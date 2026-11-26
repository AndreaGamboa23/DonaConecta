import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';
import {
  RegistroDonantePayload,
  RegistroRepresentantePayload,
} from '../../../core/interfaces/dona-conecta';

export interface RegistroResponse {
  readonly usuarioId: number;
  readonly estadoCuenta: string;
  readonly roles: readonly { readonly codigo: string; readonly estado: string }[];
  readonly institucionSolicitudId?: number | null;
  readonly mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class RegistroApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  registrarDonante(payload: RegistroDonantePayload): Observable<RegistroResponse> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<RegistroResponse>('registroDonante');
    }
    return this.injector.get(HttpClient).post<RegistroResponse>('/api/v1/autenticacion/registro', payload);
  }

  registrarRepresentante(payload: RegistroRepresentantePayload): Observable<RegistroResponse> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<RegistroResponse>('registroRepresentante');
    }
    return this.injector.get(HttpClient).post<RegistroResponse>('/api/v1/autenticacion/registro', payload);
  }
}
