import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-process-section',
  standalone: true,
  imports: [Icon, RouterLink],
  templateUrl: './process-section.html',
  styleUrl: './process-section.scss',
})
export class ProcessSection {
  protected readonly steps = [
    {
      number: '01',
      icon: 'people',
      title: 'Publican necesidades',
      text: 'Las organizaciones dan a conocer los bienes materiales que requieren.',
      tone: 'blue',
    },
    {
      number: '02',
      icon: 'hand',
      title: 'Registras tu compromiso',
      text: 'Eliges una necesidad y confirmas qué cantidad estás dispuesto a donar.',
      tone: 'amber',
    },
    {
      number: '03',
      icon: 'truck',
      title: 'Coordinas la entrega',
      text: 'Se acuerda cuándo y dónde entregar la donación de forma clara.',
      tone: 'green',
    },
    {
      number: '04',
      icon: 'check',
      title: 'Confirman la recepción',
      text: 'La organización registra lo recibido para cerrar el ciclo con transparencia.',
      tone: 'blue',
    },
  ];
}
