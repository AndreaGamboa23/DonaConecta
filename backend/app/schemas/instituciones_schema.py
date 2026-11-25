from typing import Literal, Optional
from pydantic import BaseModel, Field

class CrearInstitucionRequest(BaseModel):
    ruc: str = Field(..., min_length=11, max_length=11)
    razon_social: str = Field(..., min_length=3, max_length=180)
    nombre_comercial: str = Field(..., min_length=3, max_length=150)
    tipo_institucion: Literal["COMEDOR", "ALBERGUE", "REFUGIO_ANIMALES", "ORGANIZACION_SOCIAL"]
    distrito: str = Field(..., min_length=2, max_length=80)
    direccion: str = Field(..., min_length=5, max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=500)

class VerificarInstitucionRequest(BaseModel):
    estado_verificacion: Literal["VERIFICADA", "RECHAZADA"]
