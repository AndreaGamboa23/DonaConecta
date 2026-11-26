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
    { label: 'Explorar', route: '/explorar', fragment: '' },
    { label: 'Instituciones', route: '/instituciones', fragment: '' },
    { label: 'Puntos de acopio', route: '/puntos-de-acopio', fragment: '' },
    { label: 'Cómo donar', route: '/como-donar', fragment: '' },
    { label: 'Historias que conectan', route: '/historias', fragment: '' },
    { label: 'Mis donaciones', route: '/mis-donaciones', fragment: '' },
    { label: 'Mensajes', route: '/mensajes', fragment: '' },
    { label: 'Mi perfil', route: '/perfil', fragment: '' },
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
