import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';
import { BandejaConversaciones } from '../../components/bandeja-conversaciones/bandeja-conversaciones';

/** Estado honesto de la mensajería: no se simulan chats ni conversaciones. */
@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [RouterLink, Icon, PageHero, PendingNotice, BandejaConversaciones],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
})
export class Mensajes {
  readonly estado = inject(BackendEstadoService).estado('mensajes');
  readonly sesion = inject(SesionService);
}
