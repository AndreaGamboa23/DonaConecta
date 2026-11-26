import {
  distanciaEdicion,
  esAproximado,
  formaSingular,
  normalizarTexto,
  variantesTexto,
} from './busqueda-texto';

describe('Utilidades de búsqueda textual', () => {
  it('normaliza tildes, mayúsculas, puntuación y espacios', () => {
    expect(normalizarTexto('  ¡JABÓN!  ')).toBe('jabon');
    expect(normalizarTexto('LÁPICES   ESCOLARES')).toBe('lapices escolares');
    expect(normalizarTexto('shampoo/cabello')).toBe('shampoo cabello');
  });

  it('reduce plurales comunes sin alterar palabras singulares', () => {
    expect(formaSingular('cuadernos')).toBe('cuaderno');
    expect(formaSingular('lápices')).toBe('lapiz');
    expect(formaSingular('clases')).toBe('clas');
    expect(formaSingular('jabon')).toBe('jabon');
    expect(variantesTexto('Mochilas')).toEqual(['mochilas', 'mochila']);
  });

  it('calcula distancia de edición para términos cortos', () => {
    expect(distanciaEdicion('jabon', 'jabon')).toBe(0);
    expect(distanciaEdicion('jabon', 'jabones')).toBe(2);
    expect(distanciaEdicion('arroz', 'arrozz')).toBe(1);
  });

  it('acepta errores moderados y rechaza coincidencias lejanas', () => {
    expect(esAproximado('cuadernos', 'cuademos')).toBe(true);
    expect(esAproximado('frejoles', 'frejoles')).toBe(false);
    expect(esAproximado('arroz', 'automovil')).toBe(false);
    expect(esAproximado('jabon', 'jab')).toBe(false);
  });
});
