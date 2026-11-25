import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Institucion, InstitucionesService } from './instituciones.service';

@Component({
  selector: 'app-instituciones',
  imports: [FormsModule],
  template: `
    <section class="py-5">
      <div class="container">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h1 class="h2 fw-bold mb-1">Instituciones aliadas</h1>
            <p class="text-muted mb-0">
              Comedores, albergues y organizaciones verificadas en Huancayo que reciben bienes materiales.
            </p>
          </div>
          @if (esRepresentante()) {
            <button
              type="button"
              class="btn btn-primary"
              (click)="mostrarFormulario.set(!mostrarFormulario())"
            >
              {{ mostrarFormulario() ? 'Cerrar formulario' : '+ Registrar mi institución' }}
            </button>
          }
        </div>

        @if (mostrarFormulario() && esRepresentante()) {
          <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light">
            <h2 class="h5 fw-bold mb-3">Registrar nueva institución</h2>

            @if (errorForm()) {
              <div class="alert alert-danger py-2 small">{{ errorForm() }}</div>
            }
            @if (exitoForm()) {
              <div class="alert alert-success py-2 small">{{ exitoForm() }}</div>
            }

            <form (ngSubmit)="registrarInstitucion()">
              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label fw-medium">Nombre comercial</label>
                  <input type="text" class="form-control" name="nombre_comercial" [(ngModel)]="nombre_comercial" required />
                </div>
                <div class="col-md-5">
                  <label class="form-label fw-medium">Razón social</label>
                  <input type="text" class="form-control" name="razon_social" [(ngModel)]="razon_social" required />
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-medium">RUC (11 dígitos)</label>
                  <input type="text" class="form-control" name="ruc" [(ngModel)]="ruc" minlength="11" maxlength="11" required />
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label fw-medium">Tipo de institución</label>
                  <select class="form-select" name="tipo_institucion" [(ngModel)]="tipo_institucion">
                    <option value="COMEDOR">Comedor</option>
                    <option value="ALBERGUE">Albergue</option>
                    <option value="REFUGIO_ANIMALES">Refugio de animales</option>
                    <option value="ORGANIZACION_SOCIAL">Organización social</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-medium">Distrito</label>
                  <input type="text" class="form-control" name="distrito" [(ngModel)]="distrito" required />
                </div>
                <div class="col-md-5">
                  <label class="form-label fw-medium">Dirección</label>
                  <input type="text" class="form-control" name="direccion" [(ngModel)]="direccion" required />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-medium">Descripción</label>
                <textarea class="form-control" rows="2" name="descripcion" [(ngModel)]="descripcion"></textarea>
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                {{ guardando() ? 'Enviando...' : 'Enviar a verificación' }}
              </button>
            </form>
          </div>
        }

        @if (cargandoLista()) {
          <p class="text-muted">Cargando instituciones verificadas...</p>
        } @else if (instituciones().length === 0) {
          <div class="card border-0 shadow-sm rounded-4 p-4 text-center">
            <p class="mb-1 fw-semibold">Aún no hay instituciones verificadas publicadas.</p>
            <p class="text-muted small mb-0">
              Cuando un representante registre su organización y el administrador la apruebe, aparecerá aquí.
            </p>
          </div>
        } @else {
          <div class="row g-4">
            @for (inst of instituciones(); track inst.id_institucion) {
              <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 p-4">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="badge bg-primary-subtle text-primary">{{ inst.tipo_institucion }}</span>
                    <span class="badge bg-success-subtle text-success">Verificada</span>
                  </div>
                  <h2 class="h5 fw-bold mb-1">{{ inst.nombre_comercial }}</h2>
                  <p class="text-muted small mb-2">
                    {{ inst.direccion }} — {{ inst.distrito }} (RUC: {{ inst.ruc }})
                  </p>
                  @if (inst.descripcion) {
                    <p class="small mb-0">{{ inst.descripcion }}</p>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class Instituciones implements OnInit {
  private readonly servicio = inject(InstitucionesService);
  private readonly auth = inject(AuthService);

  readonly instituciones = signal<Institucion[]>([]);
  readonly cargandoLista = signal(true);
  readonly mostrarFormulario = signal(false);
  readonly guardando = signal(false);
  readonly errorForm = signal('');
  readonly exitoForm = signal('');

  readonly esRepresentante = computed(() =>
    this.auth.usuarioActual()?.roles.includes('REPRESENTANTE') ?? false,
  );

  ruc = '';
  razon_social = '';
  nombre_comercial = '';
  tipo_institucion: 'COMEDOR' | 'ALBERGUE' | 'REFUGIO_ANIMALES' | 'ORGANIZACION_SOCIAL' = 'COMEDOR';
  distrito = 'Huancayo';
  direccion = '';
  descripcion = '';

  ngOnInit() {
    this.cargarInstituciones();
  }

  cargarInstituciones() {
    this.cargandoLista.set(true);
    this.servicio.listarVerificadas().subscribe({
      next: (data) => {
        this.instituciones.set(data);
        this.cargandoLista.set(false);
      },
      error: () => this.cargandoLista.set(false),
    });
  }

  registrarInstitucion() {
    this.errorForm.set('');
    this.exitoForm.set('');
    this.guardando.set(true);
    this.servicio
      .registrar({
        ruc: this.ruc,
        razon_social: this.razon_social,
        nombre_comercial: this.nombre_comercial,
        tipo_institucion: this.tipo_institucion,
        distrito: this.distrito,
        direccion: this.direccion,
        descripcion: this.descripcion || undefined,
      })
      .subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.exitoForm.set(res.mensaje);
          this.ruc = '';
          this.razon_social = '';
          this.nombre_comercial = '';
          this.direccion = '';
          this.descripcion = '';
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorForm.set(err?.error?.detail || 'No se pudo registrar la institución');
        },
      });
  }
}
