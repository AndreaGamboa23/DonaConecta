"""Rutas de seguimiento GPS autorizado.

Sólo sesiones iniciadas manualmente por el donante participante de la entrega,
con consentimiento explícito y caducidad. Los participantes consultan por HTTP
(polling); el canal WebSocket queda pendiente de una fase posterior. No se
calculan rutas, distancias ni tiempos de llegada y la coordinación manual sigue
disponible.
"""

from fastapi import APIRouter, Depends, status

from app.core.security import obtener_usuario_actual
from app.repositories import gps_repo
from app.schemas.gps_schema import (
    IniciarGpsRequest,
    SesionGpsResponse,
    UbicacionRequest,
    UltimaUbicacionResponse,
)

router = APIRouter(prefix="/api/v1", tags=["GPS autorizado"])

_ERRORES = {
    401: {"description": "Token ausente, expirado, revocado o cuenta inactiva."},
    403: {"description": "El usuario no es participante activo de la entrega."},
    404: {"description": "La entrega o la sesión no existe."},
    409: {"description": "Sesión activa, vencida, detenida o Donante ajeno."},
    422: {"description": "Consentimiento ausente o coordenadas fuera de rango."},
}


@router.post(
    "/entregas/{id_entrega}/gps/sesiones",
    response_model=SesionGpsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Iniciar seguimiento autorizado",
    description=(
        "Sólo el donante participante de la entrega, con consentimiento explícito. "
        "Devuelve la fecha de expiración; el seguimiento nunca es permanente."
    ),
    responses=_ERRORES,
)
def iniciar_sesion_gps(
    id_entrega: int,
    datos: IniciarGpsRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return gps_repo.iniciar_sesion(
        usuario["id_usuario"], id_entrega, datos.duracion_minutos
    )


@router.post(
    "/gps/sesiones/{id_sesion}/ubicacion",
    response_model=UltimaUbicacionResponse,
    summary="Actualizar la única ubicación registrada",
    description=(
        "Reemplaza una sola fila con coordenadas cifradas AES-256-GCM. Si la sesión "
        "venció, se marca EXPIRADA y se rechaza la actualización."
    ),
    responses=_ERRORES,
)
def actualizar_ubicacion_gps(
    id_sesion: int,
    datos: UbicacionRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return gps_repo.actualizar_ubicacion(
        usuario["id_usuario"],
        id_sesion,
        datos.latitud,
        datos.longitud,
        datos.precision_metros,
    )


@router.get(
    "/entregas/{id_entrega}/gps/ultima",
    response_model=UltimaUbicacionResponse,
    summary="Consultar la última ubicación de la entrega",
    description=(
        "Sólo donante o representante participante activo. Sin coordenadas públicas, "
        "rutas, ETAs ni historial continuo. Una sesión vencida se expira al consultar."
    ),
    responses=_ERRORES,
)
def obtener_ultima_ubicacion_gps(
    id_entrega: int,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return gps_repo.obtener_ultima_ubicacion(usuario["id_usuario"], id_entrega)


@router.post(
    "/gps/sesiones/{id_sesion}/detener",
    response_model=SesionGpsResponse,
    summary="Detener el seguimiento",
    description="Finaliza la sesión; el donante conserva el control manual del alta.",
    responses=_ERRORES,
)
def detener_sesion_gps(
    id_sesion: int,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return gps_repo.detener_sesion(usuario["id_usuario"], id_sesion)
