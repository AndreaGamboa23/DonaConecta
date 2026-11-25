import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

interface InstitucionPendiente {
  id_institucion: number;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  tipo_institucion: string;
  distrito: string;
  direccion: string;
  representante: string;
  correo_representante: string;
}

interface CompromisoInstitucion {
  id_compromiso: number;
  necesidad: string;
  institucion: string;
  donante: string;
  telefono_donante?: string | null;
  cantidad_comprometida: number;
  unidad_medida_base: string;
  comentario?: string | null;
  estado: string;
}

@Component({
  selector: 'app-gestion',
  template: `
    <section class="py-5">
      <div class="container">
        <h1 class="h2 fw-bold mb-1">Panel de gestión</h1>
        <p class="text-muted mb-4">
          Administración de verificaciones institucionales y confirmación de entregas materiales.
        </p>

        @if (mensaje()) {
          <div class="alert alert-success py-2 small">{{ mensaje() }}</div>
        }
        @if (error()) {
          <div class="alert alert-danger py-2 small">{{ error() }}</div>
        }

        @if (esAdmin()) {
          <div class="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h2 class="h5 fw-bold mb-3">Instituciones pendientes de verificación</h2>
            @if (pendientes().length === 0) {
              <p class="text-muted small mb-0">No hay instituciones pendientes de revisión.</p>
            } @else {
              <div class="table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Institución</th>
                      <th>RUC / Tipo</th>
                      <th>Ubicación</th>
                      <th>Representante</th>
                      <th class="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (inst of pendientes(); track inst.id_institucion) {
                      <tr>
                        <td>
                          <div class="fw-semibold">{{ inst.nombre_comercial }}</div>
                          <div class="small text-muted">{{ inst.razon_social }}</div>
                        </td>
                        <td>
                          <div>{{ inst.ruc }}</div>
                          <span class="badge bg-light text-dark border">{{ inst.tipo_institucion }}</span>
                        </td>
                        <td class="small">{{ inst.direccion }} — {{ inst.distrito }}</td>
                        <td class="small">
                          <div>{{ inst.representante }}</div>
                          <div class="text-muted">{{ inst.correo_representante }}</div>
                        </td>
                        <td class="text-end">
                          <div class="d-inline-flex gap-2">
                            <button
                              type="button"
                              class="btn btn-success btn-sm"
                              (click)="decidirInstitucion(inst.id_institucion, 'VERIFICADA')"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              (click)="decidirInstitucion(inst.id_institucion, 'RECHAZADA')"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        @if (esRepresentante()) {
          <div class="card border-0 shadow-sm rounded-4 p-4">
            <h2 class="h5 fw-bold mb-3">Donaciones comprometidas para mi institución</h2>
            @if (compromisos().length === 0) {
              <p class="text-muted small mb-0">Aún no has recibido compromisos de donación.</p>
            } @else {
              <div class="table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Necesidad</th>
                      <th>Donante</th>
                      <th>Cantidad</th>
                      <th>Comentario</th>
                      <th>Estado</th>
                      <th class="text-end">Recepción</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of compromisos(); track c.id_compromiso) {
                      <tr>
                        <td class="fw-medium">{{ c.necesidad }}</td>
                        <td class="small">
                          <div>{{ c.donante }}</div>
                          <div class="text-muted">{{ c.telefono_donante || 'Sin teléfono' }}</div>
                        </td>
                        <td>{{ c.cantidad_comprometida }} {{ c.unidad_medida_base }}</td>
                        <td class="small text-muted">{{ c.comentario || '—' }}</td>
                        <td><span class="badge bg-info-subtle text-dark">{{ c.estado }}</span></td>
                        <td class="text-end">
                          @if (c.estado !== 'COMPLETADO') {
                            <button
                              type="button"
                              class="btn btn-primary btn-sm"
                              (click)="confirmarEntrega(c.id_compromiso)"
                            >
                              Confirmar entrega
                            </button>
                          } @else {
                            <span class="badge bg-success-subtle text-success">Recibida</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class Gestion implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = 'http://127.0.0.1:8000/api/v1';

  readonly pendientes = signal<InstitucionPendiente[]>([]);
  readonly compromisos = signal<CompromisoInstitucion[]>([]);
  readonly mensaje = signal('');
  readonly error = signal('');

  readonly esAdmin = computed(() =>
    this.auth.usuarioActual()?.roles.includes('ADMINISTRADOR') ?? false,
  );
  readonly esRepresentante = computed(() =>
    this.auth.usuarioActual()?.roles.includes('REPRESENTANTE') ?? false,
  );

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    if (this.esAdmin()) {
      this.http
        .get<InstitucionPendiente[]>(`${this.baseUrl}/admin/instituciones/pendientes`)
        .subscribe((data) => this.pendientes.set(data));
    }
    if (this.esRepresentante()) {
      this.http
        .get<CompromisoInstitucion[]>(`${this.baseUrl}/compromisos/institucion`)
        .subscribe((data) => this.compromisos.set(data));
    }
  }

  decidirInstitucion(idInstitucion: number, estado: 'VERIFICADA' | 'RECHAZADA') {
    this.mensaje.set('');
    this.error.set('');
    this.http
      .patch(`${this.baseUrl}/admin/instituciones/${idInstitucion}/verificar`, {
        estado_verificacion: estado,
      })
      .subscribe({
        next: () => {
          this.mensaje.set(`Institución marcada como ${estado}.`);
          this.cargarDatos();
        },
        error: (err) => this.error.set(err?.error?.detail || 'Error al actualizar estado'),
      });
  }

  confirmarEntrega(idCompromiso: number) {
    this.mensaje.set('');
    this.error.set('');
    this.http
      .patch(`${this.baseUrl}/compromisos/${idCompromiso}/confirmar-entrega`, {})
      .subscribe({
        next: () => {
          this.mensaje.set('Recepción física confirmada correctamente.');
          this.cargarDatos();
        },
        error: (err) => this.error.set(err?.error?.detail || 'Error al confirmar entrega'),
      });
  }
}
