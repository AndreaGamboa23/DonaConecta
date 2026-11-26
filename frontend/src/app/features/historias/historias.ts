import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/components/icon/icon';
import { PageHero } from '../../shared/components/page-hero/page-hero';

@Component({
  selector: 'app-historias',
  standalone: true,
  imports: [RouterLink, Icon, PageHero],
  templateUrl: './historias.html',
  styleUrl: './historias.scss',
})
export class Historias {
  protected readonly pasos = [
    {
      icono: 'box',
      titulo: 'Preparar con atención',
      texto:
        'Revisar el estado de cada bien, limpiarlo cuando corresponda y separarlo por categoría ayuda a que llegue en condiciones de uso.',
    },
    {
      icono: 'check-circle',
      titulo: 'Entregar con claridad',
      texto:
        'Indicar cantidades, unidades y el punto de entrega acordado evita confusiones y hace más rápida la revisión inicial.',
    },
    {
      icono: 'route',
      titulo: 'Seguir el recorrido',
      texto:
        'Una entrega ordenada permite confirmar la recepción y saber qué ocurrió después, sin depender de recuerdos ni mensajes dispersos.',
    },
  ];
}
