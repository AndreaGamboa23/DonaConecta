"""Puntos de acopio reales con autorización institucional y horarios de SQL Server.

No se crean columnas nuevas: la autorización explícita de coordenadas se registra
en ``auditoria_eventos``. El último evento decide si las coordenadas son
públicas; una consulta privada sólo la puede hacer un representante autorizado
o un participante activo de una entrega ligada al punto.
"""

from __future__ import annotations

from typing import Any, Iterable, Optional

from app.core.errores import ErrorNegocio, error_catalogo
from app.database.connection import get_connection

EVENTO_PUBLICAR = "PUNTO_COORDENADAS_PUBLICADAS"
EVENTO_PRIVAR = "PUNTO_COORDENADAS_PRIVADAS"
EVENTOS_COORDENADAS = (EVENTO_PUBLICAR, EVENTO_PRIVAR)

_SQL_SELECT = """
    SELECT p.punto_id, p.institucion_id, p.distrito_id, p.nombre, p.direccion,
           p.referencias_entrega, p.latitud, p.longitud, p.estado,
           d.nombre AS distrito, i.estado_verificacion,
           aut.tipo_evento AS autorizacion_coordenadas
    FROM dbo.puntos_acopio p
    INNER JOIN dbo.instituciones i ON i.institucion_id = p.institucion_id
    INNER JOIN dbo.distritos d ON d.distrito_id = p.distrito_id
    OUTER APPLY (
        SELECT TOP 1 ae.tipo_evento
        FROM dbo.auditoria_eventos ae
        WHERE ae.recurso_tipo = N'PUNTO_ACOPIO'
          AND ae.recurso_id = CAST(p.punto_id AS VARCHAR(50))
          AND ae.tipo_evento IN (N'PUNTO_COORDENADAS_PUBLICADAS',
                                 N'PUNTO_COORDENADAS_PRIVADAS')
        ORDER BY ae.evento_id DESC
    ) aut
"""

_SQL_FILTROS = """
    WHERE (? IS NULL OR p.institucion_id = ?)
      AND (? IS NULL OR p.distrito_id = ?)
"""


def _hora(valor: Any) -> str:
    if valor is None:
        return ""
    return valor.isoformat() if hasattr(valor, "isoformat") else str(valor)


def _numero(valor: Any) -> Optional[float]:
    return float(valor) if valor is not None else None


def resolver_coordenadas(
    fila, publico: bool, privado_autorizado: bool = False
) -> tuple[Optional[float], Optional[float], bool]:
    """Aplica la política de visibilidad antes de devolver latitud/longitud.

    En público se exigen tres condiciones simultáneas: punto ACTIVO,
    institución VERIFICADA y último evento de autorización de publicación. En
    privado el llamador ya fue autorizado por el repositorio.
    """

    publicacion_valida = (
        str(getattr(fila, "estado", "")).upper() == "ACTIVO"
        and str(getattr(fila, "estado_verificacion", "")).upper() == "VERIFICADA"
        and getattr(fila, "autorizacion_coordenadas", None) == EVENTO_PUBLICAR
    )
    visibles = publicacion_valida if publico else privado_autorizado
    if not visibles:
        return None, None, False
    return _numero(fila.latitud), _numero(fila.longitud), True


def registrar_evento_en_cursor(
    cursor,
    *,
    usuario_id: Optional[int],
    tipo_evento: str,
    modulo: str,
    recurso_tipo: str,
    recurso_id: Any,
    descripcion: str,
    resultado: str = "OK",
) -> None:
    """Auditoría homogénea dentro de la transacción del llamador."""

    cursor.execute(
        """
        INSERT INTO dbo.auditoria_eventos (
            usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
            origen, resultado, descripcion
        )
        VALUES (?, ?, ?, ?, ?, N'WEB', ?, ?);
        """,
        (
            usuario_id,
            tipo_evento[:60],
            modulo[:40],
            recurso_tipo[:40],
            None if recurso_id is None else str(recurso_id)[:50],
            resultado,
            descripcion[:500],
        ),
    )


