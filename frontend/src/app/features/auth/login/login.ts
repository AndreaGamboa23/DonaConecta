import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="py-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="card border-0 shadow-sm rounded-4 p-4">
              <h1 class="h3 fw-bold mb-1">Iniciar sesión</h1>
              <p class="text-muted small mb-4">Ingresa a tu cuenta de DonaConecta</p>

              @if (error()) {
                <div class="alert alert-danger py-2 small">{{ error() }}</div>
              }

              <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label fw-medium">Correo electrónico</label>
                  <input type="email" class="form-control" name="correo" [(ngModel)]="correo" required />
                </div>
                <div class="mb-4">
                  <label class="form-label fw-medium">Contraseña</label>
                  <input type="password" class="form-control" name="password" [(ngModel)]="password" required />
                </div>
                <button type="submit" class="btn btn-primary w-100" [disabled]="cargando()">
                  {{ cargando() ? 'Ingresando...' : 'Ingresar' }}
                </button>
              </form>

              <p class="text-center small text-muted mt-3 mb-0">
                ¿Aún no tienes cuenta? <a routerLink="/registro">Regístrate aquí</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  correo = '';
  password = '';
  readonly cargando = signal(false);
  readonly error = signal('');

  onSubmit() {
    this.error.set('');
    this.cargando.set(true);
    this.auth.login(this.correo, this.password).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.detail || 'Correo o contraseña incorrectos');
      },
    });
  }
}
