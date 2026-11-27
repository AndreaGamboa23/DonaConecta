"""Consultas y escrituras de los paneles sobre el modelo físico de Fase 06.

Todas las sentencias son parametrizadas. Las únicas partes dinámicas son
banderas ``CASE WHEN ? = 1`` construidas con nombres de columna fijos; nunca se
interpola un valor del cliente en texto SQL. Los datos derivados se leen de las
vistas reales o se cuentan desde las tablas, sin estimaciones.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable, Mapping, Optional

from app.core.errores import ErrorNegocio, error_catalogo
from app.core.reglas_paneles import (
    fila_version_actual,
    validar_fila_version,
    validar_transicion_necesidad,
)
from app.database.connection import get_connection


def _iso(valor: Any) -> Optional[str]:
    if valor is None:
        return None
    return valor.isoformat() if hasattr(valor, "isoformat") else str(valor)


def _entero(valor: Any) -> int:
    return int(valor) if valor is not None else 0


def _id(valor: Any) -> Optional[int]:
    return int(valor) if valor is not None else None


def _numero(valor: Any) -> float:
    return float(valor) if valor is not None else 0.0


def _texto(valor: Any) -> Optional[str]:
    return None if valor is None else str(valor)


def registrar_evento_en_cursor(
    cursor,
    *,
    usuario_id: Optional[int],
    tipo_evento: str,
    modulo: str,
    recurso_tipo: str,
    recurso_id: Any,
    descripcion: str,
    resultado: str = "OK",
    origen: str = "WEB",
) -> None:
    """Auditoría homogénea dentro de la transacción del llamador."""

    cursor.execute(
        """
        INSERT INTO dbo.auditoria_eventos (
            usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
            origen, resultado, descripcion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (
            usuario_id,
            tipo_evento[:60],
            modulo[:40],
            recurso_tipo[:40],
            None if recurso_id is None else str(recurso_id)[:50],
            origen,
            resultado,
            descripcion[:500],
        ),
    )


# ------------------------------------------------------------------ Catálogo público


def listar_productos(categoria_id: Optional[int] = None) -> list[dict]:
    sql = """
        SELECT p.producto_id, p.nombre, p.descripcion, p.activo, p.categoria_id,
               c.nombre AS categoria
        FROM dbo.productos p
        INNER JOIN dbo.categorias_bienes c ON c.categoria_id = p.categoria_id
        WHERE (? IS NULL OR p.categoria_id = ?)
        ORDER BY c.orden, c.categoria_id, p.nombre, p.producto_id;
    """
    sql_unidades = """
        SELECT pu.producto_id, pu.unidad_id, pu.es_preferida,
               u.codigo, u.nombre, u.simbolo
        FROM dbo.producto_unidades pu
        INNER JOIN dbo.unidades_medida u ON u.unidad_id = pu.unidad_id
        ORDER BY pu.producto_id, pu.es_preferida DESC, u.unidad_id;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        filas = cursor.execute(sql, (categoria_id, categoria_id)).fetchall()
        productos = [
            {
                "producto_id": _entero(fila.producto_id),
                "id_producto": _entero(fila.producto_id),
                "nombre": fila.nombre,
                "descripcion": fila.descripcion,
                "activo": bool(fila.activo),
                "categoria_id": _entero(fila.categoria_id),
                "id_categoria": _entero(fila.categoria_id),
                "categoria": fila.categoria or "",
                "unidades": [],
            }
            for fila in filas
        ]
        por_id = {producto["producto_id"]: producto for producto in productos}
        if por_id:
            for unidad in cursor.execute(sql_unidades).fetchall():
                producto = por_id.get(_entero(unidad.producto_id))
                if producto is None:
                    continue
                producto["unidades"].append(
                    {
                        "unidad_id": _entero(unidad.unidad_id),
                        "id_unidad": _entero(unidad.unidad_id),
                        "codigo": unidad.codigo,
                        "nombre": unidad.nombre,
                        "simbolo": unidad.simbolo,
                        "es_preferida": bool(unidad.es_preferida),
                    }
                )
        return productos


# -------------------------------------------------------------- Panel administrativo


def resumen_admin() -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        vista = cursor.execute(
            """
            SELECT instituciones_pendientes, usuarios_activos, incidencias_abiertas
            FROM dbo.vw_admin_resumen;
            """
        ).fetchone()
        detalle = cursor.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM dbo.instituciones
                  WHERE estado_verificacion = N'VERIFICADA') AS instituciones_verificadas,
                (SELECT COUNT(*) FROM dbo.necesidades
                  WHERE estado = N'PUBLICADA') AS necesidades_publicadas,
                (SELECT COUNT(*) FROM dbo.compromisos
                  WHERE estado IN (N'PENDIENTE', N'ACEPTADO')
                    AND (expira_en IS NULL OR expira_en >= SYSUTCDATETIME()))
                    AS compromisos_activos,
                (SELECT COUNT(*) FROM dbo.productos WHERE activo = 1) AS productos_activos,
                (SELECT MAX(creado_en) FROM dbo.verificaciones_institucion)
                    AS ultima_verificacion;
            """
        ).fetchone()
        return {
            "instituciones_pendientes": _entero(vista.instituciones_pendientes if vista else 0),
            "usuarios_activos": _entero(vista.usuarios_activos if vista else 0),
            "incidencias_abiertas": _entero(vista.incidencias_abiertas if vista else 0),
            "instituciones_verificadas": _entero(detalle.instituciones_verificadas),
            "necesidades_publicadas": _entero(detalle.necesidades_publicadas),
            "compromisos_activos": _entero(detalle.compromisos_activos),
            "productos_activos": _entero(detalle.productos_activos),
            "ultima_verificacion": _iso(detalle.ultima_verificacion),
        }


