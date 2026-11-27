"""Entregas, recepciones y detalle real de compromisos.

La confirmación de recepción delega la transacción, los bloqueos, las
notificaciones y la auditoría a ``dbo.usp_ConfirmarRecepcion``. Aquí sólo se
hacen comprobaciones previas y se traducen sus errores públicos.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

import pyodbc

from app.core.errores import ErrorNegocio, traducir_error_sql
from app.database.connection import get_connection

ESTADOS_ENTREGA = {"PROGRAMADA", "EN_CAMINO", "ENTREGADA", "INCIDENCIA", "CANCELADA"}

TRANSICIONES_ENTREGA: dict[str, set[str]] = {
    "PROGRAMADA": {"EN_CAMINO", "ENTREGADA", "INCIDENCIA", "CANCELADA"},
    "EN_CAMINO": {"ENTREGADA", "INCIDENCIA", "CANCELADA"},
    "INCIDENCIA": {"EN_CAMINO", "CANCELADA"},
}


def validar_transicion_entrega(
    estado_actual: str,
    estado_nuevo: str,
    motivo: Optional[str] = None,
    tiene_recepcion: bool = False,
) -> None:
    """Reglas puras de transición, reutilizables en pruebas y en el repositorio."""

    if estado_nuevo not in ESTADOS_ENTREGA:
        raise ErrorNegocio(422, "ESTADO_NO_VALIDO", "El estado indicado no es válido.")
    if estado_actual == estado_nuevo:
        raise ErrorNegocio(
            409, "ESTADO_SIN_CAMBIO", "La entrega ya se encuentra en el estado indicado."
        )

    if estado_actual == "CANCELADA":
        raise ErrorNegocio(
            409, "TRANSICION_NO_PERMITIDA", "Una entrega cancelada no se puede modificar."
        )
    if estado_actual == "ENTREGADA":
        # Reabrir una entrega ya recibida permitiría alterar una recepción real.
        # Sólo se admite corregir el estado antes de que exista recepción.
        if estado_nuevo == "INCIDENCIA" and not tiene_recepcion:
            pass
        else:
            raise ErrorNegocio(
                409,
                "TRANSICION_NO_PERMITIDA",
                "Una entrega entregada o confirmada no se puede modificar.",
            )
    elif estado_nuevo not in TRANSICIONES_ENTREGA.get(estado_actual, set()):
        raise ErrorNegocio(
            409, "TRANSICION_NO_PERMITIDA", "La transición indicada no está permitida."
        )

    if estado_nuevo in {"INCIDENCIA", "CANCELADA"} and not (motivo or "").strip():
        raise ErrorNegocio(
            422, "MOTIVO_REQUERIDO", "Debe indicar el motivo de la incidencia o cancelación."
        )


def _fecha_utc(valor: Any) -> Optional[str]:
    if valor is None:
        return None
    texto = valor.isoformat() if hasattr(valor, "isoformat") else str(valor)
    if texto.endswith(("Z", "+00:00")):
        return texto
    return f"{texto}Z"


def _hora_utc(valor: Any) -> Any:
    """DATETIME2 no guarda zona: se normaliza a UTC sin información de offset."""

    if valor is None:
        return None
    if valor.tzinfo is not None:
        return valor.astimezone(timezone.utc).replace(tzinfo=None)
    return valor


def _hora(valor: Any) -> str:
    if valor is None:
        return ""
    return valor.isoformat() if hasattr(valor, "isoformat") else str(valor)


def _numero(valor: Any) -> float:
    return float(valor) if valor is not None else 0.0


def registrar_evento_en_cursor(
    cursor,
    *,
    usuario_id: int,
    tipo_evento: str,
    modulo: str,
    recurso_tipo: str,
    recurso_id: Any,
    descripcion: str,
) -> None:
    cursor.execute(
        """
        INSERT INTO dbo.auditoria_eventos (
            usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
            origen, resultado, descripcion
        )
        VALUES (?, ?, ?, ?, ?, N'WEB', N'OK', ?);
        """,
        (
            usuario_id,
            tipo_evento[:60],
            modulo[:40],
            recurso_tipo[:40],
            str(recurso_id)[:50],
            descripcion[:500],
        ),
    )


def validar_representante_en_cursor(
    cursor, usuario_id: int, institucion_id: int
) -> None:
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
            "Debe representar una institución verificada para gestionar entregas.",
        )


_SQL_ENTREGA = """
    SELECT e.entrega_id, e.compromiso_id, e.punto_acopio_id, e.fecha_programada,
           e.fecha_real_inicio, e.fecha_real_fin, e.estado,
           e.responsable_usuario_id, e.observaciones,
           pa.nombre AS nombre_punto, pa.direccion AS direccion_acopio,
           pa.referencias_entrega
    FROM dbo.entregas e
    LEFT JOIN dbo.puntos_acopio pa ON pa.punto_id = e.punto_acopio_id
