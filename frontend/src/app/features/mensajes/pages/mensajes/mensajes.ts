import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';
import { BandejaConversaciones } from '../../components/bandeja-conversaciones/bandeja-conversaciones';
import { PanelConversacion } from '../../components/panel-conversacion/panel-conversacion';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [
    RouterLink,
    PageHero,
    PendingNotice,
    BandejaConversaciones,
    PanelConversacion,
  ],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
})
export class Mensajes {
  readonly estado = inject(BackendEstadoService).estado('mensajes');

  /** Ninguna conversación se crea ni se simula; el identificador llega desde la API. */
  readonly conversacionId = signal<number | null>(null);

  abrirConversacion(id: number): void {
    this.conversacionId.set(id);
  }

  volverABandeja(): void {
    this.conversacionId.set(null);
  }
}
