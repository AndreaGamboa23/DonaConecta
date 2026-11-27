import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  InstitucionCard,
  InstitucionDirectorio,
} from '../../../../shared/components/institucion-card/institucion-card';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import {
  ExploracionApiService,
  FiltrosInstituciones,
  TipoInstitucionReal,
} from '../../services/exploracion-api.service';

type EstadoDirectorio = 'servicio-no-disponible' | 'cargando' | 'error' | 'vacio' | 'datos';

/** Presentación editorial de los tipos reales de SQL Server. */
interface PresentacionTipo {
  readonly imagen: string;
  readonly altImagen: string;
  readonly icono: string;
  readonly categoriaSlug: string;
  readonly descripcion: string;
}

const PRESENTACIONES: Readonly<Record<string, PresentacionTipo>> = {
  COMEDOR: {
    imagen: '/assets/images/institucion-comedor.webp',
    altImagen: 'Ilustración de un comedor comunitario',
    icono: 'food',
    categoriaSlug: 'alimentos',
    descripcion:
      'Espacios donde se preparan comidas para vecinos y familias de la comunidad.',
  },
  ALBERGUE: {
    imagen: '/assets/images/institucion-albergue.webp',
    altImagen: 'Ilustración de un albergue infantil',
    icono: 'school',
    categoriaSlug: 'utiles-escolares',
    descripcion: 'Espacios de acogida que acompañan a niñas, niños y adolescentes.',
  },
  REFUGIO_ANIMAL: {
    imagen: '/assets/images/institucion-refugio.webp',
    altImagen: 'Ilustración de un refugio de animales',
    icono: 'animals',
    categoriaSlug: 'animales',
    descripcion: 'Cuidados temporales para animales rescatados y adopción responsable.',
  },
  ORGANIZACION_SOCIAL: {
    imagen: '/assets/images/comunidad-solidaria.webp',
    altImagen: 'Ilustración de personas trabajando en comunidad',
    icono: 'people',
    categoriaSlug: 'higiene',
    descripcion: 'Organizaciones que acompañan distintas necesidades de la comunidad.',
  },
  OTRO: {
    imagen: '/assets/images/experiencias-solidarias.webp',
    altImagen: 'Ilustración de una iniciativa solidaria comunitaria',
    icono: 'heart',
    categoriaSlug: 'ropa',
    descripcion: 'Otras formas de organización vecinal registradas en el directorio.',
  },
};

const PRESENTACION_GENERICA: PresentacionTipo = {
  imagen: '/assets/images/comunidad-solidaria.webp',
  altImagen: 'Ilustración de una iniciativa solidaria comunitaria',
  icono: 'building',
  categoriaSlug: 'alimentos',
  descripcion: 'Organización social registrada en el directorio de DonaConecta.',
};

/** Directorio público: los tipos, conteos y listados vienen de SQL Server. */
@Component({
  selector: 'app-instituciones',
  standalone: true,
  imports: [FormsModule, RouterLink, Icon, InstitucionCard, PageHero],
  templateUrl: './instituciones.html',
  styleUrl: './instituciones.scss',
})
export class Instituciones implements OnInit {
  private readonly estadoServicio = inject(BackendEstadoService);
  private readonly api = inject(ExploracionApiService);

  readonly estado = this.estadoServicio.estado('instituciones');
  readonly distritos = DISTRITOS_HUANCAYO;

  readonly termino = signal('');
  readonly distritoId = signal(0);

  readonly estadoTipos = signal<EstadoDirectorio>(
    this.estado.disponible ? 'cargando' : 'servicio-no-disponible',
  );
  readonly tiposReales = signal<readonly TipoInstitucionReal[]>([]);

  readonly estadoDirectorio = signal<EstadoDirectorio>(
    this.estado.disponible ? 'cargando' : 'servicio-no-disponible',
  );
  readonly instituciones = signal<readonly InstitucionDirectorio[]>([]);

  readonly totalVerificadas = computed(() =>
    this.tiposReales().reduce((total, tipo) => total + tipo.total_verificadas, 0),
  );

  readonly tiposVisibles = computed(() =>
    this.tiposReales().map((tipo) => ({
      ...tipo,
      ...(PRESENTACIONES[tipo.codigo] ?? PRESENTACION_GENERICA),
      descripcionPublica:
        tipo.descripcion ??
        PRESENTACIONES[tipo.codigo]?.descripcion ??
        PRESENTACION_GENERICA.descripcion,
    })),
  );

  readonly filtrosActivos = computed(
    () => Number(Boolean(this.termino().trim())) + Number(this.distritoId() > 0),
  );

  ngOnInit(): void {
    if (!this.estado.disponible) return;
    this.cargarTipos();
    this.cargarInstituciones();
  }

  private cargarTipos(): void {
    this.api.listarTiposInstitucion().subscribe({
      next: (lista) => {
        this.tiposReales.set(lista);
        this.estadoTipos.set(lista.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estadoTipos.set('error'),
    });
  }

  private filtros(): FiltrosInstituciones {
    return {
      distritoId: this.distritoId() || undefined,
      q: this.termino().trim() || undefined,
    };
  }

  cargarInstituciones(): void {
    if (!this.estado.disponible) return;
    this.estadoDirectorio.set('cargando');
    this.api.listarInstituciones(this.filtros()).subscribe({
      next: (lista) => {
        this.instituciones.set(
          lista.map((item) => ({
            institucionId: item.id_institucion,
            nombre: item.nombre,
            tipo: item.tipo,
            distrito: item.distrito,
            estadoVerificacion: item.estado_verificacion,
            descripcion: item.descripcion ?? undefined,
            direccion: item.direccion,
            necesidadesActivas: item.necesidades_activas ?? 0,
            perfilRuta: `/instituciones/${item.id_institucion}`,
          })),
        );
        this.estadoDirectorio.set(lista.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estadoDirectorio.set('error'),
    });
  }

  limpiarFiltros(): void {
    this.termino.set('');
    this.distritoId.set(0);
    this.cargarInstituciones();
  }
}