def validar_representante_en_cursor(
    cursor, usuario_id: int, institucion_id: int
) -> None:
    """Exige rol activo, vínculo ACTIVO e institución VERIFICADA."""

    fila = cursor.execute(
        """
        SELECT autorizado
        FROM dbo.vw_representante_autorizado
        WHERE usuario_id = ? AND institucion_id = ? AND autorizado = 1;
        """,
        (usuario_id, institucion_id),
    ).fetchone()
    if not fila:
        raise ErrorNegocio(
            403,
            "REPRESENTANTE_NO_AUTORIZADO",
            "Debe representar una institución verificada para administrar puntos de acopio.",
        )


def _validar_catalogos_en_cursor(cursor, institucion_id: int, distrito_id: int) -> str:
    """Verifica las FK reales y devuelve el nombre del distrito."""

    institucion = cursor.execute(
        "SELECT institucion_id FROM dbo.instituciones WHERE institucion_id = ?;",
        (institucion_id,),
    ).fetchone()
    if not institucion:
        raise error_catalogo("La institución indicada no existe.")
    distrito = cursor.execute(
        "SELECT nombre FROM dbo.distritos WHERE distrito_id = ?;", (distrito_id,)
    ).fetchone()
    if not distrito:
        raise error_catalogo("El distrito indicado no existe en el catálogo real.")
    return distrito.nombre


def _registrar_autorizacion_en_cursor(
    cursor, usuario_id: int, punto_id: int, coordenadas_publicas: bool
) -> None:
    tipo = EVENTO_PUBLICAR if coordenadas_publicas else EVENTO_PRIVAR
    descripcion = (
        "El representante autorizó la publicación de las coordenadas del punto de acopio."
        if coordenadas_publicas
        else "El representante mantuvo privadas las coordenadas del punto de acopio."
    )
    registrar_evento_en_cursor(
        cursor,
        usuario_id=usuario_id,
        tipo_evento=tipo,
        modulo="PUNTOS_ACOPIO",
        recurso_tipo="PUNTO_ACOPIO",
        recurso_id=punto_id,
        descripcion=descripcion,
    )


def _reemplazar_horarios_en_cursor(cursor, punto_id: int, horarios: Iterable[dict]) -> None:
    """Sustituye todas las franjas; el cuerpo ya validó días y horarios."""

    cursor.execute(
        "DELETE FROM dbo.puntos_acopio_horarios WHERE punto_id = ?;", (punto_id,)
    )
    for horario in horarios:
        cursor.execute(
            """
            INSERT INTO dbo.puntos_acopio_horarios (
                punto_id, dia_semana, hora_apertura, hora_cierre, activo
            )
            VALUES (?, ?, ?, ?, ?);
            """,
            (
                punto_id,
                int(horario["dia_semana"]),
                _hora(horario["hora_apertura"]),
                _hora(horario["hora_cierre"]),
                1 if horario.get("activo", True) else 0,
            ),
        )


def _leer_horarios_en_cursor(cursor, ids_puntos: list[int]) -> dict[int, list[dict]]:
    if not ids_puntos:
        return {}
    marcadores = ", ".join("?" for _ in ids_puntos)
    filas = cursor.execute(
        f"""
        SELECT punto_id, dia_semana, hora_apertura, hora_cierre, activo
        FROM dbo.puntos_acopio_horarios
        WHERE punto_id IN ({marcadores})
        ORDER BY punto_id, dia_semana, hora_apertura;
        """,
        tuple(ids_puntos),
    ).fetchall()
    horarios: dict[int, list[dict]] = {punto_id: [] for punto_id in ids_puntos}
    for fila in filas:
        horarios.setdefault(int(fila.punto_id), []).append(
            {
                "punto_id": int(fila.punto_id),
                "dia_semana": int(fila.dia_semana),
                "hora_apertura": _hora(fila.hora_apertura),
                "hora_cierre": _hora(fila.hora_cierre),
                "activo": bool(fila.activo),
            }
        )
    return horarios


def _serializar(fila, horarios: list[dict], publico: bool, privado_autorizado: bool) -> dict:
    latitud, longitud, visibles = resolver_coordenadas(
        fila, publico, privado_autorizado
    )
    return {
        "punto_id": int(fila.punto_id),
        "id_punto_acopio": int(fila.punto_id),
        "id_institucion": int(fila.institucion_id),
        "nombre": fila.nombre,
        "direccion": fila.direccion,
        "referencias_entrega": fila.referencias_entrega,
        "distrito_id": int(fila.distrito_id),
        "distrito": fila.distrito or "",
        "latitud": latitud,
        "longitud": longitud,
        "estado": fila.estado,
        "coordenadas_visibles": visibles,
        "horarios": horarios,
    }


