import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DISTRITOS_HUANCAYO, TIPOS_INSTITUCION } from '../../../../core/data/catalogos-locales';
import { RegistroRepresentantePayload } from '../../../../core/interfaces/dona-conecta';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import {
  contraseniasCoinciden,
  etiquetaFuerzaPassword,
  resolverFuerzaPassword,
  telefonoPeruano,
} from '../../../../core/utils/formularios';
import { Brand } from '../../../../shared/components/brand/brand';
import { Icon } from '../../../../shared/components/icon/icon';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';
import { RegistroApiService } from '../../services/registro-api.service';

type Paso = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-registro-institucion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Brand, Icon, PendingNotice],
  templateUrl: './registro-institucion.html',
  styleUrl: './registro-institucion.scss',
})
export class RegistroInstitucion {
  private readonly api = inject(RegistroApiService);
  private readonly estadoServicio = inject(BackendEstadoService);

  readonly distritos = DISTRITOS_HUANCAYO;
  readonly tipos = TIPOS_INSTITUCION;
  readonly estado = this.estadoServicio.estado('registroRepresentante');
  readonly paso = signal<Paso>(1);
  readonly verContrasena = signal(false);
  readonly fuerza = signal(0);
  readonly respuesta = signal('');

  readonly etapas = [
    { numero: 1, titulo: 'Acceso', icono: 'lock' },
    { numero: 2, titulo: 'Representante', icono: 'user' },
    { numero: 3, titulo: 'Institución', icono: 'building' },
    { numero: 4, titulo: 'Ubicación y revisión', icono: 'shield' },
  ] as const;

  readonly form = new FormGroup(
    {
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmacion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      nombres: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      apellidos: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      telefono: new FormControl('', { nonNullable: true, validators: [telefonoPeruano] }),
      cargoRepresentante: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
      nombreInstitucion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
      tipoId: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      distritoId: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      direccion: new FormControl('', { nonNullable: true }),
      descripcion: new FormControl('', { nonNullable: true }),
    },
    { validators: [contraseniasCoinciden] },
  );

  readonly etiquetaFuerza = computed(() => etiquetaFuerzaPassword(this.fuerza()));

  private readonly camposPorPaso: Readonly<Record<Paso, readonly string[]>> = {
    1: ['email', 'password', 'confirmacion'],
    2: ['nombres', 'apellidos', 'telefono', 'cargoRepresentante'],
    3: ['nombreInstitucion', 'tipoId'],
    4: ['distritoId', 'direccion', 'descripcion'],
  };

  constructor() {
    this.form.controls.password.valueChanges.subscribe((valor) => {
      this.fuerza.set(resolverFuerzaPassword(valor));
    });
  }

  alternarContrasena(): void {
    this.verContrasena.update((valor) => !valor);
  }

  siguiente(): void {
    if (!this.validarPaso(this.paso())) return;
    if (this.paso() < 4) this.paso.update((valor) => (valor + 1) as Paso);
  }

  anterior(): void {
    if (this.paso() > 1) this.paso.update((valor) => (valor - 1) as Paso);
  }

  enviar(): void {
    if (!this.validarPaso(4)) return;

    const valor = this.form.getRawValue();
    const payload: RegistroRepresentantePayload = {
      tipo: 'REPRESENTANTE',
      email: valor.email.trim().toLowerCase(),
      password: valor.password,
      nombres: valor.nombres.trim(),
      apellidos: valor.apellidos.trim(),
      telefono: valor.telefono.trim() || undefined,
      institucion: {
        nombre: valor.nombreInstitucion.trim(),
        tipoId: valor.tipoId,
        distritoId: valor.distritoId,
        direccion: valor.direccion.trim() || undefined,
        descripcion: valor.descripcion.trim() || undefined,
        cargoRepresentante: valor.cargoRepresentante.trim(),
      },
    };

    this.respuesta.set('');
    this.api.registrarRepresentante(payload).subscribe({
      error: () =>
        this.respuesta.set(
          'Tu solicitud no se ha enviado: el servicio oficial aún no está conectado. No se ha guardado ningún dato.',
        ),
    });
  }

  private validarPaso(paso: Paso): boolean {
    let valido = true;
    for (const nombre of this.camposPorPaso[paso]) {
      const control = this.form.get(nombre);
      if (control?.invalid) {
        control.markAsTouched();
        valido = false;
      }
    }
    if (paso === 1 && this.form.errors?.['noCoinciden']) {
      this.form.controls.confirmacion.markAsTouched();
      valido = false;
    }
    return valido;
  }
}
