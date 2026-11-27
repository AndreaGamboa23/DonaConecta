import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';
import { UsuarioSesion } from '../../../core/services/sesion.service';

export type PreferenciaNotificacion = 'TODAS' | 'IMPORTANTES' | 'NINGUNA';

export interface DonantePerfil {
  readonly distrito_id: number;
  readonly distrito: string;
  readonly preferencia_notificacion: PreferenciaNotificacion;
  readonly consentimiento_datos: boolean;
  readonly acepta_terminos: boolean;
  readonly fecha_registro: string;
}

export interface InstitucionPerfil {
  readonly institucion_id: number;
  readonly nombre: string;
  readonly tipo: string | null;
  readonly estado_verificacion: string;
  readonly cargo: string | null;
  readonly vinculo_estado: string;
  readonly fecha_inicio: string | null;
}

/** Contrato real de GET/PUT/PATCH /api/v1/usuarios/me. */
export interface PerfilCompleto extends UsuarioSesion {
  readonly estado_cuenta: string;
  readonly fecha_registro: string;
  readonly email_verificado_en: string | null;
  readonly ultimo_acceso_en: string | null;
  readonly foto_url: string | null;
  readonly telefono_enmascarado: string | null;
  readonly telefono_guardado: boolean;
  readonly donante: DonantePerfil | null;
  readonly institucion: InstitucionPerfil | null;
}

export interface ActividadPersonal {
  readonly compromisos: number;
  readonly entregas: number;
  readonly recepciones: number;
  readonly conversaciones: number;
  readonly historial: number;
}

export interface DatosEditablesPerfil {
  readonly nombres: string;
  readonly apellidos: string;
  readonly telefono: string | null;
  readonly distritoId?: number;
  readonly preferenciaNotificacion?: PreferenciaNotificacion;
}

export type ParchePerfil = Partial<DatosEditablesPerfil>;

@Injectable({ providedIn: 'root' })
export class PerfilApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  obtenerPerfil(): Observable<PerfilCompleto> {
    if (!this.estado.disponible('perfil')) {
      return this.estado.pendiente<PerfilCompleto>('perfil');
    }
    return this.http.get<PerfilCompleto>('/api/v1/usuarios/me');
  }

  obtenerActividad(): Observable<ActividadPersonal> {
    if (!this.estado.disponible('perfilActividad')) {
      return this.estado.pendiente<ActividadPersonal>('perfilActividad');
    }
    return this.http.get<ActividadPersonal>('/api/v1/usuarios/me/actividad');
  }

  reemplazarPerfil(datos: DatosEditablesPerfil): Observable<PerfilCompleto> {
    if (!this.estado.disponible('perfilActualizar')) {
      return this.estado.pendiente<PerfilCompleto>('perfilActualizar');
    }
    return this.http.put<PerfilCompleto>('/api/v1/usuarios/me', datos);
  }

  parchearPerfil(datos: ParchePerfil): Observable<PerfilCompleto> {
    if (!this.estado.disponible('perfilActualizar')) {
      return this.estado.pendiente<PerfilCompleto>('perfilActualizar');
    }
    return this.http.patch<PerfilCompleto>('/api/v1/usuarios/me', datos);
  }

  cambiarContrasena(
    passwordActual: string,
    passwordNueva: string,
    confirmacion: string,
  ): Observable<void> {
    if (!this.estado.disponible('perfilCambiarContrasena')) {
      return this.estado.pendiente<void>('perfilCambiarContrasena');
    }
    return this.http.patch<void>('/api/v1/usuarios/me/contrasena', {
      passwordActual,
      passwordNueva,
      confirmacion,
    });
  }

  cambiarCorreo(nuevoCorreo: string, password: string): Observable<void> {
    if (!this.estado.disponible('perfilCambiarCorreo')) {
      return this.estado.pendiente<void>('perfilCambiarCorreo');
    }
    return this.http.patch<void>('/api/v1/usuarios/me/correo', {
      nuevoCorreo: nuevoCorreo.trim().toLowerCase(),
      confirmacionCorreo: nuevoCorreo.trim().toLowerCase(),
      password,
    });
  }

  bajaCuenta(password: string): Observable<void> {
    if (!this.estado.disponible('perfilBaja')) {
      return this.estado.pendiente<void>('perfilBaja');
    }
    return this.http.request<void>('DELETE', '/api/v1/usuarios/me', {
      body: { password, confirmacion: 'BAJA' },
    });
  }
}
