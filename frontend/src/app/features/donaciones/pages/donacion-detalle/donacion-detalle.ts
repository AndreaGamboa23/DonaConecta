import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CompromisoDetalle,
  historialDe,
  idCompromiso,
  idEntrega,
  idPunto,
  idInstitucion,
  recepcionesDeEntrega,
  tituloCompromiso,
} from '../../../../core/interfaces/integracion-final';
import { SesionService } from '../../../../core/services/sesion.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  MapaHuancayo,
  MarcadorMapa,
  coordenadasValidas,
} from '../../../../shared/components/mapa-huancayo/mapa-huancayo';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { DonacionesApiService } from '../../services/donaciones-api.service';

type EstadoPagina = 'cargando' | 'datos' | 'error' | 'sin-sesion';

function texto(valor: string | null | undefined): string {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : '';
}

interface HitoSeguimiento {
  readonly id: string;
  readonly titulo: string;
  readonly detalle: string;
  readonly fecha: string | null;
  readonly icono: string;
  readonly tono: string;
}

@Component({
  selector: 'app-donacion-detalle',
  standalone: true,
  imports: [RouterLink, Icon, MapaHuancayo, PageHero],
  templateUrl: './donacion-detalle.html',
  styleUrl: './donacion-detalle.scss',
})
export class DonacionDetalle implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly api = inject(DonacionesApiService);
  readonly sesion = inject(SesionService);

  readonly estado = signal<EstadoPagina>('cargando');
  readonly error = signal('');
  readonly compromiso = signal<CompromisoDetalle | null>(null);

  ngOnInit(): void {
    if (!this.sesion.autenticado()) {
      this.estado.set('sin-sesion');
      return;
    }
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('El identificador de la donación no es válido.');
      this.estado.set('error');
      return;
    }

    this.api.obtenerCompromiso(id).subscribe({
      next: (compromiso) => {
        this.compromiso.set(compromiso);
        this.estado.set('datos');
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar el detalle de la donación'));
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

  tituloPagina(): string {
    const compromiso = this.compromiso();
    return compromiso ? tituloCompromiso(compromiso) : 'Detalle de donación';
  }

  idInstitucion(compromiso: CompromisoDetalle): number {
    return idInstitucion(compromiso);
  }

  puntoId(compromiso: CompromisoDetalle): number {
    return idPunto(compromiso) || this.primeraEntrega(compromiso)?.id_punto_acopio || 0;
  }

  primeraEntrega(compromiso: CompromisoDetalle) {
    return compromiso.entregas?.[0] ?? null;
  }

  /** La ruta de seguimiento se identifica por entrega, no por compromiso. */
  entregaId(compromiso: CompromisoDetalle): number {
    return idEntrega(this.primeraEntrega(compromiso) ?? { estado: '' });
  }

  /** Primero los campos raíz del DTO; la entrega sólo completa lo que falte. */
  nombrePunto(compromiso: CompromisoDetalle): string {
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

  destinoMapa(compromiso: CompromisoDetalle) {
    const coords = this.coordenadasPunto(compromiso);
    if (!coords) return null;
    return { latitud: coords[0], longitud: coords[1], nombre: this.nombrePunto(compromiso) };
  }

  /** Parámetros codificados por Angular Router; sólo datos reales del DTO. */
  parametrosMapa(compromiso: CompromisoDetalle): Record<string, string | number> {
    const parametros: Record<string, string | number> = {};
    const punto = this.puntoId(compromiso);
    const compromisoId = this.id(compromiso);
    if (punto > 0) parametros['punto'] = punto;
    if (compromisoId > 0) parametros['compromiso'] = compromisoId;

    const nombre = this.nombrePunto(compromiso);
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

  marcadores(compromiso: CompromisoDetalle): readonly MarcadorMapa[] {
    const coords = this.coordenadasPunto(compromiso);
    if (!coords) return [];
    return [
      {
        id: this.puntoId(compromiso) || -1,
        nombre: this.nombrePunto(compromiso),
        latitud: coords[0],
        longitud: coords[1],
      },
    ];
  }

  hitos(compromiso: CompromisoDetalle): readonly HitoSeguimiento[] {
    const hitos: HitoSeguimiento[] = [];

    hitos.push({
      id: `compromiso-${this.id(compromiso)}`,
      titulo: 'Compromiso registrado',
      detalle: `${tituloCompromiso(compromiso)} · ${compromiso.estado}`,
      fecha: compromiso.creado_en ?? compromiso.fecha_compromiso ?? null,
      icono: 'gift',
      tono: 'text-bg-primary',
    });

    for (const entrega of compromiso.entregas ?? []) {
      hitos.push({
        id: `entrega-${idEntrega(entrega)}`,
        titulo: `Entrega ${this.etiquetaEstado(entrega.estado)}`,
        detalle:
          entrega.observaciones ??
          entrega.nombre_punto ??
          entrega.direccion_acopio ??
          'Entrega registrada',
        fecha:
          entrega.fecha_programada ??
          entrega.fecha_real_inicio ??
          entrega.fecha_entrega ??
          entrega.creado_en ??
          null,
        icono: 'truck',
        tono: 'text-bg-info',
      });

      for (const [indiceRecepcion, recepcion] of recepcionesDeEntrega(compromiso, entrega).entries()) {
        hitos.push({
          id: `recepcion-${recepcion.recepcion_id ?? recepcion.id_recepcion ?? indiceRecepcion}`,
          titulo: `Recepción ${recepcion.estado ?? 'registrada'}`,
          detalle: recepcion.observaciones ?? 'Recepción registrada por la institución',
          fecha: recepcion.fecha_confirmacion ?? recepcion.creado_en ?? null,
          icono: 'check-circle',
          tono: 'text-bg-success',
        });
      }
    }

    for (const [indice, evento] of historialDe(compromiso).entries()) {
      hitos.push({
        id: `historial-${evento.historial_id ?? evento.evento_id ?? evento.id ?? indice}`,
        titulo: evento.estado_nuevo ?? evento.estado ?? evento.evento ?? evento.tipo ?? 'Actualización',
        detalle:
          evento.motivo ??
          evento.descripcion ??
          evento.observaciones ??
          (evento.estado_anterior ? `Antes: ${evento.estado_anterior}` : 'Registro de auditoría'),
        fecha: evento.cambiado_en ?? evento.creado_en ?? evento.fecha ?? null,
        icono: 'clock',
        tono: 'text-bg-light',
      });
    }

    return [...hitos].sort((a, b) => this.fecha(b.fecha) - this.fecha(a.fecha));
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
      PENDIENTE: 'pendiente',
      CONFIRMADO: 'confirmado',
      PROGRAMADA: 'programada',
      EN_CAMINO: 'en camino',
      ENTREGADA: 'entregada',
      PARCIAL: 'parcial',
      CONFIRMADA: 'confirmada',
      OBSERVADA: 'observada',
      CANCELADA: 'cancelada',
      INCIDENCIA: 'con incidencia',
    };
    return etiquetas[estado.toLocaleUpperCase('es')] ?? estado.toLocaleLowerCase('es');
  }

  simboloLinea(simbolo: string | undefined, unidad: string | undefined): string {
    return simbolo ?? unidad ?? '';
  }


  pendiente(comprometido: number, recibido: number | undefined, declarado?: number): number {
    if (declarado !== undefined) return Number(declarado);
    return Math.max(0, Number(comprometido) - Number(recibido ?? 0));
  }
}
