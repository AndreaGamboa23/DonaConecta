import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CompromisoDetalle,
  PuntoAcopioDTO,
  PuntoAcopioPayload,
  RespuestaPaginada,
  itemsDe,
} from '../../../core/interfaces/integracion-final';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface CrearEntregaPayload {
  readonly id_compromiso: number;
  readonly id_punto_acopio: number;
  readonly fecha_programada: string;
  readonly observaciones?: string;
}

export interface CambiarEstadoEntregaPayload {
  readonly estado: 'EN_CAMINO' | 'ENTREGADA' | 'INCIDENCIA' | 'CANCELADA';
  readonly observaciones?: string;
}

export interface LineaRecepcionPayload {
  readonly producto_id: number;
  readonly unidad_id: number;
  readonly cantidad_recibida: number;
}

export interface RegistrarRecepcionPayload {
  readonly estado: 'PARCIAL' | 'CONFIRMADA' | 'OBSERVADA';
  readonly observaciones?: string;
  readonly lineas: readonly LineaRecepcionPayload[];
}

export type RespuestaCompromisosInstitucion =
  | RespuestaPaginada<CompromisoDetalle>
  | readonly CompromisoDetalle[];
export type RespuestaPuntos = RespuestaPaginada<PuntoAcopioDTO> | readonly PuntoAcopioDTO[];

@Injectable({ providedIn: 'root' })
export class PanelOperacionesApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  listarCompromisos(): Observable<RespuestaCompromisosInstitucion> {
    if (!this.estado.disponible('compromisosInstitucion')) {
      return this.estado.pendiente<RespuestaCompromisosInstitucion>('compromisosInstitucion');
    }
    return this.http.get<RespuestaCompromisosInstitucion>('/api/v1/compromisos/institucion');
  }

  crearEntrega(payload: CrearEntregaPayload): Observable<unknown> {
    if (!this.estado.disponible('entregas')) {
      return this.estado.pendiente<unknown>('entregas');
    }
    return this.http.post('/api/v1/entregas', payload);
  }

  cambiarEstadoEntrega(id: number, payload: CambiarEstadoEntregaPayload): Observable<unknown> {
    if (!this.estado.disponible('entregaEstado')) {
      return this.estado.pendiente<unknown>('entregaEstado');
    }
    return this.http.patch(
      `/api/v1/entregas/${encodeURIComponent(String(id))}`,
      payload,
    );
  }

  registrarRecepcion(id: number, payload: RegistrarRecepcionPayload): Observable<unknown> {
    if (!this.estado.disponible('recepciones')) {
      return this.estado.pendiente<unknown>('recepciones');
    }
    return this.http.post(
      `/api/v1/entregas/${encodeURIComponent(String(id))}/recepciones`,
      payload,
    );
  }

  listarPuntos(filtros: {
    readonly institucionId?: number;
    readonly publico?: boolean;
  } = {}): Observable<RespuestaPuntos> {
    if (!this.estado.disponible('puntosAcopio')) {
      return this.estado.pendiente<RespuestaPuntos>('puntosAcopio');
    }
    let parametros = new HttpParams();
    if (filtros.institucionId) {
      parametros = parametros.set('institucionId', filtros.institucionId);
    }
    /* La vista propia debe incluir puntos privados o sin publicación autorizada.
       El listado público sigue siendo `publico=true` cuando no se pide una
       institución o cuando el llamador lo indica expresamente. */
    const publico = filtros.publico ?? filtros.institucionId === undefined;
    parametros = parametros.set('publico', publico);
    return this.http.get<RespuestaPuntos>('/api/v1/puntos-de-acopio', { params: parametros });
  }

  crearPunto(payload: PuntoAcopioPayload): Observable<PuntoAcopioDTO> {
    if (!this.estado.disponible('puntosAcopio')) {
      return this.estado.pendiente<PuntoAcopioDTO>('puntosAcopio');
    }
    return this.http.post<PuntoAcopioDTO>('/api/v1/puntos-de-acopio', payload);
  }

  reemplazarPunto(id: number, payload: PuntoAcopioPayload): Observable<PuntoAcopioDTO> {
    if (!this.estado.disponible('puntosAcopioDetalle')) {
      return this.estado.pendiente<PuntoAcopioDTO>('puntosAcopioDetalle');
    }
    return this.http.put<PuntoAcopioDTO>(
      `/api/v1/puntos-de-acopio/${encodeURIComponent(String(id))}`,
      payload,
    );
  }

  cambiarEstadoPunto(id: number, estado: 'ACTIVO' | 'INACTIVO'): Observable<PuntoAcopioDTO> {
    if (!this.estado.disponible('puntosAcopioEstado')) {
      return this.estado.pendiente<PuntoAcopioDTO>('puntosAcopioEstado');
    }
    return this.http.patch<PuntoAcopioDTO>(
      `/api/v1/puntos-de-acopio/${encodeURIComponent(String(id))}/estado`,
      { estado },
    );
  }

  eliminarPunto(id: number): Observable<unknown> {
    if (!this.estado.disponible('puntosAcopioDetalle')) {
      return this.estado.pendiente<unknown>('puntosAcopioDetalle');
    }
    return this.http.delete(`/api/v1/puntos-de-acopio/${encodeURIComponent(String(id))}`);
  }
}

export function compromisosDe(respuesta: RespuestaCompromisosInstitucion | null): readonly CompromisoDetalle[] {
  return itemsDe(respuesta);
}

export function puntosDe(respuesta: RespuestaPuntos | null): readonly PuntoAcopioDTO[] {
  return itemsDe(respuesta);
}
