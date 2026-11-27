import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SesionService } from '../../../../core/services/sesion.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { DonacionesApiService } from '../../../donaciones/services/donaciones-api.service';
import { ExploracionApiService, NecesidadDetalle } from '../../services/exploracion-api.service';

type EstadoDetalle = 'cargando' | 'error' | 'no-encontrada' | 'datos';

/** Ficha pública de una necesidad real con compromiso restringido a donantes. */
@Component({
  selector: 'app-necesidad-detalle',
  standalone: true,
  imports: [FormsModule, RouterLink, EmptyState, Icon, PageHero],
  templateUrl: './necesidad-detalle.html',
  styleUrl: './necesidad-detalle.scss',
})
export class NecesidadDetallePage implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly api = inject(ExploracionApiService);
  private readonly donacionesApi = inject(DonacionesApiService);
  readonly sesion = inject(SesionService);

  readonly estado = signal<EstadoDetalle>('cargando');
  readonly necesidad = signal<NecesidadDetalle | null>(null);
  readonly cantidades = signal<Readonly<Record<string, number>>>({});
  readonly comentario = signal('');
  readonly enviando = signal(false);
  readonly mensaje = signal('');

  readonly puedeComprometer = computed(() =>
    (this.sesion.usuario()?.roles ?? []).some(
      (rol) => rol.toLocaleUpperCase('es') === 'DONANTE',
    ),
  );

  readonly lineasDisponibles = computed(() =>
    (this.necesidad()?.lineas ?? []).filter((linea) => linea.cantidad_disponible > 0),
  );

  readonly avance = computed(() =>
    Math.min(100, Math.max(0, Number(this.necesidad()?.avance_porcentaje) || 0)),
  );

  /** Cantidades agrupadas por unidad real; nunca se suman unidades distintas. */
  readonly disponibilidadPorUnidad = computed(() => {
    const grupos = new Map<number, { simbolo: string; cantidad: number }>();
    for (const linea of this.necesidad()?.lineas ?? []) {
      if (linea.cantidad_disponible <= 0) continue;
      const actual = grupos.get(linea.unidad_id) ?? {
        simbolo: linea.simbolo,
        cantidad: 0,
      };
      actual.cantidad += Number(linea.cantidad_disponible) || 0;
      grupos.set(linea.unidad_id, actual);
    }
    return [...grupos.entries()]
      .map(([unidadId, grupo]) => ({ unidadId, ...grupo }))
      .sort((a, b) => a.simbolo.localeCompare(b.simbolo, 'es'));
  });

  readonly lineasSeleccionadas = computed(
    () => Object.values(this.cantidades()).filter((valor) => Number(valor) > 0).length,
  );

  ngOnInit(): void {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.estado.set('no-encontrada');
      return;
    }
    this.cargar(id);
  }

  private cargar(id: number): void {
    this.estado.set('cargando');
    this.api.obtenerNecesidad(id).subscribe({
      next: (necesidad) => {
        this.necesidad.set(necesidad);
        this.cantidades.set({});
        this.estado.set('datos');
      },
      error: (error) => {
        const codigo = error?.error?.error?.codigo ?? error?.error?.detail?.codigo;
        this.estado.set(codigo === 'RECURSO_NO_PUBLICO' ? 'no-encontrada' : 'error');
      },
    });
  }

  claveLinea(productoId: number, unidadId: number): string {
    return `${productoId}-${unidadId}`;
  }

  fijarCantidad(clave: string, evento: Event): void {
    const valor = Number((evento.target as HTMLInputElement).value);
    const actuales = { ...this.cantidades() };
    if (Number.isFinite(valor) && valor > 0) actuales[clave] = valor;
    else delete actuales[clave];
    this.cantidades.set(actuales);
  }

  comprometer(): void {
    const necesidad = this.necesidad();
    if (!necesidad || this.enviando()) return;
    this.mensaje.set('');

    if (!this.puedeComprometer()) {
      this.mensaje.set('Inicia sesión con una cuenta de donante para registrar un compromiso.');
      return;
    }

    const lineas = necesidad.lineas
      .map((linea) => ({
        producto_id: linea.producto_id,
        unidad_id: linea.unidad_id,
        cantidad: Number(
          this.cantidades()[this.claveLinea(linea.producto_id, linea.unidad_id)] ?? 0,
        ),
      }))
      .filter((linea) => linea.cantidad > 0);

    if (lineas.length === 0) {
      this.mensaje.set('Indica la cantidad de al menos un bien disponible.');
      return;
    }

    for (const linea of lineas) {
      const original = necesidad.lineas.find(
        (item) =>
          item.producto_id === linea.producto_id && item.unidad_id === linea.unidad_id,
      );
      if (original && linea.cantidad > original.cantidad_disponible) {
        this.mensaje.set(
          `La disponibilidad actual de ${original.producto} es ${original.cantidad_disponible} ${original.simbolo}.`,
        );
        return;
      }
    }

    this.enviando.set(true);
    this.donacionesApi
      .crearCompromiso({
        id_necesidad: necesidad.id_necesidad,
        lineas,
        comentario: this.comentario().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.mensaje.set(
            'Compromiso registrado. Puedes consultar su estado en Mis donaciones.',
          );
          this.comentario.set('');
          this.cargar(necesidad.id_necesidad);
        },
        error: (error) => {
          const cuerpo = error?.error?.error ?? error?.error?.detail ?? {};
          const codigo = typeof cuerpo === 'object' ? cuerpo.codigo : undefined;
          this.mensaje.set(
            codigo === 'COMPROMISO_VIGENTE'
              ? 'Ya tienes un compromiso vigente para esta necesidad. Consulta Mis donaciones.'
              : codigo === 'COMPROMISO_EXCEDE_DISPONIBILIDAD'
                ? 'Otro donante tomó parte de la disponibilidad. Actualiza la cantidad e inténtalo de nuevo.'
                : 'No se pudo registrar el compromiso. Verifica tu sesión e inténtalo de nuevo.',
          );
        },
        complete: () => this.enviando.set(false),
      });
  }

  fechaTexto(valor: string | null): string {
    if (!valor) return 'Sin fecha límite';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha límite';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(fecha);
  }

}
