"""DTOs de entregas, recepciones y detalle real de compromisos.

No se calculan porcentajes: sólo se exponen cantidades comprometidas,
recibidas y pendientes leídas de SQL Server.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator


class CrearEntregaRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id_compromiso: int = Field(
        ..., gt=0, validation_alias=AliasChoices("id_compromiso", "compromisoId")
    )
    id_punto_acopio: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_punto_acopio", "puntoAcopioId")
    )
    fecha_programada: datetime
    observaciones: Optional[str] = Field(default=None, max_length=500)


class CambiarEstadoEntregaRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    estado: Literal["EN_CAMINO", "ENTREGADA", "INCIDENCIA", "CANCELADA"]
    observaciones: Optional[str] = Field(default=None, max_length=500)


class LineaRecepcionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    producto_id: int = Field(
        ..., gt=0, validation_alias=AliasChoices("producto_id", "productoId", "id_producto")
    )
    unidad_id: int = Field(
        ..., gt=0, validation_alias=AliasChoices("unidad_id", "unidadId", "id_unidad")
    )
    cantidad_recibida: float = Field(
        ...,
        ge=0,
        validation_alias=AliasChoices("cantidad_recibida", "cantidadRecibida", "cantidad"),
    )


class ConfirmarRecepcionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    estado: Literal["PARCIAL", "CONFIRMADA", "OBSERVADA"]
    observaciones: Optional[str] = Field(default=None, max_length=500)
    lineas: list[LineaRecepcionRequest] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validar_observacion(self) -> "ConfirmarRecepcionRequest":
        if self.estado == "OBSERVADA" and not (self.observaciones or "").strip():
            raise ValueError("Una recepción observada requiere observaciones")
        return self


class EntregaResumen(BaseModel):
    id_entrega: int
    entrega_id: int
    id_compromiso: int
    id_punto_acopio: Optional[int] = None
    nombre_punto: str = ""
    direccion_acopio: str = ""
    fecha_programada: Optional[str] = None
    fecha_real_inicio: Optional[str] = None
    fecha_real_fin: Optional[str] = None
    estado: str
    responsable_usuario_id: int
    observaciones: Optional[str] = None


class RecepcionResponse(BaseModel):
    recepcion_id: int
    entrega_id: int
    estado: str


class LineaCompromisoDetalle(BaseModel):
    producto_id: int
    producto: str
    unidad_id: int
    unidad_codigo: str
    cantidad_comprometida: float
    cantidad_recibida: float
    cantidad_pendiente: float


class HorarioEntrega(BaseModel):
    dia_semana: int
    hora_apertura: str
    hora_cierre: str
    activo: bool


class EntregaDetalle(BaseModel):
    id_entrega: int
    entrega_id: int
    id_punto_acopio: Optional[int] = None
    nombre_punto: str = ""
    direccion_acopio: str = ""
    referencias_entrega: str = ""
    horarios: list[HorarioEntrega] = Field(default_factory=list)
    fecha_programada: Optional[str] = None
    fecha_real_inicio: Optional[str] = None
    fecha_real_fin: Optional[str] = None
    estado: str
    observaciones: Optional[str] = None


class LineaRecepcionDetalle(BaseModel):
    producto_id: int
    unidad_id: int
    cantidad_recibida: float


class RecepcionDetalle(BaseModel):
    recepcion_id: int
    entrega_id: int
    fecha_confirmacion: Optional[str] = None
    estado: str
    observaciones: Optional[str] = None
    lineas: list[LineaRecepcionDetalle] = Field(default_factory=list)


class HistorialDetalle(BaseModel):
    historial_id: int
    estado_anterior: str
    estado_nuevo: str
    cambiado_en: Optional[str] = None
    usuario_id: int
    motivo: Optional[str] = None


class DetalleCompromisoResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id_compromiso: int
    compromiso_id: int
    id_necesidad: int
    titulo: str = ""
    id_institucion: int
    institucion: str = ""
    estado: str
    fecha_compromiso: Optional[str] = None
    observaciones: Optional[str] = None
    id_punto_acopio: Optional[int] = None
    nombre_punto: str = ""
    direccion_acopio: str = ""
    referencias_entrega: str = ""
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    lineas: list[LineaCompromisoDetalle] = Field(default_factory=list)
    entregas: list[EntregaDetalle] = Field(default_factory=list)
    recepciones: list[RecepcionDetalle] = Field(default_factory=list)
    historial_entregas: list[HistorialDetalle] = Field(default_factory=list)
    historial_compromiso: list[HistorialDetalle] = Field(default_factory=list)
