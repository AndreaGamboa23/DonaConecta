import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIAS_INFORMATIVAS } from '../../../../core/data/catalogos-locales';
import { Icon } from '../../../../shared/components/icon/icon';

/** Buscador local únicamente sobre categorías informativas verificadas. */
@Component({
  selector: 'app-category-search',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './category-search.html',
  styleUrl: './category-search.scss',
})
export class CategorySearch {
  readonly categorias = CATEGORIAS_INFORMATIVAS;
  readonly termino = signal('');

  readonly resultados = computed(() => {
    const texto = this.termino().trim().toLocaleLowerCase('es');
    if (!texto) return this.categorias;
    return this.categorias.filter((categoria) =>
      `${categoria.nombre} ${categoria.descripcion} ${categoria.ejemplos}`
        .toLocaleLowerCase('es')
        .includes(texto),
    );
  });

  cambiarTermino(evento: Event): void {
    this.termino.set((evento.target as HTMLInputElement).value);
  }

  limpiar(): void {
    this.termino.set('');
  }
}