def listar_instituciones_admin() -> list[dict]:
    sql = """
        SELECT i.institucion_id AS id_institucion, i.nombre, ti.nombre AS tipo,
               d.nombre AS distrito, i.descripcion, i.direccion,
               i.estado_verificacion, i.fecha_registro,
               principal.nombres + N' ' + principal.apellidos AS representante,
               principal.email AS correo_representante
        FROM dbo.instituciones i
        INNER JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
        INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
        OUTER APPLY (
            SELECT TOP 1 u.nombres, u.apellidos, u.email
            FROM dbo.institucion_representantes ir
            INNER JOIN dbo.usuarios u ON u.usuario_id = ir.usuario_id
            WHERE ir.institucion_id = i.institucion_id
            ORDER BY ir.es_contacto_principal DESC, ir.fecha_inicio, ir.usuario_id
        ) AS principal
        ORDER BY i.fecha_registro DESC, i.institucion_id DESC;
    """
    with get_connection() as conn:
        return [
            {
                "id_institucion": _entero(fila.id_institucion),
                "nombre": fila.nombre,
                "tipo": fila.tipo or "",
                "distrito": fila.distrito or "",
                "descripcion": fila.descripcion,
                "direccion": fila.direccion,
                "estado_verificacion": fila.estado_verificacion,
                "representante": fila.representante,
                "correo_representante": fila.correo_representante,
                "fecha_registro": _iso(fila.fecha_registro),
            }
            for fila in conn.cursor().execute(sql).fetchall()
        ]


def _roles_activos(cursor, usuario_id: int) -> list[str]:
    filas = cursor.execute(
        """
        SELECT r.codigo
        FROM dbo.usuario_roles ur
        INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id
        WHERE ur.usuario_id = ? AND ur.estado = N'ACTIVO' AND r.activo = 1
        ORDER BY r.codigo;
        """,
        (usuario_id,),
    ).fetchall()
    return [fila.codigo for fila in filas]


def _fila_usuario_admin(cursor, fila) -> dict:
    id_usuario = _entero(fila.usuario_id)
    return {
        "id_usuario": id_usuario,
        "nombres": fila.nombres,
        "apellidos": fila.apellidos,
        "correo": fila.email,
        "estado_cuenta": fila.estado_cuenta,
        "roles": _roles_activos(cursor, id_usuario),
        "fecha_registro": _iso(fila.fecha_registro),
        "ultimo_acceso_en": _iso(fila.ultimo_acceso_en),
    }


