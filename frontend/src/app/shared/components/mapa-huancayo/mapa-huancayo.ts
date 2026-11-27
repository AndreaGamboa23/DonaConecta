import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type * as Leaflet from 'leaflet';
import { Icon } from '../icon/icon';

/** Marcador opcional: se crea sólo si el DTO trae coordenadas autorizadas reales. */
export interface MarcadorMapa {
  readonly id: number;
  readonly nombre: string;
  readonly latitud: number;
  readonly longitud: number;
}

/** Destino privado autorizado que llega desde el detalle de una donación. */
export interface DestinoMapa {
  readonly latitud?: number | string | null;
  readonly longitud?: number | string | null;
  readonly nombre?: string;
}

/**
 * Valida coordenadas antes de convertirlas. `Number(null)` es 0, por lo que una
 * conversión directa inventaría un punto en el océano; aquí se rechazan nulos,
 * vacíos y valores fuera de rango.
 */
export function coordenadasValidas(
  fuente: {
    readonly latitud?: number | string | null;
    readonly longitud?: number | string | null;
  } | null | undefined,
): readonly [number, number] | null {
  if (!fuente) return null;
  const { latitud, longitud } = fuente;
  if (latitud === null || latitud === undefined || longitud === null || longitud === undefined) {
    return null;
  }
  if (typeof latitud === 'string' && !latitud.trim()) return null;
  if (typeof longitud === 'string' && !longitud.trim()) return null;

  const lat = Number(latitud);
  const lng = Number(longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

type EstadoUbicacion =
  | 'idle'
  | 'consultando'
  | 'listo'
  | 'denegado'
  | 'sin-senal'
  | 'error'
  | 'mapa-error';

/**
 * Mapa base de Huancayo. El centro es una referencia geográfica verificada, no una
 * ubicación detectada ni un punto de acopio. La geolocalización solo se solicita
 * después de que la persona pulse el botón correspondiente.
 */
@Component({
  selector: 'app-mapa-huancayo',
  standalone: true,
  imports: [Icon],
  templateUrl: './mapa-huancayo.html',
  styleUrl: './mapa-huancayo.scss',
})
export class MapaHuancayo implements AfterViewInit, OnDestroy {
  readonly titulo = input('Mapa de referencia de Huancayo');
  readonly mostrarBotonUbicacion = input(true);
  readonly marcadores = input<readonly MarcadorMapa[]>([]);
  readonly marcadorResaltado = input<number | null>(null);
  readonly destino = input<DestinoMapa | null>(null);

  /** Centro validado del destino; nunca usa el centro de Huancayo como sustituto. */
  readonly centroDestino = computed(() => coordenadasValidas(this.destino()));

  private readonly lienzo = viewChild.required<ElementRef<HTMLDivElement>>('lienzoMapa');

  /** Wikidata Q468782, propiedad P625: -12.066666666667, -75.216666666667. */
  private readonly centro: Leaflet.LatLngTuple = [-12.066666666667, -75.216666666667];
  private leaflet?: typeof Leaflet;
  private mapa?: Leaflet.Map;
  private ubicacion?: Leaflet.CircleMarker;
  private marcadoresDibujados: Leaflet.Marker[] = [];
  private observador?: ResizeObserver;
  private readonly sincronizarMarcadores = effect(() => {
    const marcadores = this.marcadores();
    const resaltado = this.marcadorResaltado();
    // centroDestino lee el input `destino`; así el efecto también reacciona a él.
    const centroDestino = this.centroDestino();
    if (this.mapa && this.leaflet) {
      this.dibujarMarcadores(marcadores, resaltado);
      if (centroDestino) this.centrarEnVista(centroDestino, 15);
    }
  });
  private ultimoAncho = 0;
  private ultimoAlto = 0;
  private erroresTeselas = 0;
  private destruido = false;

  readonly cargandoMapa = signal(true);
  readonly estadoUbicacion = signal<EstadoUbicacion>('idle');

  readonly mensajeEstado = computed(() => {
    switch (this.estadoUbicacion()) {
      case 'consultando':
        return 'Consultando tu ubicación. Puedes conceder o denegar el permiso desde el navegador.';
      case 'listo':
        return 'Ubicación aproximada mostrada solo en este dispositivo. No se guarda ni se envía.';
      case 'denegado':
        return 'No se concedió permiso de ubicación. Puedes seguir usando el mapa manualmente.';
      case 'sin-senal':
        return 'La ubicación no está disponible en este dispositivo o navegador.';
      case 'error':
        return 'No se pudo obtener la ubicación. Inténtalo de nuevo o explora el mapa manualmente.';
      case 'mapa-error':
        return 'No se pudieron cargar los mapas. Revisa tu conexión e inténtalo de nuevo.';
      default:
        return '';
    }
  });

  readonly alertaEstado = computed(() =>
    this.estadoUbicacion() === 'denegado' || this.estadoUbicacion() === 'mapa-error'
      ? 'alert-warning'
      : 'alert-info',
  );

  async ngAfterViewInit(): Promise<void> {
    try {
      const leaflet = await import('leaflet');
      if (this.destruido) return;
      this.leaflet = leaflet;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const centroInicial = this.centroDestino();
      const centroMapa: Leaflet.LatLngTuple = centroInicial
        ? [centroInicial[0], centroInicial[1]]
        : this.centro;
      const mapa = leaflet.map(this.lienzo().nativeElement, {
        center: centroMapa,
        zoom: centroInicial ? 15 : 13,
        minZoom: 10,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        zoomAnimation: !reduceMotion,
        fadeAnimation: !reduceMotion,
        markerZoomAnimation: !reduceMotion,
      });

      leaflet
        .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        })
        .addTo(mapa);

      const contenedor = this.lienzo().nativeElement;
      const estabilizar = () => {
        if (this.destruido) return;
        const rect = contenedor.getBoundingClientRect();
        this.ultimoAncho = Math.round(rect.width);
        this.ultimoAlto = Math.round(rect.height);
        mapa.invalidateSize({ animate: false, pan: false });
      };

      mapa.once('load', () => {
        this.cargandoMapa.set(false);
        estabilizar();
      });
      mapa.on('tileload', () => {
        this.cargandoMapa.set(false);
        this.erroresTeselas = Math.max(0, this.erroresTeselas - 1);
        if (this.estadoUbicacion() === 'mapa-error') this.estadoUbicacion.set('idle');
      });
      mapa.on('tileerror', () => {
        this.cargandoMapa.set(false);
        this.erroresTeselas += 1;
        if (this.erroresTeselas >= 3 && this.estadoUbicacion() === 'idle') {
          this.estadoUbicacion.set('mapa-error');
        }
      });

      if ('ResizeObserver' in window) {
        this.observador = new ResizeObserver((entradas) => {
          if (this.destruido || !entradas.length) return;
          const rect = contenedor.getBoundingClientRect();
          const ancho = Math.round(rect.width);
          const alto = Math.round(rect.height);
          if (ancho !== this.ultimoAncho || alto !== this.ultimoAlto) estabilizar();
        });
        this.observador.observe(contenedor);
      }

      this.mapa = mapa;
      this.dibujarMarcadores(this.marcadores(), this.marcadorResaltado());
      if (centroInicial) this.centrarEnVista(centroInicial, 15);
    } catch {
      this.cargandoMapa.set(false);
      this.estadoUbicacion.set('mapa-error');
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.observador?.disconnect();
    this.marcadoresDibujados.forEach((marcador) => marcador.remove());
    this.marcadoresDibujados = [];
    this.mapa?.remove();
  }

  /**
   * Dibuja únicamente puntos con coordenadas numéricas válidas. El contenido del
   * popup se crea como texto para no interpretar HTML procedente del backend.
   */
  private dibujarMarcadores(
    marcadores: readonly MarcadorMapa[],
    resaltado: number | null,
  ): void {
    if (!this.mapa || !this.leaflet) return;
    this.marcadoresDibujados.forEach((marcador) => marcador.remove());
    this.marcadoresDibujados = [];

    const centroDestino = this.centroDestino();
    const puntos = [...marcadores] as MarcadorMapa[];
    if (centroDestino) {
      const yaDibujado = puntos.some(
        (punto) =>
          Math.abs(Number(punto.latitud) - centroDestino[0]) < 1e-7 &&
          Math.abs(Number(punto.longitud) - centroDestino[1]) < 1e-7,
      );
      if (!yaDibujado) {
        puntos.push({
          id: -1,
          nombre: this.destino()?.nombre?.trim() || 'Punto de entrega',
          latitud: centroDestino[0],
          longitud: centroDestino[1],
        });
      }
    }

    for (const punto of puntos) {
      const latitud = Number(punto.latitud);
      const longitud = Number(punto.longitud);
      if (
        !Number.isFinite(latitud) ||
        !Number.isFinite(longitud) ||
        latitud < -90 ||
        latitud > 90 ||
        longitud < -180 ||
        longitud > 180
      ) {
        continue;
      }

      const etiqueta = document.createElement('div');
      etiqueta.textContent = punto.nombre;
      const marcador = this.leaflet
        .marker([latitud, longitud])
        .bindPopup(etiqueta)
        .addTo(this.mapa);
      this.marcadoresDibujados.push(marcador);

      if (resaltado !== null && punto.id === resaltado) {
        this.mapa.setView([latitud, longitud], 15);
      }
    }
  }

  private centrarEnVista(coordenadas: readonly [number, number], zoom: number): void {
    if (!this.mapa) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vista: Leaflet.LatLngTuple = [coordenadas[0], coordenadas[1]];
    if (reduceMotion) {
      this.mapa.setView(vista, zoom);
      return;
    }
    this.mapa.flyTo(vista, zoom, { duration: 0.7 });
  }

  restablecerVista(): void {
    if (!this.mapa) return;
    const destino = this.centroDestino();
    const referencia: readonly [number, number] = [this.centro[0], this.centro[1]];
    this.centrarEnVista(destino ?? referencia, destino ? 15 : 13);
  }

  consultarUbicacion(): void {
    if (!this.mapa || !this.leaflet) return;
    if (!('geolocation' in navigator)) {
      this.estadoUbicacion.set('sin-senal');
      return;
    }

    this.estadoUbicacion.set('consultando');
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        if (this.destruido || !this.mapa || !this.leaflet) return;
        const coords: Leaflet.LatLngTuple = [
          posicion.coords.latitude,
          posicion.coords.longitude,
        ];

        this.ubicacion?.remove();
        this.ubicacion = this.leaflet
          .circleMarker(coords, {
            radius: 7,
            color: '#ffffff',
            weight: 3,
            fillColor: '#80b69a',
            fillOpacity: 1,
            className: 'dc-mapa-ubicacion',
          })
          .addTo(this.mapa)
          .bindTooltip('Tu ubicación aproximada para esta consulta.');

        this.mapa.setView(coords, 15);
        this.estadoUbicacion.set('listo');
      },
      (error) => {
        if (this.destruido) return;
        if (error.code === error.PERMISSION_DENIED) {
          this.estadoUbicacion.set('denegado');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          this.estadoUbicacion.set('sin-senal');
        } else {
          this.estadoUbicacion.set('error');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
}
