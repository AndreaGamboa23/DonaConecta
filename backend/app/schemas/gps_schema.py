"""DTOs del seguimiento GPS autorizado.

Se exponen coordenadas en texto plano sólo al participante autorizado de la
entrega; nunca nonces, versión de clave ni paquetes cifrados. No hay campos de
rutas, distancias ni tiempos de llegada.
"""

import math
from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, Field, field_validator


class IniciarGpsRequest(BaseModel):
    # El consentimiento es explícito: el servidor rechaza false o su ausencia.
    consentimiento_dado: Literal[True] = Field(
        validation_alias=AliasChoices("consentimiento_dado", "consentimiento")
    )
    duracion_minutos: int = Field(default=30, ge=1, le=120)


class UbicacionRequest(BaseModel):
    latitud: float = Field(ge=-90, le=90)
    longitud: float = Field(ge=-180, le=180)
    precision_metros: float = Field(default=0, ge=0, le=100_000)

    @field_validator("latitud", "longitud", "precision_metros")
    @classmethod
    def finito(cls, valor: float) -> float:
        if not math.isfinite(valor):
            raise ValueError("La coordenada debe ser un número finito.")
        return valor


class SesionGpsResponse(BaseModel):
    sesion_id: int
    entrega_id: int
    estado: str
    consentimiento_dado: bool
    fecha_inicio: str
    expira_en: str
    fecha_fin: Optional[str] = None


class UltimaUbicacionResponse(BaseModel):
    sesion_id: Optional[int] = None
    entrega_id: int
    estado: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    precision_metros: Optional[float] = None
    actualizado_en: Optional[str] = None
    expira_en: Optional[str] = None
