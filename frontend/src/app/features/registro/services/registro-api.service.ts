import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { DISTRITOS_HUANCAYO, TIPOS_INSTITUCION } from '../../../core/data/catalogos-locales';
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
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<RegistroCompletoResponse>('registroDonante');
    }

    const http = this.injector.get(HttpClient);
    return http
      .post('/api/v1/auth/registro', {
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        correo: payload.email,
        telefono: payload.telefono ?? null,
        password: payload.password,
        rol: 'DONANTE',
      })
      .pipe(
        switchMap(() =>
          http.post<LoginResponse>('/api/v1/auth/login', {
            correo: payload.email,
            password: payload.password,
          }),
        ),
        map((loginRes) => {
          this.sesion.iniciar(loginRes.access_token, loginRes.usuario);
          return {
            mensaje: 'Cuenta de donante creada correctamente.',
            usuario: loginRes.usuario,
          };
        }),
      );
  }

  registrarRepresentante(
    payload: RegistroRepresentantePayload,
  ): Observable<RegistroCompletoResponse> {
    if (!this.estado.integracionHabilitada) {
      return this.estado.pendiente<RegistroCompletoResponse>('registroRepresentante');
    }

    const http = this.injector.get(HttpClient);
    const tipo =
      TIPOS_INSTITUCION.find((t) => t.id === payload.institucion.tipoId)?.codigo ??
      'ORGANIZACION_SOCIAL';
    const distrito =
      DISTRITOS_HUANCAYO.find((d) => d.id === payload.institucion.distritoId)?.nombre ?? 'Huancayo';
    const rucGenerado = `20${String(Date.now()).slice(-9)}`;

    return http
      .post('/api/v1/auth/registro', {
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        correo: payload.email,
        telefono: payload.telefono ?? null,
        password: payload.password,
        rol: 'REPRESENTANTE',
      })
      .pipe(
        switchMap(() =>
          http.post<LoginResponse>('/api/v1/auth/login', {
            correo: payload.email,
            password: payload.password,
          }),
        ),
        switchMap((loginRes) => {
          this.sesion.iniciar(loginRes.access_token, loginRes.usuario);
          const headers = new HttpHeaders({
            Authorization: `Bearer ${loginRes.access_token}`,
          });
          return http
            .post(
              '/api/v1/instituciones',
              {
                ruc: rucGenerado,
                razon_social: payload.institucion.nombre,
                nombre_comercial: payload.institucion.nombre,
                tipo_institucion: tipo,
                distrito,
                direccion: payload.institucion.direccion || 'Huancayo, Junín',
                descripcion: payload.institucion.descripcion ?? null,
              },
              { headers },
            )
            .pipe(
              map(() => ({
                mensaje: 'Institución registrada correctamente (en revisión).',
                usuario: loginRes.usuario,
              })),
            );
        }),
      );
  }
}
