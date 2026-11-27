"""Lecturas públicas del directorio y del detalle de necesidades.

Todas las consultas son parametrizadas y filtran en SQL Server el estado de
verificación y el estado de publicación. La interfaz no decide qué registros
son públicos: el repositorio es la única fuente de esa regla.
"""

from typing import Optional

from app.core.errores import ErrorNegocio
from app.database.connection import get_connection
from app.repositories.donaciones_repo import listar_necesidades_publicas


def _numero(valor) -> float:
    return float(valor) if valor is not None else 0.0


def _fecha_utc(valor) -> Optional[str]:
    """Serializa DATETIME2 UTC con sufijo ISO 8601 explícito."""

    if valor is None:
        return None
    texto = valor.isoformat() if hasattr(valor, "isoformat") else str(valor)
    if texto.endswith(("Z", "+00:00")):
        return texto
    return f"{texto}Z"


def _hora(valor) -> str:
    """Serializa TIME sin presentarlo como fecha UTC."""

    if valor is None:
        return ""
    return valor.isoformat() if hasattr(valor, "isoformat") else str(valor)


def _escapar_like(valor: Optional[str]) -> Optional[str]:
    """Evita que %, _ y [ del usuario alteren el patrón LIKE parametrizado."""

    if valor is None:
        return None
    return (
        valor.replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
        .replace("[", "\\[")
    )


def listar_tipos_institucion() -> list[dict]:
    """Tipos reales de SQL Server con el total de instituciones verificadas."""

    sql = """
        SELECT t.tipo_id, t.codigo, t.nombre, t.descripcion,
               (SELECT COUNT(*) FROM dbo.instituciones i
                 WHERE i.tipo_id = t.tipo_id
                   AND i.estado_verificacion = N'VERIFICADA') AS total_verificadas
        FROM dbo.tipos_institucion t
        ORDER BY t.tipo_id;
    """
    with get_connection() as conn:
        return [
            {
                "tipo_id": int(fila.tipo_id),
                "codigo": fila.codigo,
                "nombre": fila.nombre,
                "descripcion": fila.descripcion,
                "total_verificadas": int(fila.total_verificadas or 0),
            }
            for fila in conn.cursor().execute(sql).fetchall()
        ]


def listar_instituciones_publicas(
    tipo_codigo: Optional[str] = None,
    distrito_id: Optional[int] = None,
    termino: Optional[str] = None,
) -> list[dict]:
    sql = """
        SELECT i.institucion_id, i.nombre, i.slug, i.descripcion, i.direccion,
               i.telefono_publico, i.email_publico, i.estado_verificacion,
               i.fecha_verificacion, i.foto_archivo_id, ti.nombre AS tipo, ti.codigo AS tipo_codigo,
               d.nombre AS distrito,
               (SELECT TOP 1 p.punto_id FROM dbo.puntos_acopio p
                 WHERE p.institucion_id = i.institucion_id AND p.estado = N'ACTIVO'
                 ORDER BY p.punto_id) AS id_punto_acopio,
               (SELECT COUNT(*) FROM dbo.necesidades n
                 WHERE n.institucion_id = i.institucion_id
                   AND n.estado = N'PUBLICADA') AS necesidades_activas
        FROM dbo.instituciones i
        INNER JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
        INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
        WHERE i.estado_verificacion = N'VERIFICADA'
          AND (? IS NULL OR ti.codigo = ?)
          AND (? IS NULL OR i.distrito_id = ?)
          AND (? IS NULL OR i.nombre LIKE N'%' + ? + N'%' ESCAPE '\\'
                        OR i.descripcion LIKE N'%' + ? + N'%' ESCAPE '\\')
        ORDER BY i.nombre, i.institucion_id;
    """
    termino_escapado = _escapar_like(termino)
    parametros = (
        tipo_codigo,
        tipo_codigo,
        distrito_id,
        distrito_id,
        termino_escapado,
        termino_escapado,
        termino_escapado,
    )
    with get_connection() as conn:
        return [_fila_resumen(fila) for fila in conn.cursor().execute(sql, parametros).fetchall()]


