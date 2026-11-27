"""Esquemas de autenticación alineados con los servicios Angular reales."""

from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field

from app.schemas.instituciones_schema import InstitucionRegistroRequest


class RegistroRequest(BaseModel):
    """Cuerpo de ``POST /api/v1/auth/registro``.

    El cliente envía ``email`` y ``rol`` como campos principales; ``correo`` y
    ``tipo`` se aceptan como alias para clientes que usan el contrato documentado
    en ``docs/contrato-api.md``.
    """

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., validation_alias=AliasChoices("email", "correo"))
    password: str = Field(..., min_length=8, max_length=128)
    rol: Literal["DONANTE", "REPRESENTANTE"] = Field(
        default="DONANTE", validation_alias=AliasChoices("rol", "tipo")
    )
    telefono: Optional[str] = Field(
        default=None,
        max_length=20,
        pattern=r"^\+?[0-9\s\-()]{7,20}$",
    )

    # Campos del donante. El cliente actual los envía siempre; se dejan opcionales
    # para no rechazar el registro de representantes del mismo endpoint.
    distrito_id: Optional[int] = Field(
        default=None, ge=1, validation_alias=AliasChoices("distritoId", "distrito_id")
    )
    preferencia_notificacion: Literal["TODAS", "IMPORTANTES", "NINGUNA"] = Field(
        default="IMPORTANTES",
        validation_alias=AliasChoices("preferenciaNotificacion", "preferencia_notificacion"),
    )
    consentimiento_datos: Optional[bool] = Field(
        default=None, validation_alias=AliasChoices("consentimientoDatos", "consentimiento_datos")
    )
    acepta_terminos: Optional[bool] = Field(
        default=None, validation_alias=AliasChoices("aceptaTerminos", "acepta_terminos")
    )

    # Ruta alternativa: el registro crea también la solicitud de institución.
    institucion: Optional[InstitucionRegistroRequest] = None


class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    correo: EmailStr = Field(..., validation_alias=AliasChoices("correo", "email"))
    password: str = Field(..., min_length=1, max_length=128)


class UsuarioSesionResponse(BaseModel):
    id_usuario: int
    nombres: str
    apellidos: str
    correo: str
    roles: list[str]


class TokenResponse(BaseModel):
    """Formato exacto consumido por ``LoginResponse`` del frontend."""

    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSesionResponse


class RolResumen(BaseModel):
    codigo: str
    estado: str


class RegistroResponse(BaseModel):
    """Incluye el formato del frontend de Jhon y el del contrato compartido."""

    mensaje: str
    usuario: UsuarioSesionResponse
    usuarioId: int
    estadoCuenta: str
    roles: list[RolResumen]
    institucionSolicitudId: Optional[int] = None


class RecuperacionRequest(BaseModel):
    correo: EmailStr = Field(..., validation_alias=AliasChoices("correo", "email"))
