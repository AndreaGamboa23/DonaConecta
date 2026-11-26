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
  readonly codigo: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly ejemplos: string;
  readonly icono: string;
  readonly tono: 'blue' | 'cream' | 'green' | 'amber' | 'navy';
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
