import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ConversacionDTO,
  MensajeDTO,
  NotificacionDTO,
  RespuestaPaginada,
} from '../../../core/interfaces/integracion-final';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface CrearConversacionPayload {
  id_necesidad?: number;
  id_compromiso?: number;
  mensaje?: string;
}

export interface EnviarMensajePayload {
  readonly contenido: string;
  readonly client_message_id: string;
}

export type RespuestaConversaciones =
  | RespuestaPaginada<ConversacionDTO>
  | readonly ConversacionDTO[];
export type RespuestaMensajes = RespuestaPaginada<MensajeDTO> | readonly MensajeDTO[];
export type RespuestaNotificaciones =
  | RespuestaPaginada<NotificacionDTO>
  | readonly NotificacionDTO[];

@Injectable({ providedIn: 'root' })
export class MensajeriaApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  listarConversaciones(): Observable<RespuestaConversaciones> {
    if (!this.estado.disponible('conversaciones')) {
      return this.estado.pendiente<RespuestaConversaciones>('conversaciones');
    }
    return this.http.get<RespuestaConversaciones>('/api/v1/conversaciones');
  }

  crearConversacion(payload: CrearConversacionPayload): Observable<ConversacionDTO> {
    if (!this.estado.disponible('conversacionCrear')) {
      return this.estado.pendiente<ConversacionDTO>('conversacionCrear');
    }
    return this.http.post<ConversacionDTO>('/api/v1/conversaciones', payload);
  }

  listarMensajes(conversacionId: number, limit = 50, offset = 0): Observable<RespuestaMensajes> {
    if (!this.estado.disponible('mensajes')) {
      return this.estado.pendiente<RespuestaMensajes>('mensajes');
    }
    const parametros = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<RespuestaMensajes>(
      `/api/v1/conversaciones/${encodeURIComponent(String(conversacionId))}/mensajes`,
      { params: parametros },
    );
  }

  enviarMensaje(conversacionId: number, payload: EnviarMensajePayload): Observable<MensajeDTO> {
    if (!this.estado.disponible('mensajes')) {
      return this.estado.pendiente<MensajeDTO>('mensajes');
    }
    return this.http.post<MensajeDTO>(
      `/api/v1/conversaciones/${encodeURIComponent(String(conversacionId))}/mensajes`,
      payload,
    );
  }

  marcarLeido(conversacionId: number, mensajeId?: number): Observable<unknown> {
    if (!this.estado.disponible('conversacionLeido')) {
      return this.estado.pendiente<unknown>('conversacionLeido');
    }
    const cuerpo = mensajeId && mensajeId > 0 ? { mensaje_id: mensajeId } : {};
    return this.http.patch(
      `/api/v1/conversaciones/${encodeURIComponent(String(conversacionId))}/leido`,
      cuerpo,
    );
  }

  listarNotificaciones(): Observable<RespuestaNotificaciones> {
    if (!this.estado.disponible('notificaciones')) {
      return this.estado.pendiente<RespuestaNotificaciones>('notificaciones');
    }
    return this.http.get<RespuestaNotificaciones>('/api/v1/notificaciones');
  }

  marcarNotificacionLeido(id: number): Observable<unknown> {
    if (!this.estado.disponible('notificacionLeido')) {
      return this.estado.pendiente<unknown>('notificacionLeido');
    }
    return this.http.patch(
      `/api/v1/notificaciones/${encodeURIComponent(String(id))}/leido`,
      {},
    );
  }
}

/** Identificador único de cliente exigido por el backend para idempotencia. */
export function nuevoClientMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hexadecimal = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hexadecimal.slice(0, 8)}-${hexadecimal.slice(8, 12)}-${hexadecimal.slice(12, 16)}-${hexadecimal.slice(16, 20)}-${hexadecimal.slice(20)}`;
  }
  return `cliente-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}