"""


def _entrega_en_cursor(cursor, entrega_id: int) -> dict:
    fila = cursor.execute(
        _SQL_ENTREGA + " WHERE e.entrega_id = ?;", (entrega_id,)
    ).fetchone()
    if not fila:
        raise ErrorNegocio(404, "ENTREGA_NO_ENCONTRADA", "La entrega no existe.")
    return {
        "id_entrega": int(fila.entrega_id),
        "entrega_id": int(fila.entrega_id),
        "id_compromiso": int(fila.compromiso_id),
        "id_punto_acopio": (
            int(fila.punto_acopio_id) if fila.punto_acopio_id is not None else None
        ),
        "nombre_punto": fila.nombre_punto or "",
        "direccion_acopio": fila.direccion_acopio or "",
        "referencias_entrega": fila.referencias_entrega or "",
        "fecha_programada": _fecha_utc(fila.fecha_programada),
        "fecha_real_inicio": _fecha_utc(fila.fecha_real_inicio),
        "fecha_real_fin": _fecha_utc(fila.fecha_real_fin),
        "estado": fila.estado,
        "responsable_usuario_id": int(fila.responsable_usuario_id),
        "observaciones": fila.observaciones,
    }


def crear_entrega(usuario_id: int, datos: dict) -> dict:
    """Programa una entrega y copia todas las líneas reales del compromiso.

    Un compromiso PENDIENTE pasa a ACEPTADO en la misma transacción, con su
    ``compromiso_historial``. El SP de recepción exige el estado ACEPTADO para
    poder completar el compromiso cuando la recepción sea CONFIRMADA.
    """

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        compromiso = cursor.execute(
            """
            SELECT c.compromiso_id, c.estado, c.expira_en, n.institucion_id
            FROM dbo.compromisos c
            INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
            WHERE c.compromiso_id = ?;
            """,
            (int(datos["id_compromiso"]),),
        ).fetchone()
        if not compromiso:
            raise ErrorNegocio(
                404, "COMPROMISO_NO_ENCONTRADO", "El compromiso indicado no existe."
            )

        estado = compromiso.estado
        if estado not in {"PENDIENTE", "ACEPTADO"}:
            raise ErrorNegocio(
                409,
                "COMPROMISO_NO_ENTREGABLE",
                "El compromiso ya no admite una nueva entrega.",
            )
        if estado == "PENDIENTE":
            expira = compromiso.expira_en
            if expira is not None:
                expira = expira.replace(tzinfo=None) if expira.tzinfo else expira
                if expira <= datetime.now(timezone.utc).replace(tzinfo=None):
                    raise ErrorNegocio(
                        409, "COMPROMISO_VENCIDO", "El compromiso ya venció."
                    )

        institucion_id = int(compromiso.institucion_id)
        validar_representante_en_cursor(cursor, usuario_id, institucion_id)

        punto_id = datos.get("id_punto_acopio")
        if punto_id is not None:
            punto = cursor.execute(
                """
                SELECT punto_id
                FROM dbo.puntos_acopio
                WHERE punto_id = ? AND institucion_id = ? AND estado = N'ACTIVO';
                """,
                (int(punto_id), institucion_id),
            ).fetchone()
            if not punto:
                raise ErrorNegocio(
                    422,
                    "PUNTO_NO_VALIDO",
                    "El punto de acopio no pertenece a la institución o no está activo.",
                )

        if estado == "PENDIENTE":
            cursor.execute(
                "UPDATE dbo.compromisos SET estado = N'ACEPTADO' WHERE compromiso_id = ?;",
                (int(datos["id_compromiso"]),),
            )
            cursor.execute(
                """
                INSERT INTO dbo.compromiso_historial (
                    compromiso_id, estado_anterior, estado_nuevo,
                    cambiado_en, usuario_id, motivo
                )
                VALUES (?, N'PENDIENTE', N'ACEPTADO', SYSUTCDATETIME(), ?, ?);
                """,
                (
                    int(datos["id_compromiso"]),
                    usuario_id,
                    "Entrega programada por representante autorizado.",
                ),
            )

        fila = cursor.execute(
            """
            INSERT INTO dbo.entregas (
                compromiso_id, punto_acopio_id, fecha_programada,
                fecha_real_inicio, fecha_real_fin, estado,
                responsable_usuario_id, observaciones
            )
            OUTPUT INSERTED.entrega_id, INSERTED.estado
            VALUES (?, ?, ?, SYSUTCDATETIME(), NULL, N'PROGRAMADA', ?, ?);
            """,
            (
                int(datos["id_compromiso"]),
                int(punto_id) if punto_id is not None else None,
                _hora_utc(datos["fecha_programada"]),
                usuario_id,
                (datos.get("observaciones") or "").strip() or None,
            ),
        ).fetchone()
        if not fila:
            raise ErrorNegocio(400, "ENTREGA_NO_REGISTRADA", "No se pudo programar la entrega.")
        entrega_id = int(fila.entrega_id)

        # Una entrega copia todas las líneas del compromiso; no se inventan bienes.
        cursor.execute(
            """
            INSERT INTO dbo.entrega_productos (
                entrega_id, compromiso_id, producto_id, unidad_id, cantidad_entregada
            )
            SELECT ?, cp.compromiso_id, cp.producto_id, cp.unidad_id,
                   cp.cantidad_comprometida
            FROM dbo.compromiso_productos cp
            WHERE cp.compromiso_id = ?;
            """,
            (entrega_id, int(datos["id_compromiso"])),
        )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="ENTREGA_PROGRAMADA",
            modulo="DONACIONES",
            recurso_tipo="ENTREGA",
            recurso_id=entrega_id,
            descripcion="Entrega programada con las líneas reales del compromiso.",
        )
        return _entrega_en_cursor(cursor, entrega_id)


def cambiar_estado_entrega(usuario_id: int, entrega_id: int, datos: dict) -> dict:
    """PATCH con transición validada e historial con identidad del usuario."""

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        fila = cursor.execute(
            """
            SELECT e.entrega_id, e.estado, c.donante_usuario_id, n.institucion_id,
                   (SELECT COUNT(*) FROM dbo.recepciones r
                     WHERE r.entrega_id = e.entrega_id) AS recepciones
            FROM dbo.entregas e
            INNER JOIN dbo.compromisos c ON c.compromiso_id = e.compromiso_id
            INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
            WHERE e.entrega_id = ?;
            """,
            (entrega_id,),
        ).fetchone()
        if not fila:
            raise ErrorNegocio(404, "ENTREGA_NO_ENCONTRADA", "La entrega no existe.")

        es_donante = int(fila.donante_usuario_id) == usuario_id
        if not es_donante:
            validar_representante_en_cursor(
                cursor, usuario_id, int(fila.institucion_id)
            )

        estado_nuevo = datos["estado"]
        observaciones = datos.get("observaciones")
        validar_transicion_entrega(
            fila.estado,
            estado_nuevo,
            observaciones,
            tiene_recepcion=int(fila.recepciones or 0) > 0,
        )

        cursor.execute(
            """
            UPDATE dbo.entregas
            SET estado = ?,
                observaciones = CASE WHEN ? = 1 THEN ? ELSE observaciones END,
                fecha_real_inicio = CASE
                    WHEN ? IN (N'EN_CAMINO', N'ENTREGADA')
                         AND fecha_real_inicio IS NULL THEN SYSUTCDATETIME()
                    ELSE fecha_real_inicio END,
                fecha_real_fin = CASE
                    WHEN ? IN (N'ENTREGADA', N'CANCELADA') THEN SYSUTCDATETIME()
                    WHEN ? = N'INCIDENCIA' THEN NULL
                    ELSE fecha_real_fin END
            WHERE entrega_id = ?;
            """,
            (
                estado_nuevo,
                1 if observaciones is not None else 0,
                (observaciones or "").strip() or None,
                estado_nuevo,
                estado_nuevo,
                estado_nuevo,
                entrega_id,
            ),
        )
        cursor.execute(
            """
            INSERT INTO dbo.entrega_historial (
                entrega_id, estado_anterior, estado_nuevo,
                cambiado_en, usuario_id, motivo
            )
            VALUES (?, ?, ?, SYSUTCDATETIME(), ?, ?);
            """,
            (
                entrega_id,
                fila.estado,
                estado_nuevo,
                usuario_id,
                (observaciones or "").strip() or f"Transición a {estado_nuevo}",
            ),
        )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="ENTREGA_ESTADO_ACTUALIZADO",
            modulo="DONACIONES",
            recurso_tipo="ENTREGA",
            recurso_id=entrega_id,
            descripcion=f"Entrega actualizada a {estado_nuevo}.",
        )
        return _entrega_en_cursor(cursor, entrega_id)


def confirmar_recepcion(usuario_id: int, entrega_id: int, datos: dict) -> dict:
    """Valida líneas y delega la recepción completa al procedimiento almacenado."""

    with get_connection(autocommit=True, escritura=True) as conn:
        cursor = conn.cursor()
        entrega = cursor.execute(
            """
            SELECT e.entrega_id, n.institucion_id,
                   (SELECT COUNT(*) FROM dbo.recepciones r
                     WHERE r.entrega_id = e.entrega_id) AS recepciones
            FROM dbo.entregas e
            INNER JOIN dbo.compromisos c ON c.compromiso_id = e.compromiso_id
            INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
            WHERE e.entrega_id = ?;
            """,
            (entrega_id,),
        ).fetchone()
        if not entrega:
            raise ErrorNegocio(404, "ENTREGA_NO_ENCONTRADA", "La entrega no existe.")
        validar_representante_en_cursor(
            cursor, usuario_id, int(entrega.institucion_id)
        )
        if int(entrega.recepciones or 0) > 0:
            raise ErrorNegocio(
                409,
                "RECEPCION_DUPLICADA",
                "La entrega ya tiene una recepción registrada.",
            )

        disponibles = {
            (int(linea.producto_id), int(linea.unidad_id)): _numero(
                linea.cantidad_entregada
            )
            for linea in cursor.execute(
                """
                SELECT producto_id, unidad_id, cantidad_entregada
                FROM dbo.entrega_productos
                WHERE entrega_id = ?;
                """,
                (entrega_id,),
            ).fetchall()
        }
        vistos: set[tuple[int, int]] = set()
        for linea in datos["lineas"]:
            clave = (int(linea["producto_id"]), int(linea["unidad_id"]))
            cantidad = float(linea["cantidad_recibida"])
            if (
                clave in vistos
                or clave not in disponibles
                or cantidad < 0
                or cantidad > disponibles[clave]
            ):
                raise ErrorNegocio(
                    400,
                    "CANTIDAD_RECIBIDA_INVALIDA",
                    "Las cantidades recibidas no corresponden a las líneas de la entrega.",
                )
            vistos.add(clave)

        lineas_json = json.dumps(
            [
                {
                    "productoId": int(linea["producto_id"]),
                    "unidadId": int(linea["unidad_id"]),
                    "cantidad": float(linea["cantidad_recibida"]),
                }
                for linea in datos["lineas"]
            ],
            ensure_ascii=False,
        )
        try:
            fila = cursor.execute(
                """
                DECLARE @recepcionId INT;
                EXEC dbo.usp_ConfirmarRecepcion
                    @entregaId = ?,
                    @recibidoPorUsuarioId = ?,
                    @lineasJson = ?,
                    @estadoRecepcion = ?,
                    @observaciones = ?,
                    @evidenciasJson = NULL,
                    @recepcionId = @recepcionId OUTPUT;
                SELECT @recepcionId AS recepcion_id, ? AS estado;
                """,
                (
                    entrega_id,
                    usuario_id,
                    lineas_json,
                    datos["estado"],
                    (datos.get("observaciones") or "").strip() or None,
                    datos["estado"],
                ),
            ).fetchone()
        except pyodbc.Error as error:
            raise traducir_error_sql(error)

        if not fila or fila.recepcion_id is None:
            raise ErrorNegocio(
                400, "RECEPCION_NO_REGISTRADA", "No se pudo registrar la recepción."
            )
        return {
            "recepcion_id": int(fila.recepcion_id),
            "entrega_id": entrega_id,
            "estado": fila.estado,
        }


_COMPROMISO_AUTORIZADO_SQL = """
    SELECT c.compromiso_id, c.necesidad_id, c.estado, c.fecha_compromiso,
           c.observaciones, c.donante_usuario_id, n.titulo,
           n.institucion_id, i.nombre AS institucion, n.punto_acopio_id
    FROM dbo.compromisos c
    INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
    INNER JOIN dbo.instituciones i ON i.institucion_id = n.institucion_id
    WHERE c.compromiso_id = ?
      AND (
          c.donante_usuario_id = ?
          OR EXISTS (
              SELECT 1 FROM dbo.vw_representante_autorizado ra
              WHERE ra.usuario_id = ? AND ra.institucion_id = n.institucion_id
                AND ra.autorizado = 1
          )
      );
