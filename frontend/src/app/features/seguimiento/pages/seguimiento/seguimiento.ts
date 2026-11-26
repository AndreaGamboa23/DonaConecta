import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { MapaHuancayo } from '../../../../shared/components/mapa-huancayo/mapa-huancayo';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [RouterLink, Icon, MapaHuancayo, PageHero, PendingNotice],
  templateUrl: './seguimiento.html',
  styleUrl: './seguimiento.scss',
})
export class Seguimiento {
  private readonly estadoServicio = inject(BackendEstadoService);
  readonly estado = this.estadoServicio.estado('seguimiento');
}
