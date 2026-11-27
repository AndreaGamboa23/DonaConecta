"""Seguimiento GPS autorizado, sin historial continuo.

Sólo el donante participante de la entrega inicia y actualiza. Se guarda una
única fila en ``gps_ultima_ubicacion`` por sesión, con coordenadas cifradas y
nonce/versión en columnas propias. Una sesión vencida se marca EXPIRADA antes de
consultarla o actualizarla. No se calculan distancias, rutas ni ETAs.

Primera versión con polling HTTP; el transporte WebSocket queda pendiente.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.core.cifrado import cifrar_datos, descifrar_datos
from app.core.errores import ErrorNegocio
from app.database.connection import get_connection
from app.repositories.paneles_repo import registrar_evento_en_cursor

_ROLES_PARTICIPANTES = ("DONANTE", "REPRESENTANTE")


def _ahora() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _iso(valor: Any) -> Optional[str]:
    if valor is None:
        return None
    texto = valor.isoformat() if hasattr(valor, "isoformat") else str(valor)
    return texto if texto.endswith(("Z", "+00:00")) else f"{texto}Z"


def _utc_naive(valor: Any) -> Optional[datetime]:
    if valor is None:
        return None
    if getattr(valor, "tzinfo", None) is not None:
        return valor.astimezone(timezone.utc).replace(tzinfo=None)
    return valor


def _participante_entrega(
    cursor, entrega_id: int, usuario_id: int, roles: tuple[str, ...] = _ROLES_PARTICIPANTES
) -> Any:
    filas = cursor.execute(
        """
        SELECT entrega_id, usuario_id, rol, activo
        FROM dbo.vw_participantes_entrega
        WHERE entrega_id = ? AND usuario_id = ? AND activo = 1;
        """,
        (entrega_id, usuario_id),
    ).fetchall()
    for fila in filas:
        if fila.rol in roles:
            return fila
    raise ErrorNegocio(
        403,
        "GPS_PARTICIPANTE_NO_AUTORIZADO",
        "No participas activamente de esta entrega con el rol requerido.",
    )


def _sesion(cursor, sesion_id: int) -> Any:
    return cursor.execute(
        """
        SELECT s.sesion_id, s.entrega_id, s.usuario_id, s.consentimiento_dado,
               s.fecha_inicio, s.expira_en, s.fecha_fin, s.estado
        FROM dbo.sesiones_gps s
        WHERE s.sesion_id = ?;
        """,
        (sesion_id,),
    ).fetchone()


def expirar_sesion_si_corresponde(cursor, sesion: Any, ahora: Optional[datetime] = None) -> bool:
    """Marca EXPIRADA una sesión ACTIVA vencida; devuelve si la expiró."""

    if sesion is None:
        return False
    if str(sesion.estado).strip().upper() != "ACTIVA":
        return False
    expira_en = _utc_naive(sesion.expira_en)
    momento = ahora or _ahora()
    if expira_en is None or expira_en > momento:
        return False
    cursor.execute(
        """
        UPDATE dbo.sesiones_gps
        SET estado = N'EXPIRADA', fecha_fin = ?
        WHERE sesion_id = ? AND estado = N'ACTIVA';
        """,
        (momento, int(sesion.sesion_id)),
    )
    return True


def _fila_sesion(
    sesion, estado: Optional[str] = None, fecha_fin: Optional[datetime] = None
) -> dict:
    return {
        "sesion_id": int(sesion.sesion_id),
        "entrega_id": int(sesion.entrega_id),
        "estado": estado or sesion.estado,
        "consentimiento_dado": bool(sesion.consentimiento_dado),
        "fecha_inicio": _iso(sesion.fecha_inicio),
        "expira_en": _iso(sesion.expira_en),
        "fecha_fin": _iso(fecha_fin if fecha_fin is not None else sesion.fecha_fin),
    }


def iniciar_sesion(
    usuario_id: int, entrega_id: int, duracion_minutos: int = 30
) -> dict:
    ahora = _ahora()
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        _participante_entrega(cursor, entrega_id, usuario_id, ("DONANTE",))
        anteriores = cursor.execute(
            """
            SELECT sesion_id, entrega_id, usuario_id, consentimiento_dado,
                   fecha_inicio, expira_en, fecha_fin, estado
            FROM dbo.sesiones_gps
            WHERE entrega_id = ? AND usuario_id = ? AND estado = N'ACTIVA';
            """,
            (entrega_id, usuario_id),
        ).fetchall()
        for anterior in anteriores:
            expirar_sesion_si_corresponde(cursor, anterior, ahora)
        if any(_utc_naive(fila.expira_en) > ahora for fila in anteriores):
            conn.commit()  # conserva la expiración de sesiones vencidas
            raise ErrorNegocio(
                409,
                "GPS_SESION_ACTIVA",
                "Ya existe una sesión de seguimiento vigente para esta entrega.",
            )
        expira_en = ahora + timedelta(minutes=duracion_minutos)
        cursor.execute(
            """
            INSERT INTO dbo.sesiones_gps (
                entrega_id, usuario_id, consentimiento_dado, consentimiento_en,
                fecha_inicio, expira_en, estado
            ) OUTPUT INSERTED.sesion_id VALUES (?, ?, 1, ?, ?, ?, N'ACTIVA');
            """,
            (entrega_id, usuario_id, ahora, ahora, expira_en),
        )
        sesion_id = int(cursor.fetchone()[0])
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="GPS_SESION_INICIADA",
            modulo="UBICACION",
            recurso_tipo="ENTREGA",
            recurso_id=entrega_id,
            descripcion="Seguimiento iniciado con consentimiento explícito.",
        )
        return {
            "sesion_id": sesion_id,
            "entrega_id": entrega_id,
            "estado": "ACTIVA",
            "consentimiento_dado": True,
            "fecha_inicio": _iso(ahora),
            "expira_en": _iso(expira_en),
            "fecha_fin": None,
        }


def _cifrar_coordenadas(latitud: float, longitud: float) -> tuple[bytes, bytes, int]:
    valor = json.dumps(
        {"latitud": round(latitud, 6), "longitud": round(longitud, 6)},
        separators=(",", ":"),
    )
    return cifrar_datos(valor)


def _descifrar_coordenadas(fila) -> tuple[float, float]:
    texto = descifrar_datos(fila.coordenadas_cifradas, fila.nonce, fila.clave_version)
    if texto is None:
        raise ErrorNegocio(
            500, "UBICACION_NO_LEIBLE", "No se pudo mostrar la última ubicación."
        )
    try:
        datos = json.loads(texto)
        return float(datos["latitud"]), float(datos["longitud"])
    except (ValueError, TypeError, KeyError):
        raise ErrorNegocio(
            500, "UBICACION_NO_LEIBLE", "No se pudo mostrar la última ubicación."
        )


def actualizar_ubicacion(
    usuario_id: int, sesion_id: int, latitud: float, longitud: float, precision_metros: float = 0
) -> dict:
    """Reemplaza la única fila de ubicación de la sesión."""

    ahora = _ahora()
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        sesion = _sesion(cursor, sesion_id)
        if not sesion:
            raise ErrorNegocio(404, "GPS_SESION_NO_ENCONTRADA", "La sesión no existe.")
        entrega_id = int(sesion.entrega_id)
        if int(sesion.usuario_id) != usuario_id:
            raise ErrorNegocio(
                403, "GPS_SESION_AJENA", "Sólo el donante de la sesión puede enviar su ubicación."
            )
        _participante_entrega(cursor, entrega_id, usuario_id, ("DONANTE",))
        expirado = expirar_sesion_si_corresponde(cursor, sesion, ahora)
        estado = "EXPIRADA" if expirado else str(sesion.estado)
        if estado != "ACTIVA":
            if expirado:
                conn.commit()  # la caducidad se persiste aunque se rechace el dato
            codigo = "GPS_SESION_EXPIRADA" if estado == "EXPIRADA" else "GPS_SESION_NO_ACTIVA"
            raise ErrorNegocio(409, codigo, "La sesión de seguimiento ya no está activa.")

        cifrado, nonce, version = _cifrar_coordenadas(latitud, longitud)
        cursor.execute(
            """
            UPDATE dbo.gps_ultima_ubicacion
            SET coordenadas_cifradas = ?, nonce = ?, clave_version = ?,
                precision_metros = ?, actualizado_en = ?
            WHERE sesion_id = ?;
            IF @@ROWCOUNT = 0
                INSERT INTO dbo.gps_ultima_ubicacion (
                    sesion_id, coordenadas_cifradas, nonce, clave_version,
                    precision_metros, actualizado_en
                ) VALUES (?, ?, ?, ?, ?, ?);
            """,
            (
                cifrado, nonce, version, precision_metros, ahora, sesion_id,
                sesion_id, cifrado, nonce, version, precision_metros, ahora,
            ),
        )
        return {
            "sesion_id": sesion_id,
            "entrega_id": entrega_id,
            "estado": estado,
            "latitud": latitud,
            "longitud": longitud,
            "precision_metros": precision_metros,
            "actualizado_en": _iso(ahora),
            "expira_en": _iso(sesion.expira_en),
        }


def obtener_ultima_ubicacion(usuario_id: int, entrega_id: int) -> dict:
    """Última posición cifrada en reposo, sólo para participantes activos."""

    # La conexión se abre en modo escritura porque al consultar puede expirar la sesión.
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        _participante_entrega(cursor, entrega_id, usuario_id)
        sesion = cursor.execute(
            """
            SELECT TOP 1 s.sesion_id, s.entrega_id, s.usuario_id, s.consentimiento_dado,
                   s.fecha_inicio, s.expira_en, s.fecha_fin, s.estado
            FROM dbo.sesiones_gps s
            WHERE s.entrega_id = ?
            ORDER BY s.fecha_inicio DESC, s.sesion_id DESC;
            """,
            (entrega_id,),
        ).fetchone()
        respuesta = {
            "sesion_id": None,
            "entrega_id": entrega_id,
            "estado": None,
            "latitud": None,
            "longitud": None,
            "precision_metros": None,
            "actualizado_en": None,
            "expira_en": None,
        }
        if not sesion:
            return respuesta

        expirado = expirar_sesion_si_corresponde(cursor, sesion, _ahora())
        estado = "EXPIRADA" if expirado else str(sesion.estado)
        respuesta.update(
            sesion_id=int(sesion.sesion_id),
            estado=estado,
            expira_en=_iso(sesion.expira_en),
        )
        if estado in ("DETENIDA", "CANCELADA"):
            return respuesta
        ubicacion = cursor.execute(
            """
            SELECT coordenadas_cifradas, nonce, clave_version, precision_metros, actualizado_en
            FROM dbo.gps_ultima_ubicacion
            WHERE sesion_id = ?;
            """,
            (int(sesion.sesion_id),),
        ).fetchone()
        if not ubicacion:
            return respuesta
        latitud, longitud = _descifrar_coordenadas(ubicacion)
        respuesta.update(
            latitud=latitud,
            longitud=longitud,
            precision_metros=float(ubicacion.precision_metros or 0),
            actualizado_en=_iso(ubicacion.actualizado_en),
        )
        return respuesta


def detener_sesion(usuario_id: int, sesion_id: int) -> dict:
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        sesion = _sesion(cursor, sesion_id)
        if not sesion:
            raise ErrorNegocio(404, "GPS_SESION_NO_ENCONTRADA", "La sesión no existe.")
        entrega_id = int(sesion.entrega_id)
        if int(sesion.usuario_id) != usuario_id:
            raise ErrorNegocio(
                403, "GPS_SESION_AJENA", "Sólo el donante de la sesión puede detenerla."
            )
        _participante_entrega(cursor, entrega_id, usuario_id, ("DONANTE",))
        ahora = _ahora()
        expirado = expirar_sesion_si_corresponde(cursor, sesion, ahora)
        if expirado:
            conn.commit()
            raise ErrorNegocio(
                409, "GPS_SESION_EXPIRADA", "La sesión venció antes de detenerse."
            )
        estado = str(sesion.estado)
        if estado == "DETENIDA":
            return _fila_sesion(sesion)
        if estado != "ACTIVA":
            raise ErrorNegocio(
                409, "GPS_SESION_NO_ACTIVA", "La sesión ya no está activa."
            )
        cursor.execute(
            """
            UPDATE dbo.sesiones_gps
            SET estado = N'DETENIDA', fecha_fin = ?
            WHERE sesion_id = ? AND estado = N'ACTIVA';
            """,
            (ahora, sesion_id),
        )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="GPS_SESION_DETENIDA",
            modulo="UBICACION",
            recurso_tipo="ENTREGA",
            recurso_id=entrega_id,
            descripcion="Seguimiento detenido por el donante.",
        )
        return _fila_sesion(sesion, "DETENIDA", ahora)
