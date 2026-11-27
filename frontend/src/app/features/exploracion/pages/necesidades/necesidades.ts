import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CATEGORIAS_INFORMATIVAS, DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import { ResultadoCatalogo } from '../../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { CatalogoInformativoService } from '../../../../core/services/catalogo-informativo.service';
import { PanelApiService, ProductoCatalogo } from '../../../../core/services/panel-api.service';
import { normalizarTexto } from '../../../../core/utils/busqueda-texto';
import { BuscadorCatalogo } from '../../../../shared/components/buscador-catalogo/buscador-catalogo';
import { CategoriasDestacadas } from '../../../../shared/components/categorias-destacadas/categorias-destacadas';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { NecesidadCard } from '../../../../shared/components/necesidad-card/necesidad-card';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import {
  ExploracionApiService,
  FiltrosNecesidades,
  InstitucionReal,
  NecesidadReal,
} from '../../services/exploracion-api.service';

type EstadoCarga = 'servicio-no-disponible' | 'cargando' | 'error' | 'vacio' | 'datos';

const TAMANO_PAGINA = 6;

/**
 * Exploración pública: guía informativa de bienes, catálogo SQL y solicitudes
 * reales separadas. Los compromisos se registran en el detalle de la necesidad.
 */
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
    NecesidadCard,
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
  private readonly panelApi = inject(PanelApiService);

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
  readonly institucionId = signal(0);
  readonly prioridad = signal('');

  readonly respuesta = computed(() => this.catalogo.buscar(this.termino()));
  readonly resultadosCatalogo = computed(() => this.respuesta().resultados.slice(0, 6));
  readonly relacionados = computed(() => this.respuesta().relacionados.slice(0, 4));

  readonly estadoProductos = signal<EstadoCarga>('cargando');
  readonly productosReales = signal<readonly ProductoCatalogo[]>([]);
  readonly mostrarTodosProductos = signal(false);

  readonly estadoInstituciones = signal<EstadoCarga>('cargando');
  readonly instituciones = signal<readonly InstitucionReal[]>([]);

  readonly estadoNecesidades = signal<EstadoCarga>(
    this.estado.disponible ? 'cargando' : 'servicio-no-disponible',
  );
  readonly necesidades = signal<readonly NecesidadReal[]>([]);
  readonly cargandoMas = signal(false);
  readonly hayMas = signal(false);

  /** El producto 1 es un registro técnico usado por pruebas de concurrencia. */
  readonly productosInformativos = computed(() =>
    this.productosReales().filter((producto) => producto.producto_id !== 1),
  );

  readonly productosFiltrados = computed(() => {
    const texto = normalizarTexto(this.termino());
    const productos = this.productosInformativos();
    if (!texto) return productos;
    return productos.filter((producto) =>
      normalizarTexto(`${producto.nombre} ${producto.categoria}`).includes(texto),
    );
  });

  readonly productosVisibles = computed(() =>
    this.mostrarTodosProductos()
      ? this.productosFiltrados()
      : this.productosFiltrados().slice(0, 12),
  );

  readonly filtrosActivos = computed(
    () =>
      Number(Boolean(this.termino().trim())) +
      Number(this.categoriaId() > 0) +
      Number(this.distritoId() > 0) +
      Number(this.institucionId() > 0) +
      Number(Boolean(this.prioridad())),
  );

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarInstituciones();
    this.cargarNecesidades();
  }

  private filtros(): FiltrosNecesidades {
    return {
      categoriaId: this.categoriaId() || undefined,
      distritoId: this.distritoId() || undefined,
      institucionId: this.institucionId() || undefined,
      prioridad: this.prioridad() || undefined,
      limit: TAMANO_PAGINA,
      offset: 0,
    };
  }

  cargarNecesidades(): void {
    if (!this.estado.disponible) {
      this.estadoNecesidades.set('servicio-no-disponible');
      return;
    }
    this.estadoNecesidades.set('cargando');
    this.api.listarNecesidades(this.filtros()).subscribe({
      next: (lista) => {
        this.necesidades.set(lista);
        this.hayMas.set(lista.length === TAMANO_PAGINA);
        this.estadoNecesidades.set(lista.length > 0 ? 'datos' : 'vacio');
      },
      error: () => {
        this.necesidades.set([]);
        this.hayMas.set(false);
        this.estadoNecesidades.set('error');
      },
    });
  }

  cargarMas(): void {
    if (!this.estado.disponible || this.cargandoMas() || !this.hayMas()) return;
    this.cargandoMas.set(true);
    this.api
      .listarNecesidades({ ...this.filtros(), offset: this.necesidades().length })
      .subscribe({
        next: (lista) => {
          const vistos = new Set(this.necesidades().map((item) => item.id_necesidad));
          this.necesidades.update((actuales) => [
            ...actuales,
            ...lista.filter((item) => !vistos.has(item.id_necesidad)),
          ]);
          this.hayMas.set(lista.length === TAMANO_PAGINA);
        },
        error: () => this.hayMas.set(false),
        complete: () => this.cargandoMas.set(false),
      });
  }

  cargarProductos(): void {
    this.estadoProductos.set('cargando');
    this.panelApi.listarProductos().subscribe({
      next: (productos) => {
        this.productosReales.set(productos);
        this.estadoProductos.set(productos.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estadoProductos.set('error'),
    });
  }

  cargarInstituciones(): void {
    this.api.listarInstituciones().subscribe({
      next: (lista) => {
        this.instituciones.set(lista);
        this.estadoInstituciones.set('datos');
      },
      error: () => this.estadoInstituciones.set('error'),
    });
  }

  fijarCategoria(id: number): void {
    this.categoriaId.set(id);
    this.cargarNecesidades();
  }

  fijarDistrito(id: number): void {
    this.distritoId.set(id);
    this.cargarNecesidades();
  }

  fijarInstitucion(id: number): void {
    this.institucionId.set(id);
    this.cargarNecesidades();
  }

  fijarPrioridad(valor: string): void {
    this.prioridad.set(valor);
    this.cargarNecesidades();
  }

  usarTermino(termino: string): void {
    this.termino.set(termino);
  }

  limpiarFiltros(): void {
    this.termino.set('');
    this.categoriaId.set(0);
    this.distritoId.set(0);
    this.institucionId.set(0);
    this.prioridad.set('');
    this.mostrarTodosProductos.set(false);
    this.cargarNecesidades();
  }

  rutaResultado(resultado: ResultadoCatalogo): string {
    return this.catalogo.rutaResultado(resultado);
  }

  unidadesTexto(producto: ProductoCatalogo): string {
    const simbolos = producto.unidades.map((unidad) => unidad.simbolo).filter(Boolean);
    return simbolos.length > 0 ? simbolos.join(', ') : 'unidad no registrada';
  }
}
