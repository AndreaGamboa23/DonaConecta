"""Necesidades y compromisos sobre el esquema real de ``DonaConectaDB``.

Los totales se calculan desde ``vw_disponibilidad_necesidad``. El alta de
compromisos delega la validación de disponibilidad y la transacción a
``dbo.usp_RegistrarCompromiso``; este módulo nunca simula reservas.
"""

import json
from datetime import datetime, timezone
from typing import Optional

import pyodbc

from app.core.errores import ErrorNegocio, error_catalogo, traducir_error_sql
from app.database.connection import get_connection

# Política de expiración mientras no exista un parámetro configurado en
# parametros_sistema. El cliente puede enviar otro valor entre 1 y 1440.
EXPIRACION_COMPROMISO_MINUTOS = 30


def _texto_fecha(valor) -> Optional[str]:
    if valor is None:
        return None
    return valor.isoformat() if hasattr(valor, "isoformat") else str(valor)


def _numero(valor) -> float:
    return float(valor) if valor is not None else 0.0


def listar_necesidades_publicas(
    categoria_id: Optional[int] = None,
    distrito_id: Optional[int] = None,
    institucion_id: Optional[int] = None,
) -> list[dict]:
    sql = """
        WITH importes AS (
            SELECT necesidad_id,
                   SUM(cantidad_requerida) AS cantidad_requerida,
                   SUM(cantidad_reservada_vigente) AS cantidad_comprometida,
                   SUM(cantidad_recibida) AS cantidad_recibida
            FROM dbo.vw_disponibilidad_necesidad
            GROUP BY necesidad_id
        )
        SELECT n.necesidad_id, n.titulo, n.descripcion, n.prioridad, n.estado,
               n.fecha_limite, n.institucion_id, i.nombre AS institucion,
               COALESCE(d.nombre, di.nombre) AS distrito,
               n.punto_acopio_id, pa.nombre AS nombre_punto, pa.direccion AS direccion_acopio,
               imp.cantidad_requerida, imp.cantidad_comprometida, imp.cantidad_recibida,
               (
                   SELECT TOP 1 u.simbolo
                   FROM dbo.necesidad_productos np
                   INNER JOIN dbo.unidades_medida u ON u.unidad_id = np.unidad_id
                   WHERE np.necesidad_id = n.necesidad_id
                   ORDER BY np.producto_id, np.unidad_id
               ) AS unidad_medida_base,
               (
                   SELECT TOP 1 p.categoria_id
                   FROM dbo.necesidad_productos np
                   INNER JOIN dbo.productos p ON p.producto_id = np.producto_id
                   WHERE np.necesidad_id = n.necesidad_id
                   ORDER BY np.producto_id, np.unidad_id
               ) AS id_categoria,
               (
                   SELECT TOP 1 c.nombre
                   FROM dbo.necesidad_productos np
                   INNER JOIN dbo.productos p ON p.producto_id = np.producto_id
                   INNER JOIN dbo.categorias_bienes c ON c.categoria_id = p.categoria_id
                   WHERE np.necesidad_id = n.necesidad_id
                   ORDER BY np.producto_id, np.unidad_id
               ) AS categoria
        FROM dbo.necesidades n
        INNER JOIN dbo.instituciones i ON i.institucion_id = n.institucion_id
        INNER JOIN dbo.distritos di ON di.distrito_id = i.distrito_id
        LEFT JOIN importes imp ON imp.necesidad_id = n.necesidad_id
        LEFT JOIN dbo.puntos_acopio pa ON pa.punto_id = n.punto_acopio_id
        LEFT JOIN dbo.distritos d ON d.distrito_id = pa.distrito_id
        WHERE n.estado = N'PUBLICADA'
          AND (? IS NULL OR EXISTS (
              SELECT 1 FROM dbo.necesidad_productos np2
              INNER JOIN dbo.productos p2 ON p2.producto_id = np2.producto_id
              WHERE np2.necesidad_id = n.necesidad_id AND p2.categoria_id = ?))
          AND (? IS NULL OR COALESCE(d.distrito_id, di.distrito_id) = ?)
          AND (? IS NULL OR n.institucion_id = ?)
        ORDER BY CASE n.prioridad WHEN N'ALTA' THEN 1 WHEN N'MEDIA' THEN 2 ELSE 3 END,
                 n.fecha_publicacion DESC;
    """
    parametros = (
        categoria_id,
        categoria_id,
        distrito_id,
        distrito_id,
        institucion_id,
        institucion_id,
    )
    with get_connection() as conn:
        filas = conn.cursor().execute(sql, parametros).fetchall()
        return [
            {
                "id_necesidad": int(fila.necesidad_id),
                "necesidad_id": int(fila.necesidad_id),
                "titulo": fila.titulo,
                "descripcion": fila.descripcion,
                "cantidad_requerida": _numero(fila.cantidad_requerida),
                "cantidad_comprometida": _numero(fila.cantidad_comprometida),
                "cantidad_recibida": _numero(fila.cantidad_recibida),
                "unidad_medida_base": fila.unidad_medida_base or "",
                "prioridad": fila.prioridad,
                "estado": fila.estado,
                "fecha_limite": _texto_fecha(fila.fecha_limite),
                "id_institucion": int(fila.institucion_id),
                "institucion": fila.institucion,
                "distrito": fila.distrito,
                "id_categoria": int(fila.id_categoria) if fila.id_categoria is not None else None,
                "categoria": fila.categoria or "",
                "id_punto_acopio": int(fila.punto_acopio_id) if fila.punto_acopio_id is not None else None,
                "punto_acopio": fila.nombre_punto or "",
                "nombre_punto": fila.nombre_punto or "",
                "direccion_acopio": fila.direccion_acopio or "",
            }
            for fila in filas
        ]


