"""API REST de puntos de acopio con autorización verificada en backend."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security import bearer_scheme, obtener_usuario_actual, requerir_roles
from app.repositories import puntos_acopio_repo
from app.schemas.puntos_acopio_schema import (
    CambiarEstadoPuntoRequest,
    PuntoAcopioRequest,
    PuntoAcopioResponse,
)

router = APIRouter(prefix="/api/v1", tags=["Puntos de acopio"])


def usuario_opcional(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Optional[dict]:
    """Permite el listado público sin token y valida el token si viene."""

    if credenciales is None:
        return None
    return obtener_usuario_actual(credenciales)


@router.get(
    "/puntos-de-acopio",
    response_model=list[PuntoAcopioResponse],
    summary="Listar puntos de acopio",
    description=(
        "El listado público exige institución VERIFICADA, punto ACTIVO y último evento "
        "de autorización de coordenadas de publicación. La vista privada requiere un "
        "representante autorizado o un participante activo de una entrega."
    ),
)
def listar_puntos(
    institucionId: Optional[int] = Query(default=None, alias="institucionId"),
    distritoId: Optional[int] = Query(default=None, alias="distritoId"),
    publico: bool = Query(default=True),
    usuario: Optional[dict] = Depends(usuario_opcional),
):
    if not publico and usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere un token de acceso para la consulta privada",
        )
    return puntos_acopio_repo.listar_puntos_acopio(
        institucion_id=institucionId,
        distrito_id=distritoId,
        publico=publico,
        usuario_id=usuario["id_usuario"] if usuario else None,
    )


@router.post(
    "/puntos-de-acopio",
    response_model=PuntoAcopioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar punto de acopio",
    responses={403: {"description": "El representante no está autorizado."}},
)
def crear_punto(
    datos: PuntoAcopioRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    return puntos_acopio_repo.crear_punto_acopio(
        usuario["id_usuario"], datos.model_dump()
    )


@router.put(
    "/puntos-de-acopio/{punto_id}",
    response_model=PuntoAcopioResponse,
    summary="Reemplazar punto de acopio y horarios",
)
def reemplazar_punto(
    punto_id: int,
    datos: PuntoAcopioRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    return puntos_acopio_repo.reemplazar_punto_acopio(
        usuario["id_usuario"], punto_id, datos.model_dump()
    )


@router.patch(
    "/puntos-de-acopio/{punto_id}/estado",
    response_model=PuntoAcopioResponse,
    summary="Activar o desactivar punto de acopio",
)
def cambiar_estado_punto(
    punto_id: int,
    datos: CambiarEstadoPuntoRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    return puntos_acopio_repo.cambiar_estado_punto(
        usuario["id_usuario"], punto_id, datos.estado
    )


@router.delete(
    "/puntos-de-acopio/{punto_id}",
    summary="Dar de baja un punto sin relaciones",
    responses={409: {"description": "El punto ya tiene necesidades o entregas."}},
)
def eliminar_punto(
    punto_id: int,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    return puntos_acopio_repo.eliminar_punto_acopio(usuario["id_usuario"], punto_id)
