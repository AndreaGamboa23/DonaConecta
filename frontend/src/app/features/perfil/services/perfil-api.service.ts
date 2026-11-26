import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';
import { SesionService, UsuarioSesion } from '../../../core/services/sesion.service';

@Injectable({ providedIn: 'root' })
export class PerfilApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);
  private readonly sesion = inject(SesionService);

  obtenerPerfil(): Observable<UsuarioSesion> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<UsuarioSesion>('perfil');
    }
    const token = this.sesion.token();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.injector.get(HttpClient).get<UsuarioSesion>('/api/v1/usuarios/me', { headers });
  }
}
