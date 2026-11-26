import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LoginPayload,
  RecuperacionPayload,
} from '../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface LoginResponse {
  readonly usuarioId: number;
  readonly roles: readonly string[];
  readonly expiresIn: number;
}

export interface RecuperacionResponse {
  readonly mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AutenticacionApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  login(payload: LoginPayload): Observable<LoginResponse> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<LoginResponse>('login');
    }
    return this.injector.get(HttpClient).post<LoginResponse>('/api/v1/autenticacion/login', payload);
  }

  recuperarClave(payload: RecuperacionPayload): Observable<RecuperacionResponse> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<RecuperacionResponse>('recuperacion');
    }
    return this.injector.get(HttpClient).post<RecuperacionResponse>(
      '/api/v1/autenticacion/recuperar-clave',
      payload,
    );
  }
}