def _fecha_limite_valida(valor: Optional[datetime]) -> Optional[datetime]:
    if valor is None:
        return None
    if valor.tzinfo is not None:
        valor = valor.astimezone(timezone.utc).replace(tzinfo=None)
    # Una fecha sin hora (formularios HTML date) se interpreta como fin de día,
    # no como medianoche, para no violar CK_necesidades_limite.
    if valor.time() == datetime.min.time():
        valor = valor.replace(hour=23, minute=59, second=59)
    if valor <= datetime.now(timezone.utc).replace(tzinfo=None):
        raise error_catalogo("La fecha límite debe ser posterior a la fecha actual.")
    return valor


def crear_necesidad_en_cursor(cursor, usuario_id: int, datos: dict) -> dict:
    autorizado = cursor.execute(
        """
        SELECT autorizado
        FROM dbo.vw_representante_autorizado
        WHERE usuario_id = ? AND institucion_id = ? AND autorizado = 1;
        """,
        (usuario_id, datos["id_institucion"]),
    ).fetchone()
    if not autorizado:
        raise ErrorNegocio(
            403,
            "REPRESENTANTE_NO_AUTORIZADO",
            "Debe representar una institución verificada para publicar necesidades.",
        )

    punto_id = datos.get("id_punto_acopio")
    if punto_id is not None:
        punto = cursor.execute(
            """
            SELECT punto_id
            FROM dbo.puntos_acopio
            WHERE punto_id = ? AND institucion_id = ? AND estado = N'ACTIVO';
            """,
            (punto_id, datos["id_institucion"]),
        ).fetchone()
        if not punto:
            raise error_catalogo("El punto de acopio no pertenece a la institución o no está activo.")

    lineas = datos.get("lineas") or []
    if not lineas:
        raise error_catalogo(
            "La necesidad requiere al menos una línea con producto, unidad y cantidad reales."
        )

    lineas_validadas: list[dict] = []
    categoria_id = datos.get("id_categoria")
    for linea in lineas:
        producto = cursor.execute(
            """
            SELECT p.producto_id, p.categoria_id
            FROM dbo.productos p
            INNER JOIN dbo.producto_unidades pu ON pu.producto_id = p.producto_id
            WHERE p.producto_id = ? AND pu.unidad_id = ? AND p.activo = 1;
            """,
            (linea["producto_id"], linea["unidad_id"]),
        ).fetchone()
        if not producto:
            raise error_catalogo(
                "El producto o la unidad indicados no existen en el catálogo activo."
            )
        if categoria_id is not None and int(producto.categoria_id) != int(categoria_id):
            raise error_catalogo("La categoría indicada no coincide con el producto.")
        if categoria_id is None:
            categoria_id = int(producto.categoria_id)
        lineas_validadas.append(
            {
                "producto_id": int(producto.producto_id),
                "unidad_id": int(linea["unidad_id"]),
                "cantidad": float(linea["cantidad"]),
            }
        )

    fila = cursor.execute(
        """
        INSERT INTO dbo.necesidades (
            institucion_id, titulo, descripcion, prioridad, estado,
            fecha_publicacion, fecha_limite, punto_acopio_id, creado_por_usuario_id
        )
        OUTPUT INSERTED.necesidad_id, INSERTED.estado
        VALUES (?, ?, ?, ?, N'PUBLICADA', SYSUTCDATETIME(), ?, ?, ?);
        """,
        (
            datos["id_institucion"],
            datos["titulo"].strip(),
            datos["descripcion"].strip(),
            datos["prioridad"],
            _fecha_limite_valida(datos.get("fecha_limite")),
            punto_id,
            usuario_id,
        ),
    ).fetchone()
    necesidad_id = int(fila.necesidad_id)

    for linea in lineas_validadas:
        cursor.execute(
            """
            INSERT INTO dbo.necesidad_productos (
                necesidad_id, producto_id, unidad_id, cantidad_requerida
            )
            VALUES (?, ?, ?, ?);
            """,
            (necesidad_id, linea["producto_id"], linea["unidad_id"], linea["cantidad"]),
        )

    return {
        "id_necesidad": necesidad_id,
        "necesidad_id": necesidad_id,
        "titulo": datos["titulo"].strip(),
        "cantidad_requerida": sum(linea["cantidad"] for linea in lineas_validadas),
        "prioridad": datos["prioridad"],
        "estado": fila.estado,
        "id_institucion": datos["id_institucion"],
        "id_categoria": categoria_id,
        "id_punto_acopio": punto_id,
    }


