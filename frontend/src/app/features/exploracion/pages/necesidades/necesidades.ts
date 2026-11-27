import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CATEGORIAS_INFORMATIVAS, DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import { ResultadoCatalogo } from '../../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { CatalogoInformativoService } from '../../../../core/services/catalogo-informativo.service';
import { PanelApiService, ProductoCatalogo } from '../../../../core/services/panel-api.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { BuscadorCatalogo } from '../../../../shared/components/buscador-catalogo/buscador-catalogo';
import { CategoriasDestacadas } from '../../../../shared/components/categorias-destacadas/categorias-destacadas';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { DonacionesApiService } from '../../../donaciones/services/donaciones-api.service';
import { ExploracionApiService, NecesidadReal } from '../../services/exploracion-api.service';

type EstadoResultados = 'servicio-no-disponible' | 'cargando' | 'error' | 'vacio' | 'datos';

/** Exploración pública: catálogo informativo real y solicitudes desde la API autorizada. */
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
  private readonly panelApi = inject(PanelApiService);
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

  readonly estadoResultados = signal<EstadoResultados>(
    this.estado.disponible ? 'cargando' : 'servicio-no-disponible',
  );
  readonly todasNecesidades = signal<readonly NecesidadReal[]>([]);
  readonly productosReales = signal<readonly ProductoCatalogo[]>([]);
  readonly estadoProductos = signal<'cargando' | 'datos' | 'vacio' | 'error'>('cargando');
  readonly mensajeCompromiso = signal('');
  readonly cantidades = signal<Readonly<Record<number, number>>>({});

  readonly necesidadesFiltradas = computed(() => {
    const lista = this.todasNecesidades();
    const categoriaNombre = CATEGORIAS_INFORMATIVAS.find((c) => c.id === this.categoriaId())?.nombre;
    const distritoNombre = DISTRITOS_HUANCAYO.find((d) => d.id === this.distritoId())?.nombre;
    const prioridad = this.prioridad();

    return lista.filter((necesidad) => {
      if (categoriaNombre && necesidad.categoria.toLocaleLowerCase('es') !== categoriaNombre.toLocaleLowerCase('es')) {
        return false;
      }
      if (distritoNombre && necesidad.distrito !== distritoNombre) return false;
      if (prioridad && necesidad.prioridad !== prioridad) return false;
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
    this.cargarProductos();
  }

  cargarNecesidades(): void {
    if (!this.estado.disponible) {
      this.estadoResultados.set('servicio-no-disponible');
      return;
    }
    this.estadoResultados.set('cargando');
    this.api.listarNecesidades(this.categoriaId(), this.distritoId()).subscribe({
      next: (lista) => {
        this.todasNecesidades.set(lista);
        this.estadoResultados.set(lista.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estadoResultados.set('error'),
    });
  }

  /** Bienes materiales persistidos en SQL Server, sin mezclarlos con la guía informativa. */
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

  fijarCategoria(id: number): void {
    this.categoriaId.set(id);
    this.cargarNecesidades();
  }

  fijarDistrito(id: number): void {
    this.distritoId.set(id);
    this.cargarNecesidades();
  }

  puedeComprometer(): boolean {
    return (this.sesion.usuario()?.roles ?? []).some(
      (rol) => rol.toLocaleUpperCase('es') === 'DONANTE',
    );
  }

  faltante(necesidad: NecesidadReal): number {
    return Math.max(0, necesidad.cantidad_requerida - necesidad.cantidad_comprometida);
  }

  fijarCantidad(idNecesidad: number, evento: Event): void {
    const valor = Number((evento.target as HTMLInputElement).value);
    const actuales = { ...this.cantidades() };
    if (Number.isFinite(valor) && valor > 0) actuales[idNecesidad] = valor;
    else delete actuales[idNecesidad];
    this.cantidades.set(actuales);
  }

  comprometer(necesidad: NecesidadReal): void {
    const cantidad = this.cantidades()[necesidad.id_necesidad];
    const faltante = this.faltante(necesidad);
    this.mensajeCompromiso.set('');

    if (!this.puedeComprometer()) {
      this.mensajeCompromiso.set('Inicia sesión con una cuenta de donante para comprometer bienes.');
      return;
    }
    if (!cantidad || cantidad <= 0) {
      this.mensajeCompromiso.set('Indica la cantidad que deseas comprometer.');
      return;
    }
    if (faltante > 0 && cantidad > faltante) {
      this.mensajeCompromiso.set(`La cantidad disponible es ${faltante} ${necesidad.unidad_medida_base}.`);
      return;
    }

    this.donacionesApi
      .crearCompromiso({
        id_necesidad: necesidad.id_necesidad,
        cantidad_comprometida: cantidad,
        comentario: 'Compromiso registrado desde la web de DonaConecta',
      })
      .subscribe({
        next: () => {
          this.mensajeCompromiso.set(
            `Compromiso de ${cantidad} ${necesidad.unidad_medida_base} registrado para «${necesidad.titulo}».`,
          );
          this.cargarNecesidades();
        },
        error: (error) => {
          const detalle = error?.error?.detail;
          this.mensajeCompromiso.set(
            typeof detalle === 'string'
              ? detalle
              : 'No se pudo registrar el compromiso. Verifica tu sesión e inténtalo de nuevo.',
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
