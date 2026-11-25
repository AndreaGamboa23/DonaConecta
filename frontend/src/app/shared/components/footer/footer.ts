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
    { label: 'Inicio', route: '/' },
    { label: 'Cómo donar', route: '/como-donar' },
    { label: 'Nosotros', route: '/nosotros' },
    { label: 'Preguntas frecuentes', route: '/preguntas-frecuentes' },
  ];

  readonly categories = [
    'Alimentos no perecibles',
    'Ropa de abrigo y frazadas',
    'Higiene y limpieza',
    'Productos para animales',
    'Útiles escolares',
  ];
}
