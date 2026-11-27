import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PanelApiService, PerfilInstitucional } from '../../../core/services/panel-api.service';
import { mensajeErrorApi } from '../../../core/utils/errores-api';
import { telefonoPeruano } from '../../../core/utils/formularios';
import { PanelEncabezado } from '../components/panel-encabezado/panel-encabezado';
import { PanelEstado } from '../components/panel-estado/panel-estado';

type EstadoPerfil = 'cargando' | 'datos' | 'error';

@Component({
  selector: 'app-institucional-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, PanelEncabezado, PanelEstado],
  templateUrl: './institucional-perfil.html',
  styleUrl: './institucional-perfil.scss',
})
export class InstitucionalPerfil implements OnInit {
  private readonly api = inject(PanelApiService);

  readonly estado = signal<EstadoPerfil>('cargando');
  readonly perfil = signal<PerfilInstitucional | null>(null);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly mensajeEsError = signal(false);
  readonly guardando = signal(false);

  readonly form = new FormGroup({
    direccion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300)] }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    telefono_publico: new FormControl('', {
      nonNullable: true,
      validators: [telefonoPeruano, Validators.maxLength(30)],
    }),
    email_publico: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(256)],
    }),
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.api.obtenerPerfilInstitucional().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.form.reset({
          direccion: perfil.direccion ?? '',
          descripcion: perfil.descripcion ?? '',
          telefono_publico: perfil.telefono_publico ?? '',
          email_publico: perfil.email_publico ?? '',
        });
        this.estado.set('datos');
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar los datos de la institución'));
        this.estado.set('error');
      },
    });
  }

  private avisar(texto: string, esError = false): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(esError);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.avisar('Revisa los campos marcados antes de guardar.', true);
      return;
    }

    const valor = this.form.getRawValue();
    this.guardando.set(true);
    this.avisar('');
    this.api
      .actualizarPerfilInstitucional({
        direccion: valor.direccion.trim() || null,
        descripcion: valor.descripcion.trim() || null,
        telefono_publico: valor.telefono_publico.trim() || null,
        email_publico: valor.email_publico.trim() || null,
      })
      .subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          this.avisar('Los datos públicos de la institución quedaron actualizados.');
          this.guardando.set(false);
        },
        error: (fallo) => {
          this.avisar(mensajeErrorApi(fallo, 'Guardar los datos de la institución'), true);
          this.guardando.set(false);
        },
      });
  }
}
