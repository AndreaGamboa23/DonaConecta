import { Routes } from '@angular/router';
import { rolGuard } from './core/guards/rol.guard';
import { PanelLayout } from './layouts/panel-layout/panel-layout';
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
        path: 'explorar',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/exploracion/pages/necesidades/necesidades').then(
                (modulo) => modulo.Necesidades,
              ),
            title: 'Explorar bienes y solicitudes | DonaConecta',
            data: {
              description:
                'Busca bienes materiales por categoría, producto o sinónimo y consulta las solicitudes publicadas en Huancayo.',
            },
          },
          {
            path: ':categoria',
            loadComponent: () =>
              import('./features/exploracion/pages/categoria-catalogo/categoria-catalogo').then(
                (modulo) => modulo.CategoriaCatalogo,
              ),
            title: 'Guía de bienes materiales | DonaConecta',
            data: {
              description:
                'Guía informativa de bienes materiales: condiciones, preparación y tipos de institución que podrían recibirlos.',
            },
          },
          {
            path: ':categoria/:producto',
            loadComponent: () =>
              import('./features/exploracion/pages/producto-detalle/producto-detalle').then(
                (modulo) => modulo.ProductoDetalle,
              ),
            title: 'Guía de un bien material | DonaConecta',
            data: {
              description:
                'Condiciones recomendadas, preparación e instituciones relacionadas con un bien material.',
            },
          },
        ],
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
        path: 'necesidades/:id',
        loadComponent: () =>
          import('./features/exploracion/pages/necesidad-detalle/necesidad-detalle').then(
            (modulo) => modulo.NecesidadDetallePage,
          ),
        title: 'Detalle de una necesidad | DonaConecta',
        data: {
          description:
            'Bienes solicitados, disponibilidad calculada con datos reales y orientación para coordinar la entrega.',
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
        path: 'instituciones/tipo/:tipo',
        loadComponent: () =>
          import(
            './features/exploracion/pages/institucion-tipo/institucion-tipo'
          ).then((modulo) => modulo.InstitucionTipo),
        title: 'Instituciones por tipo | DonaConecta',
        data: {
          description:
            'Directorio filtrado por tipo de institución con organizaciones verificadas de Huancayo.',
        },
      },
      {
        path: 'instituciones/:id',
        loadComponent: () =>
          import('./features/exploracion/pages/institucion-perfil/institucion-perfil').then(
            (modulo) => modulo.InstitucionPerfil,
          ),
        title: 'Perfil de institución | DonaConecta',
        data: {
          description:
            'Perfil público con datos autorizados, necesidades activas y puntos de acopio registrados.',
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
        path: 'historias',
        loadComponent: () =>
          import('./features/historias/historias').then((modulo) => modulo.Historias),
        title: 'Historias que conectan | DonaConecta',
        data: {
          description:
            'Historias editoriales sobre preparar donaciones, colaborar con responsabilidad y construir comunidad en Huancayo.',
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
    ],
  },
  {
    path: 'admin',
    component: PanelLayout,
    canActivate: [rolGuard('ADMINISTRADOR')],
    data: { rol: 'ADMINISTRADOR' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/paneles/admin-resumen/admin-resumen').then(
            (modulo) => modulo.AdminResumen,
          ),
        title: 'Panel de administración | DonaConecta',
        data: {
          description:
            'Resumen real de cuentas, instituciones, solicitudes y entregas de DonaConecta.',
        },
      },
      {
        path: 'instituciones',
        loadComponent: () =>
          import('./features/paneles/admin-instituciones/admin-instituciones').then(
            (modulo) => modulo.AdminInstituciones,
          ),
        title: 'Verificación de instituciones | DonaConecta',
        data: {
          description:
            'Revisa las instituciones registradas y registra su verificación con sustento.',
        },
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/paneles/admin-usuarios/admin-usuarios').then(
            (modulo) => modulo.AdminUsuarios,
          ),
        title: 'Gestión de usuarios | DonaConecta',
        data: {
          description: 'Consulta cuentas registradas y gestiona su estado con trazabilidad.',
        },
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./features/paneles/admin-auditoria/admin-auditoria').then(
            (modulo) => modulo.AdminAuditoria,
          ),
        title: 'Auditoría de acciones | DonaConecta',
        data: {
          description: 'Consulta el registro de acciones realizadas en DonaConecta.',
        },
      },
    ],
  },
  {
    path: 'institucional',
    component: PanelLayout,
    canActivate: [rolGuard('REPRESENTANTE')],
    data: { rol: 'REPRESENTANTE' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/paneles/institucional-resumen/institucional-resumen').then(
            (modulo) => modulo.InstitucionalResumen,
          ),
        title: 'Panel institucional | DonaConecta',
        data: {
          description: 'Resumen real de la institución, sus solicitudes y las entregas recibidas.',
        },
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/paneles/institucional-perfil/institucional-perfil').then(
            (modulo) => modulo.InstitucionalPerfil,
          ),
        title: 'Datos de mi institución | DonaConecta',
        data: {
          description: 'Actualiza los datos de contacto y presentación de tu institución.',
        },
      },
      {
        path: 'verificacion',
        loadComponent: () =>
          import('./features/paneles/institucional-verificacion/institucional-verificacion').then(
            (modulo) => modulo.InstitucionalVerificacion,
          ),
        title: 'Estado de verificación | DonaConecta',
        data: {
          description: 'Consulta el estado real de verificación de tu institución y su vínculo.',
        },
      },
      {
        path: 'necesidades',
        loadComponent: () =>
          import('./features/paneles/institucional-necesidades/institucional-necesidades').then(
            (modulo) => modulo.InstitucionalNecesidades,
          ),
        title: 'Mis necesidades | DonaConecta',
        data: {
          description:
            'Publica y gestiona solicitudes de bienes materiales con productos y unidades reales.',
        },
      },
    ],
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
];
