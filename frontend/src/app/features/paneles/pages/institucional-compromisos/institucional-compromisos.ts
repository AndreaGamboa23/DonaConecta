import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CompromisoDetalle,
  EntregaDetalle,
  LineaCompromisoDetalle,
  PuntoAcopioDTO,
  RecepcionDetalle,
  idCompromiso,
  idEntrega,
  idPuntoAcopio,
  itemsDe,
  notificacionLeida,
  recepcionesDeEntrega,
  tituloCompromiso,
} from '../../../../core/interfaces/integracion-final';
import { PanelApiService, PerfilInstitucional } from '../../../../core/services/panel-api.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { DonacionesApiService } from '../../../donaciones/services/donaciones-api.service';
import { MensajeriaApiService } from '../../../mensajes/services/mensajeria-api.service';
import {
  CambiarEstadoEntregaPayload,
  LineaRecepcionPayload,
  PanelOperacionesApiService,
  compromisosDe,
  puntosDe,
} from '../../services/panel-operaciones-api.service';

type EstadoPagina = 'cargando' | 'datos' | 'error' | 'sin-sesion';

interface RecepcionFormulario {
  readonly estado: FormControl<'PARCIAL' | 'CONFIRMADA' | 'OBSERVADA'>;
  readonly observaciones: FormControl<string>;
  readonly lineas: FormGroup<Record<string, FormControl<number>>>;
}

export interface BandejaEntrega {
  readonly compromisoId: number;
  readonly entregaId: number;
  readonly compromiso: CompromisoDetalle;
  readonly entrega: EntregaDetalle;
}

export function claveLinea(
  linea: Pick<LineaCompromisoDetalle, 'producto_id' | 'unidad_id'>,
): string {
  return `${linea.producto_id}-${linea.unidad_id}`;
}

export function pendienteLinea(linea: LineaCompromisoDetalle): number {
  if (linea.cantidad_pendiente !== undefined) return Number(linea.cantidad_pendiente);
  return Math.max(0, Number(linea.cantidad_comprometida) - Number(linea.cantidad_recibida ?? 0));
}

/**
 * El backend valida cada cantidad contra la línea real de la entrega. CONFIRMADA
 * sólo es honesta si lo que se está registrando cubre todo lo que aún falta.
 */
export function coberturaTotal(
  entrega: EntregaDetalle,
  compromiso: CompromisoDetalle,
  cantidades: Readonly<Record<string, number>>,
): boolean {
  const lineas = entrega.lineas?.length ? entrega.lineas : (compromiso.lineas ?? []);
  return (
    lineas.length > 0 &&
    lineas.every((linea) => Number(cantidades[claveLinea(linea)] ?? 0) >= pendienteLinea(linea))
  );
}

@Component({
  selector: 'app-institucional-compromisos',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHero],
  templateUrl: './institucional-compromisos.html',
  styleUrl: './institucional-compromisos.scss',
})
export class InstitucionalCompromisos implements OnInit {
  private readonly operaciones = inject(PanelOperacionesApiService);
  private readonly donacionesApi = inject(DonacionesApiService);
  private readonly notificacionesApi = inject(MensajeriaApiService);
  private readonly panelApi = inject(PanelApiService);
  private readonly ruta = inject(ActivatedRoute);
  readonly sesion = inject(SesionService);

  readonly estado = signal<EstadoPagina>('cargando');
  readonly error = signal('');
  readonly aviso = signal('');
  readonly compromisos = signal<readonly CompromisoDetalle[]>([]);
  readonly puntos = signal<readonly PuntoAcopioDTO[]>([]);
  readonly institucion = signal<PerfilInstitucional | null>(null);
  readonly procesando = signal(false);
  readonly seleccionId = signal(0);
  readonly noLeidas = signal<number | null>(null);
  readonly cantidades = signal<Readonly<Record<string, number>>>({});

