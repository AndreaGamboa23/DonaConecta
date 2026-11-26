import { Component, inject } from '@angular/core';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';

/**
 * Panel preparado para el futuro WebSocket autorizado. Hoy no envía, no guarda
 * mensajes en el navegador y no simula conversaciones.
 */
@Component({
  selector: 'app-panel-conversacion',
  standalone: true,
  imports: [Icon, PendingNotice],
  templateUrl: './panel-conversacion.html',
  styleUrl: './panel-conversacion.scss',
})
export class PanelConversacion {
  readonly estado = inject(BackendEstadoService).estado('mensajes');
}
