import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SesionService } from '../../../core/services/sesion.service';
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
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  readonly sesion = inject(SesionService);

  readonly menuOpen = signal(false);
  readonly masAbierto = signal(false);

  readonly links: readonly EnlacePrincipal[] = [
    { label: 'Inicio', route: '/', icon: '', exact: true },
    { label: 'Explorar', route: '/explorar', icon: '', exact: false },
    { label: 'Instituciones', route: '/instituciones', icon: '', exact: false },
  ];

  readonly personalLink: EnlacePrincipal = {
    label: 'Mensajes',
    route: '/mensajes',
    icon: 'chat',
    exact: false,
  };

  readonly secondaryLinks = [
    { label: 'Puntos de acopio', route: '/puntos-de-acopio' },
    { label: 'Mis donaciones', route: '/mis-donaciones' },
    { label: 'Cómo donar', route: '/como-donar' },
    { label: 'Historias que conectan', route: '/historias' },
    { label: 'Nosotros', route: '/nosotros' },
    { label: 'Preguntas frecuentes', route: '/preguntas-frecuentes' },
  ];

  toggleMenu(): void {
    this.menuOpen.update((abierto) => !abierto);
    this.cerrarMas();
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleMas(): void {
    this.masAbierto.update((abierto) => !abierto);
  }

  cerrarMas(): void {
    this.masAbierto.set(false);
  }

  seleccionarMas(): void {
    this.cerrarMas();
    this.closeMenu();
  }

  cerrarSesion(): void {
    this.sesion.cerrar();
    this.closeMenu();
    this.router.navigateByUrl('/iniciar-sesion');
  }

  @HostListener('document:keydown.escape')
  alEscape(): void {
    this.cerrarMas();
  }

  @HostListener('document:click', ['$event'])
  alClicarFuera(evento: MouseEvent): void {
    const destino = evento.target;
    if (!(destino instanceof Node)) return;
    if (!this.elemento.nativeElement.contains(destino)) this.cerrarMas();
  }
}
