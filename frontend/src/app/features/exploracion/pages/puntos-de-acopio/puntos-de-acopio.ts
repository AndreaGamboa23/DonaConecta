import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import {
  HorarioAcopioDTO,
  PuntoAcopioDTO,
  idPuntoAcopio,
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
import {
  PanelOperacionesApiService,
  puntosDe,
} from '../../../paneles/services/panel-operaciones-api.service';

type EstadoPagina = 'cargando' | 'datos' | 'error';

/** Datos enviados por el detalle autorizado de una donación. */
interface DestinoCompartido {
  readonly id: number;
  readonly compromisoId: number;
  readonly nombre: string;
  readonly direccion: string;
  readonly horario: string;
  readonly institucion: string;
  readonly latitud: string | null;
  readonly longitud: string | null;
}

function texto(valor: string | null | undefined): string {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : '';
}

function textoHorarios(horarios: readonly HorarioAcopioDTO[] | undefined): string {
  const activos = (horarios ?? []).filter((horario) => horario.activo !== false);
  if (!activos.length) return '';
  const nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  return activos
    .map(
      (horario) =>
        `${nombres[horario.dia_semana - 1] ?? 'Día'} ${horario.hora_apertura.slice(0, 5)}–${horario.hora_cierre.slice(0, 5)}`,
    )
    .join(' · ');
}

@Component({
  selector: 'app-puntos-de-acopio',
  standalone: true,
  imports: [RouterLink, Icon, MapaHuancayo, PageHero],
  templateUrl: './puntos-de-acopio.html',
  styleUrl: './puntos-de-acopio.scss',
})
export class PuntosDeAcopio implements OnInit {
  private readonly operaciones = inject(PanelOperacionesApiService);
  private readonly ruta = inject(ActivatedRoute);
  readonly sesion = inject(SesionService);

  readonly estado = signal<EstadoPagina>('cargando');
  readonly error = signal('');
  readonly puntos = signal<readonly PuntoAcopioDTO[]>([]);
  readonly resaltado = signal<number | null>(null);
  readonly destino = signal<DestinoCompartido | null>(null);

  /** Si el punto está publicado, se prefiere su información pública; si no, la del detalle. */
  readonly puntoPublico = computed(() => {
    const destino = this.destino();
    if (!destino) return null;
    return this.puntos().find((punto) => idPuntoAcopio(punto) === destino.id) ?? null;
  });

  readonly coordenadasDestino = computed(() => {
    const publicas = coordenadasValidas(this.puntoPublico());
    return publicas ?? coordenadasValidas(this.destino());
  });

  readonly nombreDestino = computed(
    () => texto(this.puntoPublico()?.nombre) || texto(this.destino()?.nombre) || 'Punto de acopio',
  );
  readonly direccionDestino = computed(
    () => texto(this.puntoPublico()?.direccion) || texto(this.destino()?.direccion),
  );
  readonly horarioDestino = computed(
    () => textoHorarios(this.puntoPublico()?.horarios) || texto(this.destino()?.horario),
  );
  readonly institucionDestino = computed(() => texto(this.destino()?.institucion));

  readonly destinoMarcador = computed<MarcadorMapa | null>(() => {
    const destino = this.destino();
    const coordenadas = this.coordenadasDestino();
    if (!destino || !coordenadas) return null;
    return {
      id: destino.id,
      nombre: this.nombreDestino(),
      latitud: coordenadas[0],
      longitud: coordenadas[1],
    };
  });

  readonly destinoMapa = computed(() => {
    const coordenadas = this.coordenadasDestino();
    if (!coordenadas) return null;
    return {
      latitud: coordenadas[0],
      longitud: coordenadas[1],
      nombre: this.nombreDestino(),
    };
  });

  readonly urlRuta = computed(() => {
    const coordenadas = this.coordenadasDestino();
    if (!coordenadas) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${coordenadas[0]},${coordenadas[1]}`;
  });

  ngOnInit(): void {
    const parametro = (clave: string): string =>
      texto(this.ruta.snapshot.queryParamMap.get(clave));
    const idPunto = Number(parametro('punto'));
    const compromisoId = Number(parametro('compromiso'));

    if (Number.isInteger(idPunto) && idPunto > 0) {
      this.destino.set({
        id: idPunto,
        compromisoId: Number.isInteger(compromisoId) && compromisoId > 0 ? compromisoId : 0,
        nombre: parametro('nombre'),
        direccion: parametro('direccion'),
        horario: parametro('horario'),
        institucion: parametro('institucion'),
        latitud: parametro('lat') || null,
        longitud: parametro('lng') || null,
      });
    }

    this.resaltado.set(this.destino()?.id ?? null);
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.operaciones.listarPuntos({ publico: true }).subscribe({
      next: (respuesta) => {
        this.puntos.set(puntosDe(respuesta).filter((punto) => punto.estado !== 'INACTIVO'));
        this.estado.set('datos');
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar los puntos de acopio publicados'));
        this.estado.set('error');
      },
    });
  }

  marcadores(): readonly MarcadorMapa[] {
    if (this.destino()) {
      const marcador = this.destinoMarcador();
      return marcador ? [marcador] : [];
    }

    const marcadores: MarcadorMapa[] = [];
    for (const punto of this.puntos()) {
      const coordenadas = coordenadasValidas(punto);
      if (!coordenadas) continue;
      marcadores.push({
        id: idPuntoAcopio(punto),
        nombre: punto.nombre,
        latitud: coordenadas[0],
        longitud: coordenadas[1],
      });
    }
    return marcadores;
  }

  id(punto: PuntoAcopioDTO): number {
    return idPuntoAcopio(punto);
  }

  distrito(punto: PuntoAcopioDTO): string {
    if (punto.distrito) return punto.distrito;
    return DISTRITOS_HUANCAYO.find((distrito) => distrito.id === punto.distrito_id)?.nombre ?? 'Huancayo';
  }

  horarios(punto: PuntoAcopioDTO): string {
    return textoHorarios(punto.horarios) || 'Sin horarios publicados';
  }
}
