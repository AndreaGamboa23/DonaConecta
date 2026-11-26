/** Contratos de vista de DonaConecta, derivados de docs/contrato-api.md. */

export interface DistritoOpcion {
  readonly id: number;
  readonly nombre: string;
}

export interface TipoInstitucionOpcion {
  readonly id: number;
  readonly codigo: string;
  readonly nombre: string;
}

export interface CategoriaInformativa {
  /** ID del catálogo sembrado, según el orden de `categorias_bienes`. */
  readonly id: number;
  readonly codigo: string;
  /** Segmento estable de la URL: /explorar/:categoria. */
  readonly slug: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly ejemplos: string;
  readonly icono: string;
  readonly tono: 'blue' | 'cream' | 'green' | 'amber' | 'navy';
  /** Recurso ilustrativo local, usado solo por la interfaz; no es dato de negocio. */
  readonly imagen: string;
  readonly altImagen: string;
  readonly beneficio: string;
  readonly condiciones: readonly string[];
  readonly noRecomendados: readonly string[];
  readonly tiposInstitucion: readonly string[];
}

/** Contenido orientativo local. No representa solicitudes, stock ni precios. */
export interface ProductoInformativo {
  readonly slug: string;
  readonly nombre: string;
  readonly categoriaSlug: string;
  readonly descripcion: string;
  readonly utilidad: string;
  readonly condiciones: readonly string[];
  readonly preparacion: readonly string[];
  readonly instituciones: readonly string[];
  readonly sinonimos: readonly string[];
}

export type TipoCoincidencia =
  | 'exacta'
  | 'parcial'
  | 'sinonimo'
  | 'aproximada'
  | 'relacionada';

export interface ResultadoCatalogo {
  readonly tipo: 'producto' | 'categoria';
  readonly id: string;
  readonly categoriaSlug: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly puntuacion: number;
  readonly coincidencia: TipoCoincidencia;
}

export interface RespuestaBusqueda {
  readonly normalizado: string;
  readonly resultados: readonly ResultadoCatalogo[];
  readonly relacionados: readonly ResultadoCatalogo[];
  readonly sugerencias: readonly string[];
}

export interface RegistroDonantePayload {
  readonly tipo: 'DONANTE';
  readonly email: string;
  readonly password: string;
  readonly nombres: string;
  readonly apellidos: string;
  readonly telefono?: string;
  readonly distritoId: number;
  readonly preferenciaNotificacion: 'TODAS' | 'IMPORTANTES' | 'NINGUNA';
  readonly consentimientoDatos: boolean;
  readonly aceptaTerminos: boolean;
}

export interface RegistroRepresentantePayload {
  readonly tipo: 'REPRESENTANTE';
  readonly email: string;
  readonly password: string;
  readonly nombres: string;
  readonly apellidos: string;
  readonly telefono?: string;
  readonly institucion: {
    readonly nombre: string;
    readonly tipoId: number;
    readonly distritoId: number;
    readonly direccion?: string;
    readonly descripcion?: string;
    readonly cargoRepresentante?: string;
  };
}

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
}

export interface RecuperacionPayload {
  readonly email: string;
}

export interface ApiError {
  readonly error: {
    readonly codigo: string;
    readonly mensaje: string;
    readonly detalles?: readonly unknown[];
  };
  readonly traceId?: string;
}

export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface EstadoServicio {
  readonly disponible: boolean;
  readonly endpoint: string;
  readonly mensaje: string;
}