def listar_usuarios_admin(
    limit: int, offset: int, q: str = "", rol: Optional[str] = None
) -> dict:
    busqueda = f"%{q.strip()}%" if q and q.strip() else ""
    parametros_busqueda = (
        busqueda,
        busqueda,
        busqueda,
        busqueda,
        rol,
        rol,
    )
    where = """
        WHERE (? = N'' OR u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ?)
          AND (? IS NULL OR EXISTS (
              SELECT 1
              FROM dbo.usuario_roles ur
              INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id
              WHERE ur.usuario_id = u.usuario_id AND r.codigo = ?
          ))
    """
    sql_items = (
        """
        SELECT u.usuario_id, u.nombres, u.apellidos, u.email, u.estado_cuenta,
               u.fecha_registro, u.ultimo_acceso_en
        FROM dbo.usuarios u
        """
        + where
        + """
        ORDER BY u.fecha_registro DESC, u.usuario_id DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
        """
    )
    sql_total = "SELECT COUNT(*) AS Total FROM dbo.usuarios u " + where + ";"
    with get_connection() as conn:
        cursor = conn.cursor()
        total = _entero(cursor.execute(sql_total, parametros_busqueda).fetchone().Total)
        filas = cursor.execute(
            sql_items, (*parametros_busqueda, offset, limit)
        ).fetchall()
        return {
            "items": [_fila_usuario_admin(cursor, fila) for fila in filas],
            "total": total,
            "limit": limit,
            "offset": offset,
        }


def cambiar_estado_usuario_admin(
    usuario_id: int, estado: str, motivo: Optional[str], id_admin: int
) -> dict:
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        fila = cursor.execute(
            """
            SELECT usuario_id, nombres, apellidos, email, estado_cuenta,
                   fecha_registro, ultimo_acceso_en
            FROM dbo.usuarios WHERE usuario_id = ?;
            """,
            (usuario_id,),
        ).fetchone()
        if not fila:
            raise ErrorNegocio(404, "USUARIO_NO_ENCONTRADO", "El usuario indicado no existe.")

        cursor.execute(
            """
            UPDATE dbo.usuarios
            SET estado_cuenta = ?,
                fecha_baja = CASE WHEN ? = N'BAJA' THEN SYSUTCDATETIME() ELSE fecha_baja END
            WHERE usuario_id = ?;
            """,
            (estado, estado, usuario_id),
        )
        if estado in {"BLOQUEADO", "BAJA"}:
            cursor.execute(
                "UPDATE dbo.usuario_roles SET estado = N'INACTIVO' WHERE usuario_id = ?;",
                (usuario_id,),
            )
            cursor.execute(
                """
                UPDATE dbo.tokens_seguridad
                SET revocado_en = SYSUTCDATETIME()
                WHERE usuario_id = ? AND revocado_en IS NULL;
                """,
                (usuario_id,),
            )
        elif estado == "ACTIVO":
            # La reactivación restaura únicamente los roles cuyos requisitos del
            # modelo siguen vigentes. No se activa un rol representante sin
            # vínculo activo con una institución verificada.
            cursor.execute(
                """
                UPDATE ur
                SET estado = N'ACTIVO'
                FROM dbo.usuario_roles ur
                INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id
                WHERE ur.usuario_id = ?
                  AND r.activo = 1
                  AND (
                      r.codigo IN (N'DONANTE', N'ADMINISTRADOR')
                      OR (
                          r.codigo = N'REPRESENTANTE'
                          AND EXISTS (
                              SELECT 1
                              FROM dbo.institucion_representantes ir
                              INNER JOIN dbo.instituciones i
                                      ON i.institucion_id = ir.institucion_id
                              WHERE ir.usuario_id = ur.usuario_id
                                AND ir.estado = N'ACTIVO'
                                AND i.estado_verificacion = N'VERIFICADA'
                          )
                      )
                  );
                """,
                (usuario_id,),
            )

        descripcion = f"Estado de cuenta cambiado a {estado} desde el panel administrativo."
        if motivo and motivo.strip():
            descripcion = f"{descripcion} Motivo: {motivo.strip()}"
        registrar_evento_en_cursor(
            cursor,
            usuario_id=id_admin,
            tipo_evento="USUARIO_ESTADO",
            modulo="USUARIOS",
            recurso_tipo="USUARIO",
            recurso_id=usuario_id,
            descripcion=descripcion,
        )

        actualizada = cursor.execute(
            """
            SELECT usuario_id, nombres, apellidos, email, estado_cuenta,
                   fecha_registro, ultimo_acceso_en
            FROM dbo.usuarios WHERE usuario_id = ?;
            """,
            (usuario_id,),
        ).fetchone()
        return _fila_usuario_admin(cursor, actualizada)


