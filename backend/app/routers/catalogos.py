from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.repositories.catalogos_repo import (
    listar_categorias,
    listar_unidades_medida,
    verificar_conexion_db,
)

router = APIRouter(prefix="/api/v1", tags=["Sistema y catálogos"])


@router.get("/health")
def health_check():
    try:
        db_name = verificar_conexion_db()
        return {
            "estado": "ok",
            "base_datos": db_name,
            "entorno": settings.APP_ENV,
            "modo_pruebas": settings.APP_ENV != "production" or "pruebas" in db_name.casefold(),
        }
    except Exception:
        raise HTTPException(status_code=503, detail="No se pudo conectar con SQL Server")


@router.get("/categorias")
def obtener_categorias():
    return listar_categorias()


@router.get("/unidades-medida")
def obtener_unidades_medida():
    return listar_unidades_medida()
