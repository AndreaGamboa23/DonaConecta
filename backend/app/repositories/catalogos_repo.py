"""Catálogos públicos con las columnas reales de la Fase 06."""

from app.database.connection import get_connection


def listar_categorias() -> list[dict]:
    sql = """
        SELECT categoria_id, codigo, nombre, descripcion, orden
        FROM dbo.categorias_bienes
        WHERE activo = 1
        ORDER BY orden, categoria_id;
    """
    with get_connection() as conn:
        return [
            {
                "id_categoria": int(fila.categoria_id),
                "categoria_id": int(fila.categoria_id),
                "codigo": fila.codigo,
                "nombre": fila.nombre,
                "descripcion": fila.descripcion,
                "orden": int(fila.orden),
            }
            for fila in conn.cursor().execute(sql).fetchall()
        ]


def listar_unidades_medida() -> list[dict]:
    sql = """
        SELECT unidad_id, codigo, nombre, simbolo, permite_fracciones, decimales
        FROM dbo.unidades_medida
        ORDER BY unidad_id;
    """
    with get_connection() as conn:
        return [
            {
                "id_unidad": int(fila.unidad_id),
                "unidad_id": int(fila.unidad_id),
                "codigo": fila.codigo,
                "nombre": fila.nombre,
                "simbolo": fila.simbolo,
                "permite_fracciones": bool(fila.permite_fracciones),
                "decimales": int(fila.decimales),
            }
            for fila in conn.cursor().execute(sql).fetchall()
        ]


def verificar_conexion_db() -> str:
    with get_connection() as conn:
        fila = conn.cursor().execute("SELECT DB_NAME() AS base_actual;").fetchone()
        return fila.base_actual if fila else "desconocida"
