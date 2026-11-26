import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type * as Leaflet from 'leaflet';
import { Icon } from '../icon/icon';

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

  private readonly lienzo = viewChild.required<ElementRef<HTMLDivElement>>('lienzoMapa');

  /** Wikidata Q468782, propiedad P625: -12.066666666667, -75.216666666667. */
  private readonly centro: Leaflet.LatLngTuple = [-12.066666666667, -75.216666666667];
  private leaflet?: typeof Leaflet;
  private mapa?: Leaflet.Map;
  private ubicacion?: Leaflet.CircleMarker;
  private observador?: ResizeObserver;
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
      const mapa = leaflet.map(this.lienzo().nativeElement, {
        center: this.centro,
        zoom: 13,
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
    } catch {
      this.cargandoMapa.set(false);
      this.estadoUbicacion.set('mapa-error');
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.observador?.disconnect();
    this.mapa?.remove();
  }

  restablecerVista(): void {
    if (!this.mapa) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      this.mapa.setView(this.centro, 13);
      return;
    }
    this.mapa.flyTo(this.centro, 13, { duration: 0.7 });
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
