from typing import Optional
from app.database.connection import get_connection

def crear_institucion(id_representante: int, datos: dict) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute(
            """
            INSERT INTO instituciones (
                id_representante, nombre, ruc, tipo_institucion,
                direccion, distrito, provincia, departamento, descripcion
            )
            OUTPUT INSERTED.id_institucion, INSERTED.estado_verificacion
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                id_representante,
                datos["nombre"],
                datos.get("ruc"),
                datos["tipo_institucion"],
                datos["direccion"],
                datos["distrito"],
                datos["provincia"],
                datos["departamento"],
                datos.get("descripcion"),
            ),
        ).fetchone()
        conn.commit()
        return {
            "id_institucion": int(row.id_institucion),
            "nombre": datos["nombre"],
            "ruc": datos.get("ruc"),
            "tipo_institucion": datos["tipo_institucion"],
            "distrito": datos["distrito"],
            "estado_verificacion": row.estado_verificacion,
        }

def listar_instituciones_verificadas() -> list[dict]:
    sql = """
        SELECT id_institucion, nombre, ruc, tipo_institucion,
               direccion, distrito, provincia, departamento, descripcion, estado_verificacion
        FROM instituciones
        WHERE estado_verificacion = 'VERIFICADA'
        ORDER BY nombre;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql).fetchall()
        return [
            {
                "id_institucion": r.id_institucion,
                "nombre": r.nombre,
                "ruc": r.ruc,
                "tipo_institucion": r.tipo_institucion,
                "direccion": r.direccion,
                "distrito": r.distrito,
                "provincia": r.provincia,
                "departamento": r.departamento,
                "descripcion": r.descripcion,
                "estado_verificacion": r.estado_verificacion,
            }
            for r in rows
        ]

def actualizar_verificacion_institucion(
    id_institucion: int, estado_verificacion: str, observaciones: Optional[str]
) -> Optional[dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        existe = cursor.execute(
            "SELECT id_institucion, nombre FROM instituciones WHERE id_institucion = ?;",
            (id_institucion,),
        ).fetchone()
        if not existe:
            return None
        cursor.execute(
            """
            UPDATE instituciones
            SET estado_verificacion = ?,
                observaciones_verificacion = ?,
                verificado_en = SYSDATETIME()
            WHERE id_institucion = ?;
            """,
            (estado_verificacion, observaciones, id_institucion),
        )
        conn.commit()
        return {
            "id_institucion": id_institucion,
            "nombre": existe.nombre,
            "estado_verificacion": estado_verificacion,
            "observaciones_verificacion": observaciones,
        }
