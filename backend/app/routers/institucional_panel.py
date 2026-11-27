"""Panel institucional: datos propios y gestión de necesidades."""

from fastapi import APIRouter, Depends, status

from app.core.security import requerir_roles
from app.schemas.paneles_schema import (
    ActualizarNecesidadRequest,
    ActualizarPerfilInstitucionalRequest,
    CrearNecesidadInstitucionalRequest,
    InstitucionalPerfilResponse,
    InstitucionalResumenResponse,
    NecesidadInstitucionalResponse,
    NecesidadMutacionResponse,
)
from app.services import paneles_service

router = APIRouter(prefix="/api/v1/institucional", tags=["Panel institucional"])

_ERRORES = {
    401: {"description": "Token ausente, expirado, revocado o cuenta inactiva."},
    403: {"description": "La cuenta no representa una institución autorizada."},
    404: {"description": "Recurso no encontrado o ajeno a la institución."},
    409: {"description": "Conflicto con compromisos, estado o versión de la fila."},
    422: {"description": "Cuerpo inválido o transición sin motivo obligatorio."},
}

_REPRESENTANTE = Depends(requerir_roles("REPRESENTANTE"))


@router.get(
    "/resumen",
    response_model=InstitucionalResumenResponse,
    summary="Resumen real de la institución del representante",
    description=(
        "La institución se resuelve desde la sesión y el vínculo autorizado en SQL Server; "
        "el cliente no puede enviar un identificador ajeno."
    ),
    responses=_ERRORES,
)
def obtener_resumen_institucional(_usuario: dict = _REPRESENTANTE):
    return paneles_service.resumen_institucional(_usuario["id_usuario"])


@router.get(
    "/perfil",
    response_model=InstitucionalPerfilResponse,
    summary="Consultar los datos públicos de mi institución",
    description="La institución se resuelve desde el vínculo autorizado del representante.",
    responses=_ERRORES,
)
def obtener_perfil_institucional(usuario: dict = _REPRESENTANTE):
    return paneles_service.perfil_institucional(usuario["id_usuario"])


@router.patch(
    "/perfil",
    response_model=InstitucionalPerfilResponse,
    summary="Actualizar los datos públicos editables de mi institución",
    description="Sólo dirección, descripción, teléfono público y correo público.",
    responses=_ERRORES,
)
def modificar_perfil_institucional(
    datos: ActualizarPerfilInstitucionalRequest,
    usuario: dict = _REPRESENTANTE,
):
    return paneles_service.actualizar_perfil_institucional(
        usuario["id_usuario"], datos.model_dump(exclude_unset=True)
    )


@router.get(
    "/necesidades",
    response_model=list[NecesidadInstitucionalResponse],
    summary="Listar todas mis necesidades con disponibilidad real",
    description="Incluye todos los estados y las líneas calculadas desde la vista de disponibilidad.",
    responses=_ERRORES,
)
def obtener_necesidades_institucionales(usuario: dict = _REPRESENTANTE):
    return paneles_service.listar_necesidades_institucionales(usuario["id_usuario"])


@router.post(
    "/necesidades",
    response_model=NecesidadMutacionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publicar una necesidad para mi institución",
    description="La institución se deriva del representante autorizado, nunca del cuerpo enviado.",
    responses=_ERRORES,
)
def publicar_necesidad_institucional(
    datos: CrearNecesidadInstitucionalRequest,
    usuario: dict = _REPRESENTANTE,
):
    return paneles_service.publicar_necesidad_institucional(usuario["id_usuario"], datos)


@router.patch(
    "/necesidades/{id_necesidad}",
    response_model=NecesidadMutacionResponse,
    summary="Editar o cambiar el estado de una necesidad propia",
    description=(
        "Valida transiciones, propiedad y versión de fila cuando se envía; "
        "la cancelación exige motivo y publicación fija la fecha de publicación."
    ),
    responses=_ERRORES,
)
def modificar_necesidad_institucional(
    id_necesidad: int,
    datos: ActualizarNecesidadRequest,
    usuario: dict = _REPRESENTANTE,
):
    return paneles_service.actualizar_necesidad_institucional(
        usuario["id_usuario"], id_necesidad, datos
    )


@router.delete(
    "/necesidades/{id_necesidad}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una necesidad propia en estado BORRADOR",
    description="Sólo si no tiene compromisos ni fotografías; borra líneas y auditoría en una transacción.",
    responses=_ERRORES,
)
def eliminar_necesidad_institucional(
    id_necesidad: int,
    usuario: dict = _REPRESENTANTE,
):
    paneles_service.eliminar_necesidad_institucional(usuario["id_usuario"], id_necesidad)
