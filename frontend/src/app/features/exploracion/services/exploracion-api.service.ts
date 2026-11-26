import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface NecesidadResumen {
  readonly necesidadId: number;
  readonly titulo: string;
  readonly estado: string;
}

export interface InstitucionResumen {
  readonly institucionId: number;
  readonly nombre: string;
  readonly estadoVerificacion: string;
}

export interface PuntoAcopioResumen {
  readonly puntoId: number;
  readonly nombre: string;
  readonly distritoId: number;
}

@Injectable({ providedIn: 'root' })
export class ExploracionApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  listarNecesidades(): Observable<PagedResult<NecesidadResumen>> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<PagedResult<NecesidadResumen>>('necesidades');
    }
    return this.injector.get(HttpClient).get<PagedResult<NecesidadResumen>>('/api/v1/necesidades');
  }

  listarInstituciones(): Observable<PagedResult<InstitucionResumen>> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<PagedResult<InstitucionResumen>>('instituciones');
    }
    return this.injector.get(HttpClient).get<PagedResult<InstitucionResumen>>('/api/v1/instituciones');
  }

  listarPuntos(): Observable<PagedResult<PuntoAcopioResumen>> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<PagedResult<PuntoAcopioResumen>>('puntosAcopio');
    }
    return this.injector.get(HttpClient).get<PagedResult<PuntoAcopioResumen>>('/api/v1/puntos-de-acopio');
  }
}
