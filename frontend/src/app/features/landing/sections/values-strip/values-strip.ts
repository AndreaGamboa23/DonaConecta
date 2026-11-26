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
      icon: 'people',
      title: 'Solidaridad comunitaria',
      text: 'Ciudadanos que se organizan para apoyar a otras personas.',
    },
    {
      icon: 'box',
      title: 'Donaciones materiales',
      text: 'Bienes nuevos o en buen estado, nunca dinero.',
    },
    {
      icon: 'route',
      title: 'Coordinación organizada',
      text: 'Compromisos y entregas acordados con claridad.',
    },
    {
      icon: 'shield',
      title: 'Transparencia',
      text: 'Cada entrega podrá ser confirmada por quien la recibe.',
    },
  ];
}
