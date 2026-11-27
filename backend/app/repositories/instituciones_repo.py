"""Instituciones con las columnas reales del modelo Fase 06.

No existen ``ruc``, ``razon_social`` ni ``nombre_comercial``: los campos
heredados se ignoran. La verificación siempre se crea en ``PENDIENTE``.
"""

import re
import unicodedata
import uuid
from typing import Optional

from app.core.errores import ErrorNegocio, error_catalogo
from app.database.connection import get_connection


def _slug_base(nombre: str) -> str:
    normalizado = unicodedata.normalize("NFKD", nombre).encode("ascii", "ignore").decode("ascii")
    limpio = re.sub(r"[^a-zA-Z0-9]+", "-", normalizado).strip("-").lower()
    return limpio[:180] or "institucion"


def generar_slug(nombre: str) -> str:
    """Slug estable y único; el sufijo evita colisiones sin inventar datos de negocio."""

    return f"{_slug_base(nombre)}-{uuid.uuid4().hex[:10]}"[:220]


def _obtener_tipo_id(cursor, datos: dict) -> int:
    tipo_id = datos.get("tipo_id")
    if tipo_id:
        fila = cursor.execute(
            "SELECT tipo_id FROM dbo.tipos_institucion WHERE tipo_id = ?;", (tipo_id,)
        ).fetchone()
        if fila:
            return int(fila.tipo_id)
        raise error_catalogo("El tipo de institución indicado no existe.")

    codigo = (datos.get("tipo_institucion") or "").strip().upper()
    if codigo:
        fila = cursor.execute(
            "SELECT tipo_id FROM dbo.tipos_institucion WHERE codigo = ?;", (codigo,)
        ).fetchone()
        if fila:
            return int(fila.tipo_id)
    raise error_catalogo("Debe indicar un tipo de institución válido.")


def _obtener_distrito_id(cursor, datos: dict) -> int:
    distrito_id = datos.get("distrito_id")
    if distrito_id:
        fila = cursor.execute(
            "SELECT distrito_id FROM dbo.distritos WHERE distrito_id = ? AND activo = 1;",
            (distrito_id,),
        ).fetchone()
        if fila:
            return int(fila.distrito_id)
        raise error_catalogo("El distrito indicado no existe.")

    nombre = (datos.get("distrito") or "").strip()
    if nombre:
        fila = cursor.execute(
            "SELECT distrito_id FROM dbo.distritos WHERE nombre = ? AND activo = 1;", (nombre,)
        ).fetchone()
        if fila:
            return int(fila.distrito_id)
    raise error_catalogo("Debe indicar un distrito válido de Huancayo.")


def crear_institucion_en_cursor(cursor, usuario_id: int, datos: dict) -> dict:
    """Crea la institución y vincula al representante en la transacción compartida."""

    ya_registrada = cursor.execute(
        "SELECT TOP 1 institucion_id FROM dbo.institucion_representantes WHERE usuario_id = ?;",
        (usuario_id,),
    ).fetchone()
    if ya_registrada:
        raise ErrorNegocio(
            409,
            "INSTITUCION_YA_REGISTRADA",
            "La cuenta ya tiene una institución asociada.",
        )

    tipo_id = _obtener_tipo_id(cursor, datos)
    distrito_id = _obtener_distrito_id(cursor, datos)
    nombre = (datos.get("nombre") or "").strip() or None
    if not nombre:
        raise error_catalogo("El nombre de la institución es obligatorio.")

    fila = cursor.execute(
        """
        INSERT INTO dbo.instituciones (
            tipo_id, distrito_id, nombre, slug, descripcion, direccion,
            telefono_publico, email_publico, estado_verificacion
        )
        OUTPUT INSERTED.institucion_id, INSERTED.estado_verificacion
        VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, N'PENDIENTE');
        """,
        (
            tipo_id,
            distrito_id,
            nombre,
            generar_slug(nombre),
            datos.get("descripcion") or None,
            datos.get("direccion") or None,
        ),
    ).fetchone()
    institucion_id = int(fila.institucion_id)

    cursor.execute(
        """
        INSERT INTO dbo.institucion_representantes (
            institucion_id, usuario_id, cargo, es_contacto_principal, estado
        )
        VALUES (?, ?, ?, 1, N'PENDIENTE');
        """,
        (institucion_id, usuario_id, (datos.get("cargo_representante") or "").strip() or None),
    )

    return {
        "id_institucion": institucion_id,
        "nombre": nombre,
        "tipo": _nombre_catalogo(cursor, "dbo.tipos_institucion", "tipo_id", tipo_id),
        "descripcion": datos.get("descripcion") or None,
        "distrito": _nombre_catalogo(cursor, "dbo.distritos", "distrito_id", distrito_id),
        "direccion": datos.get("direccion") or None,
        "estado_verificacion": fila.estado_verificacion,
        "id_punto_acopio": None,
    }


def _nombre_catalogo(cursor, tabla: str, columna: str, valor: int) -> str:
    fila = cursor.execute(
        f"SELECT nombre FROM {tabla} WHERE {columna} = ?;", (valor,)
    ).fetchone()
    return fila.nombre if fila else ""


def crear_institucion(usuario_id: int, datos: dict) -> dict:
    with get_connection(escritura=True) as conn:
        return crear_institucion_en_cursor(conn.cursor(), usuario_id, datos)


