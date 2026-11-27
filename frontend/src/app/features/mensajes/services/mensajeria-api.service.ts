import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

export interface ConversacionResumen {
  readonly conversacionId: number;
  readonly titulo: string;
  readonly estado: string;
}

export interface MensajeDTO {
  readonly mensajeId: number;
  readonly contenido: string;
  readonly tipo: string;
  readonly creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class MensajeriaApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  listarConversaciones(): Observable<PagedResult<ConversacionResumen>> {
    if (!this.estado.disponible('conversaciones')) {
      return this.estado.pendiente<PagedResult<ConversacionResumen>>('conversaciones');
    }
    return this.injector.get(HttpClient).get<PagedResult<ConversacionResumen>>('/api/v1/conversaciones');
  }

  listarMensajes(conversacionId: number): Observable<PagedResult<MensajeDTO>> {
    if (!this.estado.disponible('mensajes')) {
      return this.estado.pendiente<PagedResult<MensajeDTO>>('mensajes');
    }
    return this.injector.get(HttpClient).get<PagedResult<MensajeDTO>>(
      `/api/v1/conversaciones/${conversacionId}/mensajes`,
    );
  }
}
