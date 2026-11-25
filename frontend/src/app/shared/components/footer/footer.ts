import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Brand } from '../brand/brand';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [Brand, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly links = [
    { label: 'Inicio', route: '/', fragment: '' },
    { label: 'Cómo donar', route: '/como-donar', fragment: '' },
    { label: 'Nosotros', route: '/nosotros', fragment: '' },
    { label: 'Preguntas frecuentes', route: '/preguntas-frecuentes', fragment: '' },
    { label: 'Créditos visuales', route: '/nosotros', fragment: 'creditos-visuales' },
  ];

  readonly categories = [
    'Alimentos no perecibles',
    'Ropa de abrigo y frazadas',
    'Higiene y limpieza',
    'Productos para animales',
    'Útiles escolares',
  ];
}
