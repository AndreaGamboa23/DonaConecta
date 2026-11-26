import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import { RegistroDonantePayload } from '../../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';
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
  imports: [ReactiveFormsModule, PageHero, PendingNotice, EmptyState, Icon],
  templateUrl: './registro-donante.html',
  styleUrl: './registro-donante.scss',
})
export class RegistroDonante {
  private readonly api = inject(RegistroApiService);
  private readonly estadoServicio = inject(BackendEstadoService);

  readonly distritos = DISTRITOS_HUANCAYO;
  readonly estado = this.estadoServicio.estado('registroDonante');
  readonly verContrasena = signal(false);
  readonly fuerza = signal(0);
  readonly respuesta = signal('');

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
    this.api.registrarDonante(payload).subscribe({
      error: () =>
        this.respuesta.set(
          'El registro no está habilitado todavía. Revisaremos este formulario cuando el servicio real esté disponible.',
        ),
    });
  }
}
