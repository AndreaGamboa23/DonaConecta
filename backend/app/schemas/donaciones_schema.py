"""Esquemas de necesidades y compromisos.

Se aceptan los nombres del cliente actual (``id_necesidad``, ``cantidad_comprometida``,
``comentario``) y los del contrato compartido (``necesidadId``, ``lineas``,
``observaciones``) sin inventar valores ausentes.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class LineaCompromisoRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    producto_id: int = Field(
        ..., gt=0, validation_alias=AliasChoices("productoId", "producto_id", "id_producto")
    )
    unidad_id: int = Field(
        ..., gt=0, validation_alias=AliasChoices("unidadId", "unidad_id", "id_unidad")
    )
    cantidad: float = Field(..., gt=0)


class CrearCompromisoRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id_necesidad: int = Field(..., gt=0, validation_alias=AliasChoices("id_necesidad", "necesidadId"))
    lineas: Optional[list[LineaCompromisoRequest]] = None
    cantidad_comprometida: Optional[float] = Field(
        default=None, gt=0, validation_alias=AliasChoices("cantidad_comprometida", "cantidadComprometida")
    )
    comentario: Optional[str] = Field(
        default=None,
        max_length=500,
        validation_alias=AliasChoices("comentario", "observaciones"),
    )
    expiracion_minutos: Optional[int] = Field(
        default=None,
        ge=1,
        le=1440,
        validation_alias=AliasChoices("expiracionMinutos", "expiracion_minutos"),
    )


class LineaNecesidadRequest(LineaCompromisoRequest):
    pass


class CrearNecesidadRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id_institucion: int = Field(
        ..., gt=0, validation_alias=AliasChoices("id_institucion", "institucionId")
    )
    titulo: str = Field(..., min_length=4, max_length=200)
    descripcion: str = Field(..., min_length=5, max_length=600)
    prioridad: Literal["ALTA", "MEDIA", "BAJA"] = "MEDIA"
    estado: Literal["BORRADOR", "PUBLICADA"] = "PUBLICADA"
    fecha_limite: Optional[datetime] = Field(
        default=None, validation_alias=AliasChoices("fecha_limite", "fechaLimite")
    )

    id_categoria: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_categoria", "categoriaId")
    )
    id_punto_acopio: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_punto_acopio", "puntoAcopioId")
    )
    lineas: Optional[list[LineaNecesidadRequest]] = None

    # Atajo de una sola línea, usado por formularios sencillos.
    id_producto: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_producto", "productoId")
    )
    id_unidad: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_unidad", "unidadId")
    )
    cantidad_requerida: Optional[float] = Field(
        default=None, gt=0, validation_alias=AliasChoices("cantidad_requerida", "cantidadRequerida")
    )