def listar_puntos_acopio(
    institucion_id: Optional[int] = None,
    distrito_id: Optional[int] = None,
    publico: bool = True,
    usuario_id: Optional[int] = None,
) -> list[dict]:
    """Lista puntos públicos autorizados o la vista privada autorizada."""

    parametros: list[Any] = [institucion_id, institucion_id, distrito_id, distrito_id]
    if publico:
        sql = (
            _SQL_SELECT
            + _SQL_FILTROS
            + """
            AND p.estado = N'ACTIVO'
            AND i.estado_verificacion = N'VERIFICADA'
            AND aut.tipo_evento = N'PUNTO_COORDENADAS_PUBLICADAS'
            ORDER BY p.punto_id;
            """
        )
    else:
        if usuario_id is None:
            raise ErrorNegocio(
                401, "AUTENTICACION_REQUERIDA", "Se requiere un token de acceso."
            )
        sql = (
            _SQL_SELECT
            + _SQL_FILTROS
            + """
            AND (
                EXISTS (
                    SELECT 1 FROM dbo.vw_representante_autorizado ra
                    WHERE ra.usuario_id = ? AND ra.institucion_id = p.institucion_id
                      AND ra.autorizado = 1
                )
                OR EXISTS (
                    SELECT 1 FROM dbo.entregas e
                    INNER JOIN dbo.vw_participantes_entrega pe
                        ON pe.entrega_id = e.entrega_id
                       AND pe.usuario_id = ? AND pe.activo = 1
                    WHERE e.punto_acopio_id = p.punto_id
                )
            )
            ORDER BY p.punto_id;
            """
        )
        parametros.extend([usuario_id, usuario_id])

    with get_connection() as conn:
        cursor = conn.cursor()
        filas = cursor.execute(sql, tuple(parametros)).fetchall()
        horarios = _leer_horarios_en_cursor(
            cursor, [int(fila.punto_id) for fila in filas]
        )
        return [
            _serializar(
                fila,
                horarios.get(int(fila.punto_id), []),
                publico,
                privado_autorizado=not publico,
            )
            for fila in filas
        ]


def _leer_punto_en_cursor(cursor, punto_id: int) -> Any:
    fila = cursor.execute(
        _SQL_SELECT + " WHERE p.punto_id = ?;", (punto_id,)
    ).fetchone()
    if not fila:
        raise ErrorNegocio(404, "PUNTO_NO_ENCONTRADO", "El punto de acopio no existe.")
    return fila


def _punto_para_respuesta(cursor, punto_id: int) -> dict:
    fila = _leer_punto_en_cursor(cursor, punto_id)
    return _serializar(
        fila,
        _leer_horarios_en_cursor(cursor, [punto_id]).get(punto_id, []),
        publico=False,
        privado_autorizado=True,
    )


def crear_punto_acopio(usuario_id: int, datos: dict) -> dict:
    """Alta realizada por un representante autorizado de la institución."""

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        institucion_id = int(datos["id_institucion"])
        validar_representante_en_cursor(cursor, usuario_id, institucion_id)
        distrito = _validar_catalogos_en_cursor(
            cursor, institucion_id, int(datos["distrito_id"])
        )
        fila = cursor.execute(
            """
            INSERT INTO dbo.puntos_acopio (
                institucion_id, distrito_id, nombre, direccion, referencias_entrega,
                latitud, longitud, estado
            )
            OUTPUT INSERTED.punto_id
            VALUES (?, ?, ?, ?, ?, ?, ?, N'ACTIVO');
            """,
            (
                institucion_id,
                int(datos["distrito_id"]),
                datos["nombre"].strip(),
                (datos.get("direccion") or "").strip() or None,
                (datos.get("referencias_entrega") or "").strip() or None,
                datos.get("latitud"),
                datos.get("longitud"),
            ),
        ).fetchone()
        if not fila:
            raise ErrorNegocio(400, "PUNTO_NO_REGISTRADO", "No se pudo registrar el punto.")
        punto_id = int(fila.punto_id)
        _reemplazar_horarios_en_cursor(cursor, punto_id, datos["horarios"])
        _registrar_autorizacion_en_cursor(
            cursor, usuario_id, punto_id, bool(datos.get("coordenadas_publicas"))
        )
        respuesta = _punto_para_respuesta(cursor, punto_id)
        respuesta["distrito"] = distrito
        return respuesta


