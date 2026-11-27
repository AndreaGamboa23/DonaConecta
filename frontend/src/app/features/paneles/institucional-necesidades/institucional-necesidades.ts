import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  CategoriaCatalogo,
  CrearNecesidadPayload,
  EstadoNecesidad,
  NecesidadInstitucional,
  PanelApiService,
  PerfilInstitucional,
  PrioridadNecesidad,
  ProductoCatalogo,
  UnidadMedidaCatalogo,
  UnidadProducto,
} from '../../../core/services/panel-api.service';
import { mensajeErrorApi } from '../../../core/utils/errores-api';
import { PanelEncabezado } from '../components/panel-encabezado/panel-encabezado';
import { PanelEstado } from '../components/panel-estado/panel-estado';

type LineaForm = FormGroup<{
  producto_id: FormControl<number>;
  unidad_id: FormControl<number>;
  cantidad: FormControl<number>;
}>;

type EstadoPagina = 'cargando' | 'datos' | 'error';

@Component({
  selector: 'app-institucional-necesidades',
  standalone: true,
  imports: [ReactiveFormsModule, PanelEncabezado, PanelEstado],
  templateUrl: './institucional-necesidades.html',
  styleUrl: './institucional-necesidades.scss',
})
export class InstitucionalNecesidades implements OnInit {
  private readonly api = inject(PanelApiService);

  readonly estado = signal<EstadoPagina>('cargando');
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly mensajeEsError = signal(false);
  readonly guardando = signal(false);
  readonly necesidades = signal<readonly NecesidadInstitucional[]>([]);
  readonly productos = signal<readonly ProductoCatalogo[]>([]);
  readonly categorias = signal<readonly CategoriaCatalogo[]>([]);
  readonly unidades = signal<readonly UnidadMedidaCatalogo[]>([]);
  readonly perfil = signal<PerfilInstitucional | null>(null);
  readonly filtroEstado = signal('');
  readonly cancelandoId = signal<number | null>(null);
  readonly motivoCancelacion = signal('');

