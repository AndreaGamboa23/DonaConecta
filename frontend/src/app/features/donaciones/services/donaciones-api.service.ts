import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface DonacionResumen {
  readonly compromisoId: number;
  readonly necesidadId: number;
  readonly estado: string;
}

@Injectable({ providedIn: 'root' })
export class DonacionesApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  listarDonaciones(): Observable<readonly DonacionResumen[]> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<readonly DonacionResumen[]>('donaciones');
    }
    return this.injector.get(HttpClient).get<readonly DonacionResumen[]>('/api/v1/donaciones/mias');
  }
}
