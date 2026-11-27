import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginPayload, RecuperacionPayload } from '../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface LoginResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly usuario: {
    readonly id_usuario: number;
    readonly nombres: string;
    readonly apellidos: string;
    readonly correo: string;
    readonly roles: string[];
  };
}

export interface RecuperacionResponse {
  readonly mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AutenticacionApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  login(payload: LoginPayload): Observable<LoginResponse> {
    if (!this.estado.disponible('login')) {
      return this.estado.pendiente<LoginResponse>('login');
    }
    return this.injector.get(HttpClient).post<LoginResponse>('/api/v1/auth/login', {
      correo: payload.email,
      password: payload.password,
    });
  }

  recuperarClave(_payload: RecuperacionPayload): Observable<RecuperacionResponse> {
    return this.estado.pendiente<RecuperacionResponse>('recuperacion');
  }
}
