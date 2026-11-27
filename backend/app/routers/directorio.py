"""Lectura pública de fichas de necesidad e instituciones verificadas."""

from fastapi import APIRouter

from app.repositories.directorio_repo import (
    listar_tipos_institucion,
    no_encontrado,
    obtener_institucion_publica,
    obtener_necesidad_publica,
)
from app.schemas.directorio_schema import (
    InstitucionDetallePublica,
    NecesidadDetallePublica,
    TipoInstitucionPublico,
)

router = APIRouter(prefix="/api/v1", tags=["Directorio público"])


@router.get(
    "/necesidades/{id_necesidad}",
    response_model=NecesidadDetallePublica,
    summary="Detalle público de una necesidad",
    description=(
        "Muestra todos los bienes solicitados con unidades y disponibilidad calculada "
        "desde compromisos y recepciones reales. Sólo necesidades PUBLICADA de "
        "instituciones VERIFICADA."
    ),
    responses={404: {"description": "La necesidad no existe o no es pública."}},
)
def obtener_detalle_necesidad(id_necesidad: int):
    necesidad = obtener_necesidad_publica(id_necesidad)
    if not necesidad:
        raise no_encontrado("El recurso solicitado")
    return necesidad


@router.get(
    "/instituciones/tipos",
    summary="Tipos reales de institución",
    description=(
        "Catálogo SQL de tipos de institución con el número real de organizaciones "
        "verificadas. El total es informativo y se calcula desde la base de datos."
    ),
    response_model=list[TipoInstitucionPublico],
)
def obtener_tipos_institucion():
    return listar_tipos_institucion()


@router.get(
    "/instituciones/{id_institucion}",
    response_model=InstitucionDetallePublica,
    summary="Perfil público de una institución verificada",
    description=(
        "Datos públicos autorizados, puntos de acopio activos con horarios reales, "
        "bienes solicitados y necesidades publicadas. No expone correos ni datos de "
        "representantes, coordenadas privadas ni información de auditoría."
    ),
    responses={404: {"description": "La institución no existe o no está verificada."}},
)
def obtener_detalle_institucion(id_institucion: int):
    institucion = obtener_institucion_publica(id_institucion)
    if not institucion:
        raise no_encontrado("El recurso solicitado")
    return institucion
