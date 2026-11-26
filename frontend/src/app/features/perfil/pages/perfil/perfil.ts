import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';
import { PerfilApiService } from '../../services/perfil-api.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterLink, EmptyState, Icon, PageHero, PendingNotice],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly estadoServicio = inject(BackendEstadoService);
  private readonly perfilApi = inject(PerfilApiService);
  private readonly router = inject(Router);
  readonly sesion = inject(SesionService);

  readonly estado = this.estadoServicio.estado('perfil');

  ngOnInit(): void {
    if (this.sesion.autenticado()) {
      this.perfilApi.obtenerPerfil().subscribe({
        next: (datos) => this.sesion.actualizarUsuario(datos),
        error: () => {},
      });
    }
  }

  cerrarSesion(): void {
    this.sesion.cerrar();
    this.router.navigateByUrl('/iniciar-sesion');
  }
}
