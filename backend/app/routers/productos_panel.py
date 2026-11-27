"""Catálogo público de bienes materiales con sus unidades reales."""

from typing import Optional

from fastapi import APIRouter, Query

from app.schemas.paneles_schema import ProductoResponse
from app.services import paneles_service

router = APIRouter(prefix="/api/v1", tags=["Catálogo de bienes"])

_ERRORES = {422: {"description": "Parámetro de categoría inválido."}}


@router.get(
    "/productos",
    response_model=list[ProductoResponse],
    summary="Listar productos del catálogo y sus unidades permitidas",
    description=(
        "Lee dbo.productos, dbo.producto_unidades, dbo.categorias_bienes y "
        "dbo.unidades_medida. El filtro por categoría es opcional."
    ),
    responses=_ERRORES,
)
def obtener_productos(
    categoriaId: Optional[int] = Query(default=None, ge=1, alias="categoriaId"),
):
    return paneles_service.listar_productos(categoriaId)
