import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [Icon],
  templateUrl: './page-hero.html',
  styleUrl: './page-hero.scss',
})
export class PageHero {
  readonly eyebrow = input.required<string>();
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly icono = input<string>('spark');
  readonly tono = input<'blue' | 'navy' | 'green' | 'amber'>('blue');
}
