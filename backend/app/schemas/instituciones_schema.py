"""Esquemas de instituciones ajustados al modelo físico de la Fase 06.

El modelo real no tiene RUC, razón social ni nombre comercial: esos campos se
aceptan sólo como alias de entrada para clientes antiguos y nunca se almacenan.
"""

from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class InstitucionRegistroRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    nombre: str = Field(..., min_length=3, max_length=200)
    tipo_id: Optional[int] = Field(
        default=None, ge=1, validation_alias=AliasChoices("tipoId", "tipo_id")
    )
    distrito_id: Optional[int] = Field(
        default=None, ge=1, validation_alias=AliasChoices("distritoId", "distrito_id")
    )
    direccion: Optional[str] = Field(default=None, max_length=300)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    cargo_representante: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cargoRepresentante", "cargo_representante"),
    )

    # Compatibilidad con el cliente anterior: se ignoran, no se persisten.
    tipo_institucion: Optional[str] = Field(default=None, max_length=30)
    distrito: Optional[str] = Field(default=None, max_length=100)
    ruc: Optional[str] = Field(default=None, max_length=20)
    razon_social: Optional[str] = Field(default=None, max_length=200)
    nombre_comercial: Optional[str] = Field(default=None, max_length=200)


class CrearInstitucionRequest(InstitucionRegistroRequest):
    """Cuerpo exacto de ``POST /api/v1/instituciones`` tras el registro."""


class VerificarInstitucionRequest(BaseModel):
    estado_verificacion: Literal["VERIFICADA", "RECHAZADA", "SUSPENDIDA", "EN_REVISION"]
    motivo: Optional[str] = Field(default=None, max_length=500)
