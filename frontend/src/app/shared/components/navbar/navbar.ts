import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Brand } from '../brand/brand';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [Brand, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);

  readonly links = [
    { label: 'Inicio', route: '/', exact: true },
    { label: 'Instituciones', route: '/instituciones', exact: false },
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
