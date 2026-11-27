import { routes } from './app.routes';

describe('Rutas de DonaConecta', () => {
  const publica = routes[0];
  const hijas = publica?.children ?? [];
  const paginas = hijas.flatMap((ruta) =>
    (ruta.children ?? [ruta]).map((pagina) => ({
      ...pagina,
      path: ruta.children ? `${ruta.path}/${pagina.path}`.replace(/\/$/, '') : pagina.path,
    })),
  );

  it('registra todas las páginas públicas implementadas con carga diferida', () => {
    const rutas = paginas.map((pagina) => pagina.path);

    expect(rutas).toEqual([
      '',
      'explorar',
      'explorar/:categoria',
      'explorar/:categoria/:producto',
      'necesidades',
      'necesidades/:id',
      'instituciones',
      'instituciones/tipo/:tipo',
      'instituciones/:id',
      'puntos-de-acopio',
      'registro',
      'registro/donante',
      'registro/institucion',
      'iniciar-sesion',
      'mensajes',
      'mis-donaciones',
      'donaciones/:id',
      'seguimiento/:id',
      'perfil',
      'como-donar',
      'historias',
      'nosotros',
      'preguntas-frecuentes',
    ]);
    expect(paginas.every((pagina) => typeof pagina.loadComponent === 'function')).toBe(true);
  });

  it('cada página pública tiene título y descripción propios', () => {
    for (const pagina of paginas) {
      expect(typeof pagina.title).toBe('string');
      expect(typeof pagina.data?.['description']).toBe('string');
    }
  });

  it('protege los paneles con el guard de rol y usa el layout de panel', () => {
    const admin = routes.find((ruta) => ruta.path === 'admin');
    const institucional = routes.find((ruta) => ruta.path === 'institucional');

    expect(admin?.canActivate?.length).toBe(1);
    expect(institucional?.canActivate?.length).toBe(1);
    expect(admin?.data?.['rol']).toBe('ADMINISTRADOR');
    expect(institucional?.data?.['rol']).toBe('REPRESENTANTE');
    expect(admin?.children?.map((ruta) => ruta.path)).toEqual([
      '',
      'instituciones',
      'usuarios',
      'auditoria',
    ]);
    expect(institucional?.children?.map((ruta) => ruta.path)).toEqual([
      '',
      'perfil',
      'verificacion',
      'necesidades',
      'compromisos',
      'puntos-de-acopio',
    ]);
    expect(
      [...(admin?.children ?? []), ...(institucional?.children ?? [])].every(
        (pagina) => typeof pagina.loadComponent === 'function' && Boolean(pagina.title),
      ),
    ).toBe(true);
  });

  it('deja la página 404 como ruta pública final', () => {
    expect(routes.at(-1)?.path).toBe('**');
    expect(routes.at(-1)?.title).toBe('Página no encontrada | DonaConecta');
  });
});
