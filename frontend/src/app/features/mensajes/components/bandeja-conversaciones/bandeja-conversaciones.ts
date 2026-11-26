import { Component, inject } from '@angular/core';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';

/** Bandeja sin registros inventados: espera a la API autorizada de conversaciones. */
@Component({
  selector: 'app-bandeja-conversaciones',
  standalone: true,
  imports: [Icon, PendingNotice],
  templateUrl: './bandeja-conversaciones.html',
  styleUrl: './bandeja-conversaciones.scss',
})
export class BandejaConversaciones {
  readonly estado = inject(BackendEstadoService).estado('conversaciones');
}
