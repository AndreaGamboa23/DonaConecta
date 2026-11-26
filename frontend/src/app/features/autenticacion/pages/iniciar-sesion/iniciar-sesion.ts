import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { Brand } from '../../../../shared/components/brand/brand';
import { Icon } from '../../../../shared/components/icon/icon';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';
import { AutenticacionApiService } from '../../services/autenticacion-api.service';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Brand, Icon, PendingNotice],
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.scss',
})
export class IniciarSesion {
  private readonly api = inject(AutenticacionApiService);
  private readonly estadoServicio = inject(BackendEstadoService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly estadoLogin = this.estadoServicio.estado('login');
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
        next: (res) => {
          this.sesion.iniciar(res.access_token, res.usuario);
          this.router.navigateByUrl('/perfil');
        },
        error: (err) => {
          this.respuesta.set(
            err?.error?.detail ?? 'Correo o contraseña incorrectos. Verifica tus datos.',
          );
        },
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
