import { Component, computed, inject, input, model, output } from '@angular/core';
import { CatalogoInformativoService } from '../../../core/services/catalogo-informativo.service';
import { TERMINOS_SUGERIDOS } from '../../../core/data/catalogo-informativo';
import { normalizarTexto } from '../../../core/utils/busqueda-texto';
import { Icon } from '../icon/icon';

/** Buscador reutilizable del catálogo informativo, sin acceso a red. */
@Component({
  selector: 'app-buscador-catalogo',
  standalone: true,
  imports: [Icon],
  templateUrl: './buscador-catalogo.html',
  styleUrl: './buscador-catalogo.scss',
})
export class BuscadorCatalogo {
  private readonly catalogo = inject(CatalogoInformativoService);

  readonly valor = model('');
  readonly id = input('buscador-catalogo');
  readonly etiqueta = input('¿Qué quieres donar?');
  readonly placeholder = input('Ej. cuadernos, jabón, frazadas');
  readonly buscar = output<string>();

  readonly sugerenciasVisibles = computed(() => {
    const termino = this.valor().trim();
    return termino ? this.catalogo.sugerencias(termino).slice(0, 6) : TERMINOS_SUGERIDOS.slice(0, 8);
  });

  cambiar(evento: Event): void {
    this.valor.set((evento.target as HTMLInputElement).value);
  }

  usar(termino: string): void {
    this.valor.set(termino);
    this.buscar.emit(termino);
  }

  limpiar(): void {
    this.valor.set('');
    this.buscar.emit('');
  }

  enviar(evento: Event): void {
    evento.preventDefault();
    this.buscar.emit(normalizarTexto(this.valor()) ? this.valor().trim() : '');
  }
}
