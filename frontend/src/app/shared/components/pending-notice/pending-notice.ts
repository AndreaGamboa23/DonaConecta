import { Component, input } from '@angular/core';
import { EstadoServicio } from '../../../core/interfaces/dona-conecta';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-pending-notice',
  standalone: true,
  imports: [Icon],
  templateUrl: './pending-notice.html',
  styleUrl: './pending-notice.scss',
})
export class PendingNotice {
  readonly estado = input.required<EstadoServicio>();
  readonly titulo = input<string>('Este servicio todavía no está disponible');
}
