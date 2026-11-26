import { Component } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';
import { ServiceCard } from '../../../../shared/components/service-card/service-card';

interface AccionServicio {
  readonly label: string;
  readonly descripcion: string;
  readonly route: string;
  readonly icon: string;
  readonly etiqueta: string;
  readonly tono: 'blue' | 'cream' | 'green' | 'amber' | 'navy';
}

/** Solo enlaces a páginas ya implementadas en esta fase. */
@Component({
  selector: 'app-quick-access',
  standalone: true,
  imports: [Icon, ServiceCard],
  templateUrl: './quick-access.html',
  styleUrl: './quick-access.scss',
})
export class QuickAccess {
  protected readonly actions: readonly AccionServicio[] = [
    {
      label: 'Explorar necesidades',
      descripcion: 'Conoce las solicitudes reales de bienes materiales.',
      route: '/necesidades',
      icon: 'compass',
      etiqueta: 'Catálogo',
      tono: 'blue',
    },
    {
      label: 'Instituciones',
      descripcion: 'Comedores, albergues, refugios y organizaciones verificadas.',
      route: '/instituciones',
      icon: 'building',
      etiqueta: 'Directorio',
      tono: 'green',
    },
    {
      label: 'Puntos de acopio',
      descripcion: 'Dónde coordinar la entrega de tus donaciones.',
      route: '/puntos-de-acopio',
      icon: 'map',
      etiqueta: 'Entregas',
      tono: 'amber',
    },
    {
      label: 'Cómo donar',
      descripcion: 'Categorías, estado de los bienes y pasos de la donación.',
      route: '/como-donar',
      icon: 'box',
      etiqueta: 'Guía',
      tono: 'cream',
    },
    {
      label: 'Mis donaciones',
      descripcion: 'Sigue tus compromisos y confirmaciones de recepción.',
      route: '/mis-donaciones',
      icon: 'gift',
      etiqueta: 'Mi actividad',
      tono: 'navy',
    },
    {
      label: 'Mensajes',
      descripcion: 'Coordina entregas con instituciones en un espacio privado.',
      route: '/mensajes',
      icon: 'chat',
      etiqueta: 'Chat',
      tono: 'blue',
    },
    {
      label: 'Mi perfil',
      descripcion: 'Datos, roles y preferencias de tu cuenta.',
      route: '/perfil',
      icon: 'user',
      etiqueta: 'Cuenta',
      tono: 'cream',
    },
    {
      label: 'Crear cuenta',
      descripcion: 'Regístrate como donante o representante de una institución.',
      route: '/registro',
      icon: 'hand',
      etiqueta: 'Registro',
      tono: 'green',
    },
  ];
}
