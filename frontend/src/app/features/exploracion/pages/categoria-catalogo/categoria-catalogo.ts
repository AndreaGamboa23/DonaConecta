import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { CATEGORIAS_INFORMATIVAS } from '../../../../core/data/catalogos-locales';
import {
  obtenerCategoria,
  productosPorCategoria,
} from '../../../../core/data/catalogo-informativo';
import { CatalogoInformativoService } from '../../../../core/services/catalogo-informativo.service';
import { ProductoInformativo } from '../../../../core/interfaces/dona-conecta';
import { Icon } from '../../../../shared/components/icon/icon';
import { BuscadorCatalogo } from '../../../../shared/components/buscador-catalogo/buscador-catalogo';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ProductoCard } from '../../../../shared/components/producto-card/producto-card';

/** Guía informativa por categoría. No muestra solicitudes ni cantidades. */
@Component({
  selector: 'app-categoria-catalogo',
  standalone: true,
  imports: [RouterLink, BuscadorCatalogo, EmptyState, Icon, ProductoCard],
  templateUrl: './categoria-catalogo.html',
  styleUrl: './categoria-catalogo.scss',
})
export class CategoriaCatalogo {
  private readonly ruta = inject(ActivatedRoute);
  private readonly catalogo = inject(CatalogoInformativoService);
  private readonly titulo = inject(Title);
  private readonly meta = inject(Meta);

  readonly categorias = CATEGORIAS_INFORMATIVAS;
  readonly slug = signal(this.ruta.snapshot.paramMap.get('categoria') ?? '');
  readonly termino = signal(this.ruta.snapshot.queryParamMap.get('q') ?? '');
  readonly soloExactas = signal(false);

  readonly categoria = computed(() => obtenerCategoria(this.slug()));
  readonly productosCategoria = computed(() => productosPorCategoria(this.slug()));
  readonly respuesta = computed(() => this.catalogo.buscar(this.termino(), this.slug()));

  readonly productosVisibles = computed<readonly ProductoInformativo[]>(() => {
    const resultados = this.respuesta().resultados.filter(
      (resultado) => resultado.tipo === 'producto',
    );
    const porSlug = new Map(
      this.productosCategoria().map((producto) => [producto.slug, producto]),
    );
    const seleccionados = this.soloExactas()
      ? resultados.filter((resultado) => resultado.coincidencia === 'exacta')
      : resultados;
    const salida: ProductoInformativo[] = [];
    for (const resultado of seleccionados) {
      const producto = porSlug.get(resultado.id);
      if (producto && !salida.includes(producto)) salida.push(producto);
    }
    return salida;
  });

  readonly productos = computed(() =>
    this.productosVisibles().length ? this.productosVisibles() : this.productosCategoria(),
  );

  constructor() {
    const categoria = this.categoria();
    const titulo = categoria
      ? `${categoria.nombre}: guía para donar | DonaConecta`
      : 'Categoría no encontrada | DonaConecta';
    this.titulo.setTitle(titulo);
    this.meta.updateTag({
      name: 'description',
      content: categoria
        ? `${categoria.descripcion} Conoce qué bienes materiales puedes preparar y cómo entregarlos en Huancayo.`
        : 'La categoría solicitada no existe en la guía de bienes materiales de DonaConecta.',
    });
  }

  usarTermino(termino: string): void {
    this.termino.set(termino);
    this.soloExactas.set(false);
  }

  limpiarBusqueda(): void {
    this.termino.set('');
    this.soloExactas.set(false);
  }
}
