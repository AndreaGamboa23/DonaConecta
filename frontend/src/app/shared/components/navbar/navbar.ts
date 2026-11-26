import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Brand } from '../brand/brand';
import { Icon } from '../icon/icon';

interface EnlacePrincipal {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly exact: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [Brand, Icon, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly menuOpen = signal(false);

  /** Todos los destinos están implementados en la Fase 07.A. */
  readonly links: readonly EnlacePrincipal[] = [
    { label: 'Inicio', route: '/', icon: 'home', exact: true },
    { label: 'Explorar', route: '/necesidades', icon: 'compass', exact: false },
    { label: 'Instituciones', route: '/instituciones', icon: 'building', exact: false },
    { label: 'Cómo donar', route: '/como-donar', icon: 'box', exact: false },
    { label: 'Mensajes', route: '/mensajes', icon: 'chat', exact: false },
  ];

  readonly secondaryLinks = [
    { label: 'Nosotros', route: '/nosotros' },
    { label: 'Preguntas frecuentes', route: '/preguntas-frecuentes' },
    { label: 'Puntos de acopio', route: '/puntos-de-acopio' },
  ];

  toggleMenu(): void {
    this.menuOpen.update((abierto) => !abierto);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
