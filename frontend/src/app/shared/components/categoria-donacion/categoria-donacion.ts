import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriaInformativa } from '../../../core/interfaces/dona-conecta';
import { Icon } from '../icon/icon';

/** Tarjeta reutilizable de una categoría informativa con fotografía propia. */
@Component({
  selector: 'app-categoria-donacion',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './categoria-donacion.html',
  styleUrl: './categoria-donacion.scss',
})
export class CategoriaDonacion {
  readonly categoria = input.required<CategoriaInformativa>();
  readonly destacada = input(false);
  /** Solo la primera tarjeta visible carga su imagen de inmediato para evitar NG0913. */
  readonly prioritaria = input(false);
}
