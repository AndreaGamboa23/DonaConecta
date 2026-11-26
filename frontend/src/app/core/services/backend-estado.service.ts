import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { EstadoServicio } from '../interfaces/dona-conecta';

/** Error controlado: la interfaz existe, la operaciÃ³n todavÃ­a no estÃ¡ integrada. */
export class ServicioPendienteError extends Error {
  readonly codigo = 'SERVICIO_PENDIENTE';

  constructor(readonly operacion: string, readonly endpoint: string) {
    super(`La operaciÃ³n ${operacion} estarÃ¡ disponible al integrar ${endpoint}.`);
    this.name = 'ServicioPendienteError';
  }
}

const OPERACIONES = {
  registroDonante: '/api/v1/auth/registro',
  registroRepresentante: '/api/v1/auth/registro',
  login: '/api/v1/auth/login',
  recuperacion: '/api/v1/auth/recuperar-clave',
  conversaciones: '/api/v1/conversaciones',
  mensajes: '/api/v1/conversaciones/{id}/mensajes',
  donaciones: '/api/v1/donaciones/mias',
  compromisos: '/api/v1/compromisos',
  seguimiento: '/api/v1/seguimientos/{id}',
  necesidades: '/api/v1/necesidades',
  instituciones: '/api/v1/instituciones',
  puntosAcopio: '/api/v1/puntos-de-acopio',
  perfil: '/api/v1/usuarios/me',
} as const;

export type OperacionBackend = keyof typeof OPERACIONES;

/**
 * Ãšnico lugar que declara quÃ© operaciones estÃ¡n integradas. En Fase 07.A ninguna lo estÃ¡:
 * los servicios devuelven un error controlado y la interfaz lo comunica sin fingir Ã©xito.
 * `HttpClient` se resolverÃ¡ desde el injector solo cuando este flag sea `true`.
 */
@Injectable({ providedIn: 'root' })
export class BackendEstadoService {
  readonly integracionHabilitada = true;

  estado(operacion: OperacionBackend): EstadoServicio {
    const endpoint = OPERACIONES[operacion];
    return {
      disponible: this.integracionHabilitada,
      endpoint,
      mensaje: this.integracionHabilitada
        ? 'Servicio disponible.'
        : 'Esta funciÃ³n estarÃ¡ disponible cuando el servicio oficial estÃ© conectado.',
    };
  }

  pendiente<T>(operacion: OperacionBackend): Observable<T> {
    const estado = this.estado(operacion);
    return throwError(() => new ServicioPendienteError(operacion, estado.endpoint));
  }
}

