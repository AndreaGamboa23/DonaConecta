import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './service-card.html',
  styleUrl: './service-card.scss',
})
export class ServiceCard {
  readonly icono = input.required<string>();
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly ruta = input.required<string>();
  readonly fragmento = input<string>('');
  readonly etiqueta = input<string>('');
  readonly tono = input<'blue' | 'cream' | 'green' | 'amber' | 'navy'>('blue');
}
