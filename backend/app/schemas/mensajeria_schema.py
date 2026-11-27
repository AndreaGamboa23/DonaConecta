"""DTOs explícitos de conversaciones, mensajes y notificaciones internas.

Ningún esquema de respuesta expone ``contenido_cifrado``, nonces, claves ni
datos personales del otro participante. El contenido viaja cifrado en SQL Server
y se descifra en el repositorio antes de construir estos DTO.
"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

# Base64 de (4 + 12 + N) bytes debe caber en NVARCHAR(4000); 2900 bytes UTF-8
# producen como máximo 3888 caracteres.
MAX_CONTENIDO_BYTES = 2900


class CrearConversacionRequest(BaseModel):
    id_necesidad: Optional[int] = Field(default=None, ge=1)
    id_compromiso: Optional[int] = Field(default=None, ge=1)
    mensaje: Optional[str] = Field(default=None, min_length=1, max_length=2000)

    @model_validator(mode="after")
    def un_solo_recurso(self):
        if (self.id_necesidad is None) == (self.id_compromiso is None):
            raise ValueError("Indica exactamente uno: id_necesidad o id_compromiso.")
        return self


class ConversacionCreada(BaseModel):
    id_conversacion: int
    conversacion_id: int
    estado: str
    titulo: str
    participantes: list[int]
    creada_en: str


class ConversacionResumen(BaseModel):
    id_conversacion: int
    conversacion_id: int
    id_necesidad: Optional[int] = None
    id_compromiso: Optional[int] = None
    titulo: str
    estado: str
    creada_en: str
    ultimo_mensaje: Optional[str] = None
    ultimo_mensaje_id: Optional[int] = None
    ultimo_mensaje_en: Optional[str] = None
    no_leidos: int = 0


class ConversacionesResponse(BaseModel):
    items: list[ConversacionResumen]
    total: int
    page: int
    page_size: int


class EnviarMensajeRequest(BaseModel):
    contenido: str = Field(min_length=1, max_length=2000)
    client_message_id: UUID

    @field_validator("contenido")
    @classmethod
    def contenido_utf8_limitado(cls, valor: str) -> str:
        if len(valor.encode("utf-8")) > MAX_CONTENIDO_BYTES:
            raise ValueError("El mensaje es demasiado largo para almacenarse cifrado.")
        return valor


class MensajeResponse(BaseModel):
    id_mensaje: int
    mensaje_id: int
    conversacion_id: int
    remitente_usuario_id: int
    contenido: str
    tipo: str
    client_message_id: str
    creado_en: str


class MensajesResponse(BaseModel):
    items: list[MensajeResponse]
    total: int
    page: int
    page_size: int


class MarcarLeidoRequest(BaseModel):
    mensaje_id: Optional[int] = Field(default=None, ge=1)


class LeidoResponse(BaseModel):
    conversacion_id: int
    ultimo_mensaje_leido_id: Optional[int] = None
    no_leidos: int


class NotificacionRecursos(BaseModel):
    mensaje_id: Optional[int] = None
    compromiso_id: Optional[int] = None
    entrega_id: Optional[int] = None
    recepcion_id: Optional[int] = None
    institucion_id: Optional[int] = None
    verificacion_id: Optional[int] = None


class NotificacionResponse(BaseModel):
    id_notificacion: int
    notificacion_id: int
    tipo: str
    titulo: str
    cuerpo: str
    creado_en: str
    leido_en: Optional[str] = None
    recursos: NotificacionRecursos


class NotificacionesResponse(BaseModel):
    items: list[NotificacionResponse]
    total: int
    no_leidas: int
    page: int
    page_size: int


class NotificacionLeidaResponse(BaseModel):
    notificacion_id: int
    leido_en: str
