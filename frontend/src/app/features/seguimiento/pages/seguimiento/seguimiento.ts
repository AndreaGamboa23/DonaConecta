import { Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CompromisoDetalle,
  EntregaDetalle,
  coordenadas,
  idCompromiso,
  idEntrega,
  recepcionesDeEntrega,
} from '../../../../core/interfaces/integracion-final';
import { SesionService } from '../../../../core/services/sesion.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { Icon } from '../../../../shared/components/icon/icon';
import { MapaHuancayo, MarcadorMapa } from '../../../../shared/components/mapa-huancayo/mapa-huancayo';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { DonacionesApiService } from '../../../donaciones/services/donaciones-api.service';
import {
  PanelOperacionesApiService,
  compromisosDe,
} from '../../../paneles/services/panel-operaciones-api.service';
import { GpsApiService } from '../../services/gps-api.service';
import { etapasSeguimiento } from './etapas-seguimiento';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [RouterLink, Icon, MapaHuancayo, PageHero],
  templateUrl: './seguimiento.html',
  styleUrl: './seguimiento.scss',
})
export class Seguimiento implements OnDestroy {
  private readonly ruta = inject(ActivatedRoute);
  private readonly gps = inject(GpsApiService);
  private readonly donacionesApi = inject(DonacionesApiService);
  private readonly operaciones = inject(PanelOperacionesApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly sesion = inject(SesionService);

  readonly cargando = signal(false);
  readonly cargandoContexto = signal(false);
  readonly procesandoEstado = signal(false);
  readonly compartiendo = signal(false);
  readonly consentimiento = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly expiraEn = signal<string | null>(null);
  readonly ultimaActualizacion = signal<string | null>(null);
  readonly marcadores = signal<readonly MarcadorMapa[]>([]);
  readonly compromiso = signal<CompromisoDetalle | null>(null);
  readonly entrega = signal<EntregaDetalle | null>(null);

  readonly etapas = computed(() => etapasSeguimiento(this.compromiso(), this.entrega()));
  readonly compromisoId = computed(() => idCompromiso(this.compromiso() ?? { estado: '' }));
  readonly puntoId = computed(
    () =>
      Number(
        this.entrega()?.id_punto_acopio ??
          this.compromiso()?.id_punto_acopio ??
          0,
      ) || 0,
  );
  readonly estadoEntrega = computed(() => (this.entrega()?.estado ?? '').toLocaleUpperCase('es'));
  readonly parametrosPunto = computed<Record<string, string | number | null>>(() => {
    const compromiso = this.compromiso();
    const sinParametros: Record<string, string | number | null> = {};
    if (!compromiso || this.puntoId() <= 0) return sinParametros;
    const entrega = this.entrega();
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horario = (entrega?.horarios ?? [])
      .filter((item) => item.activo !== false)
      .map(
        (item) =>
          `${dias[item.dia_semana - 1] ?? 'Día'} ${item.hora_apertura.slice(0, 5)}–${item.hora_cierre.slice(0, 5)}`,
      )
      .join(' · ');
    return {
      punto: this.puntoId(),
      compromiso: this.compromisoId(),
      nombre: entrega?.nombre_punto ?? compromiso.nombre_punto ?? '',
      direccion: entrega?.direccion_acopio ?? compromiso.direccion_acopio ?? '',
      horario,
      institucion: compromiso.institucion ?? '',
      lat: entrega?.latitud ?? compromiso.latitud ?? null,
      lng: entrega?.longitud ?? compromiso.longitud ?? null,
    };
  });
  readonly tieneRecepcion = computed(() => {
    const compromiso = this.compromiso();
    const entrega = this.entrega();
    return Boolean(compromiso && entrega && recepcionesDeEntrega(compromiso, entrega).length);
  });

  readonly entregaId = Number(this.ruta.snapshot.paramMap.get('id'));
  private sesionId = 0;
  private vigilancia: number | null = null;
  private ultimoEnvio = 0;

  constructor() {
    if (!Number.isInteger(this.entregaId) || this.entregaId <= 0) {
      this.error.set('El identificador de la entrega no es válido.');
      return;
    }
    if (!this.sesion.autenticado()) return;
    this.consultarUltima();
    this.consultarContexto();
  }

  private roles(): readonly string[] {
    return (this.sesion.usuario()?.roles ?? []).map((rol) => rol.toLocaleUpperCase('es'));
  }

  get esDonante(): boolean {
    return this.roles().includes('DONANTE');
  }

  get esRepresentante(): boolean {
    return this.roles().includes('REPRESENTANTE');
  }

  get puedeCompartir(): boolean {
    return (
      this.esDonante &&
      Boolean(this.entrega()) &&
      !this.tieneRecepcion() &&
      this.estadoEntrega() !== 'CANCELADA'
    );
  }

  get puedeCoordinarEntrega(): boolean {
    const estado = (this.compromiso()?.estado ?? '').toLocaleUpperCase('es');
    return (
      this.esRepresentante &&
      Boolean(this.compromiso()) &&
      ['PENDIENTE', 'ACEPTADO'].includes(estado)
    );
  }

  get puedeIniciarTraslado(): boolean {
    return this.esRepresentante && this.estadoEntrega() === 'PROGRAMADA';
  }

  get puedeInformarLlegada(): boolean {
    return (
      this.esRepresentante &&
      ['PROGRAMADA', 'EN_CAMINO'].includes(this.estadoEntrega()) &&
      !this.tieneRecepcion()
    );
  }

  get puedeConfirmarRecepcion(): boolean {
    return (
      this.esRepresentante &&
      Boolean(this.entrega()) &&
      !this.tieneRecepcion() &&
      this.estadoEntrega() !== 'CANCELADA'
    );
  }

  ngOnDestroy(): void {
    this.detenerVigilancia();
    if (this.sesionId > 0) {
      this.gps.detenerSesion(this.sesionId).subscribe({
        next: () => undefined,
        error: () => undefined,
      });
    }
  }

  private consultarContexto(): void {
    const idCompromisoParam = Number(this.ruta.snapshot.queryParamMap.get('compromiso') ?? 0);
    if (Number.isInteger(idCompromisoParam) && idCompromisoParam > 0) {
      this.cargandoContexto.set(true);
      this.donacionesApi
        .obtenerCompromiso(idCompromisoParam)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (detalle) => {
            this.cargandoContexto.set(false);
            this.asignarDetalle(detalle);
          },
          error: (fallo) => {
            this.cargandoContexto.set(false);
            this.error.set(mensajeErrorApi(fallo, 'Consultar el detalle de la entrega'));
          },
        });
      return;
    }

