from fastapi import APIRouter, HTTPException
from app.repositories.catalogos_repo import listar_categorias, verificar_conexion_db

router = APIRouter(prefix="/api/v1", tags=["Sistema y Catalogos"])

@router.get("/health")
def health_check():
    try:
        db_name = verificar_conexion_db()
        return {"estado": "ok", "base_datos": db_name}
    except Exception:
        raise HTTPException(status_code=503, detail="No se pudo conectar con SQL Server")

@router.get("/categorias")
def obtener_categorias():
    return listar_categorias()