def listar_auditoria_admin(
    limit: int, offset: int, modulo: Optional[str] = None, resultado: Optional[str] = None
) -> dict:
    where = """
        WHERE (? IS NULL OR modulo = ?)
          AND (? IS NULL OR resultado = ?)
    """
    parametros = (modulo, modulo, resultado, resultado)
    sql_items = (
        """
        SELECT evento_id, usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
               origen, resultado, descripcion, creado_en
        FROM dbo.auditoria_eventos
        """
        + where
        + """
        ORDER BY creado_en DESC, evento_id DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
        """
    )
    sql_total = "SELECT COUNT(*) AS Total FROM dbo.auditoria_eventos " + where + ";"
    with get_connection() as conn:
        cursor = conn.cursor()
        total = _entero(cursor.execute(sql_total, parametros).fetchone().Total)
        filas = cursor.execute(sql_items, (*parametros, offset, limit)).fetchall()
        return {
            "items": [
                {
                    "evento_id": _entero(fila.evento_id),
                    "usuario_id": _id(fila.usuario_id),
                    "tipo_evento": fila.tipo_evento,
                    "modulo": fila.modulo,
                    "recurso_tipo": fila.recurso_tipo,
                    "recurso_id": fila.recurso_id,
                    "origen": fila.origen,
                    "resultado": fila.resultado,
                    "descripcion": fila.descripcion,
                    "creado_en": _iso(fila.creado_en),
                }
                for fila in filas
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }


# ------------------------------------------------------------- Panel institucional


def _institucion_autorizada_en_cursor(
    cursor, usuario_id: int, permitir_pendiente: bool = False
) -> int:
    """Devuelve la institución del representante.

    Las operaciones de negocio exigen verificación. Las pantallas de consulta del
    panel permiten un vínculo pendiente para mostrar su estado real sin aprobarlo.
    """

    fila = cursor.execute(
        """
        SELECT TOP 1 ir.institucion_id
        FROM dbo.vw_representante_autorizado ra
        INNER JOIN dbo.institucion_representantes ir
            ON ir.usuario_id = ra.usuario_id AND ir.institucion_id = ra.institucion_id
        WHERE ra.usuario_id = ? AND ra.autorizado = 1 AND ir.estado = N'ACTIVO'
        ORDER BY ir.es_contacto_principal DESC, ir.fecha_inicio, ir.institucion_id;
        """,
        (usuario_id,),
    ).fetchone()
    if not fila and permitir_pendiente:
        fila = cursor.execute(
            """
            SELECT TOP 1 ir.institucion_id
            FROM dbo.institucion_representantes ir
            INNER JOIN dbo.usuario_roles ur ON ur.usuario_id = ir.usuario_id
            INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id
            WHERE ir.usuario_id = ? AND ir.estado IN (N'ACTIVO', N'PENDIENTE')
              AND ur.estado = N'ACTIVO' AND r.codigo = N'REPRESENTANTE'
            ORDER BY ir.es_contacto_principal DESC, ir.fecha_inicio, ir.institucion_id;
            """,
            (usuario_id,),
        ).fetchone()
    if not fila:
        raise ErrorNegocio(
            403,
            "REPRESENTANTE_NO_AUTORIZADO",
            "Su cuenta no tiene una institución verificada asociada.",
        )
    return _entero(fila.institucion_id)


def institucion_autorizada(usuario_id: int, permitir_pendiente: bool = False) -> int:
    with get_connection() as conn:
        return _institucion_autorizada_en_cursor(
            conn.cursor(), usuario_id, permitir_pendiente=permitir_pendiente
        )


def resumen_institucional(usuario_id: int) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        institucion_id = _institucion_autorizada_en_cursor(
            cursor, usuario_id, permitir_pendiente=True
        )
        fila = cursor.execute(
            """
            SELECT i.institucion_id, i.nombre, i.estado_verificacion,
                   r.necesidades_publicadas, r.compromisos_recibidos, r.recepciones_confirmadas
            FROM dbo.instituciones i
            INNER JOIN dbo.vw_institucion_resumen r ON r.institucion_id = i.institucion_id
            WHERE i.institucion_id = ?;
            """,
            (institucion_id,),
        ).fetchone()
        return {
            "institucion_id": _entero(fila.institucion_id),
            "nombre": fila.nombre,
            "estado_verificacion": fila.estado_verificacion,
            "necesidades_publicadas": _entero(fila.necesidades_publicadas),
            "compromisos_recibidos": _entero(fila.compromisos_recibidos),
            "recepciones_confirmadas": _entero(fila.recepciones_confirmadas),
        }


def _perfil_en_cursor(cursor, institucion_id: int) -> dict:
    fila = cursor.execute(
        """
        SELECT i.institucion_id AS id_institucion, i.nombre, ti.nombre AS tipo,
               d.nombre AS distrito, i.descripcion, i.direccion, i.telefono_publico,
               i.email_publico, i.estado_verificacion, i.fecha_registro
        FROM dbo.instituciones i
        INNER JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
        INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
        WHERE i.institucion_id = ?;
        """,
        (institucion_id,),
    ).fetchone()
    return {
        "id_institucion": _entero(fila.id_institucion),
        "nombre": fila.nombre,
        "tipo": fila.tipo or "",
        "distrito": fila.distrito or "",
        "descripcion": fila.descripcion,
        "direccion": fila.direccion,
        "telefono_publico": fila.telefono_publico,
        "email_publico": fila.email_publico,
        "estado_verificacion": fila.estado_verificacion,
        "fecha_registro": _iso(fila.fecha_registro),
    }


def perfil_institucional(usuario_id: int) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        return _perfil_en_cursor(
            cursor,
            _institucion_autorizada_en_cursor(cursor, usuario_id, permitir_pendiente=True),
        )


CAMPOS_PERFIL_PERMITIDOS = (
    "direccion",
    "descripcion",
    "telefono_publico",
    "email_publico",
)


def actualizar_perfil_institucional(usuario_id: int, cambios: Mapping[str, Any]) -> dict:
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        institucion_id = _institucion_autorizada_en_cursor(
            cursor, usuario_id, permitir_pendiente=True
        )
        banderas: list[int] = []
        valores: list[Any] = []
        for campo in CAMPOS_PERFIL_PERMITIDOS:
            presente = campo in cambios
            banderas.append(1 if presente else 0)
            valores.append(cambios.get(campo) if presente else None)
        cursor.execute(
            """
            UPDATE dbo.instituciones
            SET direccion = CASE WHEN ? = 1 THEN ? ELSE direccion END,
                descripcion = CASE WHEN ? = 1 THEN ? ELSE descripcion END,
                telefono_publico = CASE WHEN ? = 1 THEN ? ELSE telefono_publico END,
                email_publico = CASE WHEN ? = 1 THEN ? ELSE email_publico END
            WHERE institucion_id = ?;
            """,
            (
                banderas[0], valores[0],
                banderas[1], valores[1],
                banderas[2], valores[2],
                banderas[3], valores[3],
                institucion_id,
            ),
        )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="INSTITUCION_PERFIL",
            modulo="INSTITUCIONES",
            recurso_tipo="INSTITUCION",
            recurso_id=institucion_id,
            descripcion="Datos públicos de la institución actualizados por su representante.",
        )
        return _perfil_en_cursor(cursor, institucion_id)


