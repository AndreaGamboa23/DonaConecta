"""DTOs explícitos del directorio público y del detalle de necesidades.

Sólo se exponen campos públicos: nunca correos de representantes, hashes,
nonces, coordenadas privadas ni datos de sesión.
"""

from typing import Optional

from pydantic import BaseModel, Field


class NecesidadResumenPublica(BaseModel):
    id_necesidad: int
    necesidad_id: Optional[int] = None
    titulo: str
    descripcion: Optional[str] = None
    cantidad_requerida: float
    cantidad_comprometida: float
    cantidad_recibida: float
    cantidad_disponible: float
    avance_porcentaje: float
    lineas_totales: int
    lineas_cubiertas: int
    unidad_medida_base: str
    prioridad: str
    estado: str
    fecha_publicacion: Optional[str] = None
    fecha_limite: Optional[str] = None
    id_institucion: int
    institucion: str
    distrito: str
    id_categoria: Optional[int] = None
    categoria: str
    id_punto_acopio: Optional[int] = None
    punto_acopio: str = ""
    nombre_punto: str = ""
    direccion_acopio: str = ""


class LineaNecesidadPublica(BaseModel):
    producto_id: int
    producto: str
    categoria: str
    unidad_id: int
    unidad_codigo: str
    unidad: str
    simbolo: str
    cantidad_requerida: float
    cantidad_reservada_vigente: float
    cantidad_recibida: float
    cantidad_disponible: float


class NecesidadDetallePublica(NecesidadResumenPublica):
    referencias_entrega: str = ""
    lineas: list[LineaNecesidadPublica] = Field(default_factory=list)


class TipoInstitucionPublico(BaseModel):
    tipo_id: int
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    total_verificadas: int


class InstitucionResumenPublica(BaseModel):
    id_institucion: int
    nombre: str
    tipo: str
    tipo_codigo: str = ""
    descripcion: Optional[str] = None
    distrito: str
    direccion: Optional[str] = None
    estado_verificacion: str
    id_punto_acopio: Optional[int] = None
    necesidades_activas: int = 0
    # Compatibilidad con clientes que leen el DTO heredado.
    nombre_comercial: Optional[str] = None
    tipo_institucion: Optional[str] = None


class HorarioPublico(BaseModel):
    punto_id: int
    dia_semana: int
    hora_apertura: str
    hora_cierre: str


class PuntoAcopioPublico(BaseModel):
    punto_id: int
    nombre: str
    direccion: Optional[str] = None
    referencias_entrega: Optional[str] = None


class BienSolicitadoPublico(BaseModel):
    producto_id: int
    producto: str
    categoria: str
    unidad_id: int
    unidad_codigo: str
    simbolo: str


class InstitucionDetallePublica(InstitucionResumenPublica):
    slug: str
    telefono_publico: Optional[str] = None
    email_publico: Optional[str] = None
    fecha_verificacion: Optional[str] = None
    tiene_foto: bool = False
    puntos_acopio: list[PuntoAcopioPublico] = Field(default_factory=list)
    horarios: list[HorarioPublico] = Field(default_factory=list)
    necesidades: list[NecesidadResumenPublica] = Field(default_factory=list)
    bienes_solicitados: list[BienSolicitadoPublico] = Field(default_factory=list)
