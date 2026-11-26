import { Component, input } from '@angular/core';
import { EmptyState } from '../empty-state/empty-state';
import { PageHero } from '../page-hero/page-hero';

/** Estructura común de las pantallas que todavía esperan una API real. */
@Component({
  selector: 'app-service-page',
  standalone: true,
  imports: [EmptyState, PageHero],
  templateUrl: './service-page.html',
  styleUrl: './service-page.scss',
})
export class ServicePage {
  readonly eyebrow = input.required<string>();
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly icono = input<string>('compass');
  readonly tono = input<'blue' | 'navy' | 'green' | 'amber'>('blue');
  readonly tituloVacio = input.required<string>();
  readonly mensajeVacio = input.required<string>();
  readonly accionPrincipal = input<string>('');
  readonly rutaPrincipal = input<string>('');
  readonly accionSecundaria = input<string>('');
  readonly rutaSecundaria = input<string>('');
}
