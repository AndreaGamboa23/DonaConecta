import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-mobile-tabbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './mobile-tabbar.html',
  styleUrl: './mobile-tabbar.scss',
})
export class MobileTabbar {
  /** Las rutas privadas muestran su puerta de acceso cuando no hay sesión real. */
  readonly items = [
    { label: 'Inicio', route: '/', icon: 'home', exact: true },
    { label: 'Explorar', route: '/necesidades', icon: 'compass', exact: false },
    { label: 'Donaciones', route: '/mis-donaciones', icon: 'gift', exact: false },
    { label: 'Mensajes', route: '/mensajes', icon: 'chat', exact: false },
    { label: 'Perfil', route: '/perfil', icon: 'user', exact: false },
  ];
}
