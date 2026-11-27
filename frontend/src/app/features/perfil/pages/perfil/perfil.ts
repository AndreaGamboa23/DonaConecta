import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import { SesionApiService } from '../../../../core/services/sesion-api.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { contraseniasCoinciden, telefonoPeruano } from '../../../../core/utils/formularios';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import {
  ActividadPersonal,
  DatosEditablesPerfil,
  PerfilApiService,
  PerfilCompleto,
  PreferenciaNotificacion,
} from '../../services/perfil-api.service';

type PestanaPerfil = 'informacion' | 'actividad' | 'preferencias' | 'seguridad';

function nuevasContrasenasCoinciden(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const confirmacion = control.get('confirmacion')?.value;
  return nueva === confirmacion ? null : { noCoinciden: true };
}

const ETIQUETAS_ROL: Readonly<Record<string, string>> = {
  DONANTE: 'Donante',
  REPRESENTANTE: 'Representante',
  ADMINISTRADOR: 'Administrador',
};

const ETIQUETAS_ESTADO: Readonly<Record<string, string>> = {
  ACTIVO: 'Cuenta activa',
  BAJA: 'Cuenta dada de baja',
  BLOQUEADO: 'Cuenta bloqueada',
  PENDIENTE_VERIFICACION: 'Pendiente de verificación',
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, EmptyState, PageHero],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private readonly perfilApi = inject(PerfilApiService);
  private readonly sesionApi = inject(SesionApiService);
  private readonly router = inject(Router);
  readonly sesion = inject(SesionService);

  readonly distritos = DISTRITOS_HUANCAYO;

  readonly perfil = signal<PerfilCompleto | null>(null);
  readonly actividad = signal<ActividadPersonal | null>(null);
  readonly pestana = signal<PestanaPerfil>('informacion');
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly guardandoPreferencias = signal(false);
  readonly cerrando = signal(false);
  readonly bajando = signal(false);
  readonly editando = signal(false);
  readonly error = signal('');
  readonly errorActividad = signal('');
  readonly aviso = signal('');

  readonly esDonante = computed(() => this.perfil()?.donante != null);
  readonly nombreCompleto = computed(() => {
    const perfil = this.perfil();
    return perfil ? `${perfil.nombres} ${perfil.apellidos}`.trim() : '';
  });
  readonly iniciales = computed(() => {
    const nombre = this.nombreCompleto();
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  });
  readonly rolPrincipal = computed(() => {
    const codigo = this.perfil()?.roles[0] ?? 'DONANTE';
    return ETIQUETAS_ROL[codigo] ?? codigo;
  });

  readonly formPerfil = new FormGroup(
    {
      nombres: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      apellidos: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      telefono: new FormControl('', { nonNullable: true, validators: [telefonoPeruano] }),
      distritoId: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      preferenciaNotificacion: new FormControl<PreferenciaNotificacion>('IMPORTANTES', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
  );

  readonly formPreferencias = new FormGroup({
    preferenciaNotificacion: new FormControl<PreferenciaNotificacion>('IMPORTANTES', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly formContrasena = new FormGroup(
    {
      passwordActual: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      passwordNueva: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmacion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
    },
    { validators: [nuevasContrasenasCoinciden] },
  );

  readonly formCorreo = new FormGroup({
    nuevoCorreo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly formBaja = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirmacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('^BAJA$')],
    }),
  });

  ngOnInit(): void {
    if (!this.sesion.autenticado()) {
      this.cargando.set(false);
      return;
    }
    this.recargar();
  }

  recargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.perfilApi.obtenerPerfil().subscribe({
      next: (datos) => {
        this.perfil.set(datos);
        this.sincronizarSesion(datos);
        this.rellenarFormularios(datos);
        this.error.set('');
        this.cargando.set(false);
        this.cargarActividad();
      },
      error: (error) => {
        this.error.set(mensajeErrorApi(error, 'consultar tu perfil'));
        this.cargando.set(false);
      },
    });
  }

  seleccionar(pestana: PestanaPerfil): void {
    this.pestana.set(pestana);
  }

  alternarEdicion(): void {
    const datos = this.perfil();
    if (!datos) return;
    if (this.editando()) {
      this.rellenarFormularios(datos);
      this.editando.set(false);
      return;
    }
    this.rellenarFormularios(datos);
    this.editando.set(true);
  }

  guardarPerfil(): void {
    if (this.formPerfil.invalid || !this.perfil()) {
      this.formPerfil.markAllAsTouched();
      return;
    }
    const valor = this.formPerfil.getRawValue();
    const datos: DatosEditablesPerfil = {
      nombres: valor.nombres.trim(),
      apellidos: valor.apellidos.trim(),
      telefono: valor.telefono.trim() || null,
      ...(this.esDonante()
        ? {
            distritoId: valor.distritoId,
            preferenciaNotificacion: valor.preferenciaNotificacion,
          }
        : {}),
    };

    this.guardando.set(true);
    this.aviso.set('');
    this.perfilApi.reemplazarPerfil(datos).subscribe({
      next: (datosGuardados) => {
        this.perfil.set(datosGuardados);
        this.sincronizarSesion(datosGuardados);
        this.rellenarFormularios(datosGuardados);
        this.editando.set(false);
        this.guardando.set(false);
        this.aviso.set('Tus datos se guardaron correctamente.');
      },
      error: (error) => {
        this.error.set(mensajeErrorApi(error, 'guardar tu perfil'));
        this.guardando.set(false);
      },
    });
  }

  guardarPreferencias(): void {
    if (this.formPreferencias.invalid) {
      this.formPreferencias.markAllAsTouched();
      return;
    }
    this.guardandoPreferencias.set(true);
    this.aviso.set('');
    const preferencia = this.formPreferencias.getRawValue().preferenciaNotificacion;
    this.perfilApi.parchearPerfil({ preferenciaNotificacion: preferencia }).subscribe({
      next: (datos) => {
        this.perfil.set(datos);
        this.sincronizarSesion(datos);
        this.guardandoPreferencias.set(false);
        this.aviso.set('Preferencia actualizada en tu perfil de donante.');
      },
      error: (error) => {
        this.error.set(mensajeErrorApi(error, 'guardar tus preferencias'));
        this.guardandoPreferencias.set(false);
      },
    });
  }

  cambiarContrasena(): void {
    if (this.formContrasena.invalid) {
      this.formContrasena.markAllAsTouched();
      return;
    }
    const valor = this.formContrasena.getRawValue();
    this.guardando.set(true);
    this.aviso.set('');
    this.perfilApi
      .cambiarContrasena(valor.passwordActual, valor.passwordNueva, valor.confirmacion)
      .subscribe({
        next: () => this.credencialesCambiadas(),
        error: (error) => {
          this.error.set(mensajeErrorApi(error, 'cambiar tu contraseña'));
          this.guardando.set(false);
        },
      });
  }

  cambiarCorreo(): void {
    if (this.formCorreo.invalid) {
      this.formCorreo.markAllAsTouched();
      return;
    }
    const valor = this.formCorreo.getRawValue();
    this.guardando.set(true);
    this.aviso.set('');
    this.perfilApi.cambiarCorreo(valor.nuevoCorreo, valor.password).subscribe({
      next: () => this.credencialesCambiadas(),
      error: (error) => {
        this.error.set(mensajeErrorApi(error, 'cambiar tu correo'));
        this.guardando.set(false);
      },
    });
  }

  bajaCuenta(): void {
    if (this.formBaja.invalid || !this.perfil()) {
      this.formBaja.markAllAsTouched();
      return;
    }
    this.bajando.set(true);
    this.error.set('');
    this.perfilApi.bajaCuenta(this.formBaja.getRawValue().password).subscribe({
      next: () => {
        this.sesion.cerrar();
        this.bajando.set(false);
        this.router.navigate(['/iniciar-sesion'], { queryParams: { aviso: 'cuenta-baja' } });
      },
      error: (error) => {
        this.error.set(mensajeErrorApi(error, 'dar de baja tu cuenta'));
        this.bajando.set(false);
      },
    });
  }

  cerrarSesion(): void {
    this.cerrando.set(true);
    this.sesionApi.cerrar().subscribe({
      next: () => this.router.navigateByUrl('/iniciar-sesion'),
      error: () => {
        this.cerrando.set(false);
        this.error.set('No se pudo revocar la sesión en el servidor. Cierra esta pestaña.');
      },
    });
  }

  fechaLegible(valor: string | null): string {
    if (!valor) return 'Sin registro';
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime())
      ? 'Sin registro'
      : fecha.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  estadoLegible(valor: string): string {
    return ETIQUETAS_ESTADO[valor] ?? valor;
  }

  private cargarActividad(): void {
    this.errorActividad.set('');
    this.perfilApi.obtenerActividad().subscribe({
      next: (datos) => this.actividad.set(datos),
      error: (error) => {
        this.actividad.set(null);
        this.errorActividad.set(mensajeErrorApi(error, 'consultar tu actividad'));
      },
    });
  }

  private sincronizarSesion(datos: PerfilCompleto): void {
    this.sesion.actualizarUsuario({
      id_usuario: datos.id_usuario,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      correo: datos.correo,
      roles: datos.roles,
    });
  }

  private rellenarFormularios(datos: PerfilCompleto): void {
    this.formPerfil.patchValue({
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      telefono: datos.telefono_enmascarado ? '' : '',
      distritoId: datos.donante?.distrito_id ?? 0,
      preferenciaNotificacion: datos.donante?.preferencia_notificacion ?? 'IMPORTANTES',
    });
    this.formPreferencias.patchValue({
      preferenciaNotificacion: datos.donante?.preferencia_notificacion ?? 'IMPORTANTES',
    });
  }

  private credencialesCambiadas(): void {
    this.sesion.cerrar();
    this.guardando.set(false);
    this.router.navigate(['/iniciar-sesion'], { queryParams: { aviso: 'credenciales' } });
  }
}
