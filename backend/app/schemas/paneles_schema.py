"""DTO explícitos de los paneles de Fase 09.

Sólo se exponen aquí los campos públicos autorizados. En particular, ningún DTO
de usuarios incluye ``password_hash``, hashes de token, teléfonos cifrados ni
nonces.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator


class ProductoUnidadResponse(BaseModel):
    unidad_id: int
    id_unidad: int
    codigo: str
    nombre: str
    simbolo: str
    es_preferida: bool


class ProductoResponse(BaseModel):
    producto_id: int
    id_producto: int
    nombre: str
    descripcion: Optional[str] = None
    activo: bool
    categoria_id: int
    id_categoria: int
    categoria: str
    unidades: list[ProductoUnidadResponse]


class AdminResumenResponse(BaseModel):
    instituciones_pendientes: int
    usuarios_activos: int
    incidencias_abiertas: int
    instituciones_verificadas: int
    necesidades_publicadas: int
    compromisos_activos: int
    productos_activos: int
    ultima_verificacion: Optional[str] = Field(
        default=None, description="Fecha ISO 8601 UTC de la última verificación, o null."
    )


class AdminInstitucionResponse(BaseModel):
    id_institucion: int
    nombre: str
    tipo: str
    distrito: str
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    estado_verificacion: str
    representante: Optional[str] = None
    correo_representante: Optional[str] = None
    fecha_registro: Optional[str] = None


class InstitucionVerificadaResponse(BaseModel):
    id_institucion: int
    nombre: str
    estado_verificacion: str


class VerificarInstitucionResponse(BaseModel):
    mensaje: str
    institucion: InstitucionVerificadaResponse


class CambiarEstadoUsuarioRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    estado: Literal["ACTIVO", "BLOQUEADO", "BAJA"]
    motivo: Optional[str] = Field(default=None, max_length=500)


class AdminUsuarioResponse(BaseModel):
    id_usuario: int
    nombres: str
    apellidos: str
    correo: str
    estado_cuenta: str
    roles: list[str]
    fecha_registro: Optional[str] = None
    ultimo_acceso_en: Optional[str] = None


class CambiarEstadoUsuarioResponse(BaseModel):
    mensaje: str
    usuario: AdminUsuarioResponse


class AdminUsuariosResponse(BaseModel):
    items: list[AdminUsuarioResponse]
    total: int
    limit: int
    offset: int


class AdminAuditoriaResponseItem(BaseModel):
    evento_id: int
    usuario_id: Optional[int] = None
    tipo_evento: str
    modulo: str
    recurso_tipo: str
    recurso_id: Optional[str] = None
    origen: str
    resultado: str
    descripcion: str
    creado_en: Optional[str] = None


class AdminAuditoriaResponse(BaseModel):
    items: list[AdminAuditoriaResponseItem]
    total: int
    limit: int
    offset: int


class InstitucionalResumenResponse(BaseModel):
    institucion_id: int
    nombre: str
    estado_verificacion: str
    necesidades_publicadas: int
    compromisos_recibidos: int
    recepciones_confirmadas: int


class InstitucionalPerfilResponse(BaseModel):
    id_institucion: int
    nombre: str
    tipo: str
    distrito: str
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    telefono_publico: Optional[str] = None
    email_publico: Optional[str] = None
    estado_verificacion: str
    fecha_registro: Optional[str] = None


class NecesidadLineaResponse(BaseModel):
    producto_id: int
    producto: str
    unidad_id: int
    unidad: str
    cantidad_requerida: float


class NecesidadInstitucionalResponse(BaseModel):
    id_necesidad: int
    titulo: str
    descripcion: str
    prioridad: str
    estado: str
    fila_version: Optional[str] = None
    fecha_publicacion: Optional[str] = None
    fecha_limite: Optional[str] = None
    cantidad_requerida: float
    cantidad_comprometida: float
    cantidad_recibida: float
    unidad_medida_base: str
    lineas: list[NecesidadLineaResponse]


class NecesidadMutacionResponse(BaseModel):
    mensaje: str
    necesidad: NecesidadInstitucionalResponse


class LineaNecesidadInstitucionalRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    producto_id: int = Field(
        ..., gt=0, validation_alias=AliasChoices("producto_id", "productoId", "id_producto")
    )
    unidad_id: int = Field(
        ..., gt=0, validation_alias=AliasChoices("unidad_id", "unidadId", "id_unidad")
    )
    cantidad: float = Field(..., gt=0)


class CrearNecesidadInstitucionalRequest(BaseModel):
    """Igual a ``CrearNecesidadRequest`` pero sin ``id_institucion``.

    El identificador se deriva del representante autorizado; rechazar el campo
    evita que el cliente suplante la institución.
    """

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    titulo: str = Field(..., min_length=4, max_length=200)
    descripcion: str = Field(..., min_length=5, max_length=600)
    prioridad: Literal["ALTA", "MEDIA", "BAJA"] = "MEDIA"
    fecha_limite: Optional[datetime] = Field(
        default=None, validation_alias=AliasChoices("fecha_limite", "fechaLimite")
    )
    id_categoria: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_categoria", "categoriaId")
    )
    id_punto_acopio: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_punto_acopio", "puntoAcopioId")
    )
    lineas: Optional[list[LineaNecesidadInstitucionalRequest]] = None
    id_producto: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_producto", "productoId")
    )
    id_unidad: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_unidad", "unidadId")
    )
    cantidad_requerida: Optional[float] = Field(
        default=None, gt=0, validation_alias=AliasChoices("cantidad_requerida", "cantidadRequerida")
    )


class ActualizarPerfilInstitucionalRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    direccion: Optional[str] = Field(default=None, max_length=300)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    telefono_publico: Optional[str] = Field(
        default=None,
        max_length=30,
        validation_alias=AliasChoices("telefono_publico", "telefonoPublico"),
    )
    email_publico: Optional[str] = Field(
        default=None,
        max_length=256,
        validation_alias=AliasChoices("email_publico", "emailPublico"),
    )


class ActualizarNecesidadRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    titulo: Optional[str] = Field(default=None, min_length=4, max_length=200)
    descripcion: Optional[str] = Field(default=None, min_length=5, max_length=600)
    prioridad: Optional[Literal["ALTA", "MEDIA", "BAJA"]] = None
    fecha_limite: Optional[datetime] = Field(
        default=None, validation_alias=AliasChoices("fecha_limite", "fechaLimite")
    )
    id_punto_acopio: Optional[int] = Field(
        default=None, gt=0, validation_alias=AliasChoices("id_punto_acopio", "puntoAcopioId")
    )
    estado: Optional[Literal[
        "BORRADOR", "PUBLICADA", "PAUSADA", "COMPLETADA", "VENCIDA", "CANCELADA"
    ]] = None
    lineas: Optional[list[LineaNecesidadInstitucionalRequest]] = None
    motivo: Optional[str] = Field(default=None, max_length=500)
    fila_version: Optional[str] = Field(
        default=None,
        max_length=32,
        validation_alias=AliasChoices("fila_version", "filaVersion"),
    )

    @model_validator(mode="after")
    def motivo_solo_para_cancelacion(self) -> "ActualizarNecesidadRequest":
        if self.motivo is not None and not self.motivo.strip():
            raise ValueError("El motivo no puede estar vacío.")
        return self
