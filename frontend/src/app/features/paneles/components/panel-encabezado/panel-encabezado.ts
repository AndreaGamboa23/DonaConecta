import { Component, input } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';

/** Encabezado común de los paneles: mismo ritmo visual, contenido propio por página. */
@Component({
  selector: 'app-panel-encabezado',
  standalone: true,
  imports: [Icon],
  templateUrl: './panel-encabezado.html',
  styleUrl: './panel-encabezado.scss',
})
export class PanelEncabezado {
  readonly seccion = input.required<string>();
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly icono = input('spark');
}
