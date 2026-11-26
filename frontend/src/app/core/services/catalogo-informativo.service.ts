import { Injectable } from '@angular/core';
import {
  PRODUCTOS_INFORMATIVOS,
  TERMINOS_SUGERIDOS,
  obtenerCategoria,
  productosPorCategoria,
} from '../data/catalogo-informativo';
import { CATEGORIAS_INFORMATIVAS } from '../data/catalogos-locales';
import {
  ProductoInformativo,
  RespuestaBusqueda,
  ResultadoCatalogo,
  TipoCoincidencia,
} from '../interfaces/dona-conecta';
import {
  esAproximado,
  formaSingular,
  normalizarTexto,
  variantesTexto,
} from '../utils/busqueda-texto';

interface Calificacion {
  readonly puntuacion: number;
  readonly coincidencia: TipoCoincidencia;
}

/** Términos coloquiales que no están en el nombre del producto. */
const SINONIMOS_CATEGORIA: Readonly<Record<string, readonly string[]>> = {
  alimentos: ['comida', 'despensa', 'no perecibles', 'menestras'],
  ropa: ['abrigo', 'frío', 'vestuario', 'cobijas'],
  higiene: ['aseo', 'cuidado personal', 'limpieza'],
  animales: ['mascotas', 'perros', 'gatos', 'refugio animal'],
  'utiles-escolares': ['estudio', 'escuela', 'papelería', 'material escolar'],
};

/**
 * Búsqueda del catálogo informativo. Opera solo sobre datos locales tipados:
 * no consulta solicitudes, no inventa resultados y no usa localStorage.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoInformativoService {
  buscar(termino: string, categoriaSlug?: string): RespuestaBusqueda {
    const normalizado = normalizarTexto(termino);
    if (!normalizado) {
      return {
        normalizado: '',
        resultados: [],
        relacionados: [],
        sugerencias: TERMINOS_SUGERIDOS.slice(0, 8),
      };
    }

    const base = formaSingular(normalizado);
    const permitida = (slugCandidato: string) =>
      !categoriaSlug || categoriaSlug === 'todas' || slugCandidato === categoriaSlug;
    const resultados: ResultadoCatalogo[] = [];

    for (const categoria of CATEGORIAS_INFORMATIVAS) {
      if (!permitida(categoria.slug)) continue;
      const calificacion = this.calificar(categoria.nombre, [
        categoria.nombre,
        categoria.descripcion,
        categoria.ejemplos,
        ...(SINONIMOS_CATEGORIA[categoria.slug] ?? []),
      ], normalizado, base);
      if (!calificacion) continue;
      resultados.push({
        tipo: 'categoria',
        id: categoria.slug,
        categoriaSlug: categoria.slug,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        puntuacion: calificacion.puntuacion,
        coincidencia: calificacion.coincidencia,
      });
    }

    for (const producto of PRODUCTOS_INFORMATIVOS) {
      if (!permitida(producto.categoriaSlug)) continue;
      const calificacion = this.calificar(producto.nombre, [
        ...producto.sinonimos,
        producto.descripcion,
        producto.utilidad,
      ], normalizado, base);
      if (!calificacion) continue;
      resultados.push({
        tipo: 'producto',
        id: producto.slug,
        categoriaSlug: producto.categoriaSlug,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        puntuacion: calificacion.puntuacion,
        coincidencia: calificacion.coincidencia,
      });
    }

    const ordenados = resultados
      .slice()
      .sort((a, b) => b.puntuacion - a.puntuacion || a.nombre.localeCompare(b.nombre, 'es'))
      .slice(0, 14);

    const relacionados = this.relacionados(ordenados, permitida).slice(0, 4);
    const nombres = ordenados
      .filter((resultado) => resultado.tipo === 'producto')
      .map((resultado) => resultado.nombre);

    return {
      normalizado,
      resultados: ordenados,
      relacionados,
      sugerencias: this.sugerenciasDesde(nombres, base),
    };
  }

  sugerencias(termino: string): readonly string[] {
    return this.buscar(termino).sugerencias;
  }

  rutaResultado(resultado: ResultadoCatalogo): string {
    return resultado.tipo === 'categoria'
      ? `/explorar/${resultado.categoriaSlug}`
      : `/explorar/${resultado.categoriaSlug}/${resultado.id}`;
  }

  private calificar(
    nombre: string,
    alias: readonly string[],
    termino: string,
    base: string,
  ): Calificacion | null {
    const nombreNormalizado = normalizarTexto(nombre);
    const nombreSingular = formaSingular(nombreNormalizado);
    const aliasNormalizados = alias.flatMap(variantesTexto).filter(Boolean);

    if (nombreNormalizado === termino || nombreSingular === base) {
      return { puntuacion: 130, coincidencia: 'exacta' };
    }
    if (aliasNormalizados.includes(termino) || aliasNormalizados.includes(base)) {
      return { puntuacion: 112, coincidencia: 'sinonimo' };
    }

    const tokensTermino = termino.split(' ').filter((token) => token.length >= 3);
    const tokensNombre = nombreNormalizado.split(' ').map(formaSingular);
    const coincideToken = tokensTermino.some(
      (token) =>
        tokensNombre.includes(token) || tokensNombre.some((valor) => valor.startsWith(token)),
    );
    if (termino.length >= 3 && (nombreNormalizado.includes(termino) || coincideToken)) {
      return { puntuacion: 94, coincidencia: 'parcial' };
    }
    if (
      aliasNormalizados.some(
        (valor) => valor.length >= 4 && (valor.includes(base) || termino.includes(valor)),
      )
    ) {
      return { puntuacion: 78, coincidencia: 'sinonimo' };
    }

    const candidatos = [...tokensNombre, ...aliasNormalizados];
    if (candidatos.some((valor) => esAproximado(base, valor))) {
      return { puntuacion: 54, coincidencia: 'aproximada' };
    }
    return null;
  }

  private relacionados(
    resultados: readonly ResultadoCatalogo[],
    permitida: (slug: string) => boolean,
  ): readonly ResultadoCatalogo[] {
    const categorias = new Set(resultados.map((resultado) => resultado.categoriaSlug));
    const existentes = new Set(
      resultados.map((resultado) => `${resultado.categoriaSlug}/${resultado.id}`),
    );
    const salida: ResultadoCatalogo[] = [];

    for (const slug of categorias) {
      const categoria = obtenerCategoria(slug);
      if (!categoria || !permitida(slug)) continue;
      for (const producto of productosPorCategoria(slug) as readonly ProductoInformativo[]) {
        const clave = `${slug}/${producto.slug}`;
        if (existentes.has(clave)) continue;
        existentes.add(clave);
        salida.push({
          tipo: 'producto',
          id: producto.slug,
          categoriaSlug: slug,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          puntuacion: 10,
          coincidencia: 'relacionada',
        });
        if (salida.length >= 4) return salida;
      }
    }
    return salida;
  }

  private sugerenciasDesde(nombres: readonly string[], base: string): readonly string[] {
    const sugerencias = [...nombres];
    for (const termino of TERMINOS_SUGERIDOS) {
      if (
        sugerencias.length >= 8 &&
        !(base.length >= 3 && normalizarTexto(termino).startsWith(base))
      ) {
        break;
      }
      if (!sugerencias.includes(termino)) sugerencias.push(termino);
    }
    return sugerencias.slice(0, 8);
  }
}
