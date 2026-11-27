"""Acceso a usuarios, sesiones, perfil y baja lógica (modelo Fase 06).

Todas las sentencias usan parámetros ``?`` de PyODBC. Ninguna función devuelve
``password_hash``, hashes de token, nonces ni claves al resto de la aplicación.
"""

import hashlib
from datetime import datetime
from typing import Optional

from app.database.connection import get_connection


_ROLES_ACTIVOS_SQL = """
    SELECT r.codigo
    FROM dbo.usuario_roles ur
    INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id
    WHERE ur.usuario_id = ? AND ur.estado = N'ACTIVO' AND r.activo = 1
    ORDER BY r.codigo;
"""


def _roles_de_cursor(cursor, usuario_id: int) -> list[str]:
    return [fila.codigo for fila in cursor.execute(_ROLES_ACTIVOS_SQL, (usuario_id,)).fetchall()]


def _fecha(valor) -> Optional[str]:
    return valor.isoformat() if isinstance(valor, datetime) else (str(valor) if valor else None)


def hash_token(token: str) -> bytes:
    """SHA-256 del JWT: la base guarda un hash, nunca el token en texto plano."""

    return hashlib.sha256(token.encode("utf-8")).digest()


def buscar_usuario_por_correo(correo: str) -> Optional[dict]:
    sql = """
        SELECT usuario_id, email, nombres, apellidos, password_hash, hash_version, estado_cuenta
        FROM dbo.usuarios
        WHERE email = ?;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        fila = cursor.execute(sql, (correo.strip().lower(),)).fetchone()
        if not fila:
            return None
        return {
            "id_usuario": int(fila.usuario_id),
            "usuario_id": int(fila.usuario_id),
            "nombres": fila.nombres,
            "apellidos": fila.apellidos,
            "correo": fila.email,
            "email": fila.email,
            "password_hash": fila.password_hash,
            "hash_version": int(fila.hash_version),
            "estado_cuenta": fila.estado_cuenta,
            "activo": fila.estado_cuenta == "ACTIVO",
            "roles": _roles_de_cursor(cursor, int(fila.usuario_id)),
        }


def buscar_usuario_por_id(id_usuario: int) -> Optional[dict]:
    sql = """
        SELECT usuario_id, email, nombres, apellidos, estado_cuenta
        FROM dbo.usuarios
        WHERE usuario_id = ?;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        fila = cursor.execute(sql, (id_usuario,)).fetchone()
        if not fila:
            return None
        return {
            "id_usuario": int(fila.usuario_id),
            "usuario_id": int(fila.usuario_id),
            "nombres": fila.nombres,
            "apellidos": fila.apellidos,
            "correo": fila.email,
            "email": fila.email,
            "estado_cuenta": fila.estado_cuenta,
            "activo": fila.estado_cuenta == "ACTIVO",
            "roles": _roles_de_cursor(cursor, int(fila.usuario_id)),
        }


def obtener_rol_id(cursor, codigo: str) -> Optional[int]:
    fila = cursor.execute(
        "SELECT rol_id FROM dbo.roles WHERE codigo = ? AND activo = 1;", (codigo,)
    ).fetchone()
    return int(fila.rol_id) if fila else None


def distrito_existe(cursor, distrito_id: int) -> bool:
    fila = cursor.execute(
        "SELECT distrito_id FROM dbo.distritos WHERE distrito_id = ? AND activo = 1;",
        (distrito_id,),
    ).fetchone()
    return fila is not None


