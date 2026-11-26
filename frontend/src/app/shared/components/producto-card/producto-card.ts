import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriaInformativa, ProductoInformativo } from '../../../core/interfaces/dona-conecta';
import { Icon } from '../icon/icon';

/** Tarjeta informativa de un bien. Nunca representa stock, precio ni solicitud. */
@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.scss',
})
export class ProductoCard {
  readonly producto = input.required<ProductoInformativo>();
  readonly categoria = input<CategoriaInformativa | null>(null);
}
