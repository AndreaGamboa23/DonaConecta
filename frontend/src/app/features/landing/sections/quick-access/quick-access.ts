import { Component, computed, inject } from '@angular/core';
import { SesionService } from '../../../../core/services/sesion.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { ServiceCard } from '../../../../shared/components/service-card/service-card';

interface AccionServicio {
  readonly label: string;
  readonly descripcion: string;
  readonly route: string;
  readonly fragmento?: string;
  readonly icon: string;
  readonly etiqueta: string;
  readonly tono: 'blue' | 'cream' | 'green' | 'amber' | 'navy';
}

/**
 * Accesos reales a servicios implementados. Las opciones personales dependen
 * de la sesión local; el backend vuelve a autorizar cada operación sensible.
 */
@Component({
  selector: 'app-quick-access',
  standalone: true,
  imports: [Icon, ServiceCard],
  templateUrl: './quick-access.html',
  styleUrl: './quick-access.scss',
})
export class QuickAccess {
  private readonly sesion = inject(SesionService);

  private readonly explorar: AccionServicio = {
    label: 'Explorar necesidades',
    descripcion: 'Bienes que puedo donar y solicitudes publicadas por organizaciones verificadas.',
    route: '/explorar',
    fragmento: 'solicitudes',
    icon: 'compass',
    etiqueta: 'Catálogo',
    tono: 'blue',
  };

  private readonly instituciones: AccionServicio = {
    label: 'Instituciones',
    descripcion: 'Comedores, albergues, refugios y organizaciones verificadas de Huancayo.',
    route: '/instituciones',
    icon: 'building',
    etiqueta: 'Directorio',
    tono: 'green',
  };

  private readonly comoDonar: AccionServicio = {
    label: 'Cómo donar',
    descripcion: 'Categorías, estado de los bienes y pasos para preparar una donación.',
    route: '/como-donar',
    icon: 'box',
    etiqueta: 'Guía',
    tono: 'cream',
  };

  private readonly acopio: AccionServicio = {
    label: 'Puntos de acopio',
    descripcion: 'Conoce el mapa base y cómo se coordinan las entregas.',
    route: '/puntos-de-acopio',
    icon: 'map',
    etiqueta: 'Entregas',
    tono: 'amber',
  };

  private readonly perfil: AccionServicio = {
    label: 'Mi perfil',
    descripcion: 'Datos personales, actividad y preferencias de tu cuenta.',
    route: '/perfil',
    icon: 'user',
    etiqueta: 'Cuenta',
    tono: 'cream',
  };

  private readonly publicas: readonly AccionServicio[] = [
    this.explorar,
    this.instituciones,
    this.comoDonar,
    this.acopio,
    {
      label: 'Ser donante',
      descripcion: 'Crea un perfil de donante y registra tus compromisos de bienes materiales.',
      route: '/registro/donante',
      icon: 'hand',
      etiqueta: 'Registro',
      tono: 'green',
    },
    {
      label: 'Registrar institución',
      descripcion: 'Presenta una organización social para iniciar su verificación.',
      route: '/registro/institucion',
      icon: 'heart',
      etiqueta: 'Institución',
      tono: 'navy',
    },
    {
      label: 'Iniciar sesión',
      descripcion: 'Accede a tus donaciones, mensajes y preferencias.',
      route: '/iniciar-sesion',
      icon: 'log-in',
      etiqueta: 'Acceso',
      tono: 'blue',
    },
    {
      label: 'Nosotros',
      descripcion: 'Conoce el propósito solidario y académico de DonaConecta.',
      route: '/nosotros',
      icon: 'people',
      etiqueta: 'Proyecto',
      tono: 'cream',
    },
  ];

  private readonly donante: readonly AccionServicio[] = [
    this.explorar,
    this.instituciones,
    {
      label: 'Mis donaciones',
      descripcion: 'Consulta tus compromisos reales y su estado.',
      route: '/mis-donaciones',
      icon: 'gift',
      etiqueta: 'Mi actividad',
      tono: 'navy',
    },
    {
      label: 'Mensajes',
      descripcion: 'Revisa el estado de la mensajería y su disponibilidad real.',
      route: '/mensajes',
      icon: 'chat',
      etiqueta: 'Comunicación',
      tono: 'blue',
    },
    this.perfil,
    this.comoDonar,
    this.acopio,
  ];

  private readonly representante: readonly AccionServicio[] = [
    {
      label: 'Mi panel',
      descripcion: 'Resumen real de tu institución, solicitudes y entregas.',
      route: '/institucional',
      icon: 'building',
      etiqueta: 'Panel',
      tono: 'navy',
    },
    {
      label: 'Mis necesidades',
      descripcion: 'Publica y gestiona bienes materiales solicitados por tu institución.',
      route: '/institucional/necesidades',
      icon: 'box',
      etiqueta: 'Gestión',
      tono: 'blue',
    },
    this.explorar,
    this.instituciones,
    this.perfil,
    this.comoDonar,
    this.acopio,
  ];

  private readonly administrador: readonly AccionServicio[] = [
    {
      label: 'Panel de administración',
      descripcion: 'Verificación de instituciones, cuentas y auditoría real.',
      route: '/admin',
      icon: 'shield',
      etiqueta: 'Panel',
      tono: 'navy',
    },
    {
      label: 'Verificar instituciones',
      descripcion: 'Revisa solicitudes pendientes y registra su verificación.',
      route: '/admin/instituciones',
      icon: 'check-circle',
      etiqueta: 'Verificación',
      tono: 'green',
    },
    this.explorar,
    this.instituciones,
    this.perfil,
    this.comoDonar,
    this.acopio,
  ];

  readonly roles = computed(() =>
    (this.sesion.usuario()?.roles ?? []).map((rol) => rol.toLocaleUpperCase('es')),
  );

  readonly saludo = computed(() => {
    if (!this.sesion.autenticado()) return 'Tu comunidad';
    const nombre = this.sesion.nombreCompleto().split(' ')[0] || 'Bienvenido';
    return `Hola, ${nombre}`;
  });

  readonly acciones = computed<readonly AccionServicio[]>(() => {
    if (!this.sesion.autenticado()) return this.publicas;
    const roles = this.roles();
    if (roles.includes('ADMINISTRADOR')) return this.administrador;
    if (roles.includes('REPRESENTANTE')) return this.representante;
    if (roles.includes('DONANTE')) return this.donante;
    return [this.explorar, this.instituciones, this.perfil, this.comoDonar, this.acopio];
  });
}
