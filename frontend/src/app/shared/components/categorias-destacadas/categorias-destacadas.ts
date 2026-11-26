import { Component, computed, inject, input } from '@angular/core';
import { CATEGORIAS_INFORMATIVAS } from '../../../core/data/catalogos-locales';
import { CatalogoInformativoService } from '../../../core/services/catalogo-informativo.service';
import { CategoriaDonacion } from '../categoria-donacion/categoria-donacion';

/** Rejilla de categorías con búsqueda inteligente local, sin datos de negocio. */
@Component({
  selector: 'app-categorias-destacadas',
  standalone: true,
  imports: [CategoriaDonacion],
  templateUrl: './categorias-destacadas.html',
  styleUrl: './categorias-destacadas.scss',
})
export class CategoriasDestacadas {
  private readonly catalogo = inject(CatalogoInformativoService);

  /** Filtro informativo local; nunca representa una consulta de necesidades. */
  readonly filtro = input('');

  readonly categorias = computed(() => {
    const texto = this.filtro().trim();
    if (!texto) return CATEGORIAS_INFORMATIVAS;
    const coincidencias = this.catalogo.buscar(texto).resultados;
    const slugs = new Set(
      coincidencias
        .filter((resultado) => resultado.coincidencia !== 'relacionada')
        .map((resultado) => resultado.categoriaSlug),
    );
    return CATEGORIAS_INFORMATIVAS.filter((categoria) => slugs.has(categoria.slug));
  });
}
