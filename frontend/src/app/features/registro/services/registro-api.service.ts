import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import {
  RegistroDonantePayload,
  RegistroRepresentantePayload,
} from '../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';
import { SesionService, UsuarioSesion } from '../../../core/services/sesion.service';
import { LoginResponse } from '../../autenticacion/services/autenticacion-api.service';

export interface RegistroCompletoResponse {
  readonly mensaje: string;
  readonly usuario: UsuarioSesion;
}

@Injectable({ providedIn: 'root' })
export class RegistroApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);
  private readonly sesion = inject(SesionService);

  registrarDonante(payload: RegistroDonantePayload): Observable<RegistroCompletoResponse> {
    if (!this.estado.disponible('registroDonante')) {
      return this.estado.pendiente<RegistroCompletoResponse>('registroDonante');
    }

    const http = this.injector.get(HttpClient);
    return http
      .post('/api/v1/auth/registro', {
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        email: payload.email,
        telefono: payload.telefono ?? null,
        password: payload.password,
        rol: 'DONANTE',
        distritoId: payload.distritoId,
        preferenciaNotificacion: payload.preferenciaNotificacion,
        consentimientoDatos: payload.consentimientoDatos,
        aceptaTerminos: payload.aceptaTerminos,
      })
      .pipe(
        switchMap(() =>
          http.post<LoginResponse>('/api/v1/auth/login', {
            correo: payload.email,
            password: payload.password,
          }),
        ),
        map((respuesta) => {
          this.sesion.iniciar(respuesta.access_token, respuesta.usuario);
          return {
            mensaje: 'Cuenta de donante creada correctamente.',
            usuario: respuesta.usuario,
          };
        }),
      );
  }

  registrarRepresentante(
    payload: RegistroRepresentantePayload,
  ): Observable<RegistroCompletoResponse> {
    if (!this.estado.disponible('registroRepresentante')) {
      return this.estado.pendiente<RegistroCompletoResponse>('registroRepresentante');
    }

    const http = this.injector.get(HttpClient);
    // El backend crea cuenta, vínculo, institución y rol en una sola transacción.
    // Así no quedan cuentas huérfanas si falla una petición intermedia.
    return http
      .post('/api/v1/auth/registro', {
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        email: payload.email,
        telefono: payload.telefono ?? null,
        password: payload.password,
        rol: 'REPRESENTANTE',
        institucion: {
          nombre: payload.institucion.nombre,
          tipoId: payload.institucion.tipoId,
          distritoId: payload.institucion.distritoId,
          direccion: payload.institucion.direccion ?? null,
          descripcion: payload.institucion.descripcion ?? null,
          cargoRepresentante: payload.institucion.cargoRepresentante ?? null,
        },
      })
      .pipe(
        switchMap(() =>
          http.post<LoginResponse>('/api/v1/auth/login', {
            correo: payload.email,
            password: payload.password,
          }),
        ),
        map((respuesta) => {
          this.sesion.iniciar(respuesta.access_token, respuesta.usuario);
          return {
            mensaje: 'Solicitud registrada. La institución queda pendiente de verificación.',
            usuario: respuesta.usuario,
          };
        }),
      );
  }
}
