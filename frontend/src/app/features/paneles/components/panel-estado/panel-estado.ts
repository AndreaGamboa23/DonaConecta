import { Component, input, output } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';

export type EstadoPanel = 'cargando' | 'vacio' | 'error';

/** Estados honestos de carga, ausencia de datos y fallo, compartidos por los paneles. */
@Component({
  selector: 'app-panel-estado',
  standalone: true,
  imports: [Icon],
  templateUrl: './panel-estado.html',
  styleUrl: './panel-estado.scss',
})
export class PanelEstado {
  readonly estado = input.required<EstadoPanel>();
  readonly mensaje = input('');
  readonly reintentar = output<void>();
}
