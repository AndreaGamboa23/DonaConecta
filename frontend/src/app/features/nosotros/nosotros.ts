import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './nosotros.html',
  styleUrl: './nosotros.scss',
})
export class Nosotros {
  protected readonly principles = [
    {
      icon: 'people',
      title: 'Solidaridad',
      text: 'Muchas manos pequeñas pueden sostener una necesidad grande.',
      tone: 'blue',
    },
    {
      icon: 'shield',
      title: 'Confianza',
      text: 'Los compromisos y las recepciones deben poder verificarse.',
      tone: 'green',
    },
    {
      icon: 'route',
      title: 'Colaboración',
      text: 'Ciudadanos e instituciones trabajan con objetivos claros.',
      tone: 'amber',
    },
  ];

  protected readonly commitments = [
    'Gestionamos exclusivamente bienes materiales.',
    'No procesamos pagos, transferencias ni donaciones monetarias.',
    'No publicamos organizaciones verificadas sin un proceso real de revisión.',
    'No inventamos estadísticas, testimonios ni necesidades.',
    'Respetamos la privacidad de donantes, representantes y personas vulnerables.',
  ];
}
