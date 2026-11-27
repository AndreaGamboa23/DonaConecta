import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CompromisoDetalle,
  EntregaDetalle,
  EventoHistorial,
  LineaCompromisoDetalle,
  historialDe,
  idCompromiso,
  idInstitucion,
  idEntrega,
  idPunto,
  tituloCompromiso,
} from '../../../../core/interfaces/integracion-final';
import { SesionService } from '../../../../core/services/sesion.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { coordenadasValidas } from '../../../../shared/components/mapa-huancayo/mapa-huancayo';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { DonacionesApiService } from '../../services/donaciones-api.service';

type EstadoPagina = 'cargando' | 'datos' | 'error' | 'sin-sesion';

function texto(valor: string | null | undefined): string {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : '';
}

@Component({
  selector: 'app-mis-donaciones',
  standalone: true,
  imports: [RouterLink, EmptyState, Icon, PageHero],
  templateUrl: './mis-donaciones.html',
  styleUrl: './mis-donaciones.scss',
})
export class MisDonaciones implements OnInit {
  private readonly donacionesApi = inject(DonacionesApiService);
  readonly sesion = inject(SesionService);

  readonly estado = signal<EstadoPagina>('cargando');
  readonly error = signal('');
  readonly compromisos = signal<readonly CompromisoDetalle[]>([]);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (!this.sesion.autenticado()) {
      this.estado.set('sin-sesion');
      return;
    }

