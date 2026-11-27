from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.security import requerir_roles
from app.repositories.donaciones_repo import (
    listar_compromisos_donante,
    listar_compromisos_representante,
    listar_necesidades_publicas,
)
from app.schemas.donaciones_schema import CrearCompromisoRequest, CrearNecesidadRequest
from app.services import donaciones_service

router = APIRouter(prefix="/api/v1", tags=["Necesidades y donaciones"])


@router.get("/necesidades")
def obtener_necesidades_publicas(
    categoriaId: Optional[int] = Query(default=None, alias="categoriaId"),
    distritoId: Optional[int] = Query(default=None, alias="distritoId"),
    institucionId: Optional[int] = Query(default=None, alias="institucionId"),
):
    return listar_necesidades_publicas(
        categoria_id=categoriaId,
        distrito_id=distritoId,
        institucion_id=institucionId,
    )


@router.post("/necesidades", status_code=status.HTTP_201_CREATED)
def publicar_necesidad(
    datos: CrearNecesidadRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    nueva = donaciones_service.publicar_necesidad(usuario["id_usuario"], datos)
    return {"mensaje": "Necesidad publicada correctamente", "necesidad": nueva}


@router.post("/compromisos", status_code=status.HTTP_201_CREATED)
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
