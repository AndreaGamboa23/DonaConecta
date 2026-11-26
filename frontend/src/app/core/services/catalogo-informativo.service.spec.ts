import { CatalogoInformativoService } from './catalogo-informativo.service';

describe('CatalogoInformativoService', () => {
  const servicio = new CatalogoInformativoService();

  it('pone las coincidencias exactas antes que los sinónimos', () => {
    const respuesta = servicio.buscar('cuadernos');

    expect(respuesta.resultados.length).toBeGreaterThan(0);
    expect(respuesta.resultados[0].nombre).toBe('Cuadernos');
    expect(respuesta.resultados[0].coincidencia).toBe('exacta');
    expect(respuesta.resultados.some((resultado) => resultado.coincidencia === 'sinonimo')).toBe(true);
  });

  it('reconoce ejemplos cotidianos sin depender de tildes ni mayúsculas', () => {
    const terminos = [
      'cuadernos',
      'LÁPICES',
      'mochilas',
      'chompas',
      'casacas',
      'cobijas',
      'arroz',
      'menestras',
      'frejoles',
      'jabón',
      'champú',
      'shampoo',
      'croquetas',
      'perros',
      'mascotas',
    ];

    for (const termino of terminos) {
      const respuesta = servicio.buscar(termino);
      expect(respuesta.resultados.length).toBeGreaterThan(0);
    }
  });

  it('normaliza la búsqueda antes de comparar', () => {
    expect(servicio.buscar('JABÓN').normalizado).toBe('jabon');
    expect(servicio.buscar('JABON').resultados[0].nombre).toBe('Jabón');
  });

  it('limita los resultados a la categoría solicitada', () => {
    const respuesta = servicio.buscar('cobijas', 'ropa');

    expect(respuesta.resultados.length).toBeGreaterThan(0);
    expect(respuesta.resultados.every((resultado) => resultado.categoriaSlug === 'ropa')).toBe(true);
    expect(servicio.buscar('cobijas', 'alimentos').resultados.length).toBe(0);
  });

  it('propone bienes relacionados de la misma categoría', () => {
    const respuesta = servicio.buscar('cuadernos');

    expect(respuesta.relacionados.length).toBeGreaterThan(0);
    expect(
      respuesta.relacionados.every((resultado) => resultado.coincidencia === 'relacionada'),
    ).toBe(true);
    expect(
      respuesta.relacionados.every((resultado) => resultado.categoriaSlug === 'utiles-escolares'),
    ).toBe(true);
  });

  it('no inventa resultados cuando no hay coincidencias', () => {
    const respuesta = servicio.buscar('automóvil');

    expect(respuesta.resultados.length).toBe(0);
    expect(respuesta.relacionados.length).toBe(0);
  });

  it('devuelve sugerencias útiles para una búsqueda vacía', () => {
    const respuesta = servicio.buscar('   ');

    expect(respuesta.normalizado).toBe('');
    expect(respuesta.resultados.length).toBe(0);
    expect(respuesta.sugerencias.length).toBe(8);
  });

  it('construye rutas reales para categorías y productos', () => {
    expect(
      servicio.rutaResultado({
        tipo: 'categoria',
        id: 'alimentos',
        categoriaSlug: 'alimentos',
        nombre: 'Alimentos',
        descripcion: '',
        puntuacion: 1,
        coincidencia: 'exacta',
      }),
    ).toBe('/explorar/alimentos');
    expect(
      servicio.rutaResultado({
        tipo: 'producto',
        id: 'arroz',
        categoriaSlug: 'alimentos',
        nombre: 'Arroz',
        descripcion: '',
        puntuacion: 1,
        coincidencia: 'exacta',
      }),
    ).toBe('/explorar/alimentos/arroz');
  });
});
