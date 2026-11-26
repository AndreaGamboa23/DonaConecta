import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import {
  obtenerCategoria,
  obtenerProducto,
  productosRelacionados,
} from '../../../../core/data/catalogo-informativo';
import { Icon } from '../../../../shared/components/icon/icon';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ProductoCard } from '../../../../shared/components/producto-card/producto-card';

/** Detalle informativo de un bien material; sin precios, ventas ni cantidades. */
@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [RouterLink, EmptyState, Icon, ProductoCard],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.scss',
})
export class ProductoDetalle {
  private readonly ruta = inject(ActivatedRoute);
  private readonly titulo = inject(Title);
  private readonly meta = inject(Meta);

  readonly categoriaSlug = signal(this.ruta.snapshot.paramMap.get('categoria') ?? '');
  readonly productoSlug = signal(this.ruta.snapshot.paramMap.get('producto') ?? '');

  readonly categoria = computed(() => obtenerCategoria(this.categoriaSlug()));
  readonly producto = computed(() =>
    obtenerProducto(this.categoriaSlug(), this.productoSlug()),
  );
  readonly relacionados = computed(() => {
    const producto = this.producto();
    return producto ? productosRelacionados(producto) : [];
  });

  constructor() {
    const producto = this.producto();
    const titulo = producto
      ? `${producto.nombre}: cómo donarlo | DonaConecta`
      : 'Bien no encontrado | DonaConecta';
    this.titulo.setTitle(titulo);
    this.meta.updateTag({
      name: 'description',
      content: producto
        ? `${producto.descripcion} Condiciones recomendadas, preparación y tipos de institución que podrían recibirlo.`
        : 'El bien solicitado no existe en la guía de bienes materiales de DonaConecta.',
    });
  }
}