def crear_usuario_en_cursor(
    cursor,
    *,
    nombres: str,
    apellidos: str,
    email: str,
    password_hash: str,
    hash_version: int,
    estado_cuenta: str,
    rol_id: int,
    codigo_rol: str,
    telefono_cifrado: Optional[bytes] = None,
    telefono_nonce: Optional[bytes] = None,
    telefono_clave_version: Optional[int] = None,
) -> dict:
    """Inserta usuario y rol dentro de la transacción abierta por el servicio."""

    fila = cursor.execute(
        """
        INSERT INTO dbo.usuarios (
            email, password_hash, hash_version, nombres, apellidos,
            telefono_cifrado, telefono_nonce, telefono_clave_version, estado_cuenta
        )
        OUTPUT INSERTED.usuario_id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (
            email,
            password_hash,
            hash_version,
            nombres,
            apellidos,
            telefono_cifrado,
            telefono_nonce,
            telefono_clave_version,
            estado_cuenta,
        ),
    ).fetchone()
    usuario_id = int(fila.usuario_id)

    cursor.execute(
        """
        INSERT INTO dbo.usuario_roles (usuario_id, rol_id, estado)
        VALUES (?, ?, N'ACTIVO');
        """,
        (usuario_id, rol_id),
    )
    return {"id_usuario": usuario_id, "roles": [codigo_rol]}


def crear_donante_en_cursor(
    cursor,
    *,
    usuario_id: int,
    distrito_id: int,
    preferencia_notificacion: str,
) -> None:
    cursor.execute(
        """
        INSERT INTO dbo.donantes (
            usuario_id, distrito_id, preferencia_notificacion,
            consentimiento_datos, acepta_terminos
        )
        VALUES (?, ?, ?, 1, 1);
        """,
        (usuario_id, distrito_id, preferencia_notificacion),
    )


def obtener_perfil_completo(usuario_id: int) -> Optional[dict]:
    """Consulta completa del propio usuario, sin secretos ni datos ajenos."""

    sql = """
        SELECT u.usuario_id, u.email, u.nombres, u.apellidos, u.estado_cuenta,
               u.fecha_registro, u.email_verificado_en, u.ultimo_acceso_en,
               u.telefono_cifrado, u.telefono_nonce, u.telefono_clave_version
        FROM dbo.usuarios u
        WHERE u.usuario_id = ?;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        fila = cursor.execute(sql, (usuario_id,)).fetchone()
        if not fila:
            return None

        perfil = {
            "id_usuario": int(fila.usuario_id),
            "nombres": fila.nombres,
            "apellidos": fila.apellidos,
            "correo": fila.email,
            "roles": _roles_de_cursor(cursor, usuario_id),
            "estado_cuenta": fila.estado_cuenta,
            "fecha_registro": _fecha(fila.fecha_registro),
            "email_verificado_en": _fecha(fila.email_verificado_en),
            "ultimo_acceso_en": _fecha(fila.ultimo_acceso_en),
            "foto_url": None,
            "_telefono": (
                bytes(fila.telefono_cifrado) if fila.telefono_cifrado else None,
                bytes(fila.telefono_nonce) if fila.telefono_nonce else None,
                int(fila.telefono_clave_version) if fila.telefono_clave_version else None,
            ),
            "donante": None,
            "institucion": None,
        }

        donante = cursor.execute(
            """
            SELECT d.distrito_id, di.nombre AS distrito_nombre,
                   d.preferencia_notificacion, d.consentimiento_datos,
                   d.acepta_terminos, d.fecha_registro
            FROM dbo.donantes d
            INNER JOIN dbo.distritos di ON di.distrito_id = d.distrito_id
            WHERE d.usuario_id = ?;
            """,
            (usuario_id,),
        ).fetchone()
        if donante:
            perfil["donante"] = {
                "distrito_id": int(donante.distrito_id),
                "distrito": donante.distrito_nombre,
                "preferencia_notificacion": donante.preferencia_notificacion,
                "consentimiento_datos": bool(donante.consentimiento_datos),
                "acepta_terminos": bool(donante.acepta_terminos),
                "fecha_registro": _fecha(donante.fecha_registro),
            }

        institucion = cursor.execute(
            """
            SELECT TOP 1 i.institucion_id, i.nombre, i.estado_verificacion,
                   ti.nombre AS tipo_institucion, ir.cargo, ir.estado AS vinculo_estado,
                   ir.fecha_inicio
            FROM dbo.institucion_representantes ir
            INNER JOIN dbo.instituciones i ON i.institucion_id = ir.institucion_id
            LEFT JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
            WHERE ir.usuario_id = ?
            ORDER BY ir.fecha_inicio DESC, ir.institucion_id DESC;
            """,
            (usuario_id,),
        ).fetchone()
        if institucion:
            perfil["institucion"] = {
                "institucion_id": int(institucion.institucion_id),
                "nombre": institucion.nombre,
                "tipo": institucion.tipo_institucion,
                "estado_verificacion": institucion.estado_verificacion,
                "cargo": institucion.cargo,
                "vinculo_estado": institucion.vinculo_estado,
                "fecha_inicio": _fecha(institucion.fecha_inicio),
            }
        return perfil


def actualizar_usuario_en_cursor(
    cursor,
    *,
    usuario_id: int,
    nombres: str,
    apellidos: str,
    telefono_cifrado: Optional[bytes],
    telefono_nonce: Optional[bytes],
    telefono_clave_version: Optional[int],
) -> None:
    cursor.execute(
        """
        UPDATE dbo.usuarios
        SET nombres = ?, apellidos = ?, telefono_cifrado = ?,
            telefono_nonce = ?, telefono_clave_version = ?
        WHERE usuario_id = ?;
        """,
        (
            nombres,
            apellidos,
            telefono_cifrado,
            telefono_nonce,
            telefono_clave_version,
            usuario_id,
        ),
    )


def actualizar_donante_en_cursor(
    cursor, *, usuario_id: int, distrito_id: int, preferencia_notificacion: str
) -> None:
    cursor.execute(
        """
        UPDATE dbo.donantes
        SET distrito_id = ?, preferencia_notificacion = ?
        WHERE usuario_id = ?;
        """,
        (distrito_id, preferencia_notificacion, usuario_id),
    )


def verificar_correo_disponible(correo: str, usuario_id: int) -> bool:
    with get_connection() as conn:
        fila = conn.cursor().execute(
            """
            SELECT usuario_id FROM dbo.usuarios
            WHERE email = ? AND usuario_id <> ?;
            """,
            (correo.strip().lower(), usuario_id),
        ).fetchone()
        return fila is None


def actualizar_password_en_cursor(
    cursor, *, usuario_id: int, password_hash: str, hash_version: int
) -> None:
    cursor.execute(
        """
        UPDATE dbo.usuarios
        SET password_hash = ?, hash_version = ?, intentos_fallidos = 0,
            bloqueado_hasta = NULL
        WHERE usuario_id = ?;
        """,
        (password_hash, hash_version, usuario_id),
    )


def actualizar_correo_en_cursor(cursor, *, usuario_id: int, correo: str) -> None:
    cursor.execute(
        """
        UPDATE dbo.usuarios
        SET email = ?, email_verificado_en = NULL
        WHERE usuario_id = ?;
        """,
        (correo.strip().lower(), usuario_id),
    )


def tiene_compromisos_activos(usuario_id: int) -> bool:
    with get_connection() as conn:
        fila = conn.cursor().execute(
            """
            SELECT COUNT(*) AS Total
            FROM dbo.compromisos
            WHERE donante_usuario_id = ? AND estado IN (N'PENDIENTE', N'ACEPTADO');
            """,
            (usuario_id,),
        ).fetchone()
        return int(fila.Total) > 0


def dar_baja_usuario_en_cursor(cursor, usuario_id: int) -> None:
    cursor.execute(
        """
        UPDATE dbo.usuarios
        SET estado_cuenta = N'BAJA', fecha_baja = SYSUTCDATETIME()
        WHERE usuario_id = ?;
        """,
        (usuario_id,),
    )
    cursor.execute(
        "UPDATE dbo.usuario_roles SET estado = N'INACTIVO' WHERE usuario_id = ?;",
        (usuario_id,),
    )
    cursor.execute(
        """
        UPDATE dbo.institucion_representantes
        SET estado = N'RETIRADO', fecha_fin = SYSUTCDATETIME()
        WHERE usuario_id = ? AND estado IN (N'ACTIVO', N'PENDIENTE')
          AND fecha_fin IS NULL;
        """,
        (usuario_id,),
    )
    revocar_sesiones_en_cursor(cursor, usuario_id)


def contar_actividad(usuario_id: int) -> dict:
    """Cantidades calculadas desde tablas reales; nunca valores estimados."""

    consultas = {
        "compromisos": """
            SELECT COUNT(*) AS Total FROM dbo.compromisos
            WHERE donante_usuario_id = ?;
        """,
        "entregas": """
            SELECT COUNT(*) AS Total
            FROM dbo.entregas e
            INNER JOIN dbo.compromisos c ON c.compromiso_id = e.compromiso_id
            WHERE c.donante_usuario_id = ?;
        """,
        "recepciones": """
            SELECT COUNT(*) AS Total
            FROM dbo.recepciones r
            INNER JOIN dbo.entregas e ON e.entrega_id = r.entrega_id
            INNER JOIN dbo.compromisos c ON c.compromiso_id = e.compromiso_id
            WHERE c.donante_usuario_id = ?;
        """,
        "conversaciones": """
            SELECT COUNT(*) AS Total FROM dbo.conversaciones
            WHERE creada_por_usuario_id = ?;
        """,
        "historial": """
            SELECT COUNT(*) AS Total FROM dbo.auditoria_eventos
            WHERE usuario_id = ?;
        """,
    }
    with get_connection() as conn:
        cursor = conn.cursor()
        return {clave: int(cursor.execute(sql, (usuario_id,)).fetchone().Total)
                for clave, sql in consultas.items()}


def registrar_evento_en_cursor(
    cursor,
    *,
    usuario_id: int,
    tipo_evento: str,
    descripcion: str,
    modulo: str = "USUARIOS",
    resultado: str = "OK",
) -> None:
    cursor.execute(
        """
        INSERT INTO dbo.auditoria_eventos (
            usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
            origen, resultado, descripcion
        )
        VALUES (?, ?, ?, N'USUARIO', ?, N'WEB', ?, ?);
        """,
        (usuario_id, tipo_evento, modulo, str(usuario_id), resultado, descripcion[:500]),
    )


def registrar_sesion(token: str, usuario_id: int, expira_en: datetime) -> None:
    """Guarda el hash del JWT como sesión activa usando el tipo permitido por CHECK."""

    with get_connection(escritura=True) as conn:
        conn.cursor().execute(
            """
            INSERT INTO dbo.tokens_seguridad (
                usuario_id, tipo, token_hash, expira_en
            )
            VALUES (?, N'REFRESCAR_SESION', ?, ?);
            """,
            (usuario_id, hash_token(token), expira_en),
        )


def token_sesion_valido(token: str, usuario_id: int) -> bool:
    with get_connection() as conn:
        fila = conn.cursor().execute(
            """
            SELECT token_id
            FROM dbo.tokens_seguridad
            WHERE token_hash = ? AND usuario_id = ?
              AND revocado_en IS NULL AND usado_en IS NULL
              AND expira_en > SYSUTCDATETIME();
            """,
            (hash_token(token), usuario_id),
        ).fetchone()
        return fila is not None


def revocar_token_en_cursor(cursor, token: str, usuario_id: int) -> None:
    cursor.execute(
        """
        UPDATE dbo.tokens_seguridad
        SET revocado_en = SYSUTCDATETIME()
        WHERE token_hash = ? AND usuario_id = ? AND revocado_en IS NULL;
        """,
        (hash_token(token), usuario_id),
    )


def revocar_token(token: str, usuario_id: int) -> None:
    with get_connection(escritura=True) as conn:
        revocar_token_en_cursor(conn.cursor(), token, usuario_id)
        registrar_evento_en_cursor(
            conn.cursor(),
            usuario_id=usuario_id,
            tipo_evento="SESION_CERRADA",
            descripcion="La sesión activa fue revocada en el servidor.",
            modulo="AUTENTICACION",
        )


def revocar_sesiones_en_cursor(cursor, usuario_id: int) -> None:
    cursor.execute(
        """
        UPDATE dbo.tokens_seguridad
        SET revocado_en = SYSUTCDATETIME()
        WHERE usuario_id = ? AND revocado_en IS NULL;
        """,
        (usuario_id,),
    )
