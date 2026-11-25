import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Brand } from '../brand/brand';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [Brand, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly menuOpen = signal(false);

  /** Solo páginas implementadas. Las rutas planificadas no se enlazan todavía. */
  readonly links = [
    { label: 'Inicio', route: '/', exact: true },
    { label: 'Cómo donar', route: '/como-donar', exact: false },
    { label: 'Nosotros', route: '/nosotros', exact: false },
    { label: 'Preguntas frecuentes', route: '/preguntas-frecuentes', exact: false },
  ];

  toggleMenu(): void {
    this.menuOpen.update((abierto) => !abierto);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
