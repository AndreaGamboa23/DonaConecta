import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

type EstadoPagina = 'servicio-no-disponible' | 'cargando' | 'error' | 'vacio' | 'datos';

/** Listado filtrado por un tipo real del catálogo de SQL Server. */
@Component({
  selector: 'app-institucion-tipo',
  standalone: true,
  imports: [FormsModule, RouterLink, Icon, InstitucionCard, PageHero],
  templateUrl: './institucion-tipo.html',
  styleUrl: './institucion-tipo.scss',
})
export class InstitucionTipo implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly estadoServicio = inject(BackendEstadoService);
  private readonly api = inject(ExploracionApiService);

  private readonly disponible = this.estadoServicio.estado('instituciones').disponible;
  readonly codigo = this.ruta.snapshot.paramMap.get('tipo')?.toUpperCase() ?? '';
  readonly distritos = DISTRITOS_HUANCAYO;

  readonly termino = signal('');
  readonly distritoId = signal(0);
  readonly estadoTipos = signal<EstadoPagina>(this.disponible ? 'cargando' : 'servicio-no-disponible');
  readonly tipos = signal<readonly TipoInstitucionReal[]>([]);
  readonly estadoListado = signal<EstadoPagina>(this.disponible ? 'cargando' : 'servicio-no-disponible');
  readonly instituciones = signal<readonly InstitucionDirectorio[]>([]);

  readonly tipoActual = computed(() => this.tipos().find((tipo) => tipo.codigo === this.codigo));
  readonly titulo = computed(() => this.tipoActual()?.nombre ?? 'Tipo no registrado');
  readonly totalTipo = computed(() => this.tipoActual()?.total_verificadas ?? 0);

  ngOnInit(): void {
    if (!this.disponible) return;
    this.api.listarTiposInstitucion().subscribe({
      next: (lista) => {
        this.tipos.set(lista);
        this.estadoTipos.set(lista.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estadoTipos.set('error'),
    });
    this.cargar();
  }

  private filtros(): FiltrosInstituciones {
    return {
      tipoCodigo: this.codigo,
      distritoId: this.distritoId() || undefined,
      q: this.termino().trim() || undefined,
    };
  }

  cargar(): void {
    if (!this.disponible) return;
    this.estadoListado.set('cargando');
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
            necesidadesActivas: item.necesidades_activas ?? 0,
            perfilRuta: `/instituciones/${item.id_institucion}`,
          })),
        );
        this.estadoListado.set(lista.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estadoListado.set('error'),
    });
  }

  limpiar(): void {
    this.termino.set('');
    this.distritoId.set(0);
    this.cargar();
  }
}
