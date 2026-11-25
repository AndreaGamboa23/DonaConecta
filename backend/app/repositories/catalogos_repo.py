from app.database.connection import get_connection

def listar_categorias() -> list[dict]:
    sql = """
        SELECT id_categoria, nombre, descripcion, unidad_medida_base
        FROM categorias_bien
        WHERE activo = 1
        ORDER BY id_categoria;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql).fetchall()
        return [
            {
                "id_categoria": row.id_categoria,
                "nombre": row.nombre,
                "descripcion": row.descripcion,
                "unidad_medida_base": row.unidad_medida_base,
            }
            for row in rows
        ]

def verificar_conexion_db() -> str:
    with get_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute("SELECT DB_NAME() AS base_actual;").fetchone()
        return row.base_actual if row else "desconocida"