  readonly form = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4), Validators.maxLength(200)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(600)],
    }),
    prioridad: new FormControl<PrioridadNecesidad>('MEDIA', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fecha_limite: new FormControl('', { nonNullable: true }),
    id_categoria: new FormControl(0, { nonNullable: true }),
    lineas: new FormArray<LineaForm>([]),
  });

  readonly necesidadesFiltradas = computed(() => {
    const estado = this.filtroEstado();
    if (!estado) return this.necesidades();
    return this.necesidades().filter(
      (necesidad) => necesidad.estado.toLocaleUpperCase('es') === estado,
    );
  });

  readonly catalogoSinProductos = computed(() => this.productos().length === 0);

  constructor() {
    this.anadirLinea();
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    forkJoin({
      necesidades: this.api.listarNecesidadesInstitucionales(),
      productos: this.api.listarProductos(),
      categorias: this.api.listarCategorias(),
      unidades: this.api.listarUnidades(),
      perfil: this.api.obtenerPerfilInstitucional(),
    }).subscribe({
      next: (datos) => {
        this.necesidades.set(datos.necesidades);
        this.productos.set(datos.productos);
        this.categorias.set(datos.categorias);
        this.unidades.set(datos.unidades);
        this.perfil.set(datos.perfil);
        this.estado.set('datos');
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar las necesidades y el catálogo'));
        this.estado.set('error');
      },
    });
  }

  idCategoria(categoria: CategoriaCatalogo): number {
    return categoria.categoria_id ?? categoria.id_categoria ?? 0;
  }

  anadirLinea(): void {
    this.form.controls.lineas.push(
      new FormGroup({
        producto_id: new FormControl(0, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(1)],
        }),
        unidad_id: new FormControl(0, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(1)],
        }),
        cantidad: new FormControl(0, {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0.01)],
        }),
      }),
    );
  }

  quitarLinea(indice: number): void {
    if (this.form.controls.lineas.length <= 1) return;
    this.form.controls.lineas.removeAt(indice);
  }

  alCambiarProducto(indice: number, evento: Event): void {
    const id = Number((evento.target as HTMLSelectElement).value);
    const producto = this.productos().find((item) => item.producto_id === id);
    const preferida =
      producto?.unidades.find((unidad) => unidad.es_preferida) ?? producto?.unidades[0];
    this.form.controls.lineas.at(indice)?.patchValue({
      unidad_id: preferida?.unidad_id ?? 0,
    });
  }

  unidadesDe(productoId: number): readonly UnidadProducto[] {
    const producto = this.productos().find((item) => item.producto_id === productoId);
    if (producto?.unidades.length) return producto.unidades;
    return this.unidades()
      .map((unidad) => ({
        unidad_id: unidad.unidad_id ?? unidad.id_unidad ?? 0,
        codigo: unidad.codigo,
        nombre: unidad.nombre,
        simbolo: unidad.simbolo,
        es_preferida: false,
      }))
      .filter((unidad) => unidad.unidad_id > 0);
  }

  crear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.avisar('Completa el título, la descripción y al menos una línea válida.', true);
      return;
    }

    const valor = this.form.getRawValue();
    if (valor.lineas.length === 0) {
      this.avisar('Agrega al menos un bien material a la solicitud.', true);
      return;
    }

    const datos: CrearNecesidadPayload = {
      titulo: valor.titulo.trim(),
      descripcion: valor.descripcion.trim(),
      prioridad: valor.prioridad,
      fecha_limite: valor.fecha_limite || null,
      id_categoria: valor.id_categoria > 0 ? valor.id_categoria : null,
      lineas: valor.lineas.map((linea) => ({
        producto_id: linea.producto_id,
        unidad_id: linea.unidad_id,
        cantidad: linea.cantidad,
      })),
    };

    this.guardando.set(true);
    this.avisar('');
    this.api.crearNecesidad(datos).subscribe({
      next: (respuesta) => {
        this.necesidades.update((lista) => [respuesta.necesidad, ...lista]);
        this.reiniciarFormulario();
        this.avisar(respuesta.mensaje);
        this.guardando.set(false);
      },
      error: (fallo) => {
        this.avisar(mensajeErrorApi(fallo, 'Publicar la solicitud'), true);
        this.guardando.set(false);
      },
    });
  }

  /** Sólo transiciones permitidas por las reglas de negocio del backend. */
  acciones(necesidad: NecesidadInstitucional): readonly EstadoNecesidad[] {
    const estado = necesidad.estado.toLocaleUpperCase('es');
    if (estado === 'BORRADOR') return ['PUBLICADA', 'CANCELADA'];
    if (estado === 'PUBLICADA') return ['PAUSADA', 'CANCELADA'];
    if (estado === 'PAUSADA') return ['PUBLICADA', 'CANCELADA'];
    return [];
  }

  prepararCancelacion(necesidad: NecesidadInstitucional): void {
    this.cancelandoId.set(necesidad.id_necesidad);
    this.motivoCancelacion.set('');
    this.avisar('');
  }

  cancelarEdicion(): void {
    this.cancelandoId.set(null);
    this.motivoCancelacion.set('');
    this.avisar('');
  }

  cambiarEstado(necesidad: NecesidadInstitucional, estado: EstadoNecesidad): void {
    this.avisar('');
    if (estado === 'CANCELADA') {
      if (this.cancelandoId() !== necesidad.id_necesidad) {
        this.prepararCancelacion(necesidad);
        return;
      }
      if (this.motivoCancelacion().trim().length < 4) {
        this.avisar('Escribe el motivo de la cancelación antes de continuar.', true);
        return;
      }
    }

    const cuerpo =
      estado === 'CANCELADA'
        ? { estado, motivo: this.motivoCancelacion().trim() }
        : { estado };
    this.api.actualizarNecesidad(necesidad.id_necesidad, cuerpo).subscribe({
      next: (respuesta) => {
        this.necesidades.update((lista) =>
          lista.map((item) =>
            item.id_necesidad === respuesta.necesidad.id_necesidad
              ? respuesta.necesidad
              : item,
          ),
        );
        this.cancelandoId.set(null);
        this.motivoCancelacion.set('');
        this.avisar(respuesta.mensaje);
      },
      error: (fallo) => this.avisar(mensajeErrorApi(fallo, 'Actualizar la solicitud'), true),
    });
  }

  eliminarBorrador(necesidad: NecesidadInstitucional): void {
    if (necesidad.estado.toLocaleUpperCase('es') !== 'BORRADOR') {
      this.avisar('Solo se puede eliminar una solicitud que todavía sea borrador.', true);
      return;
    }
    this.avisar('');
    this.api.eliminarNecesidad(necesidad.id_necesidad).subscribe({
      next: () => {
        this.necesidades.update((lista) =>
          lista.filter((item) => item.id_necesidad !== necesidad.id_necesidad),
        );
        this.avisar('El borrador se eliminó correctamente.');
      },
      error: (fallo) => this.avisar(mensajeErrorApi(fallo, 'Eliminar el borrador'), true),
    });
  }

  etiquetaEstado(estado: string): string {
    const valor = estado.toLocaleUpperCase('es');
    const etiquetas: Readonly<Record<string, string>> = {
      BORRADOR: 'Borrador',
      PUBLICADA: 'Publicada',
      PAUSADA: 'Pausada',
      COMPLETADA: 'Completada',
      VENCIDA: 'Vencida',
      CANCELADA: 'Cancelada',
    };
    return etiquetas[valor] ?? estado;
  }

  claseEstado(estado: string): string {
    const valor = estado.toLocaleUpperCase('es');
    if (valor === 'PUBLICADA' || valor === 'COMPLETADA') return 'badge rounded-pill text-bg-success';
    if (valor === 'PAUSADA' || valor === 'BORRADOR') return 'badge rounded-pill text-bg-warning';
    if (valor === 'CANCELADA' || valor === 'VENCIDA') return 'badge rounded-pill text-bg-secondary';
    return 'badge rounded-pill text-bg-light';
  }

  /** Disponibilidad real calculada por la vista de SQL Server, sin doble conteo. */
  disponible(necesidad: NecesidadInstitucional): number {
    return Math.max(
      0,
      necesidad.cantidad_requerida -
        necesidad.cantidad_comprometida -
        necesidad.cantidad_recibida,
    );
  }

  disponibleTexto(necesidad: NecesidadInstitucional): string {
    return `${this.disponible(necesidad)} ${necesidad.unidad_medida_base}`.trim();
  }

  private avisar(texto: string, esError = false): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(esError);
  }

  private reiniciarFormulario(): void {
    this.form.controls.lineas.clear();
    this.form.reset({
      titulo: '',
      descripcion: '',
      prioridad: 'MEDIA',
      fecha_limite: '',
      id_categoria: 0,
    });
    this.anadirLinea();
  }
}
