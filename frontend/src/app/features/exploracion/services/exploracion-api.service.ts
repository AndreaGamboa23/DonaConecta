import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface NecesidadReal {
  readonly id_necesidad: number;
  readonly titulo: string;
  readonly descripcion: string;
  readonly cantidad_requerida: number;
  readonly cantidad_comprometida: number;
  readonly cantidad_recibida: number;
  readonly unidad_medida_base: string;
  readonly prioridad: string;
  readonly estado: string;
  readonly fecha_limite: string | null;
  readonly institucion: string;
  readonly distrito: string;
  readonly categoria: string;
  readonly punto_acopio?: string;
  readonly direccion_acopio?: string;
}

export interface InstitucionReal {
  readonly id_institucion: number;
  readonly nombre?: string;
  readonly nombre_comercial?: string;
  readonly tipo?: string;
  readonly tipo_institucion?: string;
  readonly descripcion: string | null;
  readonly distrito: string;
  readonly direccion: string | null;
  readonly estado_verificacion: string;
  readonly id_punto_acopio?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ExploracionApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  listarNecesidades(): Observable<readonly NecesidadReal[]> {
    if (!this.estado.disponible('necesidades')) {
      return this.estado.pendiente<readonly NecesidadReal[]>('necesidades');
    }
    return this.injector.get(HttpClient).get<readonly NecesidadReal[]>('/api/v1/necesidades');
  }

  listarInstituciones(): Observable<readonly InstitucionReal[]> {
    if (!this.estado.disponible('instituciones')) {
      return this.estado.pendiente<readonly InstitucionReal[]>('instituciones');
    }
    return this.injector.get(HttpClient).get<readonly InstitucionReal[]>('/api/v1/instituciones');
  }
}
