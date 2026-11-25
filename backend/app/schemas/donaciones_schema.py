from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field

class CrearNecesidadRequest(BaseModel):
    id_institucion: int = Field(..., gt=0)
    id_categoria: int = Field(..., gt=0)
    id_punto_acopio: int = Field(..., gt=0)
    titulo: str = Field(..., min_length=4, max_length=150)
    descripcion: str = Field(..., min_length=5, max_length=600)
    cantidad_requerida: float = Field(..., gt=0)
    prioridad: Literal["ALTA", "MEDIA", "BAJA"] = "MEDIA"
    fecha_limite: Optional[date] = None

class CrearCompromisoRequest(BaseModel):
    id_necesidad: int = Field(..., gt=0)
    cantidad_comprometida: float = Field(..., gt=0)
    comentario: Optional[str] = Field(default=None, max_length=300)
