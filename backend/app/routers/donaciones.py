from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.security import requerir_roles
from app.repositories.donaciones_repo import (
    listar_compromisos_donante,
    listar_compromisos_representante,
    listar_necesidades_publicas,
)
from app.schemas.directorio_schema import NecesidadResumenPublica
from app.schemas.donaciones_schema import CrearCompromisoRequest, CrearNecesidadRequest
from app.services import donaciones_service

router = APIRouter(prefix="/api/v1", tags=["Necesidades y donaciones"])


@router.get(
    "/necesidades",
    response_model=list[NecesidadResumenPublica],
    summary="Listar necesidades publicadas",
    description=(
        "Devuelve solicitudes PUBLICADA de instituciones verificadas, ordenadas por "
        "prioridad y fecha. La disponibilidad y el avance provienen de las vistas "
        "reales de SQL Server; admite filtros y paginación."
    ),
)
def obtener_necesidades_publicas(
    categoriaId: Optional[int] = Query(default=None, alias="categoriaId"),
    distritoId: Optional[int] = Query(default=None, alias="distritoId"),
    institucionId: Optional[int] = Query(default=None, alias="institucionId"),
    prioridad: Optional[str] = Query(default=None, pattern="^(ALTA|MEDIA|BAJA)$"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    return listar_necesidades_publicas(
        categoria_id=categoriaId,
        distrito_id=distritoId,
        institucion_id=institucionId,
        prioridad=prioridad,
        limite=limit,
        desplazamiento=offset,
    )


@router.post("/necesidades", status_code=status.HTTP_201_CREATED)
def publicar_necesidad(
    datos: CrearNecesidadRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    nueva = donaciones_service.publicar_necesidad(usuario["id_usuario"], datos)
    return {"mensaje": "Necesidad publicada correctamente", "necesidad": nueva}


@router.post(
    "/compromisos",
    status_code=status.HTTP_201_CREATED,
    summary="Registrar compromiso de bienes materiales",
    description=(
        "Reserva bienes de una necesidad publicada. Un donante no puede tener dos compromisos "
        "vigentes para la misma necesidad; la disponibilidad se valida por producto y unidad."
    ),
    responses={
        400: {"description": "Líneas, unidades o expiración no válidas."},
        401: {"description": "Sesión no autenticada."},
        403: {"description": "La cuenta no tiene perfil de donante."},
        409: {
            "description": (
                "Compromiso vigente duplicado o cantidad superior a la disponibilidad real."
            )
        },
    },
)
def registrar_compromiso_donacion(
    datos: CrearCompromisoRequest,
    usuario: dict = Depends(requerir_roles("DONANTE")),
):
    nuevo = donaciones_service.registrar_compromiso(usuario["id_usuario"], datos)
    return {"mensaje": "Compromiso de donación registrado", "compromiso": nuevo}


@router.get("/compromisos/mis-compromisos")
@router.get("/donaciones/mias", include_in_schema=False)
def mis_compromisos(usuario: dict = Depends(requerir_roles("DONANTE"))):
    return listar_compromisos_donante(usuario["id_usuario"])


@router.get("/compromisos/institucion")
def compromisos_de_mi_institucion(
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    return listar_compromisos_representante(usuario["id_usuario"])
