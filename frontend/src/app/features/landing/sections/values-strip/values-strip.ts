import { Component } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-values-strip',
  standalone: true,
  imports: [Icon],
  templateUrl: './values-strip.html',
  styleUrl: './values-strip.scss',
})
export class ValuesStrip {
  protected readonly values = [
    {
      icon: 'box',
      title: 'Donaciones en especie',
      text: 'Bienes nuevos o en buen estado, nunca dinero.',
    },
    {
      icon: 'people',
      title: 'Colaboración comunitaria',
      text: 'Ciudadanos y organizaciones trabajando juntos.',
    },
    {
      icon: 'route',
      title: 'Coordinación organizada',
      text: 'Compromisos y entregas acordados con claridad.',
    },
    {
      icon: 'shield',
      title: 'Seguimiento transparente',
      text: 'Cada entrega podrá ser confirmada por quien la recibe.',
    },
  ];
}
