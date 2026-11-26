import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { obtenerCategoria } from '../../../../core/data/catalogo-informativo';
import { CATEGORIAS_INFORMATIVAS } from '../../../../core/data/catalogos-locales';
import { CatalogoInformativoService } from '../../../../core/services/catalogo-informativo.service';
import { RespuestaBusqueda } from '../../../../core/interfaces/dona-conecta';
import { BuscadorCatalogo } from '../../../../shared/components/buscador-catalogo/buscador-catalogo';
import { Icon } from '../../../../shared/components/icon/icon';

interface ResultadoVisible {
  readonly tipo: 'categoria' | 'producto';
  readonly nombre: string;
  readonly descripcion: string;
  readonly icono: string;
  readonly ruta: string;
}

/** Buscador de la portada: traslada el término a Explorar y abre guías reales. */
@Component({
  selector: 'app-category-search',
  standalone: true,
  imports: [RouterLink, BuscadorCatalogo, Icon],
  templateUrl: './category-search.html',
  styleUrl: './category-search.scss',
})
export class CategorySearch {
  private readonly router = inject(Router);
  private readonly catalogo = inject(CatalogoInformativoService);

  readonly termino = signal('');
  readonly respuesta = computed(() => this.catalogo.buscar(this.termino()) as RespuestaBusqueda);

  readonly resultados = computed<readonly ResultadoVisible[]>(() => {
    const termino = this.termino().trim();
    if (!termino) {
      return CATEGORIAS_INFORMATIVAS.map((categoria) => ({
        tipo: 'categoria' as const,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        icono: categoria.icono,
        ruta: `/explorar/${categoria.slug}`,
      }));
    }
    return this.respuesta()
      .resultados.slice(0, 8)
      .map((resultado) => ({
        tipo: resultado.tipo,
        nombre: resultado.nombre,
        descripcion: resultado.descripcion,
        icono: obtenerCategoria(resultado.categoriaSlug)?.icono ?? 'box',
        ruta: this.catalogo.rutaResultado(resultado),
      }));
  });

  usarTermino(termino: string): void {
    this.termino.set(termino);
    if (termino.trim()) {
      void this.router.navigate(['/explorar'], { queryParams: { q: termino.trim() } });
    }
  }

  irAEplorar(): void {
    const termino = this.termino().trim();
    void this.router.navigate(['/explorar'], {
      queryParams: termino ? { q: termino } : {},
    });
  }
}
