"""Persistencia de conversaciones, mensajes y notificaciones internas.

Todas las sentencias son parametrizadas. La autorización se comprueba en SQL con
``conversacion_participantes.estado = 'ACTIVO'`` antes de cualquier operación,
incluidas las de lectura. El contenido se guarda cifrado con AES-256-GCM y se
descifra aquí, nunca en una respuesta con el valor cifrado.

Primera versión con polling HTTP; el transporte WebSocket queda pendiente.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

import pyodbc

from app.core.cifrado import cifrar_texto, descifrar_texto
from app.core.errores import ErrorNegocio
from app.database.connection import get_connection
from app.repositories.paneles_repo import registrar_evento_en_cursor


def _ahora() -> datetime:
    """UTC sin tz, igual que DATETIME2/SYSUTCDATETIME en SQL Server."""

    return datetime.now(timezone.utc).replace(tzinfo=None)


def _iso(valor: Any) -> Optional[str]:
    if valor is None:
        return None
    texto = valor.isoformat() if hasattr(valor, "isoformat") else str(valor)
    return texto if texto.endswith(("Z", "+00:00")) else f"{texto}Z"


def _entero(valor: Any, predeterminado: int = 0) -> int:
    return int(valor) if valor is not None else predeterminado


def _id(valor: Any) -> Optional[int]:
    return int(valor) if valor is not None else None


def _participante_activo(cursor, conversacion_id: int, usuario_id: int) -> Any:
    fila = cursor.execute(
        """
        SELECT cp.usuario_id, cp.tipo_participante, cp.ultimo_mensaje_leido_id
        FROM dbo.conversacion_participantes cp
        WHERE cp.conversacion_id = ? AND cp.usuario_id = ? AND cp.estado = N'ACTIVO';
        """,
        (conversacion_id, usuario_id),
    ).fetchone()
    if not fila:
        raise ErrorNegocio(
            403,
            "PARTICIPANTE_NO_AUTORIZADO",
            "No tienes una participación activa en esta conversación.",
        )
    return fila


def _fila_mensaje(fila) -> dict:
    contenido = descifrar_texto(fila.contenido)
    if contenido is None:
        # Nunca se devuelve el paquete cifrado al cliente.
        raise ErrorNegocio(
            500, "MENSAJE_NO_LEIBLE", "No se pudo mostrar el mensaje. Intente nuevamente."
        )
    mensaje_id = _entero(fila.mensaje_id)
    return {
        "id_mensaje": mensaje_id,
        "mensaje_id": mensaje_id,
        "conversacion_id": _entero(fila.conversacion_id),
        "remitente_usuario_id": _entero(fila.remitente_usuario_id),
        "contenido": contenido,
        "tipo": fila.tipo,
        "client_message_id": str(fila.client_message_id),
        "creado_en": _iso(fila.creado_en),
    }


_SQL_MENSAJE_IDEMPOTENTE = """
    SELECT mensaje_id, conversacion_id, remitente_usuario_id, contenido, tipo,
           client_message_id, creado_en
    FROM dbo.mensajes
    WHERE remitente_usuario_id = ? AND client_message_id = ?;
