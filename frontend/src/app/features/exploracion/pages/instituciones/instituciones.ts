import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DISTRITOS_HUANCAYO, TIPOS_INSTITUCION } from '../../../../core/data/catalogos-locales';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { normalizarTexto } from '../../../../core/utils/busqueda-texto';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  InstitucionCard,
  InstitucionDirectorio,
} from '../../../../shared/components/institucion-card/institucion-card';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { ExploracionApiService } from '../../services/exploracion-api.service';

type EstadoDirectorio = 'servicio-no-disponible' | 'cargando' | 'error' | 'vacio' | 'datos';

interface TipoInstitucionInformativo {
  readonly nombre: string;
  readonly descripcion: string;
  readonly bienes: readonly string[];
  readonly imagen: string;
  readonly altImagen: string;
  readonly categoriaSlug: string;
  readonly icono: string;
}

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
  readonly tipos = TIPOS_INSTITUCION;

  /** Los tipos son información general; ninguno representa una institución registrada. */
  readonly tiposInformativos: readonly TipoInstitucionInformativo[] = [
    {
      nombre: 'Comedores comunitarios',
      descripcion: 'Espacios donde se preparan comidas para vecinos y familias de la comunidad.',
      bienes: ['Alimentos', 'Higiene', 'Útiles escolares'],
      imagen: '/assets/images/institucion-comedor.webp',
      altImagen: 'Ilustración de un comedor comunitario',
      categoriaSlug: 'alimentos',
      icono: 'food',
    },
    {
      nombre: 'Albergues infantiles',
      descripcion: 'Espacios de acogida que acompañan a niñas, niños y adolescentes.',
      bienes: ['Ropa y abrigo', 'Alimentos', 'Útiles escolares'],
      imagen: '/assets/images/institucion-albergue.webp',
      altImagen: 'Ilustración de un albergue infantil',
      categoriaSlug: 'utiles-escolares',
      icono: 'school',
    },
    {
      nombre: 'Refugios de animales',
      descripcion: 'Cuidados temporales para animales rescatados y espacios de adopción responsable.',
      bienes: ['Alimento animal', 'Mantas', 'Comederos'],
      imagen: '/assets/images/institucion-refugio.webp',
      altImagen: 'Ilustración de un refugio de animales',
      categoriaSlug: 'animales',
      icono: 'animals',
    },
    {
      nombre: 'Personas adultas mayores',
      descripcion: 'Organizaciones que acompañan a adultos mayores en situación de vulnerabilidad.',
      bienes: ['Ropa y abrigo', 'Higiene', 'Alimentos'],
      imagen: '/assets/images/institucion-adultos-mayores.webp',
      altImagen: 'Ilustración de una organización que acompaña a adultos mayores',
      categoriaSlug: 'ropa',
      icono: 'hand',
    },
  ];

  readonly termino = signal('');
  readonly tipoId = signal(0);
  readonly distritoId = signal(0);
  readonly soloVerificadas = signal(true);

  readonly estadoDirectorio = signal<EstadoDirectorio>(
    this.estado.disponible ? 'cargando' : 'servicio-no-disponible',
  );
  readonly todasInstituciones = signal<readonly InstitucionDirectorio[]>([]);

  readonly instituciones = computed(() => {
    const lista = this.todasInstituciones();
    const tipoCodigo = TIPOS_INSTITUCION.find((tipo) => tipo.id === this.tipoId())?.codigo;
    const distritoNombre = DISTRITOS_HUANCAYO.find((distrito) => distrito.id === this.distritoId())
      ?.nombre;

    return lista.filter((institucion) => {
      if (tipoCodigo && institucion.tipo !== tipoCodigo) return false;
      if (distritoNombre && institucion.distrito !== distritoNombre) return false;
      if (this.soloVerificadas() && institucion.estadoVerificacion !== 'VERIFICADA') return false;
      return true;
    });
  });

  readonly tiposVisibles = computed(() => {
    const texto = normalizarTexto(this.termino());
    if (!texto) return this.tiposInformativos;
    return this.tiposInformativos.filter((tipo) =>
      `${tipo.nombre} ${tipo.descripcion} ${tipo.bienes.join(' ')}`
        .toLocaleLowerCase('es')
        .includes(texto),
    );
  });

  readonly filtrosActivos = computed(
    () =>
      Number(Boolean(this.termino().trim())) +
      Number(this.tipoId() > 0) +
      Number(this.distritoId() > 0) +
      Number(!this.soloVerificadas()),
  );

  ngOnInit(): void {
    if (!this.estado.disponible) {
      this.estadoDirectorio.set('servicio-no-disponible');
      return;
    }
    this.api.listarInstituciones().subscribe({
      next: (lista) => {
        const mapeadas: readonly InstitucionDirectorio[] = lista.map((item) => ({
          institucionId: item.id_institucion,
          nombre: item.nombre ?? item.nombre_comercial ?? 'Institución sin nombre',
          tipo: item.tipo ?? item.tipo_institucion ?? '',
          distrito: item.distrito,
          estadoVerificacion: item.estado_verificacion,
          descripcion: item.descripcion ?? item.direccion ?? undefined,
        }));
        this.todasInstituciones.set(mapeadas);
        this.estadoDirectorio.set(mapeadas.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estadoDirectorio.set('error'),
    });
  }

  limpiarFiltros(): void {
    this.termino.set('');
    this.tipoId.set(0);
    this.distritoId.set(0);
    this.soloVerificadas.set(true);
  }
}