def crear_necesidad(usuario_id: int, datos: dict) -> dict:
    with get_connection(escritura=True) as conn:
        return crear_necesidad_en_cursor(conn.cursor(), usuario_id, datos)


def _lineas_legacy(cursor, necesidad_id: int, cantidad: float) -> list[dict]:
    """Deriva la única línea de la necesidad para el formulario sencillo.

    No se crea ningún producto: si la necesidad no tiene exactamente una línea
    real en ``necesidad_productos``, se rechaza la petición con un mensaje claro.
    """

    filas = cursor.execute(
        """
        SELECT np.producto_id, np.unidad_id
        FROM dbo.necesidad_productos np
        INNER JOIN dbo.producto_unidades pu
            ON pu.producto_id = np.producto_id AND pu.unidad_id = np.unidad_id
        INNER JOIN dbo.productos p ON p.producto_id = np.producto_id AND p.activo = 1
        WHERE np.necesidad_id = ?
        ORDER BY np.producto_id, np.unidad_id;
        """,
        (necesidad_id,),
    ).fetchall()
    if len(filas) != 1:
        raise ErrorNegocio(
            422,
            "LINEAS_NO_UNICAS",
            "Esta necesidad no tiene una única línea de producto; envíe el detalle de líneas.",
        )
    return [
        {
            "productoId": int(filas[0].producto_id),
            "unidadId": int(filas[0].unidad_id),
            "cantidad": float(cantidad),
        }
    ]


