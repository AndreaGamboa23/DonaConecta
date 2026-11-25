from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import requerir_roles
from app.repositories.instituciones_repo import (
    actualizar_verificacion_institucion,
    crear_institucion,
    listar_instituciones_pendientes,
    listar_instituciones_verificadas,
)
from app.schemas.instituciones_schema import (
    CrearInstitucionRequest,
    VerificarInstitucionRequest,
)

router = APIRouter(prefix="/api/v1", tags=["Instituciones"])

@router.get("/instituciones")
def obtener_instituciones_publicas():
    return listar_instituciones_verificadas()

@router.post("/instituciones", status_code=status.HTTP_201_CREATED)
def registrar_institucion(
    datos: CrearInstitucionRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    nueva = crear_institucion(usuario["id_usuario"], datos.model_dump())
    return {"mensaje": "Institucion registrada en estado PENDIENTE", "institucion": nueva}

@router.get("/admin/instituciones/pendientes")
def obtener_instituciones_pendientes(
    usuario: dict = Depends(requerir_roles("ADMINISTRADOR")),
):
    return listar_instituciones_pendientes()

@router.patch("/admin/instituciones/{id_institucion}/verificar")
def verificar_institucion(
    id_institucion: int,
    datos: VerificarInstitucionRequest,
    usuario: dict = Depends(requerir_roles("ADMINISTRADOR")),
):
    actualizada = actualizar_verificacion_institucion(
        id_institucion=id_institucion,
        estado_verificacion=datos.estado_verificacion,
        id_admin=usuario["id_usuario"],
    )
    if not actualizada:
        raise HTTPException(status_code=404, detail="Institucion no encontrada")
    return {"mensaje": "Estado de verificacion actualizado", "institucion": actualizada}