def listar_instituciones_verificadas() -> list[dict]:
    sql = """
        SELECT i.institucion_id AS id_institucion, i.nombre, ti.nombre AS tipo, i.descripcion,
               d.nombre AS distrito, i.direccion, i.estado_verificacion,
               (
                   SELECT TOP 1 p.punto_id
                   FROM dbo.puntos_acopio p
                   WHERE p.institucion_id = i.institucion_id AND p.estado = N'ACTIVO'
                   ORDER BY p.creado_en, p.punto_id
               ) AS id_punto_acopio
        FROM dbo.instituciones i
        INNER JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
        INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
        WHERE i.estado_verificacion = N'VERIFICADA'
        ORDER BY i.nombre;
    """
    with get_connection() as conn:
        return [_fila_publica(fila) for fila in conn.cursor().execute(sql).fetchall()]


def _fila_publica(fila) -> dict:
    return {
        "id_institucion": int(fila.id_institucion),
        "nombre": fila.nombre,
        "nombre_comercial": fila.nombre,
        "tipo": fila.tipo,
        "tipo_institucion": fila.tipo,
        "descripcion": fila.descripcion,
        "distrito": fila.distrito,
        "direccion": fila.direccion,
        "estado_verificacion": fila.estado_verificacion,
        "id_punto_acopio": int(fila.id_punto_acopio) if fila.id_punto_acopio is not None else None,
    }


def listar_instituciones_pendientes() -> list[dict]:
    sql = """
        SELECT i.institucion_id AS id_institucion, i.nombre, ti.nombre AS tipo, i.descripcion,
               d.nombre AS distrito, i.direccion, i.estado_verificacion,
               u.nombres + N' ' + u.apellidos AS representante,
               u.email AS correo_representante
        FROM dbo.instituciones i
        INNER JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
        INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
        INNER JOIN dbo.institucion_representantes ir ON ir.institucion_id = i.institucion_id
        INNER JOIN dbo.usuarios u ON u.usuario_id = ir.usuario_id
        WHERE i.estado_verificacion = N'PENDIENTE' AND ir.es_contacto_principal = 1
        ORDER BY i.fecha_registro;
    """
    with get_connection() as conn:
        filas = conn.cursor().execute(sql).fetchall()
        return [
            {
                "id_institucion": int(fila.id_institucion),
                "nombre": fila.nombre,
                "tipo": fila.tipo,
                "descripcion": fila.descripcion,
                "distrito": fila.distrito,
                "direccion": fila.direccion,
                "estado_verificacion": fila.estado_verificacion,
                "representante": fila.representante,
                "correo_representante": fila.correo_representante,
            }
            for fila in filas
        ]


def actualizar_verificacion_institucion(
    id_institucion: int,
    estado_verificacion: str,
    id_admin: int,
    motivo: Optional[str] = None,
) -> Optional[dict]:
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        fila = cursor.execute(
            "SELECT nombre, estado_verificacion FROM dbo.instituciones WHERE institucion_id = ?;",
            (id_institucion,),
        ).fetchone()
        if not fila:
            return None
        if fila.estado_verificacion == estado_verificacion:
            raise ErrorNegocio(
                409,
                "ESTADO_SIN_CAMBIO",
                "La institución ya se encuentra en el estado indicado.",
            )

        cursor.execute(
            """
            UPDATE dbo.instituciones
            SET estado_verificacion = ?,
                fecha_verificacion = CASE WHEN ? = N'VERIFICADA' THEN SYSUTCDATETIME() ELSE NULL END,
                verificado_por_usuario_id = CASE WHEN ? = N'VERIFICADA' THEN ? ELSE NULL END
            WHERE institucion_id = ?;
            """,
            (estado_verificacion, estado_verificacion, estado_verificacion, id_admin, id_institucion),
        )

        # La vista vw_representante_autorizado exige vínculo y rol ACTIVO. Sin este
        # ajuste, verificar la institución no habilitaría la operación real.
        estado_vinculo = "ACTIVO" if estado_verificacion == "VERIFICADA" else "INACTIVO"
        cursor.execute(
            """
            UPDATE dbo.institucion_representantes
            SET estado = ?
            WHERE institucion_id = ?;
            """,
            (estado_vinculo, id_institucion),
        )
        cursor.execute(
            """
            UPDATE ur
            SET estado = ?
            FROM dbo.usuario_roles ur
            INNER JOIN dbo.institucion_representantes ir ON ir.usuario_id = ur.usuario_id
            INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id AND r.codigo = N'REPRESENTANTE'
            WHERE ir.institucion_id = ?
              AND ir.es_contacto_principal = 1;
            """,
            (estado_vinculo, id_institucion),
        )
        cursor.execute(
            """
            INSERT INTO dbo.verificaciones_institucion (
                institucion_id, revisor_usuario_id, estado_anterior, estado_nuevo, motivo
            )
            VALUES (?, ?, ?, ?, ?);
            """,
            (id_institucion, id_admin, fila.estado_verificacion, estado_verificacion, motivo),
        )
        return {
            "id_institucion": id_institucion,
            "nombre": fila.nombre,
            "estado_verificacion": estado_verificacion,
        }