_NECESIDADES_SQL = """
    WITH totales AS (
        SELECT necesidad_id,
               SUM(cantidad_requerida) AS requerida,
               SUM(cantidad_reservada_vigente) AS comprometida,
               SUM(cantidad_recibida) AS recibida
        FROM dbo.vw_disponibilidad_necesidad
        GROUP BY necesidad_id
    )
    SELECT n.necesidad_id, n.titulo, n.descripcion, n.prioridad, n.estado,
           n.fila_version, n.fecha_publicacion, n.fecha_limite,
           COALESCE(t.requerida, 0) AS cantidad_requerida,
           COALESCE(t.comprometida, 0) AS cantidad_comprometida,
           COALESCE(t.recibida, 0) AS cantidad_recibida,
           (
               SELECT TOP 1 u.simbolo
               FROM dbo.necesidad_productos np
               INNER JOIN dbo.unidades_medida u ON u.unidad_id = np.unidad_id
               WHERE np.necesidad_id = n.necesidad_id
               ORDER BY np.producto_id, np.unidad_id
           ) AS unidad_medida_base
    FROM dbo.necesidades n
    LEFT JOIN totales t ON t.necesidad_id = n.necesidad_id
    WHERE n.institucion_id = ? %s
    ORDER BY n.creado_en DESC, n.necesidad_id DESC;
"""