    this.estado.set('cargando');
    this.error.set('');
    this.donacionesApi.listarDonaciones().subscribe({
      next: (lista) => {
        const ids = lista
          .map((item) => Number(item.id_compromiso))
          .filter((id) => Number.isInteger(id) && id > 0);
        if (ids.length === 0) {
          this.compromisos.set([]);
          this.estado.set('datos');
          return;
        }

        forkJoin(ids.map((id) => this.donacionesApi.obtenerCompromiso(id))).subscribe({
          next: (detalles) => {
            this.compromisos.set(detalles);
            this.estado.set('datos');
          },
          error: (fallo) => {
            this.error.set(mensajeErrorApi(fallo, 'Consultar el detalle de tus compromisos'));
            this.estado.set('error');
          },
        });
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar tus compromisos'));
        this.estado.set('error');
      },
    });
  }

  id(compromiso: CompromisoDetalle): number {
    return idCompromiso(compromiso);
  }

  idInstitucion(compromiso: CompromisoDetalle): number {
    return idInstitucion(compromiso);
  }

  puntoId(compromiso: CompromisoDetalle): number {
    const entrega = this.primeraEntrega(compromiso);
    return idPunto(compromiso) || Number(entrega?.id_punto_acopio ?? 0) || 0;
  }

  /** Primero los campos raíz del DTO; la entrega sólo completa lo que falte. */
  puntoNombre(compromiso: CompromisoDetalle): string {
    const entrega = this.primeraEntrega(compromiso);
    return (
      texto(compromiso.nombre_punto) ||
      texto(compromiso.punto_acopio) ||
      texto(entrega?.nombre_punto) ||
      texto(entrega?.direccion_acopio)
    );
  }

  direccionPunto(compromiso: CompromisoDetalle): string {
    const entrega = this.primeraEntrega(compromiso);
    return texto(compromiso.direccion_acopio) || texto(entrega?.direccion_acopio);
  }

  referenciasPunto(compromiso: CompromisoDetalle): string {
    const entrega = this.primeraEntrega(compromiso);
    return texto(compromiso.referencias_entrega) || texto(entrega?.referencias_entrega);
  }

  institucionNombre(compromiso: CompromisoDetalle): string {
    return texto(compromiso.institucion);
  }

  horarios(compromiso: CompromisoDetalle): string {
    const raiz = texto(compromiso.horario_programado);
    if (raiz) return raiz;
    const activos = (this.primeraEntrega(compromiso)?.horarios ?? []).filter(
      (horario) => horario.activo !== false,
    );
    if (!activos.length) return '';
    const nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return activos
      .map(
        (horario) =>
          `${nombres[horario.dia_semana - 1] ?? 'Día'} ${horario.hora_apertura.slice(0, 5)}–${horario.hora_cierre.slice(0, 5)}`,
      )
      .join(' · ');
  }

  horariosTexto(compromiso: CompromisoDetalle): string {
    return this.horarios(compromiso) || 'Por coordinar con la institución';
  }

  coordenadasPunto(compromiso: CompromisoDetalle): readonly [number, number] | null {
    return coordenadasValidas(compromiso) ?? coordenadasValidas(this.primeraEntrega(compromiso));
  }

  /** Parámetros codificados por Angular Router; sólo datos reales del DTO. */
  parametrosMapa(compromiso: CompromisoDetalle): Record<string, string | number> {
    const parametros: Record<string, string | number> = {};
    const punto = this.puntoId(compromiso);
    const compromisoId = this.id(compromiso);
    if (punto > 0) parametros['punto'] = punto;
    if (compromisoId > 0) parametros['compromiso'] = compromisoId;

    const nombre = this.puntoNombre(compromiso);
    const direccion = this.direccionPunto(compromiso);
    const horario = this.horarios(compromiso);
    const institucion = this.institucionNombre(compromiso);
    if (nombre) parametros['nombre'] = nombre;
    if (direccion) parametros['direccion'] = direccion;
    if (horario) parametros['horario'] = horario;
    if (institucion) parametros['institucion'] = institucion;

    const coordenadas = this.coordenadasPunto(compromiso);
    if (coordenadas) {
      parametros['lat'] = coordenadas[0];
      parametros['lng'] = coordenadas[1];
    }
    return parametros;
  }

  primeraEntrega(compromiso: CompromisoDetalle): EntregaDetalle | null {
    return compromiso.entregas?.[0] ?? null;
  }

  /** La ruta de seguimiento se identifica por entrega, no por compromiso. */
  entregaId(compromiso: CompromisoDetalle): number {
    return idEntrega(this.primeraEntrega(compromiso) ?? { estado: '' });
  }

  titulo(compromiso: CompromisoDetalle): string {
    return tituloCompromiso(compromiso);
  }

  lineas(compromiso: CompromisoDetalle): readonly LineaCompromisoDetalle[] {
    return compromiso.lineas ?? [];
  }

  historial(compromiso: CompromisoDetalle): readonly EventoHistorial[] {
    return [...historialDe(compromiso)]
      .sort((a, b) => this.fecha(this.fechaEvento(b)) - this.fecha(this.fechaEvento(a)))
      .slice(0, 4);
  }

  fechaEvento(evento: EventoHistorial): string | null {
    return evento.cambiado_en ?? evento.creado_en ?? evento.fecha ?? null;
  }

  nombreLinea(linea: LineaCompromisoDetalle): string {
    return linea.producto ?? `Bien #${linea.producto_id}`;
  }

  simboloLinea(linea: LineaCompromisoDetalle): string {
    return linea.simbolo ?? linea.unidad_codigo ?? linea.unidad ?? '';
  }

  pendiente(linea: LineaCompromisoDetalle): number {
    if (linea.cantidad_pendiente !== undefined) return Number(linea.cantidad_pendiente);
    return Math.max(
      0,
      Number(linea.cantidad_comprometida) - Number(linea.cantidad_recibida ?? 0),
    );
  }

  avance(linea: LineaCompromisoDetalle): number {
    const comprometido = Number(linea.cantidad_comprometida);
    if (comprometido <= 0) return 0;
    return Math.min(
      100,
      Math.round((Number(linea.cantidad_recibida ?? 0) / comprometido) * 100),
    );
  }

  fecha(valor: string | null | undefined): number {
    if (!valor) return 0;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
  }

  fechaTexto(valor: string | null | undefined): string {
    const tiempo = this.fecha(valor);
    if (!tiempo) return 'Sin fecha registrada';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(tiempo));
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Readonly<Record<string, string>> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADO: 'Confirmado',
      EN_CAMINO: 'En camino',
      ENTREGADA: 'Entregada',
      RECIBIDA: 'Recibida',
      CANCELADA: 'Cancelada',
      INCIDENCIA: 'Incidencia',
      COMPLETADA: 'Completada',
    };
    return etiquetas[estado.toLocaleUpperCase('es')] ?? estado;
  }

  claseEstado(estado: string): string {
    const valor = estado.toLocaleUpperCase('es');
    if (['CONFIRMADO', 'ENTREGADA', 'RECIBIDA', 'COMPLETADA'].includes(valor)) {
      return 'text-bg-success';
    }
    if (['EN_CAMINO', 'PENDIENTE'].includes(valor)) return 'text-bg-primary';
    if (['CANCELADA', 'INCIDENCIA'].includes(valor)) return 'text-bg-secondary';
    return 'text-bg-warning';
  }

  eventoTexto(evento: EventoHistorial): string {
    return (
      evento.motivo ??
      evento.descripcion ??
      evento.observaciones ??
      evento.estado_nuevo ??
      evento.estado ??
      evento.evento ??
      evento.tipo ??
      'Actualización registrada'
    );
  }
}