  readonly bandeja = computed<readonly BandejaEntrega[]>(() =>
    this.compromisos().flatMap((compromiso) =>
      (compromiso.entregas ?? []).map((entrega) => ({
        compromisoId: idCompromiso(compromiso),
        entregaId: idEntrega(entrega),
        compromiso,
        entrega,
      })),
    ),
  );

  readonly seleccion = computed<BandejaEntrega | null>(
    () => this.bandeja().find((item) => item.entregaId === this.seleccionId()) ?? null,
  );

  private readonly compromisoSolicitado = Number(
    this.ruta.snapshot.queryParamMap.get('compromiso') ?? 0,
  );
  private readonly entregaSolicitada = Number(this.ruta.snapshot.queryParamMap.get('entrega') ?? 0);

  readonly entregaFormulario = new FormGroup({
    id_compromiso: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    id_punto_acopio: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    fecha_programada: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    observaciones: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  readonly recepcionFormularios = new Map<number, FormGroup<RecepcionFormulario>>();

  ngOnInit(): void {
    if (!this.sesion.autenticado()) {
      this.estado.set('sin-sesion');
      return;
    }
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.panelApi.obtenerPerfilInstitucional().subscribe({
      next: (perfil) => {
        this.institucion.set(perfil);
        forkJoin({
          compromisos: this.operaciones.listarCompromisos(),
          puntos: this.operaciones.listarPuntos({
            institucionId: perfil.id_institucion,
            publico: false,
          }),
        }).subscribe({
          next: ({ compromisos, puntos }) => {
            this.puntos.set(puntosDe(puntos));
            this.inicializarEntrega();
            const resumen = compromisosDe(compromisos);
            if (resumen.length === 0) {
              this.compromisos.set([]);
              this.sincronizarSeleccion();
              this.estado.set('datos');
              return;
            }
            forkJoin(
              resumen.map((item) => this.donacionesApi.obtenerCompromiso(idCompromiso(item))),
            ).subscribe({
              next: (detalles) => {
                this.compromisos.set(detalles);
                this.sincronizarSeleccion();
                this.estado.set('datos');
              },
              error: (fallo) => {
                this.error.set(mensajeErrorApi(fallo, 'Consultar el detalle de los compromisos'));
                this.estado.set('error');
              },
            });
          },
          error: (fallo) => {
            this.error.set(mensajeErrorApi(fallo, 'Consultar compromisos y puntos de acopio'));
            this.estado.set('error');
          },
        });
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar los datos de tu institución'));
        this.estado.set('error');
      },
    });
  }

  id(compromiso: CompromisoDetalle): number {
    return idCompromiso(compromiso);
  }

  titulo(compromiso: CompromisoDetalle): string {
    return tituloCompromiso(compromiso);
  }

  idEntrega(entrega: EntregaDetalle): number {
    return idEntrega(entrega);
  }

  idPunto(punto: PuntoAcopioDTO): number {
    return idPuntoAcopio(punto);
  }

  nombrePunto(puntoId: number): string {
    return this.puntos().find((punto) => idPuntoAcopio(punto) === puntoId)?.nombre ?? 'Sin punto asignado';
  }

  pendiente(comprometido: number, recibido: number | undefined, declarado?: number): number {
    if (declarado !== undefined) return Number(declarado);
    return Math.max(0, Number(comprometido) - Number(recibido ?? 0));
  }

  sincronizarCantidades(entrega: EntregaDetalle, compromiso: CompromisoDetalle): void {
    const formulario = this.formularioRecepcion(entrega, compromiso);
    this.cantidades.set({ ...formulario.getRawValue().lineas });
  }

  lineas(entrega: EntregaDetalle, compromiso: CompromisoDetalle): readonly LineaCompromisoDetalle[] {
    return entrega.lineas?.length ? entrega.lineas : (compromiso.lineas ?? []);
  }

  recepciones(
    entrega: EntregaDetalle,
    compromiso: CompromisoDetalle,
  ): readonly RecepcionDetalle[] {
    return recepcionesDeEntrega(compromiso, entrega);
  }

  puedeConfirmarTotal(entrega: EntregaDetalle, compromiso: CompromisoDetalle): boolean {
    return coberturaTotal(entrega, compromiso, this.cantidades());
  }

  puedeMarcarEnCamino(entrega: EntregaDetalle): boolean {
    return entrega.estado.toLocaleUpperCase('es') === 'PROGRAMADA';
  }

  puedeMarcarEntregada(entrega: EntregaDetalle): boolean {
    return ['PROGRAMADA', 'EN_CAMINO'].includes(entrega.estado.toLocaleUpperCase('es'));
  }

  fechaTexto(valor: string | null | undefined): string {
    if (!valor) return 'Sin fecha registrada';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha registrada';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  }

  claseEstado(estado: string): string {
    const valor = estado.toLocaleUpperCase('es');
    if (['PROGRAMADA', 'CONFIRMADA', 'RECIBIDA', 'COMPLETADA'].includes(valor)) return 'text-bg-success';
    if (['EN_CAMINO', 'PENDIENTE', 'CONFIRMADO'].includes(valor)) return 'text-bg-primary';
    if (['CANCELADA', 'INCIDENCIA', 'OBSERVADA', 'PARCIAL'].includes(valor)) return 'text-bg-warning';
    return 'text-bg-secondary';
  }

  seleccionar(item: BandejaEntrega): void {
    this.seleccionId.set(item.entregaId);
    this.sincronizarCantidades(item.entrega, item.compromiso);
    this.aviso.set('');
  }

  private sincronizarSeleccion(): void {
    const items = this.bandeja();
    if (items.some((item) => item.entregaId === this.seleccionId())) return;
    const preferida =
      (this.entregaSolicitada > 0
        ? items.find((item) => item.entregaId === this.entregaSolicitada)
        : undefined) ??
      (this.compromisoSolicitado > 0
        ? items.find((item) => item.compromisoId === this.compromisoSolicitado)
        : undefined) ??
      items[0];
    this.seleccionId.set(preferida?.entregaId ?? 0);
    if (preferida) this.sincronizarCantidades(preferida.entrega, preferida.compromiso);
  }

  private inicializarEntrega(): void {
    const compromisos = this.compromisos();
    const puntos = this.puntos();
    const solicitado = compromisos.find((item) => this.id(item) === this.compromisoSolicitado);
    this.entregaFormulario.patchValue({
      id_compromiso: solicitado
        ? this.id(solicitado)
        : compromisos.length
          ? this.id(compromisos[0])
          : 0,
      id_punto_acopio: puntos.length ? idPuntoAcopio(puntos[0]) : 0,
    });
  }

  programarEntrega(): void {
    if (this.entregaFormulario.invalid || this.procesando()) {
      this.entregaFormulario.markAllAsTouched();
      return;
    }
    const valor = this.entregaFormulario.getRawValue();
    this.procesando.set(true);
    this.aviso.set('');
    this.operaciones
      .crearEntrega({
        id_compromiso: valor.id_compromiso,
        id_punto_acopio: valor.id_punto_acopio,
        fecha_programada: new Date(valor.fecha_programada).toISOString(),
        observaciones: valor.observaciones.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.aviso.set('Entrega programada y líneas copiadas del compromiso.');
          this.procesando.set(false);
          this.cargar();
        },
        error: (fallo) => {
          this.aviso.set(mensajeErrorApi(fallo, 'Programar la entrega'));
          this.procesando.set(false);
        },
      });
  }

  cambiarEstado(entrega: EntregaDetalle, estado: CambiarEstadoEntregaPayload['estado']): void {
    const id = idEntrega(entrega);
    if (!id || this.procesando()) return;
    this.procesando.set(true);
    this.aviso.set('');
    this.operaciones.cambiarEstadoEntrega(id, { estado }).subscribe({
      next: () => {
        this.aviso.set(`Estado de la entrega actualizado a ${estado}.`);
        this.procesando.set(false);
        this.cargar();
      },
      error: (fallo) => {
        this.aviso.set(mensajeErrorApi(fallo, 'Actualizar el estado de la entrega'));
        this.procesando.set(false);
      },
    });
  }

  formularioRecepcion(
    entrega: EntregaDetalle,
    compromiso: CompromisoDetalle,
  ): FormGroup<RecepcionFormulario> {
    const id = idEntrega(entrega);
    const existente = this.recepcionFormularios.get(id);
    if (existente) return existente;

    const lineas: Record<string, FormControl<number>> = {};
    for (const linea of this.lineas(entrega, compromiso)) {
      const clave = claveLinea(linea);
      lineas[clave] = new FormControl(0, {
        nonNullable: true,
        validators: [Validators.min(0), Validators.max(pendienteLinea(linea))],
      });
    }
    const formulario = new FormGroup<RecepcionFormulario>({
      estado: new FormControl<'PARCIAL' | 'CONFIRMADA' | 'OBSERVADA'>('PARCIAL', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      observaciones: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
      lineas: new FormGroup(lineas),
    });
    this.recepcionFormularios.set(id, formulario);
    return formulario;
  }

  registrarRecepcion(entrega: EntregaDetalle, compromiso: CompromisoDetalle): void {
    const id = idEntrega(entrega);
    const formulario = this.formularioRecepcion(entrega, compromiso);
    if (formulario.invalid || this.procesando()) {
      formulario.markAllAsTouched();
      return;
    }
    const valor = formulario.getRawValue();
    const observaciones = valor.observaciones.trim();
    if (valor.estado === 'OBSERVADA' && !observaciones) {
      this.aviso.set('Una recepción observada requiere indicar el motivo.');
      return;
    }
    if (valor.estado === 'CONFIRMADA' && !this.puedeConfirmarTotal(entrega, compromiso)) {
      this.aviso.set(
        'Para confirmar el total, registra lo que falta en cada bien; si no, elige recepción parcial u observada.',
      );
      return;
    }
    const lineas: LineaRecepcionPayload[] = [];
    for (const [clave, cantidad] of Object.entries(valor.lineas)) {
      if (Number(cantidad) <= 0) continue;
      const [productoId, unidadId] = clave.split('-').map(Number);
      lineas.push({ producto_id: productoId, unidad_id: unidadId, cantidad_recibida: Number(cantidad) });
    }
    if (lineas.length === 0) {
      this.aviso.set('Indica la cantidad recibida de al menos un bien.');
      return;
    }

    this.procesando.set(true);
    this.aviso.set('');
    this.operaciones
      .registrarRecepcion(id, {
        estado: valor.estado,
        observaciones: observaciones || undefined,
        lineas,
      })
      .subscribe({
        next: () => {
          this.aviso.set('Recepción registrada. El detalle, las cantidades y las notificaciones se actualizaron.');
          this.procesando.set(false);
          formulario.reset({
            estado: 'PARCIAL',
            observaciones: '',
            lineas: Object.fromEntries(
              Object.keys(formulario.controls.lineas.controls).map((clave) => [clave, 0]),
            ),
          });
          this.cantidades.set({});
          this.cargar();
          this.refrescarNotificaciones();
        },
        error: (fallo) => {
          this.aviso.set(mensajeErrorApi(fallo, 'Registrar la recepción'));
          this.procesando.set(false);
        },
      });
  }

  private refrescarNotificaciones(): void {
    this.notificacionesApi.listarNotificaciones().subscribe({
      next: (respuesta) => {
        const sobre = respuesta as { no_leidas?: number };
        const calculadas = itemsDe(respuesta).filter((notificacion) => !notificacionLeida(notificacion))
          .length;
        this.noLeidas.set(
          typeof sobre.no_leidas === 'number' ? sobre.no_leidas : calculadas,
        );
      },
      error: () => this.noLeidas.set(null),
    });
  }
}