_LINEAS_SQL = """
    SELECT np.necesidad_id, np.producto_id, p.nombre AS producto,
           np.unidad_id, u.nombre AS unidad, np.cantidad_requerida
    FROM dbo.necesidad_productos np
    INNER JOIN dbo.productos p ON p.producto_id = np.producto_id
    INNER JOIN dbo.unidades_medida u ON u.unidad_id = np.unidad_id
    INNER JOIN dbo.necesidades n ON n.necesidad_id = np.necesidad_id
    WHERE n.institucion_id = ? %s
    ORDER BY np.necesidad_id, np.producto_id, np.unidad_id;
"""


def _listar_necesidades_en_cursor(
    cursor, usuario_id: int, necesidad_id: Optional[int] = None
) -> list[dict]:
    institucion_id = _institucion_autorizada_en_cursor(
        cursor, usuario_id, permitir_pendiente=True
    )
    filtro = "AND n.necesidad_id = ?" if necesidad_id is not None else ""
    parametros = (
        (institucion_id, necesidad_id)
        if necesidad_id is not None
        else (institucion_id,)
    )
    filas = cursor.execute(_NECESIDADES_SQL % filtro, parametros).fetchall()
    necesidades = [
        {
            "id_necesidad": _entero(fila.necesidad_id),
            "titulo": fila.titulo,
            "descripcion": fila.descripcion,
            "prioridad": fila.prioridad,
            "estado": fila.estado,
            "fila_version": fila_version_actual(fila.fila_version),
            "fecha_publicacion": _iso(fila.fecha_publicacion),
            "fecha_limite": _iso(fila.fecha_limite),
            "cantidad_requerida": _numero(fila.cantidad_requerida),
            "cantidad_comprometida": _numero(fila.cantidad_comprometida),
            "cantidad_recibida": _numero(fila.cantidad_recibida),
            "unidad_medida_base": fila.unidad_medida_base or "",
            "lineas": [],
        }
        for fila in filas
    ]
    por_id = {necesidad["id_necesidad"]: necesidad for necesidad in necesidades}
    if por_id:
        parametros_lineas = (
            (institucion_id, necesidad_id)
            if necesidad_id is not None
            else (institucion_id,)
        )
        for fila in cursor.execute(_LINEAS_SQL % filtro, parametros_lineas).fetchall():
            necesidad = por_id.get(_entero(fila.necesidad_id))
            if necesidad is None:
                continue
            necesidad["lineas"].append(
                {
                    "producto_id": _entero(fila.producto_id),
                    "producto": fila.producto,
                    "unidad_id": _entero(fila.unidad_id),
                    "unidad": fila.unidad,
                    "cantidad_requerida": _numero(fila.cantidad_requerida),
                }
            )
    return necesidades


def listar_necesidades_institucionales(usuario_id: int) -> list[dict]:
    with get_connection() as conn:
        return _listar_necesidades_en_cursor(conn.cursor(), usuario_id)


def obtener_necesidad_institucional(usuario_id: int, necesidad_id: int) -> Optional[dict]:
    with get_connection() as conn:
        filas = _listar_necesidades_en_cursor(conn.cursor(), usuario_id, necesidad_id)
    return filas[0] if filas else None


def _fecha_limite_para_sql(valor: Optional[datetime]) -> Optional[datetime]:
    if valor is None:
        return None
    if valor.tzinfo is not None:
        valor = valor.astimezone(timezone.utc).replace(tzinfo=None)
    if valor.time() == datetime.min.time():
        valor = valor.replace(hour=23, minute=59, second=59)
    if valor <= datetime.now(timezone.utc).replace(tzinfo=None):
        raise error_catalogo("La fecha límite debe ser posterior a la fecha actual.")
    return valor


def _validar_punto_acopio(cursor, punto_id: Optional[int], institucion_id: int) -> None:
    if punto_id is None:
        return
    fila = cursor.execute(
        """
        SELECT punto_id FROM dbo.puntos_acopio
        WHERE punto_id = ? AND institucion_id = ? AND estado = N'ACTIVO';
        """,
        (punto_id, institucion_id),
    ).fetchone()
    if not fila:
        raise error_catalogo("El punto de acopio no pertenece a la institución o no está activo.")


