from typing import Optional
from app.database.connection import get_connection

def crear_institucion(id_representante: int, datos: dict) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute(
            """
            INSERT INTO instituciones (
                id_representante, ruc, razon_social, nombre_comercial,
                tipo_institucion, descripcion, distrito, direccion
            )
            OUTPUT INSERTED.id_institucion, INSERTED.estado_verificacion
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                id_representante,
                datos["ruc"],
                datos["razon_social"],
                datos["nombre_comercial"],
                datos["tipo_institucion"],
                datos.get("descripcion"),
                datos["distrito"],
                datos["direccion"],
            ),
        ).fetchone()
        id_inst = int(row.id_institucion)
        cursor.execute(
            """
            INSERT INTO puntos_acopio (id_institucion, nombre_punto, distrito, direccion)
            VALUES (?, ?, ?, ?);
            """,
            (id_inst, f"Sede Principal - {datos['nombre_comercial']}", datos["distrito"], datos["direccion"]),
        )
        conn.commit()
        return {
            "id_institucion": id_inst,
            "ruc": datos["ruc"],
            "razon_social": datos["razon_social"],
            "nombre_comercial": datos["nombre_comercial"],
            "tipo_institucion": datos["tipo_institucion"],
            "distrito": datos["distrito"],
            "direccion": datos["direccion"],
            "estado_verificacion": row.estado_verificacion,
        }

def listar_instituciones_verificadas() -> list[dict]:
    sql = """
        SELECT i.id_institucion, i.ruc, i.razon_social, i.nombre_comercial,
               i.tipo_institucion, i.descripcion, i.distrito, i.direccion, i.estado_verificacion,
               (SELECT TOP 1 p.id_punto_acopio FROM puntos_acopio p WHERE p.id_institucion = i.id_institucion AND p.activo = 1) AS id_punto_acopio
        FROM instituciones i
        WHERE i.estado_verificacion = 'VERIFICADA' AND i.activo = 1
        ORDER BY i.nombre_comercial;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql).fetchall()
        return [
            {
                "id_institucion": r.id_institucion,
                "ruc": r.ruc,
                "razon_social": r.razon_social,
                "nombre_comercial": r.nombre_comercial,
                "tipo_institucion": r.tipo_institucion,
                "descripcion": r.descripcion,
                "distrito": r.distrito,
                "direccion": r.direccion,
                "estado_verificacion": r.estado_verificacion,
                "id_punto_acopio": r.id_punto_acopio,
            }
            for r in rows
        ]

def actualizar_verificacion_institucion(
    id_institucion: int, estado_verificacion: str, id_admin: int
) -> Optional[dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        existe = cursor.execute(
            "SELECT id_institucion, nombre_comercial FROM instituciones WHERE id_institucion = ?;",
            (id_institucion,),
        ).fetchone()
        if not existe:
            return None
        cursor.execute(
            """
            UPDATE instituciones
            SET estado_verificacion = ?,
                verificada_por = ?,
                verificada_en = SYSDATETIME()
            WHERE id_institucion = ?;
            """,
            (estado_verificacion, id_admin, id_institucion),
        )
        conn.commit()
        return {
            "id_institucion": id_institucion,
            "nombre_comercial": existe.nombre_comercial,
            "estado_verificacion": estado_verificacion,
        }

def listar_instituciones_pendientes() -> list[dict]:
    sql = """
        SELECT i.id_institucion, i.ruc, i.razon_social, i.nombre_comercial,
               i.tipo_institucion, i.descripcion, i.distrito, i.direccion, i.estado_verificacion,
               u.nombres + ' ' + u.apellidos AS representante, u.correo AS correo_representante
        FROM instituciones i
        INNER JOIN usuarios u ON u.id_usuario = i.id_representante
        WHERE i.estado_verificacion = 'PENDIENTE' AND i.activo = 1
        ORDER BY i.creado_en ASC;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql).fetchall()
        return [
            {
                "id_institucion": r.id_institucion,
                "ruc": r.ruc,
                "razon_social": r.razon_social,
                "nombre_comercial": r.nombre_comercial,
                "tipo_institucion": r.tipo_institucion,
                "descripcion": r.descripcion,
                "distrito": r.distrito,
                "direccion": r.direccion,
                "estado_verificacion": r.estado_verificacion,
                "representante": r.representante,
                "correo_representante": r.correo_representante,
            }
            for r in rows
        ]
