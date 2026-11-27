from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import requerir_roles
from app.repositories.directorio_repo import listar_instituciones_publicas
from app.repositories.instituciones_repo import (
    crear_institucion,
    listar_instituciones_pendientes,
)
from app.schemas.directorio_schema import InstitucionResumenPublica
from app.schemas.instituciones_schema import (
    CrearInstitucionRequest,
    VerificarInstitucionRequest,
)
from app.schemas.paneles_schema import VerificarInstitucionResponse
from app.services import paneles_service

router = APIRouter(prefix="/api/v1", tags=["Instituciones"])


@router.get(
    "/instituciones",
    summary="Directorio de instituciones verificadas",
    description=(
        "Sólo organizaciones VERIFICADA. Los filtros por tipo real, distrito y texto "
        "se aplican en SQL Server; nunca se devuelven solicitudes pendientes, "
        "rechazadas ni suspendidas."
    ),
    response_model=list[InstitucionResumenPublica],
)
def obtener_instituciones_publicas(
    tipoCodigo: Optional[str] = Query(default=None, alias="tipoCodigo"),
    distritoId: Optional[int] = Query(default=None, alias="distritoId"),
    q: Optional[str] = Query(default=None, max_length=100),
):
    return listar_instituciones_publicas(
        tipo_codigo=tipoCodigo,
        distrito_id=distritoId,
        termino=q,
    )


@router.post("/instituciones", status_code=status.HTTP_201_CREATED)
def registrar_institucion(
    datos: CrearInstitucionRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    nueva = crear_institucion(usuario["id_usuario"], datos.model_dump())
    return {"mensaje": "Institución registrada en estado PENDIENTE", "institucion": nueva}


@router.get(
    "/admin/instituciones/pendientes",
    summary="Listar instituciones pendientes de verificación",
    description=(
        "Devuelve las solicitudes en estado PENDIENTE para la cola del panel "
        "administrativo. Solo accesible con el rol ADMINISTRADOR activo."
    ),
)
def obtener_instituciones_pendientes(
    _usuario: dict = Depends(requerir_roles("ADMINISTRADOR")),
):
    return listar_instituciones_pendientes()


@router.patch(
    "/admin/instituciones/{id_institucion}/verificar",
    response_model=VerificarInstitucionResponse,
    summary="Verificar, rechazar, suspender o reactivar una institución",
    description=(
        "Aplica las transiciones permitidas, activa o desactiva únicamente el vínculo "
        "principal y su rol de representante, y registra la verificación y la auditoría "
        "en la misma transacción."
    ),
    responses={
        401: {"description": "Token ausente, expirado o revocado."},
        403: {"description": "El usuario no es administrador."},
        404: {"description": "Institución no encontrada."},
        409: {"description": "Transición no permitida o estado sin cambio."},
        422: {"description": "Cuerpo inválido o motivo ausente cuando es obligatorio."},
    },
)
def verificar_institucion(
    id_institucion: int,
    datos: VerificarInstitucionRequest,
    usuario: dict = Depends(requerir_roles("ADMINISTRADOR")),
):
    actualizada = paneles_service.verificar_institucion(
        id_institucion=id_institucion,
        estado_verificacion=datos.estado_verificacion,
        id_admin=usuario["id_usuario"],
        motivo=datos.motivo,
    )
    if not actualizada:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institución no encontrada")
    return {"mensaje": "Estado de verificación actualizado", "institucion": actualizada}
