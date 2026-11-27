import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface DonacionResumen {
  readonly id_compromiso: number;
  readonly id_necesidad?: number;
  readonly necesidad: string;
  readonly institucion: string;
  readonly cantidad_comprometida: number;
  readonly unidad_medida_base: string;
  readonly comentario: string | null;
  readonly estado: string;
  readonly punto_acopio: string;
  readonly direccion_acopio: string;
  readonly creado_en: string;
}

export interface LineaCompromisoPayload {
  readonly producto_id: number;
  readonly unidad_id: number;
  readonly cantidad: number;
}

export interface CrearCompromisoPayload {
  readonly id_necesidad: number;
  /** Una línea por bien solicitado; el backend valida disponibilidad por línea. */
  readonly lineas?: readonly LineaCompromisoPayload[];
  /** Atajo heredado para necesidades de una sola línea. */
  readonly cantidad_comprometida?: number;
  readonly comentario?: string;
}

@Injectable({ providedIn: 'root' })
export class DonacionesApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  listarDonaciones(): Observable<readonly DonacionResumen[]> {
    if (!this.estado.disponible('donaciones')) {
      return this.estado.pendiente<readonly DonacionResumen[]>('donaciones');
    }
    return this.injector
      .get(HttpClient)
      .get<readonly DonacionResumen[]>('/api/v1/compromisos/mis-compromisos');
  }

  crearCompromiso(payload: CrearCompromisoPayload): Observable<unknown> {
    if (!this.estado.disponible('compromisos')) {
      return this.estado.pendiente<unknown>('compromisos');
    }
    return this.injector.get(HttpClient).post('/api/v1/compromisos', payload);
  }
}
