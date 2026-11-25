from typing import Literal, Optional
from pydantic import BaseModel, Field

class CrearInstitucionRequest(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=150)
    ruc: Optional[str] = Field(default=None, min_length=11, max_length=11)
    tipo_institucion: str = Field(..., min_length=3, max_length=60)
    direccion: str = Field(..., min_length=5, max_length=250)
    distrito: str = Field(..., min_length=2, max_length=100)
    provincia: str = Field(..., min_length=2, max_length=100)
    departamento: str = Field(..., min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)

class VerificarInstitucionRequest(BaseModel):
    estado_verificacion: Literal["VERIFICADA", "RECHAZADA"]
    observaciones: Optional[str] = Field(default=None, max_length=300)
