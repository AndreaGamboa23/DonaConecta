"""DTOs de puntos de acopio y de sus horarios reales.

Las coordenadas son opcionales en la respuesta: el repositorio las deja en
``None`` cuando no existe autorización explícita para publicarlas.
"""

from datetime import time
from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator


class HorarioAcopioRequest(BaseModel):
    """Franja horaria de un punto; un día puede tener varias aperturas distintas."""

    model_config = ConfigDict(populate_by_name=True)

    dia_semana: int = Field(..., ge=1, le=7)
    hora_apertura: time
    hora_cierre: time
    activo: bool = True

    @model_validator(mode="after")
    def validar_franja(self) -> "HorarioAcopioRequest":
        if self.hora_cierre <= self.hora_apertura:
            raise ValueError("La hora de cierre debe ser posterior a la de apertura")
        return self


class PuntoAcopioRequest(BaseModel):
    """Cuerpo compartido por el alta y el reemplazo de un punto de acopio."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id_institucion: int = Field(
        ..., gt=0, validation_alias=AliasChoices("id_institucion", "institucionId")
    )
    nombre: str = Field(..., min_length=3, max_length=150)
    direccion: Optional[str] = Field(default=None, max_length=300)
    referencias_entrega: Optional[str] = Field(default=None, max_length=500)
    distrito_id: int = Field(
        ..., gt=0, validation_alias=AliasChoices("distrito_id", "distritoId")
    )
    latitud: Optional[float] = Field(default=None, ge=-90, le=90)
    longitud: Optional[float] = Field(default=None, ge=-180, le=180)
    coordenadas_publicas: bool = Field(
        default=False,
        validation_alias=AliasChoices("coordenadas_publicas", "coordenadasPublicas"),
    )
    horarios: list[HorarioAcopioRequest] = Field(..., min_length=1, max_length=21)

    @model_validator(mode="after")
    def validar_coordenadas_y_horarios(self) -> "PuntoAcopioRequest":
        if (self.latitud is None) != (self.longitud is None):
            raise ValueError("Latitud y longitud deben indicarse juntas")
        if self.coordenadas_publicas and self.latitud is None:
            raise ValueError("Para publicar coordenadas debe indicar latitud y longitud")
        # La PK real es (punto_id, dia_semana, hora_apertura): se permiten varias
        # franjas por día siempre que la apertura sea distinta.
        claves = [
            (horario.dia_semana, horario.hora_apertura) for horario in self.horarios
        ]
        if len(claves) != len(set(claves)):
            raise ValueError(
                "No se puede repetir la misma hora de apertura para un día de la semana"
            )
        return self


class CambiarEstadoPuntoRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    estado: Literal["ACTIVO", "INACTIVO"]


class HorarioAcopioResponse(BaseModel):
    punto_id: int
    dia_semana: int
    hora_apertura: str
    hora_cierre: str
    activo: bool


class PuntoAcopioResponse(BaseModel):
    punto_id: int
    id_punto_acopio: int
    id_institucion: int
    nombre: str
    direccion: Optional[str] = None
    referencias_entrega: Optional[str] = None
    distrito_id: int
    distrito: str = ""
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    estado: str
    coordenadas_visibles: bool = False
    horarios: list[HorarioAcopioResponse] = Field(default_factory=list)
