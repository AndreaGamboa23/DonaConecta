import { Component, computed, inject, input } from '@angular/core';
import {
  BackendEstadoService,
  OperacionBackend,
} from '../../../core/services/backend-estado.service';
import { EmptyState } from '../empty-state/empty-state';
import { PageHero } from '../page-hero/page-hero';
import { PendingNotice } from '../pending-notice/pending-notice';

/** Estructura común de las pantallas que todavía esperan una API real. */
@Component({
  selector: 'app-service-page',
  standalone: true,
  imports: [EmptyState, PageHero, PendingNotice],
  templateUrl: './service-page.html',
  styleUrl: './service-page.scss',
})
export class ServicePage {
  private readonly estadoServicio = inject(BackendEstadoService);

  readonly operacion = input.required<OperacionBackend>();
  readonly eyebrow = input.required<string>();
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly icono = input<string>('compass');
  readonly tono = input<'blue' | 'navy' | 'green' | 'amber'>('blue');
  readonly tituloServicio = input<string>('Servicio pendiente de integración');
  readonly tituloVacio = input.required<string>();
  readonly mensajeVacio = input.required<string>();
  readonly accionPrincipal = input<string>('');
  readonly rutaPrincipal = input<string>('');
  readonly accionSecundaria = input<string>('');
  readonly rutaSecundaria = input<string>('');

  readonly estado = computed(() => this.estadoServicio.estado(this.operacion()));
}
