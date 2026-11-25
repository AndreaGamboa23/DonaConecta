from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import requerir_roles
from app.repositories.donaciones_repo import (
    crear_compromiso,
    crear_necesidad,
    listar_compromisos_donante,
    listar_necesidades_activas,
)
from app.schemas.donaciones_schema import CrearCompromisoRequest, CrearNecesidadRequest

router = APIRouter(prefix="/api/v1", tags=["Necesidades y Donaciones"])

@router.get("/necesidades")
def obtener_necesidades_publicas():
    return listar_necesidades_activas()

@router.post("/necesidades", status_code=status.HTTP_201_CREATED)
def publicar_necesidad(
    datos: CrearNecesidadRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    try:
        nueva = crear_necesidad(usuario["id_usuario"], datos.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"mensaje": "Necesidad publicada correctamente", "necesidad": nueva}

@router.post("/compromisos", status_code=status.HTTP_201_CREATED)
def registrar_compromiso_donacion(
    datos: CrearCompromisoRequest,
    usuario: dict = Depends(requerir_roles("DONANTE")),
):
    try:
        nuevo = crear_compromiso(usuario["id_usuario"], datos.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"mensaje": "Compromiso de donacion registrado correctamente", "compromiso": nuevo}

@router.get("/compromisos/mis-compromisos")
def mis_compromisos(usuario: dict = Depends(requerir_roles("DONANTE"))):
    return listar_compromisos_donante(usuario["id_usuario"])
