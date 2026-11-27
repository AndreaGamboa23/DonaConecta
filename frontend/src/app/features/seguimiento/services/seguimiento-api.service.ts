import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface SeguimientoResumen {
  readonly sesionId: number;
  readonly entregaId: number;
  readonly estado: string;
  readonly expiraEn: string;
}

@Injectable({ providedIn: 'root' })
export class SeguimientoApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  consultarSesion(sesionId: number): Observable<SeguimientoResumen> {
    if (!this.estado.disponible('seguimiento')) {
      return this.estado.pendiente<SeguimientoResumen>('seguimiento');
    }
    return this.injector.get(HttpClient).get<SeguimientoResumen>(`/api/v1/seguimientos/${sesionId}`);
  }
}
