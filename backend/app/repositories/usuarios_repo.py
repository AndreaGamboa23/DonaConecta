from typing import Optional
from app.database.connection import get_connection

def buscar_usuario_por_correo(correo: str) -> Optional[dict]:
    sql = """
        SELECT id_usuario, nombres, apellidos, correo, telefono, password_hash, activo
        FROM usuarios
        WHERE correo = ?;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute(sql, (correo,)).fetchone()
        if not row:
            return None
        roles_rows = cursor.execute(
            """
            SELECT r.nombre_rol
            FROM usuario_roles ur
            INNER JOIN roles r ON r.id_rol = ur.id_rol
            WHERE ur.id_usuario = ?;
            """,
            (row.id_usuario,),
        ).fetchall()
        return {
            "id_usuario": row.id_usuario,
            "nombres": row.nombres,
            "apellidos": row.apellidos,
            "correo": row.correo,
            "telefono": row.telefono,
            "password_hash": row.password_hash,
            "activo": bool(row.activo),
            "roles": [r.nombre_rol for r in roles_rows],
        }

def buscar_usuario_por_id(id_usuario: int) -> Optional[dict]:
    sql = """
        SELECT id_usuario, nombres, apellidos, correo, telefono, activo, creado_en
        FROM usuarios
        WHERE id_usuario = ?;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        row = cursor.execute(sql, (id_usuario,)).fetchone()
        if not row:
            return None
        roles_rows = cursor.execute(
            """
            SELECT r.nombre_rol
            FROM usuario_roles ur
            INNER JOIN roles r ON r.id_rol = ur.id_rol
            WHERE ur.id_usuario = ?;
            """,
            (id_usuario,),
        ).fetchall()
        return {
            "id_usuario": row.id_usuario,
            "nombres": row.nombres,
            "apellidos": row.apellidos,
            "correo": row.correo,
            "telefono": row.telefono,
            "activo": bool(row.activo),
            "roles": [r.nombre_rol for r in roles_rows],
        }

def crear_usuario_con_rol(
    nombres: str,
    apellidos: str,
    correo: str,
    telefono: Optional[str],
    password_hash: str,
    nombre_rol: str,
) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        rol_row = cursor.execute(
            "SELECT id_rol FROM roles WHERE nombre_rol = ?;", (nombre_rol,)
        ).fetchone()
        if not rol_row:
            raise ValueError("Rol no valido")

        usuario_row = cursor.execute(
            """
            INSERT INTO usuarios (nombres, apellidos, correo, telefono, password_hash)
            OUTPUT INSERTED.id_usuario
            VALUES (?, ?, ?, ?, ?);
            """,
            (nombres, apellidos, correo, telefono, password_hash),
        ).fetchone()
        id_usuario = int(usuario_row.id_usuario)

        cursor.execute(
            "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?);",
            (id_usuario, int(rol_row.id_rol)),
        )
        conn.commit()
        return {
            "id_usuario": id_usuario,
            "nombres": nombres,
            "apellidos": apellidos,
            "correo": correo,
            "telefono": telefono,
            "roles": [nombre_rol],
        }
