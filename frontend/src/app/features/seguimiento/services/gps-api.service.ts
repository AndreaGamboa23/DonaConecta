import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  SesionGpsDTO,
  UltimaUbicacionDTO,
  idSesionGps,
} from '../../../core/interfaces/integracion-final';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface IniciarSesionGpsPayload {
  readonly consentimiento_dado: true;
  readonly duracion_minutos: number;
}

export interface UbicacionGpsPayload {
  readonly latitud: number;
  readonly longitud: number;
  readonly precision_metros?: number;
}

@Injectable({ providedIn: 'root' })
export class GpsApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  iniciarSesion(entregaId: number, payload: IniciarSesionGpsPayload): Observable<SesionGpsDTO> {
    if (!this.estado.disponible('gpsSesion')) {
      return this.estado.pendiente<SesionGpsDTO>('gpsSesion');
    }
    return this.http.post<SesionGpsDTO>(
      `/api/v1/entregas/${encodeURIComponent(String(entregaId))}/gps/sesiones`,
      payload,
    );
  }

  enviarUbicacion(sesionId: number, payload: UbicacionGpsPayload): Observable<unknown> {
    if (!this.estado.disponible('gpsUbicacion')) {
      return this.estado.pendiente<unknown>('gpsUbicacion');
    }
    return this.http.post(
      `/api/v1/gps/sesiones/${encodeURIComponent(String(sesionId))}/ubicacion`,
      payload,
    );
  }

  ultimaUbicacion(entregaId: number): Observable<UltimaUbicacionDTO> {
    if (!this.estado.disponible('gpsUltima')) {
      return this.estado.pendiente<UltimaUbicacionDTO>('gpsUltima');
    }
    return this.http.get<UltimaUbicacionDTO>(
      `/api/v1/entregas/${encodeURIComponent(String(entregaId))}/gps/ultima`,
    );
  }

  detenerSesion(sesionId: number): Observable<unknown> {
    if (!this.estado.disponible('gpsDetener')) {
      return this.estado.pendiente<unknown>('gpsDetener');
    }
    return this.http.post(
      `/api/v1/gps/sesiones/${encodeURIComponent(String(sesionId))}/detener`,
      {},
    );
  }

  idSesion(sesion: SesionGpsDTO): number {
    return idSesionGps(sesion);
  }
}
