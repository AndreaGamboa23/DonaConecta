import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-quick-access',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './quick-access.html',
  styleUrl: './quick-access.scss',
})
export class QuickAccess {
  /** Solo destinos implementados: rutas reales o fragmentos existentes de la portada. */
  protected readonly actions = [
    { label: 'Explorar', route: '/', fragment: 'donar', icon: 'spark' },
    { label: 'Cómo donar', route: '/como-donar', fragment: '', icon: 'box' },
    { label: 'Nosotros', route: '/nosotros', fragment: '', icon: 'people' },
    { label: 'Ayuda', route: '/preguntas-frecuentes', fragment: '', icon: 'shield' },
  ];
}
