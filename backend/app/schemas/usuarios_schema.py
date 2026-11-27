"""Esquemas del perfil propio, actualizaciones y credenciales.

Los campos administrativos (roles, identificadores, estado y contraseña) no
forman parte de la representación editable general. ``extra='forbid'`` hace que
un cliente que los envíe reciba 422 en lugar de ignorarlos silenciosamente.
"""

from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, model_validator

Preferencia = Literal["TODAS", "IMPORTANTES", "NINGUNA"]
TELEFONO_PATRON = r"^\+?[0-9\s\-()]{7,20}$"


class DonanteResumen(BaseModel):
    distrito_id: int
    distrito: str
    preferencia_notificacion: Preferencia
    consentimiento_datos: bool
    acepta_terminos: bool
    fecha_registro: str


class InstitucionResumen(BaseModel):
    institucion_id: int
    nombre: str
    tipo: Optional[str] = None
    estado_verificacion: str
    cargo: Optional[str] = None
    vinculo_estado: str
    fecha_inicio: Optional[str] = None


class PerfilResponse(BaseModel):
    """Datos autorizados del propio usuario; nunca hashes, claves ni tokens."""

    id_usuario: int
    nombres: str
    apellidos: str
    correo: EmailStr
    roles: list[str]
    estado_cuenta: str
    fecha_registro: str
    email_verificado_en: Optional[str] = None
    ultimo_acceso_en: Optional[str] = None
    foto_url: Optional[str] = None
    telefono_enmascarado: Optional[str] = None
    telefono_guardado: bool = False
    donante: Optional[DonanteResumen] = None
    institucion: Optional[InstitucionResumen] = None


class ActividadResponse(BaseModel):
    compromisos: int
    entregas: int
    recepciones: int
    conversaciones: int
    historial: int


class _CamposEditables(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    nombres: Optional[str] = Field(default=None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(default=None, min_length=2, max_length=100)
    telefono: Optional[str] = Field(default=None, max_length=20, pattern=TELEFONO_PATRON)
    distrito_id: Optional[int] = Field(
        default=None, ge=1, validation_alias=AliasChoices("distritoId", "distrito_id")
    )
    preferencia_notificacion: Optional[Preferencia] = Field(
        default=None,
        validation_alias=AliasChoices("preferenciaNotificacion", "preferencia_notificacion"),
    )


class PerfilActualizarRequest(_CamposEditables):
    """PUT: representación editable completa.

    ``nombres`` y ``apellidos`` son obligatorios. Para donantes, el servicio
    exige además distrito y preferencia; para representantes esos campos no se
    aceptan porque pertenecen a la institución, no al perfil general.
    """

    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)


class PerfilParcialRequest(_CamposEditables):
    """PATCH: sólo se tocan los campos presentes en el cuerpo JSON.

    ``telefono: null`` elimina el valor cifrado. Los demás campos no admiten
    null porque son obligatorios en el modelo relacional.
    """


class CambiarContrasenaRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    password_actual: str = Field(
        ...,
        min_length=1,
        max_length=128,
        validation_alias=AliasChoices("passwordActual", "password_actual"),
    )
    password_nueva: str = Field(
        ...,
        min_length=8,
        max_length=128,
        validation_alias=AliasChoices("passwordNueva", "password_nueva"),
    )
    confirmacion: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def las_nuevas_coinciden(self) -> "CambiarContrasenaRequest":
        if self.password_nueva != self.confirmacion:
            raise ValueError("La nueva contraseña y su confirmación no coinciden.")
        if self.password_nueva == self.password_actual:
            raise ValueError("La nueva contraseña debe ser diferente de la actual.")
        return self


class CambiarCorreoRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    nuevo_correo: EmailStr = Field(
        ..., validation_alias=AliasChoices("nuevoCorreo", "nuevo_correo")
    )
    confirmacion_correo: EmailStr = Field(
        ..., validation_alias=AliasChoices("confirmacionCorreo", "confirmacion_correo")
    )
    password: str = Field(..., min_length=1, max_length=128)

    @model_validator(mode="after")
    def los_correos_coinciden(self) -> "CambiarCorreoRequest":
        if str(self.nuevo_correo).lower() != str(self.confirmacion_correo).lower():
            raise ValueError("Los correos electrónicos no coinciden.")
        return self


class BajaCuentaRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    password: str = Field(..., min_length=1, max_length=128)
    confirmacion: Literal["BAJA"]
