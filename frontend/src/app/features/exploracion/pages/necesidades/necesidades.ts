import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CATEGORIAS_INFORMATIVAS, DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import { CatalogoInformativoService } from '../../../../core/services/catalogo-informativo.service';
import { ResultadoCatalogo } from '../../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { BuscadorCatalogo } from '../../../../shared/components/buscador-catalogo/buscador-catalogo';
import { CategoriasDestacadas } from '../../../../shared/components/categorias-destacadas/categorias-destacadas';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';

type EstadoResultados = 'servicio-no-disponible' | 'cargando' | 'error' | 'vacio' | 'datos';

/** Exploración pública: catálogo informativo real y solicitudes solo con integración. */
@Component({
  selector: 'app-necesidades',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    BuscadorCatalogo,
    CategoriasDestacadas,
    EmptyState,
    Icon,
    PageHero,
  ],
  templateUrl: './necesidades.html',
  styleUrl: './necesidades.scss',
})
export class Necesidades {
  private readonly estadoServicio = inject(BackendEstadoService);
  private readonly catalogo = inject(CatalogoInformativoService);
  private readonly ruta = inject(ActivatedRoute);

  readonly estado = this.estadoServicio.estado('necesidades');
  readonly categorias = CATEGORIAS_INFORMATIVAS;
  readonly distritos = DISTRITOS_HUANCAYO;
  readonly prioridades = [
    { valor: 'ALTA', etiqueta: 'Prioridad alta' },
    { valor: 'MEDIA', etiqueta: 'Prioridad media' },
    { valor: 'BAJA', etiqueta: 'Prioridad baja' },
  ] as const;

  readonly termino = signal(this.ruta.snapshot.queryParamMap.get('q') ?? '');
  readonly categoriaId = signal(0);
  readonly distritoId = signal(0);
  readonly prioridad = signal('');

  readonly respuesta = computed(() => this.catalogo.buscar(this.termino()));
  readonly resultadosCatalogo = computed(() => this.respuesta().resultados.slice(0, 8));
  readonly relacionados = computed(() => this.respuesta().relacionados.slice(0, 3));

  /** Las solicitudes solo cambiarán cuando exista una consulta REST autorizada. */
  readonly estadoResultados = signal<EstadoResultados>('servicio-no-disponible');

  readonly filtrosActivos = computed(
    () =>
      Number(Boolean(this.termino().trim())) +
      Number(this.categoriaId() > 0) +
      Number(this.distritoId() > 0) +
      Number(Boolean(this.prioridad())),
  );

  usarTermino(termino: string): void {
    this.termino.set(termino);
  }

  limpiarFiltros(): void {
    this.termino.set('');
    this.categoriaId.set(0);
    this.distritoId.set(0);
    this.prioridad.set('');
  }

  rutaResultado(resultado: ResultadoCatalogo): string {
    return this.catalogo.rutaResultado(resultado);
  }
}