"""


def _autorizacion_publica_sql(alias: str) -> str:
    """Réplica literal de directorio_repo: el último evento debe ser público.

    El alias es fijo del repositorio; ningún valor del usuario se interpola en
    el texto SQL. Las coordenadas privadas nunca se incluyen en el DTO.
    """

    return f"""EXISTS (
        SELECT 1 FROM (
            SELECT TOP 1 ae.tipo_evento
            FROM dbo.auditoria_eventos ae
            WHERE ae.recurso_tipo = N'PUNTO_ACOPIO'
              AND ae.recurso_id = CAST({alias}.punto_id AS VARCHAR(50))
              AND ae.tipo_evento IN (N'PUNTO_COORDENADAS_PUBLICADAS',
                                     N'PUNTO_COORDENADAS_PRIVADAS')
            ORDER BY ae.evento_id DESC
        ) ultima
        WHERE ultima.tipo_evento = N'PUNTO_COORDENADAS_PUBLICADAS'
    )"""


_AUTORIZACION_PUBLICA_PUNTO = _autorizacion_publica_sql("pa")


def _punto_acopio_en_cursor(cursor, punto_id: Optional[int]) -> dict:
    """Punto real asignado; coordenadas sólo con autorización pública vigente."""

    datos = {
        "id_punto_acopio": None,
        "nombre_punto": "",
        "direccion_acopio": "",
        "referencias_entrega": "",
        "latitud": None,
        "longitud": None,
    }
    if punto_id is None:
        return datos

    fila = cursor.execute(
        f"""
        SELECT pa.punto_id, pa.nombre, pa.direccion, pa.referencias_entrega,
               CASE WHEN {_AUTORIZACION_PUBLICA_PUNTO}
                    THEN pa.latitud ELSE NULL END AS latitud,
               CASE WHEN {_AUTORIZACION_PUBLICA_PUNTO}
                    THEN pa.longitud ELSE NULL END AS longitud
        FROM dbo.puntos_acopio pa
        WHERE pa.punto_id = ?;
        """,
        (punto_id,),
    ).fetchone()
    if not fila:
        return datos

    datos.update(
        {
            "id_punto_acopio": int(fila.punto_id),
            "nombre_punto": fila.nombre or "",
            "direccion_acopio": fila.direccion or "",
            "referencias_entrega": fila.referencias_entrega or "",
            "latitud": float(fila.latitud) if fila.latitud is not None else None,
            "longitud": float(fila.longitud) if fila.longitud is not None else None,
        }
    )
    return datos


def _leer_compromiso_autorizado(cursor, usuario_id: int, compromiso_id: int):
    fila = cursor.execute(
        _COMPROMISO_AUTORIZADO_SQL, (compromiso_id, usuario_id, usuario_id)
    ).fetchone()
    if not fila:
        raise ErrorNegocio(
            404,
            "COMPROMISO_NO_DISPONIBLE",
            "El compromiso no existe o no está disponible para su cuenta.",
        )
    return fila


def _horarios_de_puntos_en_cursor(cursor, ids_puntos: list[int]) -> dict[int, list[dict]]:
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
                "dia_semana": int(fila.dia_semana),
                "hora_apertura": _hora(fila.hora_apertura),
                "hora_cierre": _hora(fila.hora_cierre),
                "activo": bool(fila.activo),
            }
        )
    return horarios


def _historial_entregas_en_cursor(cursor, compromiso_id: int) -> list[dict]:
    filas = cursor.execute(
        """
        SELECT h.historial_id, h.estado_anterior, h.estado_nuevo, h.cambiado_en,
               h.usuario_id, h.motivo
        FROM dbo.entrega_historial h
        INNER JOIN dbo.entregas e ON e.entrega_id = h.entrega_id
        WHERE e.compromiso_id = ?
        ORDER BY h.cambiado_en, h.historial_id;
        """,
        (compromiso_id,),
    ).fetchall()
    return [
        {
            "historial_id": int(fila.historial_id),
            "estado_anterior": fila.estado_anterior,
            "estado_nuevo": fila.estado_nuevo,
            "cambiado_en": _fecha_utc(fila.cambiado_en),
            "usuario_id": int(fila.usuario_id),
            "motivo": fila.motivo,
        }
        for fila in filas
    ]


def obtener_detalle_compromiso(usuario_id: int, compromiso_id: int) -> dict:
    """Detalle real para el donante dueño o un representante autorizado."""

    with get_connection() as conn:
        cursor = conn.cursor()
        compromiso = _leer_compromiso_autorizado(cursor, usuario_id, compromiso_id)
        id_compromiso = int(compromiso.compromiso_id)

        lineas_sql = """
            SELECT cp.producto_id, p.nombre AS producto, cp.unidad_id,
                   u.codigo AS unidad_codigo, cp.cantidad_comprometida,
                   ISNULL(rec.cantidad_recibida, 0) AS cantidad_recibida
            FROM dbo.compromiso_productos cp
            INNER JOIN dbo.productos p ON p.producto_id = cp.producto_id
            INNER JOIN dbo.unidades_medida u ON u.unidad_id = cp.unidad_id
            LEFT JOIN (
                SELECT e.compromiso_id, rp.producto_id, rp.unidad_id,
                       SUM(rp.cantidad_recibida) AS cantidad_recibida
                FROM dbo.recepcion_productos rp
                INNER JOIN dbo.recepciones r ON r.recepcion_id = rp.recepcion_id
                INNER JOIN dbo.entregas e ON e.entrega_id = r.entrega_id
                WHERE e.compromiso_id = ?
                GROUP BY e.compromiso_id, rp.producto_id, rp.unidad_id
            ) rec ON rec.compromiso_id = cp.compromiso_id
                 AND rec.producto_id = cp.producto_id
                 AND rec.unidad_id = cp.unidad_id
            WHERE cp.compromiso_id = ?
            ORDER BY p.nombre, u.codigo;
        """
        lineas = []
        for fila in cursor.execute(lineas_sql, (id_compromiso, id_compromiso)).fetchall():
            comprometida = _numero(fila.cantidad_comprometida)
            recibida = _numero(fila.cantidad_recibida)
            lineas.append(
                {
                    "producto_id": int(fila.producto_id),
                    "producto": fila.producto,
                    "unidad_id": int(fila.unidad_id),
                    "unidad_codigo": fila.unidad_codigo,
                    "cantidad_comprometida": comprometida,
                    "cantidad_recibida": recibida,
                    "cantidad_pendiente": max(comprometida - recibida, 0.0),
                }
            )

        entregas_filas = cursor.execute(
            _SQL_ENTREGA + " WHERE e.compromiso_id = ? ORDER BY e.fecha_programada, e.entrega_id;",
            (id_compromiso,),
        ).fetchall()

        # El punto de la necesidad manda; si no tiene, se toma la primera
        # entrega que sí registre uno (mismo orden que la lista de entregas).
        punto_id = compromiso.punto_acopio_id
        if punto_id is None:
            punto_id = next(
                (
                    int(fila.punto_acopio_id)
                    for fila in entregas_filas
                    if fila.punto_acopio_id is not None
                ),
                None,
            )
        punto = _punto_acopio_en_cursor(cursor, punto_id)

        ids_puntos = [
            int(fila.punto_acopio_id)
            for fila in entregas_filas
            if fila.punto_acopio_id is not None
        ]
        horarios = _horarios_de_puntos_en_cursor(cursor, sorted(set(ids_puntos)))
        entregas = []
        for fila in entregas_filas:
            punto_id = (
                int(fila.punto_acopio_id) if fila.punto_acopio_id is not None else None
            )
            entregas.append(
                {
                    "id_entrega": int(fila.entrega_id),
                    "entrega_id": int(fila.entrega_id),
                    "id_punto_acopio": punto_id,
                    "nombre_punto": fila.nombre_punto or "",
                    "direccion_acopio": fila.direccion_acopio or "",
                    "referencias_entrega": fila.referencias_entrega or "",
                    "horarios": horarios.get(punto_id, []),
                    "fecha_programada": _fecha_utc(fila.fecha_programada),
                    "fecha_real_inicio": _fecha_utc(fila.fecha_real_inicio),
                    "fecha_real_fin": _fecha_utc(fila.fecha_real_fin),
                    "estado": fila.estado,
                    "observaciones": fila.observaciones,
                }
            )

        recepciones_filas = cursor.execute(
            """
            SELECT r.recepcion_id, r.entrega_id, r.fecha_confirmacion, r.estado,
                   r.observaciones, rp.producto_id, rp.unidad_id, rp.cantidad_recibida
            FROM dbo.recepciones r
            INNER JOIN dbo.entregas e ON e.entrega_id = r.entrega_id
            LEFT JOIN dbo.recepcion_productos rp ON rp.recepcion_id = r.recepcion_id
            WHERE e.compromiso_id = ?
            ORDER BY r.recepcion_id, rp.producto_id, rp.unidad_id;
            """,
            (id_compromiso,),
        ).fetchall()
        recepciones: dict[int, dict] = {}
        for fila in recepciones_filas:
            id_recepcion = int(fila.recepcion_id)
            if id_recepcion not in recepciones:
                recepciones[id_recepcion] = {
                    "recepcion_id": id_recepcion,
                    "entrega_id": int(fila.entrega_id),
                    "fecha_confirmacion": _fecha_utc(fila.fecha_confirmacion),
                    "estado": fila.estado,
                    "observaciones": fila.observaciones,
                    "lineas": [],
                }
            if fila.producto_id is not None:
                recepciones[id_recepcion]["lineas"].append(
                    {
                        "producto_id": int(fila.producto_id),
                        "unidad_id": int(fila.unidad_id),
                        "cantidad_recibida": _numero(fila.cantidad_recibida),
                    }
                )

        historial_compromiso = [
            {
                "historial_id": int(fila.historial_id),
                "estado_anterior": fila.estado_anterior,
                "estado_nuevo": fila.estado_nuevo,
                "cambiado_en": _fecha_utc(fila.cambiado_en),
                "usuario_id": int(fila.usuario_id),
                "motivo": fila.motivo,
            }
            for fila in cursor.execute(
                """
                SELECT historial_id, estado_anterior, estado_nuevo,
                       cambiado_en, usuario_id, motivo
                FROM dbo.compromiso_historial
                WHERE compromiso_id = ?
                ORDER BY cambiado_en, historial_id;
                """,
                (id_compromiso,),
            ).fetchall()
        ]

        return {
            "id_compromiso": id_compromiso,
            "compromiso_id": id_compromiso,
            "id_necesidad": int(compromiso.necesidad_id),
            "titulo": compromiso.titulo,
            "id_institucion": int(compromiso.institucion_id),
            "institucion": compromiso.institucion,
            "estado": compromiso.estado,
            "fecha_compromiso": _fecha_utc(compromiso.fecha_compromiso),
            "observaciones": compromiso.observaciones,
            **punto,
            "lineas": lineas,
            "entregas": entregas,
            "recepciones": list(recepciones.values()),
            "historial_entregas": _historial_entregas_en_cursor(cursor, id_compromiso),
            "historial_compromiso": historial_compromiso,
        }
