import { routes } from './app.routes';

describe('Rutas públicas de DonaConecta', () => {
  const hijas = routes[0]?.children ?? [];
  const paginas = hijas.flatMap((ruta) =>
    (ruta.children ?? [ruta]).map((pagina) => ({
      ...pagina,
      path: ruta.children ? `${ruta.path}/${pagina.path}`.replace(/\/$/, '') : pagina.path,
    })),
  );

  it('registra todas las páginas implementadas con carga diferida', () => {
    const rutas = paginas.map((pagina) => pagina.path);

    expect(rutas).toEqual([
      '',
      'explorar',
      'explorar/:categoria',
      'explorar/:categoria/:producto',
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
      'historias',
      'nosotros',
      'preguntas-frecuentes',
      '**',
    ]);
    expect(paginas.every((pagina) => typeof pagina.loadComponent === 'function')).toBe(true);
  });

  it('cada página tiene título y descripción propios', () => {
    for (const pagina of paginas) {
      expect(typeof pagina.title).toBe('string');
      expect(typeof pagina.data?.['description']).toBe('string');
    }
  });
});