def reemplazar_punto_acopio(usuario_id: int, punto_id: int, datos: dict) -> dict:
    """PUT: reemplaza datos y todas las franjas horarias existentes."""

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        actual = _leer_punto_en_cursor(cursor, punto_id)
        institucion_actual = int(actual.institucion_id)
        institucion_nueva = int(datos["id_institucion"])
        validar_representante_en_cursor(cursor, usuario_id, institucion_actual)
        if institucion_nueva != institucion_actual:
            validar_representante_en_cursor(cursor, usuario_id, institucion_nueva)
        _validar_catalogos_en_cursor(
            cursor, institucion_nueva, int(datos["distrito_id"])
        )
        cursor.execute(
            """
            UPDATE dbo.puntos_acopio
            SET institucion_id = ?, distrito_id = ?, nombre = ?, direccion = ?,
                referencias_entrega = ?, latitud = ?, longitud = ?
            WHERE punto_id = ?;
            """,
            (
                institucion_nueva,
                int(datos["distrito_id"]),
                datos["nombre"].strip(),
                (datos.get("direccion") or "").strip() or None,
                (datos.get("referencias_entrega") or "").strip() or None,
                datos.get("latitud"),
                datos.get("longitud"),
                punto_id,
            ),
        )
        _reemplazar_horarios_en_cursor(cursor, punto_id, datos["horarios"])
        _registrar_autorizacion_en_cursor(
            cursor, usuario_id, punto_id, bool(datos.get("coordenadas_publicas"))
        )
        return _punto_para_respuesta(cursor, punto_id)


def cambiar_estado_punto(usuario_id: int, punto_id: int, estado: str) -> dict:
    """PATCH de estado: ACTIVO o INACTIVO, sin tocar la autorización de coords."""

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        actual = _leer_punto_en_cursor(cursor, punto_id)
        validar_representante_en_cursor(
            cursor, usuario_id, int(actual.institucion_id)
        )
        cursor.execute(
            "UPDATE dbo.puntos_acopio SET estado = ? WHERE punto_id = ?;",
            (estado, punto_id),
        )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="PUNTO_ESTADO_ACTUALIZADO",
            modulo="PUNTOS_ACOPIO",
            recurso_tipo="PUNTO_ACOPIO",
            recurso_id=punto_id,
            descripcion=f"Estado del punto de acopio actualizado a {estado}.",
        )
        return _punto_para_respuesta(cursor, punto_id)


def eliminar_punto_acopio(usuario_id: int, punto_id: int) -> dict:
    """Baja lógica: se rechaza si ya hay necesidades o entregas asociadas."""

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        actual = _leer_punto_en_cursor(cursor, punto_id)
        validar_representante_en_cursor(
            cursor, usuario_id, int(actual.institucion_id)
        )
        relaciones = cursor.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM dbo.necesidades WHERE punto_acopio_id = ?)
                    AS necesidades,
                (SELECT COUNT(*) FROM dbo.entregas WHERE punto_acopio_id = ?)
                    AS entregas;
            """,
            (punto_id, punto_id),
        ).fetchone()
        if relaciones and (
            int(relaciones.necesidades) > 0 or int(relaciones.entregas) > 0
        ):
            raise ErrorNegocio(
                409,
                "PUNTO_CON_RELACIONES",
                "El punto ya está asociado a necesidades o entregas; no se puede eliminar.",
            )
        cursor.execute(
            "UPDATE dbo.puntos_acopio SET estado = N'INACTIVO' WHERE punto_id = ?;",
            (punto_id,),
        )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="PUNTO_ELIMINADO_LOGICAMENTE",
            modulo="PUNTOS_ACOPIO",
            recurso_tipo="PUNTO_ACOPIO",
            recurso_id=punto_id,
            descripcion="Punto de acopio dado de baja lógica sin relaciones.",
        )
        return {"punto_id": punto_id, "estado": "INACTIVO"}