def _fila_resumen(fila) -> dict:
    return {
        "id_institucion": int(fila.institucion_id),
        "nombre": fila.nombre,
        "nombre_comercial": fila.nombre,
        "tipo": fila.tipo,
        "tipo_institucion": fila.tipo,
        "tipo_codigo": fila.tipo_codigo,
        "descripcion": fila.descripcion,
        "distrito": fila.distrito,
        "direccion": fila.direccion,
        "estado_verificacion": fila.estado_verificacion,
        "id_punto_acopio": int(fila.id_punto_acopio) if fila.id_punto_acopio is not None else None,
        "necesidades_activas": int(fila.necesidades_activas or 0),
        "slug": fila.slug,
        "telefono_publico": fila.telefono_publico,
        "email_publico": fila.email_publico,
        "fecha_verificacion": _fecha_utc(fila.fecha_verificacion),
        "tiene_foto": fila.foto_archivo_id is not None,
    }


def obtener_institucion_publica(id_institucion: int) -> Optional[dict]:
    sql = """
        SELECT i.institucion_id, i.nombre, i.slug, i.descripcion, i.direccion,
               i.telefono_publico, i.email_publico, i.estado_verificacion,
               i.fecha_verificacion, i.foto_archivo_id, ti.nombre AS tipo,
               ti.codigo AS tipo_codigo, d.nombre AS distrito,
               (SELECT TOP 1 p.punto_id FROM dbo.puntos_acopio p
                 WHERE p.institucion_id = i.institucion_id AND p.estado = N'ACTIVO'
                 ORDER BY p.punto_id) AS id_punto_acopio,
               (SELECT COUNT(*) FROM dbo.necesidades n
                 WHERE n.institucion_id = i.institucion_id
                   AND n.estado = N'PUBLICADA') AS necesidades_activas
        FROM dbo.instituciones i
        INNER JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
        INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
        WHERE i.institucion_id = ? AND i.estado_verificacion = N'VERIFICADA';
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        fila = cursor.execute(sql, (id_institucion,)).fetchone()
        if not fila:
            return None
        institucion = _fila_resumen(fila)

        puntos = cursor.execute(
            """
            SELECT punto_id, nombre, direccion, referencias_entrega
            FROM dbo.puntos_acopio
            WHERE institucion_id = ? AND estado = N'ACTIVO'
            ORDER BY punto_id;
            """,
            (id_institucion,),
        ).fetchall()
        institucion["puntos_acopio"] = [
            {
                "punto_id": int(p.punto_id),
                "nombre": p.nombre,
                "direccion": p.direccion,
                "referencias_entrega": p.referencias_entrega,
            }
            for p in puntos
        ]

        institucion["horarios"] = [
            {
                "punto_id": int(h.punto_id),
                "dia_semana": int(h.dia_semana),
                "hora_apertura": _hora(h.hora_apertura),
                "hora_cierre": _hora(h.hora_cierre),
            }
            for h in cursor.execute(
                """
                SELECT h.punto_id, h.dia_semana, h.hora_apertura, h.hora_cierre
                FROM dbo.puntos_acopio_horarios h
                INNER JOIN dbo.puntos_acopio p ON p.punto_id = h.punto_id
                WHERE p.institucion_id = ? AND p.estado = N'ACTIVO' AND h.activo = 1
                ORDER BY h.punto_id, h.dia_semana;
                """,
                (id_institucion,),
            ).fetchall()
        ]

        institucion["bienes_solicitados"] = [
            {
                "producto_id": int(b.producto_id),
                "producto": b.producto,
                "categoria": b.categoria or "",
                "unidad_id": int(b.unidad_id),
                "unidad_codigo": b.unidad_codigo,
                "simbolo": b.simbolo or "",
            }
            for b in cursor.execute(
                """
                SELECT p.producto_id, p.nombre AS producto, c.nombre AS categoria,
                       np.unidad_id, u.codigo AS unidad_codigo, u.simbolo
                FROM dbo.necesidades n
                INNER JOIN dbo.necesidad_productos np ON np.necesidad_id = n.necesidad_id
                INNER JOIN dbo.productos p ON p.producto_id = np.producto_id
                INNER JOIN dbo.unidades_medida u ON u.unidad_id = np.unidad_id
                LEFT JOIN dbo.categorias_bienes c ON c.categoria_id = p.categoria_id
                WHERE n.institucion_id = ? AND n.estado = N'PUBLICADA'
                GROUP BY p.producto_id, p.nombre, c.nombre,
                         np.unidad_id, u.codigo, u.simbolo
                ORDER BY p.nombre, u.codigo;
                """,
                (id_institucion,),
            ).fetchall()
        ]

        institucion["necesidades"] = listar_necesidades_publicas(
            institucion_id=id_institucion, limite=12
        )
        return institucion


def obtener_necesidad_publica(id_necesidad: int) -> Optional[dict]:
    sql = """
        SELECT n.necesidad_id, n.titulo, n.descripcion, n.prioridad, n.estado,
               n.fecha_publicacion, n.fecha_limite, n.institucion_id,
               i.nombre AS institucion, d.nombre AS distrito,
               n.punto_acopio_id, pa.nombre AS punto_acopio,
               pa.direccion AS direccion_acopio, pa.referencias_entrega,
               pro.avance_porcentaje,
               pro.lineas_totales, pro.lineas_cubiertas,
               (SELECT ISNULL(SUM(cantidad_requerida), 0)
                  FROM dbo.vw_disponibilidad_necesidad WHERE necesidad_id = n.necesidad_id) AS requerida,
               (SELECT ISNULL(SUM(cantidad_reservada_vigente), 0)
                  FROM dbo.vw_disponibilidad_necesidad WHERE necesidad_id = n.necesidad_id) AS reservada,
               (SELECT ISNULL(SUM(cantidad_recibida), 0)
                  FROM dbo.vw_disponibilidad_necesidad WHERE necesidad_id = n.necesidad_id) AS recibida,
               (SELECT ISNULL(SUM(cantidad_disponible), 0)
                  FROM dbo.vw_disponibilidad_necesidad WHERE necesidad_id = n.necesidad_id) AS disponible,
               (SELECT TOP 1 p.categoria_id
                  FROM dbo.necesidad_productos np
                  INNER JOIN dbo.productos p ON p.producto_id = np.producto_id
                  WHERE np.necesidad_id = n.necesidad_id
                  ORDER BY np.producto_id, np.unidad_id) AS id_categoria,
               (SELECT TOP 1 c.nombre
                  FROM dbo.necesidad_productos np
                  INNER JOIN dbo.productos p ON p.producto_id = np.producto_id
                  INNER JOIN dbo.categorias_bienes c ON c.categoria_id = p.categoria_id
                  WHERE np.necesidad_id = n.necesidad_id
                  ORDER BY np.producto_id, np.unidad_id) AS categoria,
               (SELECT TOP 1 u.simbolo
                  FROM dbo.necesidad_productos np
                  INNER JOIN dbo.unidades_medida u ON u.unidad_id = np.unidad_id
                  WHERE np.necesidad_id = n.necesidad_id
                  ORDER BY np.producto_id, np.unidad_id) AS unidad_medida_base
        FROM dbo.necesidades n
        INNER JOIN dbo.instituciones i ON i.institucion_id = n.institucion_id
        INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
        LEFT JOIN dbo.puntos_acopio pa
               ON pa.punto_id = n.punto_acopio_id
              AND pa.institucion_id = n.institucion_id
              AND pa.estado = N'ACTIVO'
        LEFT JOIN dbo.vw_progreso_necesidad pro ON pro.necesidad_id = n.necesidad_id
        WHERE n.necesidad_id = ? AND n.estado = N'PUBLICADA'
          AND i.estado_verificacion = N'VERIFICADA';
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        fila = cursor.execute(sql, (id_necesidad,)).fetchone()
        if not fila:
            return None

        lineas = cursor.execute(
            """
            SELECT np.producto_id, p.nombre AS producto, c.nombre AS categoria,
                   np.unidad_id, u.codigo AS unidad_codigo, u.nombre AS unidad,
                   u.simbolo, np.cantidad_requerida,
                   ISNULL(v.cantidad_reservada_vigente, 0) AS cantidad_reservada_vigente,
                   ISNULL(v.cantidad_recibida, 0) AS cantidad_recibida,
                   ISNULL(v.cantidad_disponible, 0) AS cantidad_disponible
            FROM dbo.necesidad_productos np
            INNER JOIN dbo.productos p ON p.producto_id = np.producto_id
            INNER JOIN dbo.unidades_medida u ON u.unidad_id = np.unidad_id
            LEFT JOIN dbo.categorias_bienes c ON c.categoria_id = p.categoria_id
            LEFT JOIN dbo.vw_disponibilidad_necesidad v
                ON v.necesidad_id = np.necesidad_id
               AND v.producto_id = np.producto_id
               AND v.unidad_id = np.unidad_id
            WHERE np.necesidad_id = ?
            ORDER BY p.nombre, u.codigo;
            """,
            (id_necesidad,),
        ).fetchall()

        return {
            "id_necesidad": int(fila.necesidad_id),
            "necesidad_id": int(fila.necesidad_id),
            "titulo": fila.titulo,
            "descripcion": fila.descripcion,
            "cantidad_requerida": _numero(fila.requerida),
            "cantidad_comprometida": _numero(fila.reservada),
            "cantidad_recibida": _numero(fila.recibida),
            "cantidad_disponible": _numero(fila.disponible),
            "avance_porcentaje": _numero(fila.avance_porcentaje),
            "lineas_totales": int(fila.lineas_totales or 0),
            "lineas_cubiertas": int(fila.lineas_cubiertas or 0),
            "unidad_medida_base": fila.unidad_medida_base or "",
            "prioridad": fila.prioridad,
            "estado": fila.estado,
            "fecha_publicacion": _fecha_utc(fila.fecha_publicacion),
            "fecha_limite": _fecha_utc(fila.fecha_limite),
            "id_institucion": int(fila.institucion_id),
            "institucion": fila.institucion,
            "distrito": fila.distrito,
            "id_categoria": int(fila.id_categoria) if fila.id_categoria is not None else None,
            "categoria": fila.categoria or "",
            "id_punto_acopio": (
                int(fila.punto_acopio_id) if fila.punto_acopio_id is not None else None
            ),
            "punto_acopio": fila.punto_acopio or "",
            "nombre_punto": fila.punto_acopio or "",
            "direccion_acopio": fila.direccion_acopio or "",
            "referencias_entrega": fila.referencias_entrega or "",
            "lineas": [
                {
                    "producto_id": int(linea.producto_id),
                    "producto": linea.producto,
                    "categoria": linea.categoria or "",
                    "unidad_id": int(linea.unidad_id),
                    "unidad_codigo": linea.unidad_codigo,
                    "unidad": linea.unidad,
                    "simbolo": linea.simbolo,
                    "cantidad_requerida": _numero(linea.cantidad_requerida),
                    "cantidad_reservada_vigente": _numero(linea.cantidad_reservada_vigente),
                    "cantidad_recibida": _numero(linea.cantidad_recibida),
                    "cantidad_disponible": _numero(linea.cantidad_disponible),
                }
                for linea in lineas
            ],
        }


def no_encontrado(recurso: str) -> ErrorNegocio:
    return ErrorNegocio(404, "RECURSO_NO_PUBLICO", f"{recurso} no encontrado o no disponible públicamente.")
