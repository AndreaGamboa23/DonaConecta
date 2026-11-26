import { routes } from './app.routes';

describe('Rutas públicas de DonaConecta', () => {
  const hijas = routes[0]?.children ?? [];

  it('registra todas las páginas implementadas con carga diferida', () => {
    const rutas = hijas.map((ruta) => ruta.path);

    expect(rutas).toEqual([
      '',
      'necesidades',
      'instituciones',
      'puntos-de-acopio',
      'registro',
      'registro/donante',
      'registro/institucion',
      'iniciar-sesion',
      'mensajes',
      'mis-donaciones',
      'seguimiento/:id',
      'perfil',
      'como-donar',
      'nosotros',
      'preguntas-frecuentes',
      '**',
    ]);
    expect(hijas.every((ruta) => typeof ruta.loadComponent === 'function')).toBe(true);
  });

  it('cada ruta tiene título y descripción propios', () => {
    for (const ruta of hijas) {
      expect(typeof ruta.title).toBe('string');
      expect(typeof ruta.data?.['description']).toBe('string');
    }
  });
});
