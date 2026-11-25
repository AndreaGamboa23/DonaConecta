import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Institucion, InstitucionesService } from '../instituciones/instituciones.service';
import {
  CategoriaBien,
  CompromisoDonante,
  Necesidad,
  NecesidadesService,
} from './necesidades.service';

@Component({
  selector: 'app-necesidades',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="py-5">
      <div class="container">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 class="h2 fw-bold mb-1">Necesidades activas</h1>
            <p class="text-muted mb-0">
              Bienes materiales solicitados por organizaciones verificadas en Huancayo.
            </p>
          </div>
          @if (esRepresentante()) {
            <button
              type="button"
              class="btn btn-primary"
              (click)="mostrarFormNecesidad.set(!mostrarFormNecesidad())"
            >
              {{ mostrarFormNecesidad() ? 'Cerrar formulario' : '+ Publicar necesidad' }}
            </button>
          }
        </div>

        @if (mensajeGlobal()) {
          <div class="alert alert-success py-2 small">{{ mensajeGlobal() }}</div>
        }
        @if (errorGlobal()) {
          <div class="alert alert-danger py-2 small">{{ errorGlobal() }}</div>
        }

        @if (mostrarFormNecesidad() && esRepresentante()) {
          <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light">
            <h2 class="h5 fw-bold mb-3">Publicar necesidad de bienes materiales</h2>
            <form (ngSubmit)="crearNecesidad()">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-medium">Institución verificada</label>
                  <select
                    class="form-select"
                    name="id_institucion"
                    [(ngModel)]="id_institucion"
                    (ngModelChange)="alElegirInstitucion($event)"
                    required
                  >
                    <option [ngValue]="0" disabled>Selecciona tu institución...</option>
                    @for (inst of instituciones(); track inst.id_institucion) {
                      <option [ngValue]="inst.id_institucion">{{ inst.nombre_comercial }}</option>
                    }
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-medium">Categoría de bien</label>
                  <select class="form-select" name="id_categoria" [(ngModel)]="id_categoria" required>
                    <option [ngValue]="0" disabled>Selecciona una categoría...</option>
                    @for (cat of categorias(); track cat.id_categoria) {
                      <option [ngValue]="cat.id_categoria">
                        {{ cat.nombre }} ({{ cat.unidad_medida_base }})
                      </option>
                    }
                  </select>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-medium">Título de la solicitud</label>
                  <input type="text" class="form-control" name="titulo" [(ngModel)]="titulo" required />
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-medium">Cantidad requerida</label>
                  <input type="number" step="0.5" min="1" class="form-control" name="cantidad_requerida" [(ngModel)]="cantidad_requerida" required />
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-medium">Prioridad</label>
                  <select class="form-select" name="prioridad" [(ngModel)]="prioridad">
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-medium">Descripción detallada</label>
                <textarea class="form-control" rows="2" name="descripcion" [(ngModel)]="descripcion" required></textarea>
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                {{ guardando() ? 'Publicando...' : 'Publicar necesidad' }}
              </button>
            </form>
          </div>
        }

        @if (cargando()) {
          <p class="text-muted">Cargando necesidades activas...</p>
        } @else if (necesidades().length === 0) {
          <div class="card border-0 shadow-sm rounded-4 p-4 text-center mb-4">
            <p class="mb-1 fw-semibold">Todavía no hay necesidades publicadas.</p>
            <p class="text-muted small mb-0">
              Las instituciones verificadas pueden publicar aquí los bienes materiales que requieren.
            </p>
          </div>
        } @else {
          <div class="row g-4 mb-5">
            @for (nec of necesidades(); track nec.id_necesidad) {
              <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 p-4 d-flex flex-column">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-primary-subtle text-primary">{{ nec.categoria }}</span>
                    <span class="badge bg-warning-subtle text-dark">Prioridad {{ nec.prioridad }}</span>
                  </div>
                  <h2 class="h5 fw-bold mb-1">{{ nec.titulo }}</h2>
                  <p class="text-muted small mb-2">
                    <strong>{{ nec.institucion }}</strong> · {{ nec.distrito }}
                  </p>
                  <p class="small text-secondary mb-3">{{ nec.descripcion }}</p>

                  <div class="mt-auto">
                    <div class="d-flex justify-content-between small mb-1">
                      <span>Comprometido: <strong>{{ nec.cantidad_comprometida }}</strong></span>
                      <span>Meta: <strong>{{ nec.cantidad_requerida }} {{ nec.unidad_medida_base }}</strong></span>
                    </div>
                    <div class="progress mb-3" style="height: 8px;">
                      <div
                        class="progress-bar"
                        [style.width.%]="calcularPorcentaje(nec)"
                      ></div>
                    </div>

                    <p class="small text-muted mb-3">
                      Acopio: {{ nec.punto_acopio }} ({{ nec.direccion_acopio }})
                    </p>

                    @if (esDonante()) {
                      @if (necesidadSeleccionada() === nec.id_necesidad) {
                        <div class="border rounded-3 p-2 bg-light">
                          <label class="form-label small fw-medium mb-1">
                            Cantidad a donar ({{ nec.unidad_medida_base }})
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            class="form-control form-control-sm mb-2"
                            [(ngModel)]="cantidadDonar"
                          />
                          <input
                            type="text"
                            class="form-control form-control-sm mb-2"
                            placeholder="Comentario opcional (ej. entrego mañana)"
                            [(ngModel)]="comentarioDonar"
                          />
                          <div class="d-flex gap-2">
                            <button
                              type="button"
                              class="btn btn-primary btn-sm flex-grow-1"
                              (click)="confirmarDonacion(nec.id_necesidad)"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              class="btn btn-outline-secondary btn-sm"
                              (click)="necesidadSeleccionada.set(null)"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      } @else {
                        <button
                          type="button"
                          class="btn btn-primary btn-sm w-100"
                          (click)="abrirCompromiso(nec.id_necesidad)"
                        >
                          Donar bienes
                        </button>
                      }
                    } @else if (!auth.estaAutenticado()) {
                      <a routerLink="/iniciar-sesion" class="btn btn-outline-primary btn-sm w-100">
                        Inicia sesión para donar
                      </a>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

        @if (esDonante() && compromisos().length > 0) {
          <div class="card border-0 shadow-sm rounded-4 p-4">
            <h2 class="h5 fw-bold mb-3">Mis compromisos de donación</h2>
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Necesidad</th>
                    <th>Institución</th>
                    <th>Cantidad</th>
                    <th>Punto de acopio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of compromisos(); track c.id_compromiso) {
                    <tr>
                      <td class="fw-medium">{{ c.necesidad }}</td>
                      <td>{{ c.institucion }}</td>
                      <td>{{ c.cantidad_comprometida }} {{ c.unidad_medida_base }}</td>
                      <td class="small text-muted">{{ c.punto_acopio }} — {{ c.direccion_acopio }}</td>
                      <td><span class="badge bg-info-subtle text-dark">{{ c.estado }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class Necesidades implements OnInit {
  readonly auth = inject(AuthService);
  private readonly servicio = inject(NecesidadesService);
  private readonly instServicio = inject(InstitucionesService);

  readonly necesidades = signal<Necesidad[]>([]);
  readonly categorias = signal<CategoriaBien[]>([]);
  readonly instituciones = signal<Institucion[]>([]);
  readonly compromisos = signal<CompromisoDonante[]>([]);

  readonly cargando = signal(true);
  readonly mostrarFormNecesidad = signal(false);
  readonly guardando = signal(false);
  readonly mensajeGlobal = signal('');
  readonly errorGlobal = signal('');

  readonly necesidadSeleccionada = signal<number | null>(null);
  cantidadDonar = 1;
  comentarioDonar = '';

  readonly esRepresentante = computed(() =>
    this.auth.usuarioActual()?.roles.includes('REPRESENTANTE') ?? false,
  );
  readonly esDonante = computed(() =>
    this.auth.usuarioActual()?.roles.includes('DONANTE') ?? false,
  );

  id_institucion = 0;
  id_categoria = 0;
  id_punto_acopio = 0;
  titulo = '';
  descripcion = '';
  cantidad_requerida = 10;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA' = 'MEDIA';

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    this.cargando.set(true);
    this.servicio.listarNecesidades().subscribe({
      next: (data) => {
        this.necesidades.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });

    this.servicio.listarCategorias().subscribe((cats) => this.categorias.set(cats));
    this.instServicio.listarVerificadas().subscribe((insts) => this.instituciones.set(insts));

    if (this.esDonante()) {
      this.servicio.misCompromisos().subscribe((list) => this.compromisos.set(list));
    }
  }

  alElegirInstitucion(idInst: number) {
    const elegida = this.instituciones().find((i) => i.id_institucion === Number(idInst));
    this.id_punto_acopio = elegida?.id_punto_acopio ?? 1;
  }

  crearNecesidad() {
    this.errorGlobal.set('');
    this.mensajeGlobal.set('');
    this.guardando.set(true);
    this.servicio
      .publicarNecesidad({
        id_institucion: Number(this.id_institucion),
        id_categoria: Number(this.id_categoria),
        id_punto_acopio: Number(this.id_punto_acopio),
        titulo: this.titulo,
        descripcion: this.descripcion,
        cantidad_requerida: Number(this.cantidad_requerida),
        prioridad: this.prioridad,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.mensajeGlobal.set('Necesidad publicada correctamente.');
          this.mostrarFormNecesidad.set(false);
          this.titulo = '';
          this.descripcion = '';
          this.cargarTodo();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorGlobal.set(err?.error?.detail || 'No se pudo publicar la necesidad');
        },
      });
  }

  abrirCompromiso(idNecesidad: number) {
    this.necesidadSeleccionada.set(idNecesidad);
    this.cantidadDonar = 1;
    this.comentarioDonar = '';
  }

  confirmarDonacion(idNecesidad: number) {
    this.errorGlobal.set('');
    this.mensajeGlobal.set('');
    this.servicio
      .comprometerDonacion({
        id_necesidad: idNecesidad,
        cantidad_comprometida: Number(this.cantidadDonar),
        comentario: this.comentarioDonar || undefined,
      })
      .subscribe({
        next: () => {
          this.necesidadSeleccionada.set(null);
          this.mensajeGlobal.set('¡Gracias! Tu compromiso de donación fue registrado.');
          this.cargarTodo();
        },
        error: (err) => {
          this.errorGlobal.set(err?.error?.detail || 'No se pudo registrar tu compromiso');
        },
      });
  }

  calcularPorcentaje(nec: Necesidad): number {
    if (!nec.cantidad_requerida) return 0;
    return Math.min(100, Math.round((nec.cantidad_comprometida / nec.cantidad_requerida) * 100));
  }
}
