import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SesionService } from '../../../../core/services/sesion.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { Brand } from '../../../../shared/components/brand/brand';
import { Icon } from '../../../../shared/components/icon/icon';
import { AutenticacionApiService } from '../../services/autenticacion-api.service';

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Brand, Icon],
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.scss',
})
export class IniciarSesion {
  private readonly api = inject(AutenticacionApiService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  private avisoInicial(): string {
    const aviso = this.ruta.snapshot.queryParamMap.get('aviso');
    if (aviso === 'credenciales') {
      return 'Tus credenciales cambiaron. Inicia sesión con los nuevos datos.';
    }
    if (aviso === 'cuenta-baja') {
      return 'Tu cuenta fue dada de baja. Ya no puedes iniciar sesión.';
    }
    return '';
  }

  readonly verContrasena = signal(false);
  readonly respuesta = signal(this.avisoInicial());

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
        next: (respuesta) => {
          this.sesion.iniciar(respuesta.access_token, respuesta.usuario);
          this.router.navigateByUrl('/perfil');
        },
        error: (error) => {
          this.respuesta.set(mensajeErrorApi(error, 'el inicio de sesión'));
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
