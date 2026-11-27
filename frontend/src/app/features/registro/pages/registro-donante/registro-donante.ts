import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import { RegistroDonantePayload } from '../../../../core/interfaces/dona-conecta';
import { EntornoService } from '../../../../core/services/entorno.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { Brand } from '../../../../shared/components/brand/brand';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  contraseniasCoinciden,
  etiquetaFuerzaPassword,
  resolverFuerzaPassword,
  telefonoPeruano,
} from '../../../../core/utils/formularios';
import { RegistroApiService } from '../../services/registro-api.service';

@Component({
  selector: 'app-registro-donante',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Brand, Icon],
  templateUrl: './registro-donante.html',
  styleUrl: './registro-donante.scss',
})
export class RegistroDonante implements OnInit {
  private readonly api = inject(RegistroApiService);
  readonly entorno = inject(EntornoService);
  private readonly router = inject(Router);

  readonly distritos = DISTRITOS_HUANCAYO;
  readonly verContrasena = signal(false);
  readonly fuerza = signal(0);
  readonly respuesta = signal('');
  readonly enviando = signal(false);

  readonly form = new FormGroup(
    {
      nombres: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
      apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      telefono: new FormControl('', { nonNullable: true, validators: [telefonoPeruano] }),
      distritoId: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      preferenciaNotificacion: new FormControl<'TODAS' | 'IMPORTANTES' | 'NINGUNA'>('IMPORTANTES', {
        nonNullable: true,
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmacion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      consentimientoDatos: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
      aceptaTerminos: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    },
    { validators: [contraseniasCoinciden] },
  );

  readonly etiquetaFuerza = computed(() => etiquetaFuerzaPassword(this.fuerza()));

  constructor() {
    this.form.controls.password.valueChanges.subscribe((valor) => {
      this.fuerza.set(resolverFuerzaPassword(valor));
    });
  }

  ngOnInit(): void {
    this.entorno.cargar();
  }

  alternarContrasena(): void {
    this.verContrasena.update((valor) => !valor);
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();
    const payload: RegistroDonantePayload = {
      tipo: 'DONANTE',
      email: valor.email.trim().toLowerCase(),
      password: valor.password,
      nombres: valor.nombres.trim(),
      apellidos: valor.apellidos.trim(),
      telefono: valor.telefono.trim() || undefined,
      distritoId: valor.distritoId,
      preferenciaNotificacion: valor.preferenciaNotificacion,
      consentimientoDatos: valor.consentimientoDatos,
      aceptaTerminos: valor.aceptaTerminos,
    };

    this.respuesta.set('');
    this.enviando.set(true);
    this.api.registrarDonante(payload).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigateByUrl('/perfil');
      },
      error: (error) => {
        this.enviando.set(false);
        this.respuesta.set(mensajeErrorApi(error, 'el registro'));
      },
    });
  }
}
