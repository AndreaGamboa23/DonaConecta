import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/landing/landing').then((modulo) => modulo.Landing),
        title: 'DonaConecta | Una comunidad, muchas manos, un mismo propósito',
        data: {
          description:
            'Explora necesidades, instituciones y puntos de acopio en Huancayo. Conectamos solidaridad con donaciones de bienes materiales, sin pagos ni transferencias.',
        },
      },
      {
        path: 'necesidades',
        loadComponent: () =>
          import('./features/exploracion/pages/necesidades/necesidades').then(
            (modulo) => modulo.Necesidades,
          ),
        title: 'Explorar necesidades | DonaConecta',
        data: {
          description:
            'Consulta el catálogo de solicitudes de bienes materiales de organizaciones verificadas en Huancayo.',
        },
      },
      {
        path: 'instituciones',
        loadComponent: () =>
          import('./features/exploracion/pages/instituciones/instituciones').then(
            (modulo) => modulo.Instituciones,
          ),
        title: 'Instituciones | DonaConecta',
        data: {
          description:
            'Directorio público de comedores, albergues, refugios y organizaciones sociales verificadas de Huancayo.',
        },
      },
      {
        path: 'puntos-de-acopio',
        loadComponent: () =>
          import('./features/exploracion/pages/puntos-de-acopio/puntos-de-acopio').then(
            (modulo) => modulo.PuntosDeAcopio,
          ),
        title: 'Puntos de acopio | DonaConecta',
        data: {
          description:
            'Conoce dónde se coordinan las entregas de bienes materiales en la provincia de Huancayo.',
        },
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./features/registro/pages/registro/registro').then((modulo) => modulo.Registro),
        title: 'Crea tu cuenta | DonaConecta',
        data: {
          description:
            'Regístrate como donante de bienes materiales o como representante de una institución en Huancayo.',
        },
      },
      {
        path: 'registro/donante',
        loadComponent: () =>
          import('./features/registro/pages/registro-donante/registro-donante').then(
            (modulo) => modulo.RegistroDonante,
          ),
        title: 'Registro de donante | DonaConecta',
        data: {
          description:
            'Crea un perfil de donante para ofrecer bienes materiales y seguir tus compromisos con la comunidad.',
        },
      },
      {
        path: 'registro/institucion',
        loadComponent: () =>
          import('./features/registro/pages/registro-institucion/registro-institucion').then(
            (modulo) => modulo.RegistroInstitucion,
          ),
        title: 'Registro de institución | DonaConecta',
        data: {
          description:
            'Registra una institución social de Huancayo y vincula al representante responsable de la solicitud.',
        },
      },
      {
        path: 'iniciar-sesion',
        loadComponent: () =>
          import('./features/autenticacion/pages/iniciar-sesion/iniciar-sesion').then(
            (modulo) => modulo.IniciarSesion,
          ),
        title: 'Iniciar sesión | DonaConecta',
        data: {
          description:
            'Accede a tu cuenta de DonaConecta para ver donaciones, mensajes y preferencias de tu perfil.',
        },
      },
      {
        path: 'mensajes',
        loadComponent: () =>
          import('./features/mensajes/pages/mensajes/mensajes').then((modulo) => modulo.Mensajes),
        title: 'Mensajes | DonaConecta',
        data: {
          description:
            'Espacio privado previsto para coordinar entregas de bienes materiales con instituciones verificadas.',
        },
      },
      {
        path: 'mis-donaciones',
        loadComponent: () =>
          import('./features/donaciones/pages/mis-donaciones/mis-donaciones').then(
            (modulo) => modulo.MisDonaciones,
          ),
        title: 'Mis donaciones | DonaConecta',
        data: {
          description:
            'Consulta tus compromisos de bienes materiales, entregas y confirmaciones de recepción.',
        },
      },
      {
        path: 'seguimiento/:id',
        loadComponent: () =>
          import('./features/seguimiento/pages/seguimiento/seguimiento').then(
            (modulo) => modulo.Seguimiento,
          ),
        title: 'Seguimiento de entrega | DonaConecta',
        data: {
          description:
            'Seguimiento autorizado y manual de una entrega de bienes materiales, con privacidad y caducidad.',
        },
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil/pages/perfil/perfil').then((modulo) => modulo.Perfil),
        title: 'Mi perfil | DonaConecta',
        data: {
          description:
            'Gestiona tus datos personales, roles y preferencias de notificación de tu cuenta DonaConecta.',
        },
      },
      {
        path: 'como-donar',
        loadComponent: () =>
          import('./features/como-donar/como-donar').then((modulo) => modulo.ComoDonar),
        title: 'Cómo donar | DonaConecta',
        data: {
          description:
            'Guía para donar bienes materiales en DonaConecta: categorías, estado de los productos, pasos y seguimiento previsto.',
        },
      },
      {
        path: 'nosotros',
        loadComponent: () => import('./features/nosotros/nosotros').then((modulo) => modulo.Nosotros),
        title: 'Nosotros | DonaConecta',
        data: {
          description:
            'Conoce el propósito académico y social de DonaConecta: una comunidad que organiza donaciones de bienes materiales en Huancayo.',
        },
      },
      {
        path: 'preguntas-frecuentes',
        loadComponent: () =>
          import('./features/preguntas-frecuentes/preguntas-frecuentes').then(
            (modulo) => modulo.PreguntasFrecuentes,
          ),
        title: 'Preguntas frecuentes | DonaConecta',
        data: {
          description:
            'Respuestas claras sobre donaciones materiales, registro, privacidad, seguimiento GPS y mensajería en DonaConecta.',
        },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/not-found/not-found').then((modulo) => modulo.NotFoundPage),
        title: 'Página no encontrada | DonaConecta',
        data: {
          description:
            'La página solicitada no existe. Regresa al inicio de DonaConecta o consulta la guía para donar.',
        },
      },
    ],
  },
];
