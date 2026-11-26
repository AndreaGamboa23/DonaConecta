import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';
import { AutenticacionApiService } from '../../services/autenticacion-api.service';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Icon, PageHero, PendingNotice],
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.scss',
})
export class IniciarSesion {
  private readonly api = inject(AutenticacionApiService);
  private readonly estadoServicio = inject(BackendEstadoService);

  readonly estadoLogin = this.estadoServicio.estado('login');
  readonly estadoRecuperacion = this.estadoServicio.estado('recuperacion');
  readonly verContrasena = signal(false);
  readonly respuesta = signal('');

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  readonly recuperacionForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  alternarContrasena(): void {
    this.verContrasena.update((valor) => !valor);
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue();
    this.respuesta.set('');
    this.api
      .login({ email: valor.email.trim().toLowerCase(), password: valor.password })
      .subscribe({
        error: () =>
          this.respuesta.set(
            'No hay una sesión disponible todavía. El acceso se habilitará cuando el servicio de cuentas esté disponible.',
          ),
      });
  }

  recuperar(): void {
    if (this.recuperacionForm.invalid) {
      this.recuperacionForm.markAllAsTouched();
      return;
    }
    const email = this.recuperacionForm.getRawValue().email.trim().toLowerCase();
    this.respuesta.set('');
    this.api.recuperarClave({ email }).subscribe({
      error: () =>
        this.respuesta.set(
          'La recuperación de clave no está activa todavía. No se envió ningún correo.',
        ),
    });
  }
}