def registrar_compromiso(donante_usuario_id: int, datos: dict) -> dict:
    necesidad_id = int(datos["id_necesidad"])
    expiracion = int(datos.get("expiracion_minutos") or EXPIRACION_COMPROMISO_MINUTOS)
    lineas = datos.get("lineas")

    with get_connection(autocommit=True, escritura=True) as conn:
        cursor = conn.cursor()
        if not lineas:
            if datos.get("cantidad_comprometida") is None:
                raise ErrorNegocio(
                    422,
                    "LINEAS_INVALIDAS",
                    "Debe indicar la cantidad o el detalle de líneas de la donación.",
                )
            lineas = _lineas_legacy(cursor, necesidad_id, float(datos["cantidad_comprometida"]))

        lineas_json = json.dumps(
            [
                {
                    "productoId": int(linea["producto_id"]),
                    "unidadId": int(linea["unidad_id"]),
                    "cantidad": float(linea["cantidad"]),
                }
                for linea in lineas
            ],
            ensure_ascii=False,
        )

        try:
            cursor.execute(
                """
                DECLARE @idCompromiso INT;
                EXEC dbo.usp_RegistrarCompromiso
                    @necesidadId = ?,
                    @donanteUsuarioId = ?,
                    @lineasJson = ?,
                    @expiracionMinutos = ?,
                    @compromisoId = @idCompromiso OUTPUT;
                SELECT @idCompromiso AS compromiso_id;
                """,
                (necesidad_id, donante_usuario_id, lineas_json, expiracion),
            )
            fila = cursor.fetchone()
        except pyodbc.Error as error:
            raise traducir_error_sql(error)

        if not fila or fila.compromiso_id is None:
            raise ErrorNegocio(400, "COMPROMISO_NO_REGISTRADO", "No se pudo registrar el compromiso.")

        compromiso_id = int(fila.compromiso_id)

        # El procedimiento no acepta observaciones. Se persisten aparte para no
        # perder el comentario del formulario, sin alterar la transacción del SP.
        if datos.get("comentario"):
            cursor.execute(
                "UPDATE dbo.compromisos SET observaciones = ? WHERE compromiso_id = ?;",
                (datos["comentario"].strip(), compromiso_id),
            )

        titulo = cursor.execute(
            "SELECT titulo FROM dbo.necesidades WHERE necesidad_id = ?;", (necesidad_id,)
        ).fetchone()

        return {
            "id_compromiso": compromiso_id,
            "compromiso_id": compromiso_id,
            "id_necesidad": necesidad_id,
            "necesidad": titulo.titulo if titulo else "",
            "cantidad_comprometida": sum(float(linea["cantidad"]) for linea in lineas),
            "estado": "PENDIENTE",
        }


def _fila_compromiso(fila) -> dict:
    return {
        "id_compromiso": int(fila.id_compromiso),
        "compromiso_id": int(fila.id_compromiso),
        "id_necesidad": int(fila.id_necesidad),
        "necesidad": fila.necesidad,
        "institucion": fila.institucion,
        "cantidad_comprometida": _numero(fila.cantidad_comprometida),
        # Si hay varias unidades se muestra la primera del catálogo, sin sumar
        # magnitudes de unidades distintas.
        "unidad_medida_base": fila.unidad_medida_base or "",
        "comentario": fila.comentario,
        "estado": fila.estado,
        "punto_acopio": fila.punto_acopio or "",
        "direccion_acopio": fila.direccion_acopio or "",
        "creado_en": _texto_fecha(fila.creado_en) or "",
    }


_COMPROMISOS_BASE_SQL = """
    WITH totales AS (
        SELECT cp.compromiso_id,
               SUM(cp.cantidad_comprometida) AS cantidad_comprometida,
               MIN(u.simbolo) AS unidad_medida_base
        FROM dbo.compromiso_productos cp
        INNER JOIN dbo.unidades_medida u ON u.unidad_id = cp.unidad_id
        GROUP BY cp.compromiso_id
    )
    SELECT c.compromiso_id, c.necesidad_id, n.titulo AS necesidad,
           i.nombre AS institucion, t.cantidad_comprometida, t.unidad_medida_base,
           c.observaciones AS comentario, c.estado,
           pa.nombre AS punto_acopio, pa.direccion AS direccion_acopio, c.creado_en
    FROM dbo.compromisos c
    INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
    INNER JOIN dbo.instituciones i ON i.institucion_id = n.institucion_id
    LEFT JOIN dbo.puntos_acopio pa ON pa.punto_id = n.punto_acopio_id
    LEFT JOIN totales t ON t.compromiso_id = c.compromiso_id
"""


def listar_compromisos_donante(donante_usuario_id: int) -> list[dict]:
    sql = _COMPROMISOS_BASE_SQL + """
        WHERE c.donante_usuario_id = ?
        ORDER BY c.creado_en DESC;
    """
    with get_connection() as conn:
        filas = conn.cursor().execute(sql, (donante_usuario_id,)).fetchall()
        return [_fila_compromiso(fila) for fila in filas]


def listar_compromisos_representante(representante_usuario_id: int) -> list[dict]:
    sql = _COMPROMISOS_BASE_SQL + """
        INNER JOIN dbo.institucion_representantes ir
            ON ir.institucion_id = n.institucion_id
           AND ir.usuario_id = ?
           AND ir.estado = N'ACTIVO'
        ORDER BY c.creado_en DESC;
    """
    with get_connection() as conn:
        filas = conn.cursor().execute(sql, (representante_usuario_id,)).fetchall()
        return [_fila_compromiso(fila) for fila in filas]