    if (this.esDonante) {
      this.donacionesApi
        .listarDonaciones()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (resumen) =>
            this.buscarEnDetalles(
              resumen
                .map((item) => Number(item.id_compromiso))
                .filter((id) => Number.isInteger(id) && id > 0),
            ),
          error: (fallo) => this.error.set(mensajeErrorApi(fallo, 'Consultar tus donaciones')),
        });
      return;
    }

    if (this.esRepresentante) {
      this.operaciones
        .listarCompromisos()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (respuesta) => this.buscarEnDetalles(compromisosDe(respuesta).map(idCompromiso)),
          error: (fallo) => this.error.set(mensajeErrorApi(fallo, 'Consultar los compromisos')),
        });
      return;
    }

    this.error.set('Tu cuenta no participa en esta entrega. Inicia sesión con el perfil involucrado.');
  }

  private buscarEnDetalles(ids: readonly number[]): void {
    if (ids.length === 0) {
      this.error.set('No encontramos esta entrega entre tus compromisos registrados.');
      return;
    }
    this.cargandoContexto.set(true);
    forkJoin(ids.map((id) => this.donacionesApi.obtenerCompromiso(id)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalles) => {
          this.cargandoContexto.set(false);
          this.asignarDetalle(
            detalles.find((detalle) =>
              (detalle.entregas ?? []).some((item) => idEntrega(item) === this.entregaId),
            ) ?? null,
          );
        },
        error: (fallo) => {
          this.cargandoContexto.set(false);
          this.error.set(mensajeErrorApi(fallo, 'Consultar el detalle de los compromisos'));
        },
      });
  }

  private asignarDetalle(detalle: CompromisoDetalle | null): void {
    const entrega = detalle?.entregas?.find((item) => idEntrega(item) === this.entregaId);
    if (!detalle || !entrega) {
      this.error.set('No encontramos esta entrega entre tus compromisos registrados.');
      return;
    }
    this.compromiso.set(detalle);
    this.entrega.set(entrega);
    this.error.set('');
  }

  cambiarEstado(estado: 'EN_CAMINO' | 'ENTREGADA'): void {
    const permitido =
      estado === 'EN_CAMINO' ? this.puedeIniciarTraslado : this.puedeInformarLlegada;
    if (!permitido || this.procesandoEstado()) {
      this.error.set('Esta acción no está disponible para tu rol o para el estado actual de la entrega.');
      return;
    }
    this.procesandoEstado.set(true);
    this.mensaje.set('');
    this.error.set('');
    this.operaciones
      .cambiarEstadoEntrega(this.entregaId, { estado })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.procesandoEstado.set(false);
          this.mensaje.set(
            estado === 'EN_CAMINO'
              ? 'Traslado registrado. La recepción continúa pendiente.'
              : 'Llegada registrada. Falta la confirmación de recepción de la institución.',
          );
          this.consultarContexto();
        },
        error: (fallo) => {
          this.procesandoEstado.set(false);
          this.error.set(mensajeErrorApi(fallo, `Registrar el estado ${estado}`));
        },
      });
  }

  compartirUbicacion(): void {
    if (this.compartiendo() || this.cargando()) return;
    if (!this.puedeCompartir) {
      this.error.set('Solo el donante participante de una entrega activa puede iniciar el seguimiento.');
      return;
    }
    if (!this.consentimiento()) {
      this.error.set('Marca el consentimiento para compartir tu ubicación de forma voluntaria.');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.error.set('Este navegador no permite compartir ubicación. Coordina la entrega por mensajes.');
      return;
    }

    this.cargando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.gps
      .iniciarSesion(this.entregaId, {
        consentimiento_dado: true,
        duracion_minutos: 30,
      })
      .subscribe({
        next: (sesion) => {
          this.sesionId = this.gps.idSesion(sesion);
          this.expiraEn.set(sesion.expira_en ?? sesion.expiracion ?? sesion.expiraEn ?? null);
          this.compartiendo.set(true);
          this.cargando.set(false);
          this.mensaje.set('Compartiendo ubicación de forma voluntaria. Puedes detenerla cuando quieras.');
          this.iniciarVigilancia();
        },
        error: (fallo) => {
          this.error.set(mensajeErrorApi(fallo, 'Iniciar la sesión de ubicación'));
          this.cargando.set(false);
        },
      });
  }

  detenerUbicacion(): void {
    this.detenerVigilancia();
    if (this.sesionId <= 0) {
      this.compartiendo.set(false);
      return;
    }
    const id = this.sesionId;
    this.sesionId = 0;
    this.gps.detenerSesion(id).subscribe({
      next: () => {
        this.compartiendo.set(false);
        this.mensaje.set('La ubicación dejó de compartirse.');
        this.expiraEn.set(null);
        this.consultarUltima();
      },
      error: (fallo) => {
        this.compartiendo.set(false);
        this.error.set(mensajeErrorApi(fallo, 'Detener la sesión de ubicación'));
      },
    });
  }

  private iniciarVigilancia(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    this.vigilancia = navigator.geolocation.watchPosition(
      (posicion) => {
        const ahora = Date.now();
        if (ahora - this.ultimoEnvio < 20000 || this.sesionId <= 0) return;
        this.ultimoEnvio = ahora;
        this.gps
          .enviarUbicacion(this.sesionId, {
            latitud: posicion.coords.latitude,
            longitud: posicion.coords.longitude,
            precision_metros: Math.round(posicion.coords.accuracy),
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.consultarUltima(),
            error: (fallo) => this.error.set(mensajeErrorApi(fallo, 'Registrar la ubicación')),
          });
      },
      () => {
        this.error.set(
          'No se pudo obtener la ubicación. Revisa el permiso del navegador o coordina manualmente por mensajes.',
        );
        this.detenerUbicacion();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }

  private consultarUltima(): void {
    this.gps.ultimaUbicacion(this.entregaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (ultima) => {
        const coords = coordenadas(ultima);
        this.marcadores.set(
          coords
            ? [
                {
                  id: this.entregaId,
                  nombre: 'Última ubicación autorizada (privada)',
                  latitud: coords[0],
                  longitud: coords[1],
                },
              ]
            : [],
        );
        this.ultimaActualizacion.set(ultima.actualizado_en ?? ultima.creado_en ?? null);
      },
      error: () => {
        this.marcadores.set([]);
      },
    });
  }

  private detenerVigilancia(): void {
    if (this.vigilancia !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.vigilancia);
      this.vigilancia = null;
    }
  }

  fechaTexto(valor: string | null): string {
    if (!valor) return 'Sin registro';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin registro';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  }
}
