import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';
import { DonacionResumen, DonacionesApiService } from '../../services/donaciones-api.service';

@Component({
  selector: 'app-mis-donaciones',
  standalone: true,
  imports: [RouterLink, EmptyState, Icon, PageHero, PendingNotice],
  templateUrl: './mis-donaciones.html',
  styleUrl: './mis-donaciones.scss',
})
export class MisDonaciones implements OnInit {
  private readonly estadoServicio = inject(BackendEstadoService);
  private readonly donacionesApi = inject(DonacionesApiService);
  readonly sesion = inject(SesionService);

  readonly estado = this.estadoServicio.estado('donaciones');
  readonly cargando = signal(false);
  readonly donaciones = signal<readonly DonacionResumen[]>([]);

  ngOnInit(): void {
    if (!this.sesion.autenticado()) return;
    this.cargando.set(true);
    this.donacionesApi.listarDonaciones().subscribe({
      next: (lista) => {
        this.donaciones.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }
}
