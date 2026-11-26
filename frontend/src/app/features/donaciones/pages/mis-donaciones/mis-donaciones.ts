import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';

@Component({
  selector: 'app-mis-donaciones',
  standalone: true,
  imports: [RouterLink, EmptyState, Icon, PageHero, PendingNotice],
  templateUrl: './mis-donaciones.html',
  styleUrl: './mis-donaciones.scss',
})
export class MisDonaciones {
  private readonly estadoServicio = inject(BackendEstadoService);
  readonly estado = this.estadoServicio.estado('donaciones');
}
