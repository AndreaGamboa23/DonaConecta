import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="py-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-7 col-lg-6">
            <div class="card border-0 shadow-sm rounded-4 p-4">
              <h1 class="h3 fw-bold mb-1">Crear cuenta</h1>
              <p class="text-muted small mb-4">Únete como donante o representante de una institución</p>

              @if (error()) {
                <div class="alert alert-danger py-2 small">{{ error() }}</div>
              }
              @if (exito()) {
                <div class="alert alert-success py-2 small">{{ exito() }}</div>
              }

              <form (ngSubmit)="onSubmit()">
                <div class="row g-3 mb-3">
                  <div class="col-sm-6">
                    <label class="form-label fw-medium">Nombres</label>
                    <input type="text" class="form-control" name="nombres" [(ngModel)]="nombres" required />
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label fw-medium">Apellidos</label>
                    <input type="text" class="form-control" name="apellidos" [(ngModel)]="apellidos" required />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-medium">Correo electrónico</label>
                  <input type="email" class="form-control" name="correo" [(ngModel)]="correo" required />
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-sm-6">
                    <label class="form-label fw-medium">Teléfono (opcional)</label>
                    <input type="text" class="form-control" name="telefono" [(ngModel)]="telefono" />
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label fw-medium">Tipo de cuenta</label>
                    <select class="form-select" name="rol" [(ngModel)]="rol">
                      <option value="DONANTE">Donante</option>
                      <option value="REPRESENTANTE">Representante de institución</option>
                    </select>
                  </div>
                </div>

                <div class="mb-4">
                  <label class="form-label fw-medium">Contraseña (mínimo 8 caracteres)</label>
                  <input type="password" class="form-control" name="password" [(ngModel)]="password" minlength="8" required />
                </div>

                <button type="submit" class="btn btn-primary w-100" [disabled]="cargando()">
                  {{ cargando() ? 'Registrando...' : 'Crear cuenta' }}
                </button>
              </form>

              <p class="text-center small text-muted mt-3 mb-0">
                ¿Ya tienes cuenta? <a routerLink="/iniciar-sesion">Inicia sesión</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  nombres = '';
  apellidos = '';
  correo = '';
  telefono = '';
  rol: 'DONANTE' | 'REPRESENTANTE' = 'DONANTE';
  password = '';

  readonly cargando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  onSubmit() {
    this.error.set('');
    this.exito.set('');
    this.cargando.set(true);
    this.auth
      .registro({
        nombres: this.nombres,
        apellidos: this.apellidos,
        correo: this.correo,
        telefono: this.telefono || undefined,
        password: this.password,
        rol: this.rol,
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.exito.set('Cuenta creada correctamente. Redirigiendo a inicio de sesión...');
          setTimeout(() => this.router.navigateByUrl('/iniciar-sesion'), 1200);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(err?.error?.detail || 'No se pudo completar el registro');
        },
      });
  }
}
