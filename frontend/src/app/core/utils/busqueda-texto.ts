/** Normalización local y determinista: sin IA, sin red y sin almacenamiento. */

export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Singular aproximado para mejorar coincidencias de plurales comunes.
 * Se usa solo como apoyo: los sinónimos explícitos tienen prioridad.
 */
export function formaSingular(valor: string): string {
  const texto = normalizarTexto(valor);
  if (texto.length > 5 && texto.endsWith('ces')) return `${texto.slice(0, -3)}z`;
  if (texto.length > 4 && texto.endsWith('es')) return texto.slice(0, -2);
  if (texto.length > 3 && texto.endsWith('s')) return texto.slice(0, -1);
  return texto;
}

export function variantesTexto(valor: string): readonly string[] {
  const normalizado = normalizarTexto(valor);
  const singular = formaSingular(normalizado);
  return singular === normalizado ? [normalizado] : [normalizado, singular];
}

/** Distancia de Levenshtein, limitada a términos cortos del catálogo. */
export function distanciaEdicion(izquierda: string, derecha: string): number {
  if (izquierda === derecha) return 0;
  if (!izquierda.length) return derecha.length;
  if (!derecha.length) return izquierda.length;

  let anterior = Array.from({ length: derecha.length + 1 }, (_, indice) => indice);
  for (let i = 1; i <= izquierda.length; i += 1) {
    const actual = [i];
    for (let j = 1; j <= derecha.length; j += 1) {
      const coste = izquierda[i - 1] === derecha[j - 1] ? 0 : 1;
      actual[j] = Math.min(
        actual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + coste,
      );
    }
    anterior = actual;
  }
  return anterior[derecha.length];
}

/** Coincidencia aproximada moderada: nunca permite distancias grandes. */
export function esAproximado(izquierda: string, derecha: string): boolean {
  if (izquierda === derecha || izquierda.length < 4 || derecha.length < 4) return false;
  const permitida = Math.min(2, Math.max(1, Math.floor(Math.max(izquierda.length, derecha.length) / 4)));
  if (Math.abs(izquierda.length - derecha.length) > permitida) return false;
  return distanciaEdicion(izquierda, derecha) <= permitida;
}
