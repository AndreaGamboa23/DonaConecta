import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';

/**
 * Panel preparado para mensajería autorizada. Hoy no envía, no guarda mensajes en el
 * navegador y no simula conversaciones.
 */
@Component({
  selector: 'app-panel-conversacion',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './panel-conversacion.html',
  styleUrl: './panel-conversacion.scss',
})
export class PanelConversacion {
  readonly conversacionId = input<number | null>(null);
  readonly volver = output<void>();
}
