import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface PerfilDTO {
  readonly usuarioId: number;
  readonly nombres: string;
  readonly apellidos: string;
  readonly email: string;
  readonly roles: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class PerfilApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  obtenerPerfil(): Observable<PerfilDTO> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<PerfilDTO>('perfil');
    }
    return this.injector.get(HttpClient).get<PerfilDTO>('/api/v1/usuarios/me');
  }
}
