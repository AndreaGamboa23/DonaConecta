"""Mensajería persistente y notificaciones internas.

La autorización se verifica en el repositorio contra los participantes activos
de SQL Server; los roles del token sólo identifican la sesión. La primera versión
usa polling HTTP mientras la conversación está activa: el transporte WebSocket
queda pendiente de una fase posterior.
"""

from fastapi import APIRouter, Depends, Query, status

from app.core.security import obtener_usuario_actual
from app.repositories import mensajeria_repo
from app.schemas.mensajeria_schema import (
    ConversacionesResponse,
    ConversacionCreada,
    CrearConversacionRequest,
    EnviarMensajeRequest,
    LeidoResponse,
    MarcarLeidoRequest,
    MensajesResponse,
    MensajeResponse,
    NotificacionLeidaResponse,
    NotificacionesResponse,
)

router = APIRouter(prefix="/api/v1", tags=["Mensajería y notificaciones"])

_ERRORES = {
    401: {"description": "Token ausente, expirado, revocado o cuenta inactiva."},
    403: {"description": "El usuario no participa activamente de la conversación."},
    404: {"description": "Conversación, mensaje o notificación ajena o inexistente."},
    409: {"description": "Conflicto con el recurso, el representante o la idempotencia."},
    422: {"description": "Cuerpo inválido o recurso de conversación ambiguo."},
}


@router.post(
    "/conversaciones",
    response_model=ConversacionCreada,
    status_code=status.HTTP_201_CREATED,
    summary="Abrir una conversación con la institución",
    description=(
        "Se crea desde una necesidad o un compromiso, nunca ambos. Los participantes "
        "son el donante dueño y un representante autorizado activo de la institución."
    ),
    responses=_ERRORES,
)
def crear_conversacion(
    datos: CrearConversacionRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return mensajeria_repo.crear_conversacion(
        usuario["id_usuario"],
        datos.id_necesidad,
        datos.id_compromiso,
        datos.mensaje,
    )


@router.get(
    "/conversaciones",
    response_model=ConversacionesResponse,
    summary="Listar mis conversaciones",
    description=(
        "Sólo conversaciones propias con participación ACTIVA. Incluye el último "
        "mensaje descifrado y ``no_leidos`` calculado desde ultimo_mensaje_leido_id."
    ),
    responses=_ERRORES,
)
def listar_conversaciones(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    usuario: dict = Depends(obtener_usuario_actual),
):
    return mensajeria_repo.listar_conversaciones(usuario["id_usuario"], limit, offset)


@router.get(
    "/conversaciones/{id_conversacion}/mensajes",
    response_model=MensajesResponse,
    summary="Historial paginado de una conversación",
    description="Sólo participantes ACTIVOS; el contenido se descifra antes de responder.",
    responses=_ERRORES,
)
def listar_mensajes(
    id_conversacion: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    usuario: dict = Depends(obtener_usuario_actual),
):
    return mensajeria_repo.historial_mensajes(
        usuario["id_usuario"], id_conversacion, limit, offset
    )


@router.post(
    "/conversaciones/{id_conversacion}/mensajes",
    response_model=MensajeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar un mensaje cifrado",
    description=(
        "Cifra el contenido con AES-256-GCM antes de persistirlo y crea notificaciones "
        "para los demás participantes. ``client_message_id`` hace idempotente el envío "
        "por remitente: una repetición devuelve el mensaje original."
    ),
    responses=_ERRORES,
)
def enviar_mensaje(
    id_conversacion: int,
    datos: EnviarMensajeRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return mensajeria_repo.enviar_mensaje(
        usuario["id_usuario"],
        id_conversacion,
        datos.contenido,
        str(datos.client_message_id),
    )


@router.patch(
    "/conversaciones/{id_conversacion}/leido",
    response_model=LeidoResponse,
    summary="Marcar mensajes como leídos",
    description=(
        "Actualiza ultimo_mensaje_leido_id del participante. Sin ``mensaje_id`` se "
        "marca el último mensaje de la conversación; nunca retrocede."
    ),
    responses=_ERRORES,
)
def marcar_conversacion_leida(
    id_conversacion: int,
    datos: MarcarLeidoRequest | None = None,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return mensajeria_repo.marcar_leido(
        usuario["id_usuario"], id_conversacion, datos.mensaje_id if datos else None
    )


@router.get(
    "/notificaciones",
    response_model=NotificacionesResponse,
    summary="Bandeja de notificaciones del usuario",
    description=(
        "Sólo notificaciones del destinatario autenticado. ``total`` y ``no_leidas`` "
        "se cuentan desde SQL Server, sin valores estimados."
    ),
    responses=_ERRORES,
)
def listar_notificaciones(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    solo_no_leidas: bool = Query(False),
    usuario: dict = Depends(obtener_usuario_actual),
):
    return mensajeria_repo.listar_notificaciones(
        usuario["id_usuario"], limit, offset, solo_no_leidas
    )


@router.patch(
    "/notificaciones/{id_notificacion}/leido",
    response_model=NotificacionLeidaResponse,
    summary="Marcar una notificación como leída",
    description="Sólo el destinatario puede marcarla; una segunda llamada es inofensiva.",
    responses=_ERRORES,
)
def marcar_notificacion_leida(
    id_notificacion: int,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return mensajeria_repo.marcar_notificacion_leida(usuario["id_usuario"], id_notificacion)
