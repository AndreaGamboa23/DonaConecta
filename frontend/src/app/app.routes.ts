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
            'Conectamos la solidaridad de Huancayo con organizaciones que necesitan bienes materiales. Sin pagos ni transferencias.',
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