"""


def _insertar_mensaje(
    conn,
    cursor,
    conversacion_id: int,
    remitente_id: int,
    contenido: str,
    client_message_id: str,
) -> dict:
    """Inserta y notifica; un ``client_message_id`` repetido devuelve el original."""

    idempotencia = (remitente_id, str(client_message_id))
    duplicado = cursor.execute(_SQL_MENSAJE_IDEMPOTENTE, idempotencia).fetchone()
    if duplicado:
        if _entero(duplicado.conversacion_id) != conversacion_id:
            raise ErrorNegocio(
                409,
                "MENSAJE_IDEMPOTENTE_DISTINTO",
                "Ese identificador ya pertenece a otra conversación.",
            )
        return _fila_mensaje(duplicado)

    ahora = _ahora()
    try:
        cursor.execute(
            """
            INSERT INTO dbo.mensajes (
                conversacion_id, remitente_usuario_id, contenido, tipo,
                client_message_id, creado_en
            ) OUTPUT INSERTED.mensaje_id VALUES (?, ?, ?, N'TEXTO', ?, ?);
            """,
            (conversacion_id, remitente_id, cifrar_texto(contenido), idempotencia[1], ahora),
        )
        mensaje_id = _entero(cursor.fetchone()[0])
    except pyodbc.IntegrityError:
        # Concurrencia real: otra petición ganó el UNIQUE. Se descarta este intento
        # y se devuelve el mensaje ya persistido por ese mismo remitente.
        conn.rollback()
        duplicado = cursor.execute(_SQL_MENSAJE_IDEMPOTENTE, idempotencia).fetchone()
        if not duplicado:
            raise ErrorNegocio(
                500, "MENSAJE_NO_REGISTRADO", "No se pudo registrar el mensaje."
            )
        if _entero(duplicado.conversacion_id) != conversacion_id:
            raise ErrorNegocio(
                409,
                "MENSAJE_IDEMPOTENTE_DISTINTO",
                "Ese identificador ya pertenece a otra conversación.",
            )
        return _fila_mensaje(duplicado)

    # Una notificación por participante activo distinto del remitente, sin texto
    # sensible. Las recepciones y verificaciones ya son notificadas por los SP.
    cursor.execute(
        """
        INSERT INTO dbo.notificaciones (
            destinatario_usuario_id, tipo, titulo, cuerpo, creado_en, mensaje_id
        )
        SELECT cp.usuario_id, N'MENSAJE_NUEVO', N'Tienes un mensaje nuevo',
               N'Revisa la conversación en DonaConecta.', ?, ?
        FROM dbo.conversacion_participantes cp
        WHERE cp.conversacion_id = ?
          AND cp.estado = N'ACTIVO'
          AND cp.usuario_id <> ?;
        """,
        (ahora, mensaje_id, conversacion_id, remitente_id),
    )
    registrar_evento_en_cursor(
        cursor,
        usuario_id=remitente_id,
        tipo_evento="MENSAJE_ENVIADO",
        modulo="MENSAJERIA",
        recurso_tipo="MENSAJE",
        recurso_id=mensaje_id,
        descripcion="Mensaje registrado en la conversación.",
    )
    return {
        "id_mensaje": mensaje_id,
        "mensaje_id": mensaje_id,
        "conversacion_id": conversacion_id,
        "remitente_usuario_id": remitente_id,
        "contenido": contenido,
        "tipo": "TEXTO",
        "client_message_id": str(idempotencia[1]),
        "creado_en": _iso(ahora),
    }


def crear_conversacion(
    usuario_id: int,
    id_necesidad: Optional[int],
    id_compromiso: Optional[int],
    mensaje: Optional[str] = None,
) -> dict:
    """Crea donante + representante autorizado para una necesidad o compromiso."""

    if (id_necesidad is None) == (id_compromiso is None):
        raise ErrorNegocio(
            422,
            "RECURSO_CONVERSACION_INVALIDO",
            "Indica exactamente una necesidad o un compromiso.",
        )

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        if id_compromiso is not None:
            contexto = cursor.execute(
                """
                SELECT c.compromiso_id, c.donante_usuario_id, n.institucion_id, n.titulo
                FROM dbo.compromisos c
                INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
                WHERE c.compromiso_id = ?;
                """,
                (id_compromiso,),
            ).fetchone()
        else:
            contexto = cursor.execute(
                """
                SELECT n.institucion_id, n.titulo
                FROM dbo.necesidades n
                WHERE n.necesidad_id = ?;
                """,
                (id_necesidad,),
            ).fetchone()
        if not contexto:
            raise ErrorNegocio(
                404, "RECURSO_NO_ENCONTRADO", "La necesidad o el compromiso no existe."
            )

        institucion_id = _entero(contexto.institucion_id)
        es_donante = cursor.execute(
            """
            SELECT d.usuario_id
            FROM dbo.donantes d
            INNER JOIN dbo.usuarios u ON u.usuario_id = d.usuario_id
            INNER JOIN dbo.usuario_roles ur
                ON ur.usuario_id = d.usuario_id AND ur.estado = N'ACTIVO'
            INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id AND r.codigo = N'DONANTE'
            WHERE d.usuario_id = ? AND u.estado_cuenta = N'ACTIVO';
            """,
            (usuario_id,),
        ).fetchone() is not None
        es_representante = cursor.execute(
            """
            SELECT TOP 1 ir.usuario_id
            FROM dbo.institucion_representantes ir
            INNER JOIN dbo.vw_representante_autorizado ra
                ON ra.usuario_id = ir.usuario_id AND ra.institucion_id = ir.institucion_id
            WHERE ir.institucion_id = ? AND ir.usuario_id = ?
              AND ir.estado = N'ACTIVO' AND ra.autorizado = 1;
            """,
            (institucion_id, usuario_id),
        ).fetchone() is not None

        if not es_donante and not es_representante:
            raise ErrorNegocio(
                403,
                "PARTICIPANTE_NO_AUTORIZADO",
                "Debes ser donante o representante autorizado de la institución.",
            )

        if id_compromiso is not None:
            donante_id = _entero(contexto.donante_usuario_id)
            if es_donante and donante_id != usuario_id:
                raise ErrorNegocio(
                    403,
                    "COMPROMISO_AJENO",
                    "Sólo el donante dueño o el representante pueden escribir aquí.",
                )
        else:
            if not es_donante:
                raise ErrorNegocio(
                    409,
                    "DONANTE_REQUERIDO",
                    "Para una necesidad sin compromiso debe existir un donante; "
                    "usa un compromiso para coordinar con la institución.",
                )
            donante_id = usuario_id

        representante = cursor.execute(
            """
            SELECT TOP 1 ir.usuario_id
            FROM dbo.institucion_representantes ir
            INNER JOIN dbo.vw_representante_autorizado ra
                ON ra.usuario_id = ir.usuario_id AND ra.institucion_id = ir.institucion_id
            WHERE ir.institucion_id = ? AND ir.usuario_id <> ?
              AND ir.estado = N'ACTIVO' AND ra.autorizado = 1
            ORDER BY ir.usuario_id;
            """,
            (institucion_id, donante_id),
        ).fetchone()
        if not representante:
            raise ErrorNegocio(
                409,
                "REPRESENTANTE_NO_DISPONIBLE",
                "La institución todavía no tiene un representante autorizado activo.",
            )
        representante_id = _entero(representante.usuario_id)

        ahora = _ahora()
        cursor.execute(
            """
            INSERT INTO dbo.conversaciones (
                necesidad_id, compromiso_id, estado, creada_por_usuario_id, creada_en
            ) OUTPUT INSERTED.conversacion_id VALUES (?, ?, N'ABIERTA', ?, ?);
            """,
            (id_necesidad, id_compromiso, usuario_id, ahora),
        )
        conversacion_id = _entero(cursor.fetchone()[0])

        for participante_id, tipo in (
            (donante_id, "DONANTE"),
            (representante_id, "REPRESENTANTE"),
        ):
            cursor.execute(
                """
                INSERT INTO dbo.conversacion_participantes (
                    conversacion_id, usuario_id, tipo_participante, estado, fecha_union
                ) VALUES (?, ?, ?, N'ACTIVO', ?);
                """,
                (conversacion_id, participante_id, tipo, ahora),
            )

        if mensaje:
            _insertar_mensaje(
                conn, cursor, conversacion_id, usuario_id, mensaje, str(uuid4())
            )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="CONVERSACION_CREADA",
            modulo="MENSAJERIA",
            recurso_tipo="CONVERSACION",
            recurso_id=conversacion_id,
            descripcion="Conversación creada con participantes autorizados.",
        )
        return {
            "id_conversacion": conversacion_id,
            "conversacion_id": conversacion_id,
            "estado": "ABIERTA",
            "titulo": contexto.titulo or "Coordinación de donación",
            "participantes": [donante_id, representante_id],
            "creada_en": _iso(ahora),
        }


def listar_conversaciones(
    usuario_id: int, limite: int = 20, desplazamiento: int = 0
) -> dict:
    """Sólo conversaciones propias con participación ACTIVA y conteo real."""

    base = """
        FROM dbo.conversaciones c
        INNER JOIN dbo.conversacion_participantes cp
            ON cp.conversacion_id = c.conversacion_id
           AND cp.usuario_id = ? AND cp.estado = N'ACTIVO'
        LEFT JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
        LEFT JOIN dbo.vw_conversaciones_usuario v
            ON v.conversacion_id = c.conversacion_id AND v.usuario_id = cp.usuario_id
    """
    sql = f"""
        SELECT c.conversacion_id, c.necesidad_id, c.compromiso_id, c.estado, c.creada_en,
               ISNULL(n.titulo, (
                   SELECT TOP 1 n2.titulo
                   FROM dbo.compromisos c2
                   INNER JOIN dbo.necesidades n2 ON n2.necesidad_id = c2.necesidad_id
                   WHERE c2.compromiso_id = c.compromiso_id
               )) AS titulo,
               ISNULL(v.mensajes_no_leidos, 0) AS no_leidos,
               ultimo.mensaje_id AS ultimo_mensaje_id,
               ultimo.contenido AS ultimo_contenido,
               ultimo.creado_en AS ultimo_mensaje_en
        {base}
        OUTER APPLY (
            SELECT TOP 1 m.mensaje_id, m.contenido, m.creado_en
            FROM dbo.mensajes m
            WHERE m.conversacion_id = c.conversacion_id AND m.eliminado_en IS NULL
            ORDER BY m.mensaje_id DESC
        ) ultimo
        ORDER BY ultimo.creado_en DESC, c.conversacion_id DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
    """
    parametros = (usuario_id, desplazamiento, limite)
    with get_connection() as conn:
        cursor = conn.cursor()
        filas = cursor.execute(sql, parametros).fetchall()
        total = _entero(
            cursor.execute(f"SELECT COUNT(*) AS Total {base};", (usuario_id,)).fetchone()[0]
        )
        items = []
        for fila in filas:
            ultimo = None
            if fila.ultimo_contenido:
                ultimo = descifrar_texto(fila.ultimo_contenido)
                if ultimo is None:
                    raise ErrorNegocio(
                        500, "MENSAJE_NO_LEIBLE", "No se pudo mostrar el mensaje."
                    )
            conversacion_id = _entero(fila.conversacion_id)
            items.append(
                {
                    "id_conversacion": conversacion_id,
                    "conversacion_id": conversacion_id,
                    "id_necesidad": _id(fila.necesidad_id),
                    "id_compromiso": _id(fila.compromiso_id),
                    "titulo": fila.titulo or "Coordinación de donación",
                    "estado": fila.estado,
                    "creada_en": _iso(fila.creada_en),
                    "ultimo_mensaje": ultimo,
                    "ultimo_mensaje_id": _id(fila.ultimo_mensaje_id),
                    "ultimo_mensaje_en": _iso(fila.ultimo_mensaje_en),
                    "no_leidos": _entero(fila.no_leidos),
                }
            )
        return {
            "items": items,
            "total": total,
            "page": desplazamiento // limite + 1,
            "page_size": limite,
        }


def historial_mensajes(
    usuario_id: int, conversacion_id: int, limite: int = 50, desplazamiento: int = 0
) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        _participante_activo(cursor, conversacion_id, usuario_id)
        filas = cursor.execute(
            """
            SELECT mensaje_id, conversacion_id, remitente_usuario_id, contenido, tipo,
                   client_message_id, creado_en
            FROM dbo.mensajes
            WHERE conversacion_id = ? AND eliminado_en IS NULL
            ORDER BY mensaje_id
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
            """,
            (conversacion_id, desplazamiento, limite),
        ).fetchall()
        total = _entero(
            cursor.execute(
                """
                SELECT COUNT(*) FROM dbo.mensajes
                WHERE conversacion_id = ? AND eliminado_en IS NULL;
                """,
                (conversacion_id,),
            ).fetchone()[0]
        )
        return {
            "items": [_fila_mensaje(fila) for fila in filas],
            "total": total,
            "page": desplazamiento // limite + 1,
            "page_size": limite,
        }


def enviar_mensaje(
    usuario_id: int,
    conversacion_id: int,
    contenido: str,
    client_message_id: str,
) -> dict:
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        _participante_activo(cursor, conversacion_id, usuario_id)
        return _insertar_mensaje(
            conn, cursor, conversacion_id, usuario_id, contenido, client_message_id
        )


def marcar_leido(
    usuario_id: int, conversacion_id: int, mensaje_id: Optional[int] = None
) -> dict:
    """Mueve ``ultimo_mensaje_leido_id`` hacia adelante, nunca hacia atrás."""

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        _participante_activo(cursor, conversacion_id, usuario_id)
        if mensaje_id is not None:
            objetivo = cursor.execute(
                """
                SELECT mensaje_id FROM dbo.mensajes
                WHERE mensaje_id = ? AND conversacion_id = ? AND eliminado_en IS NULL;
                """,
                (mensaje_id, conversacion_id),
            ).fetchone()
            if not objetivo:
                raise ErrorNegocio(
                    404, "MENSAJE_NO_ENCONTRADO", "El mensaje no pertenece a esta conversación."
                )
            ultimo_id = mensaje_id
        else:
            ultimo_id = _entero(
                cursor.execute(
                    """
                    SELECT MAX(mensaje_id) AS UltimoId FROM dbo.mensajes
                    WHERE conversacion_id = ? AND eliminado_en IS NULL;
                    """,
                    (conversacion_id,),
                ).fetchone()[0],
                0,
            )
        if ultimo_id:
            cursor.execute(
                """
                UPDATE dbo.conversacion_participantes
                SET ultimo_mensaje_leido_id = ?
                WHERE conversacion_id = ? AND usuario_id = ? AND estado = N'ACTIVO'
                  AND (ultimo_mensaje_leido_id IS NULL OR ultimo_mensaje_leido_id < ?);
                """,
                (ultimo_id, conversacion_id, usuario_id, ultimo_id),
            )
        fila = cursor.execute(
            """
            SELECT ultimo_mensaje_leido_id
            FROM dbo.conversacion_participantes
            WHERE conversacion_id = ? AND usuario_id = ? AND estado = N'ACTIVO';
            """,
            (conversacion_id, usuario_id),
        ).fetchone()
        leido_id = _id(fila.ultimo_mensaje_leido_id) if fila else None
        no_leidos = _entero(
            cursor.execute(
                """
                SELECT COUNT(*) FROM dbo.mensajes
                WHERE conversacion_id = ? AND eliminado_en IS NULL
                  AND (? IS NULL OR mensaje_id > ?);
                """,
                (conversacion_id, leido_id, leido_id),
            ).fetchone()[0]
        )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="MENSAJES_MARCADOS_LEIDOS",
            modulo="MENSAJERIA",
            recurso_tipo="CONVERSACION",
            recurso_id=conversacion_id,
            descripcion="Se actualizó el último mensaje leído.",
        )
        return {
            "conversacion_id": conversacion_id,
            "ultimo_mensaje_leido_id": leido_id,
            "no_leidos": no_leidos,
        }


def _fila_notificacion(fila) -> dict:
    notificacion_id = _entero(fila.notificacion_id)
    return {
        "id_notificacion": notificacion_id,
        "notificacion_id": notificacion_id,
        "tipo": fila.tipo,
        "titulo": fila.titulo,
        "cuerpo": fila.cuerpo,
        "creado_en": _iso(fila.creado_en),
        "leido_en": _iso(fila.leido_en),
        "recursos": {
            "mensaje_id": _id(fila.mensaje_id),
            "compromiso_id": _id(fila.compromiso_id),
            "entrega_id": _id(fila.entrega_id),
            "recepcion_id": _id(fila.recepcion_id),
            "institucion_id": _id(fila.institucion_id),
            "verificacion_id": _id(fila.verificacion_id),
        },
    }


def listar_notificaciones(
    usuario_id: int,
    limite: int = 20,
    desplazamiento: int = 0,
    solo_no_leidas: bool = False,
) -> dict:
    sql = """
        SELECT notificacion_id, tipo, titulo, cuerpo, creado_en, leido_en,
               mensaje_id, compromiso_id, entrega_id, recepcion_id,
               institucion_id, verificacion_id
        FROM dbo.notificaciones
        WHERE destinatario_usuario_id = ? AND (? = 0 OR leido_en IS NULL)
        ORDER BY creado_en DESC, notificacion_id DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
    """
    parametros = (usuario_id, int(solo_no_leidas), desplazamiento, limite)
    with get_connection() as conn:
        cursor = conn.cursor()
        filas = cursor.execute(sql, parametros).fetchall()
        total = _entero(
            cursor.execute(
                "SELECT COUNT(*) FROM dbo.notificaciones WHERE destinatario_usuario_id = ?;",
                (usuario_id,),
            ).fetchone()[0]
        )
        no_leidas = _entero(
            cursor.execute(
                """
                SELECT COUNT(*) FROM dbo.notificaciones
                WHERE destinatario_usuario_id = ? AND leido_en IS NULL;
                """,
                (usuario_id,),
            ).fetchone()[0]
        )
        return {
            "items": [_fila_notificacion(fila) for fila in filas],
            "total": total,
            "no_leidas": no_leidas,
            "page": desplazamiento // limite + 1,
            "page_size": limite,
        }


def marcar_notificacion_leida(usuario_id: int, notificacion_id: int) -> dict:
    ahora = _ahora()
    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE dbo.notificaciones
            SET leido_en = ?
            WHERE notificacion_id = ? AND destinatario_usuario_id = ? AND leido_en IS NULL;
            """,
            (ahora, notificacion_id, usuario_id),
        )
        fila = cursor.execute(
            """
            SELECT leido_en, destinatario_usuario_id
            FROM dbo.notificaciones
            WHERE notificacion_id = ?;
            """,
            (notificacion_id,),
        ).fetchone()
        if not fila or _entero(fila.destinatario_usuario_id) != usuario_id:
            raise ErrorNegocio(
                404, "NOTIFICACION_NO_ENCONTRADA", "La notificación no existe o no es tuya."
            )
        registrar_evento_en_cursor(
            cursor,
            usuario_id=usuario_id,
            tipo_evento="NOTIFICACION_LEIDA",
            modulo="NOTIFICACIONES",
            recurso_tipo="NOTIFICACION",
            recurso_id=notificacion_id,
            descripcion="Notificación marcada como leída.",
        )
        return {
            "notificacion_id": notificacion_id,
            "leido_en": _iso(fila.leido_en) or _iso(ahora),
        }