def _validar_lineas(cursor, lineas: Iterable[Mapping[str, Any]]) -> list[dict]:
    validadas: list[dict] = []
    for linea in lineas:
        fila = cursor.execute(
            """
            SELECT p.producto_id, p.categoria_id
            FROM dbo.productos p
            INNER JOIN dbo.producto_unidades pu ON pu.producto_id = p.producto_id
            WHERE p.producto_id = ? AND pu.unidad_id = ? AND p.activo = 1;
            """,
            (linea["producto_id"], linea["unidad_id"]),
        ).fetchone()
        if not fila:
            raise error_catalogo(
                "El producto o la unidad indicados no existen en el catálogo activo."
            )
        validadas.append(
            {
                "producto_id": _entero(fila.producto_id),
                "unidad_id": _entero(linea["unidad_id"]),
                "cantidad": float(linea["cantidad"]),
            }
        )
    if not validadas:
        raise error_catalogo("La necesidad requiere al menos una línea real.")
    return validadas


def actualizar_necesidad_institucional(
    usuario_id: int, necesidad_id: int, cambios: Mapping[str, Any]
) -> dict:
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        institucion_id = _institucion_autorizada_en_cursor(
            cursor, usuario_id, permitir_pendiente=True
        )
        fila = cursor.execute(
            """
            SELECT institucion_id, estado, motivo_cancelacion, fila_version
            FROM dbo.necesidades WHERE necesidad_id = ?;
            """,
            (necesidad_id,),
        ).fetchone()
        if not fila or _entero(fila.institucion_id) != institucion_id:
            raise ErrorNegocio(404, "NECESIDAD_NO_ENCONTRADA", "La necesidad indicada no existe.")

        estado_nuevo = cambios.get("estado")
        if estado_nuevo == "PUBLICADA":
            # Publicar necesidades sí exige institución verificada; el borrador no.
            _institucion_autorizada_en_cursor(cursor, usuario_id)
        motivo = (cambios.get("motivo") or "").strip() or None
        version_enviada = cambios.get("fila_version")
        if estado_nuevo is not None:
            validar_transicion_necesidad(fila.estado, estado_nuevo, motivo)
        validar_fila_version(fila.fila_version, version_enviada)
        _validar_punto_acopio(cursor, cambios.get("id_punto_acopio"), institucion_id)
        version_para_where = (
            bytes(fila.fila_version)
            if fila.fila_version is not None and version_enviada is not None
            else None
        )

        lineas_validas: Optional[list[dict]] = None
        if "lineas" in cambios:
            compromisos = _entero(
                cursor.execute(
                    "SELECT COUNT(*) AS Total FROM dbo.compromisos WHERE necesidad_id = ?;",
                    (necesidad_id,),
                ).fetchone().Total
            )
            if compromisos:
                raise ErrorNegocio(
                    409,
                    "LINEAS_NO_EDITABLES",
                    "No se pueden editar líneas cuando existen compromisos registrados.",
                )
            lineas_validas = _validar_lineas(cursor, cambios["lineas"] or [])

        banderas = {
            campo: 1 if campo in cambios else 0
            for campo in (
                "titulo", "descripcion", "prioridad", "fecha_limite",
                "id_punto_acopio", "estado",
            )
        }
        fecha_limite = (
            _fecha_limite_para_sql(cambios["fecha_limite"])
            if banderas["fecha_limite"]
            else None
        )
        cursor.execute(
            """
            UPDATE dbo.necesidades
            SET titulo = CASE WHEN ? = 1 THEN ? ELSE titulo END,
                descripcion = CASE WHEN ? = 1 THEN ? ELSE descripcion END,
                prioridad = CASE WHEN ? = 1 THEN ? ELSE prioridad END,
                fecha_limite = CASE WHEN ? = 1 THEN ? ELSE fecha_limite END,
                punto_acopio_id = CASE WHEN ? = 1 THEN ? ELSE punto_acopio_id END,
                estado = CASE WHEN ? = 1 THEN ? ELSE estado END,
                fecha_publicacion = CASE
                    WHEN ? = 1 AND fecha_publicacion IS NULL THEN SYSUTCDATETIME()
                    ELSE fecha_publicacion END,
                motivo_cancelacion = CASE WHEN ? = 1 THEN ? ELSE motivo_cancelacion END,
                actualizado_en = SYSUTCDATETIME()
            WHERE necesidad_id = ? AND institucion_id = ?
              AND (? IS NULL OR fila_version = ?);
            """,
            (
                banderas["titulo"], cambios.get("titulo"),
                banderas["descripcion"], cambios.get("descripcion"),
                banderas["prioridad"], cambios.get("prioridad"),
                banderas["fecha_limite"], fecha_limite,
                banderas["id_punto_acopio"], cambios.get("id_punto_acopio"),
                banderas["estado"], estado_nuevo,
                1 if estado_nuevo == "PUBLICADA" else 0,
                1 if estado_nuevo == "CANCELADA" else 0, motivo,
                necesidad_id, institucion_id, version_para_where, version_para_where,
            ),
        )
        if cursor.rowcount == 0:
            raise ErrorNegocio(
                409,
                "CONCURRENCIA",
                "La necesidad fue modificada por otra operación. Recargue los datos.",
            )

        if lineas_validas is not None:
            cursor.execute(
                "DELETE FROM dbo.necesidad_productos WHERE necesidad_id = ?;",
                (necesidad_id,),
            )
            for linea in lineas_validas:
                cursor.execute(
                    """
                    INSERT INTO dbo.necesidad_productos (
                        necesidad_id, producto_id, unidad_id, cantidad_requerida
                    )
                    VALUES (?, ?, ?, ?);
                    """,
                    (necesidad_id, linea["producto_id"], linea["unidad_id"], linea["cantidad"]),
                )

        descripcion = "Necesidad actualizada por la institución representante."
        if estado_nuevo:
            descripcion = f"Estado de necesidad cambiado a {estado_nuevo} por la institución."
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="NECESIDAD_ESTADO" if estado_nuevo else "NECESIDAD_ACTUALIZADA",
            modulo="NECESIDADES",
            recurso_tipo="NECESIDAD",
            recurso_id=necesidad_id,
            descripcion=descripcion,
        )
        return _listar_necesidades_en_cursor(cursor, usuario_id, necesidad_id)[0]


