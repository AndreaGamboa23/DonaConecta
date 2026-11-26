import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CATEGORIAS_INFORMATIVAS, DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import { ResultadoCatalogo } from '../../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { CatalogoInformativoService } from '../../../../core/services/catalogo-informativo.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { BuscadorCatalogo } from '../../../../shared/components/buscador-catalogo/buscador-catalogo';
import { CategoriasDestacadas } from '../../../../shared/components/categorias-destacadas/categorias-destacadas';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { DonacionesApiService } from '../../../donaciones/services/donaciones-api.service';
import { ExploracionApiService, NecesidadReal } from '../../services/exploracion-api.service';

type EstadoResultados = 'servicio-no-disponible' | 'cargando' | 'error' | 'vacio' | 'datos';

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
export class Necesidades implements OnInit {
  private readonly estadoServicio = inject(BackendEstadoService);
  private readonly catalogo = inject(CatalogoInformativoService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly api = inject(ExploracionApiService);
  private readonly donacionesApi = inject(DonacionesApiService);
  readonly sesion = inject(SesionService);

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

  readonly estadoResultados = signal<EstadoResultados>('cargando');
  readonly todasNecesidades = signal<readonly NecesidadReal[]>([]);
  readonly mensajeCompromiso = signal('');

  readonly necesidadesFiltradas = computed(() => {
    const lista = this.todasNecesidades();
    const catNombre = CATEGORIAS_INFORMATIVAS.find((c) => c.id === this.categoriaId())?.nombre;
    const distNombre = DISTRITOS_HUANCAYO.find((d) => d.id === this.distritoId())?.nombre;
    const prio = this.prioridad();

    return lista.filter((n) => {
      if (catNombre && n.categoria.toLowerCase() !== catNombre.toLowerCase()) return false;
      if (distNombre && n.distrito !== distNombre) return false;
      if (prio && n.prioridad !== prio) return false;
      return true;
    });
  });

  readonly filtrosActivos = computed(
    () =>
      Number(Boolean(this.termino().trim())) +
      Number(this.categoriaId() > 0) +
      Number(this.distritoId() > 0) +
      Number(Boolean(this.prioridad())),
  );

  ngOnInit(): void {
    this.cargarNecesidades();
  }

  cargarNecesidades(): void {
    this.api.listarNecesidades().subscribe({
      next: (lista) => {
        this.todasNecesidades.set(lista);
        this.estadoResultados.set(lista.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estadoResultados.set('error'),
    });
  }

  comprometer(item: NecesidadReal): void {
    const faltante = Math.max(1, item.cantidad_requerida - item.cantidad_comprometida);
    this.mensajeCompromiso.set('');
    this.donacionesApi
      .crearCompromiso({
        id_necesidad: item.id_necesidad,
        cantidad_comprometida: Math.min(1, faltante),
        comentario: 'Compromiso registrado desde la web DonaConecta',
      })
      .subscribe({
        next: () => {
          this.mensajeCompromiso.set(
            `¡Compromiso registrado para "${item.titulo}"! Puedes verlo en Mis donaciones.`,
          );
          this.cargarNecesidades();
        },
        error: (err) => {
          this.mensajeCompromiso.set(
            err?.error?.detail ?? 'No se pudo registrar el compromiso. Verifica tu sesión.',
          );
        },
      });
  }

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
