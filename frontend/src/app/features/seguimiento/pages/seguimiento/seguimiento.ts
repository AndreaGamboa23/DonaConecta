import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [RouterLink, Icon, PageHero, PendingNotice],
  templateUrl: './seguimiento.html',
  styleUrl: './seguimiento.scss',
})
export class Seguimiento {
  private readonly ruta = inject(ActivatedRoute);
  private readonly estadoServicio = inject(BackendEstadoService);

  readonly sesionId = this.ruta.snapshot.paramMap.get('id') ?? '';
  readonly estado = this.estadoServicio.estado('seguimiento');
  readonly aviso = signal('');

  intentarIniciar(): void {
    this.aviso.set(
      'El seguimiento GPS requiere consentimiento explícito, inicio manual, indicador visible y caducidad. No se activará hasta que exista el servicio autorizado.',
    );
  }
}