def eliminar_necesidad_institucional(usuario_id: int, necesidad_id: int) -> bool:
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        institucion_id = _institucion_autorizada_en_cursor(
            cursor, usuario_id, permitir_pendiente=True
        )
        fila = cursor.execute(
            "SELECT estado FROM dbo.necesidades WHERE necesidad_id = ? AND institucion_id = ?;",
            (necesidad_id, institucion_id),
        ).fetchone()
        if not fila:
            raise ErrorNegocio(404, "NECESIDAD_NO_ENCONTRADA", "La necesidad indicada no existe.")
        if fila.estado != "BORRADOR":
            raise ErrorNegocio(
                409,
                "NECESIDAD_NO_ELIMINABLE",
                "Sólo se pueden eliminar necesidades en estado BORRADOR.",
            )
        compromisos = _entero(
            cursor.execute(
                "SELECT COUNT(*) AS Total FROM dbo.compromisos WHERE necesidad_id = ?;",
                (necesidad_id,),
            ).fetchone().Total
        )
        fotos = _entero(
            cursor.execute(
                "SELECT COUNT(*) AS Total FROM dbo.necesidad_fotos WHERE necesidad_id = ?;",
                (necesidad_id,),
            ).fetchone().Total
        )
        if compromisos or fotos:
            raise ErrorNegocio(
                409,
                "NECESIDAD_CON_HISTORIAL",
                "La necesidad tiene compromisos o evidencias y no puede eliminarse.",
            )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="NECESIDAD_ELIMINADA",
            modulo="NECESIDADES",
            recurso_tipo="NECESIDAD",
            recurso_id=necesidad_id,
            descripcion="Se eliminó una necesidad en estado BORRADOR sin compromisos ni fotos.",
        )
        cursor.execute(
            "DELETE FROM dbo.necesidad_productos WHERE necesidad_id = ?;", (necesidad_id,)
        )
        cursor.execute(
            "DELETE FROM dbo.necesidades WHERE necesidad_id = ? AND institucion_id = ?;",
            (necesidad_id, institucion_id),
        )
        return cursor.rowcount > 0
