import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DISTRITOS_HUANCAYO } from '../../../../core/data/catalogos-locales';
import {
  HorarioAcopioPayload,
  PuntoAcopioDTO,
  idPuntoAcopio,
} from '../../../../core/interfaces/integracion-final';
import { PanelApiService } from '../../../../core/services/panel-api.service';
import { SesionService } from '../../../../core/services/sesion.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import {
  PanelOperacionesApiService,
  puntosDe,
} from '../../services/panel-operaciones-api.service';

type EstadoPagina = 'cargando' | 'datos' | 'error' | 'sin-sesion';

interface HorarioForm {
  readonly dia_semana: FormControl<number>;
  readonly hora_apertura: FormControl<string>;
  readonly hora_cierre: FormControl<string>;
  readonly activo: FormControl<boolean>;
}

interface PuntoForm {
  readonly nombre: FormControl<string>;
  readonly direccion: FormControl<string>;
  readonly referencias_entrega: FormControl<string>;
  readonly distrito_id: FormControl<number>;
  readonly latitud: FormControl<string>;
  readonly longitud: FormControl<string>;
  readonly coordenadas_publicas: FormControl<boolean>;
  readonly horarios: FormGroup<Record<string, FormGroup<HorarioForm>>>;
}

const DIAS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

@Component({
  selector: 'app-institucional-puntos-acopio',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Icon, PageHero],
  templateUrl: './institucional-puntos-acopio.html',
  styleUrl: './institucional-puntos-acopio.scss',
})
export class InstitucionalPuntosAcopio implements OnInit {
  private readonly operaciones = inject(PanelOperacionesApiService);
  private readonly panelApi = inject(PanelApiService);
  readonly sesion = inject(SesionService);
  readonly distritos = DISTRITOS_HUANCAYO;
  readonly dias = DIAS;

  readonly estado = signal<EstadoPagina>('cargando');
  readonly error = signal('');
  readonly aviso = signal('');
  readonly puntos = signal<readonly PuntoAcopioDTO[]>([]);
  readonly institucionId = signal(0);
  readonly editandoId = signal(0);
  readonly procesando = signal(false);

  readonly formulario = new FormGroup<PuntoForm>({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    direccion: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(250)] }),
    referencias_entrega: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(250)] }),
    distrito_id: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    latitud: new FormControl('', { nonNullable: true }),
    longitud: new FormControl('', { nonNullable: true }),
    coordenadas_publicas: new FormControl(false, { nonNullable: true }),
    horarios: new FormGroup(
      Object.fromEntries(
        DIAS.map((_, indice) => [
          String(indice + 1),
          new FormGroup<HorarioForm>({
            dia_semana: new FormControl(indice + 1, { nonNullable: true }),
            hora_apertura: new FormControl('09:00', { nonNullable: true }),
            hora_cierre: new FormControl('12:00', { nonNullable: true }),
            activo: new FormControl(false, { nonNullable: true }),
          }),
        ]),
      ) as Record<string, FormGroup<HorarioForm>>,
    ),
  });

  ngOnInit(): void {
    if (!this.sesion.autenticado()) {
      this.estado.set('sin-sesion');
      return;
    }
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.panelApi.obtenerPerfilInstitucional().subscribe({
      next: (perfil) => {
        this.institucionId.set(perfil.id_institucion);
        this.operaciones
          .listarPuntos({ institucionId: perfil.id_institucion, publico: false })
          .subscribe({
            next: (respuesta) => {
              this.puntos.set(puntosDe(respuesta));
              this.estado.set('datos');
            },
            error: (fallo) => {
              this.error.set(mensajeErrorApi(fallo, 'Consultar tus puntos de acopio'));
              this.estado.set('error');
            },
          });
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar los datos de tu institución'));
        this.estado.set('error');
      },
    });
  }

  id(punto: PuntoAcopioDTO): number {
    return idPuntoAcopio(punto);
  }

  horarios(punto: PuntoAcopioDTO): string {
    const activos = (punto.horarios ?? []).filter((horario) => horario.activo !== false);
    if (!activos.length) return 'Sin horarios registrados';
    return activos
      .map((horario) => `${DIAS[horario.dia_semana - 1] ?? 'Día'} ${horario.hora_apertura.slice(0, 5)}–${horario.hora_cierre.slice(0, 5)}`)
      .join(' · ');
  }

  coordenadas(punto: PuntoAcopioDTO): string {
    if (punto.latitud === null || punto.latitud === undefined || punto.longitud === null || punto.longitud === undefined) {
      return 'Sin coordenadas registradas';
    }
    return punto.coordenadas_visibles || punto.coordenadas_publicas
      ? `${punto.latitud}, ${punto.longitud} · publicadas con autorización`
      : `${punto.latitud}, ${punto.longitud} · privadas`;
  }

  editar(punto: PuntoAcopioDTO): void {
    this.editandoId.set(this.id(punto));
    this.aviso.set('');
    const horarios = this.formulario.controls.horarios.controls;
    for (const [clave, grupo] of Object.entries(horarios)) {
      const existe = (punto.horarios ?? []).find((horario) => horario.dia_semana === Number(clave));
      grupo.patchValue({
        hora_apertura: existe?.hora_apertura.slice(0, 5) ?? '09:00',
        hora_cierre: existe?.hora_cierre.slice(0, 5) ?? '12:00',
        activo: existe?.activo ?? false,
      });
    }
    this.formulario.patchValue({
      nombre: punto.nombre,
      direccion: punto.direccion ?? '',
      referencias_entrega: punto.referencias_entrega ?? '',
      distrito_id: Number(punto.distrito_id ?? 0),
      latitud: punto.latitud === null || punto.latitud === undefined ? '' : String(punto.latitud),
      longitud: punto.longitud === null || punto.longitud === undefined ? '' : String(punto.longitud),
      coordenadas_publicas: Boolean(punto.coordenadas_publicas),
    });
  }

  nuevo(): void {
    this.editandoId.set(0);
    this.aviso.set('');
    this.formulario.reset({
      nombre: '',
      direccion: '',
      referencias_entrega: '',
      distrito_id: 0,
      latitud: '',
      longitud: '',
      coordenadas_publicas: false,
    });
    for (const grupo of Object.values(this.formulario.controls.horarios.controls)) {
      grupo.patchValue({ hora_apertura: '09:00', hora_cierre: '12:00', activo: false });
    }
  }

  guardar(): void {
    if (this.formulario.invalid || this.procesando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valor = this.formulario.getRawValue();
    const latitud = valor.latitud.trim() ? Number(valor.latitud) : null;
    const longitud = valor.longitud.trim() ? Number(valor.longitud) : null;
    if (
      (latitud !== null && !Number.isFinite(latitud)) ||
      (longitud !== null && !Number.isFinite(longitud)) ||
      (latitud !== null && (latitud < -90 || latitud > 90)) ||
      (longitud !== null && (longitud < -180 || longitud > 180))
    ) {
      this.aviso.set('Las coordenadas indicadas no son válidas.');
      return;
    }

    const horarios: HorarioAcopioPayload[] = Object.values(valor.horarios).map((horario) => ({
      dia_semana: horario.dia_semana,
      hora_apertura: this.hora(horario.hora_apertura),
      hora_cierre: this.hora(horario.hora_cierre),
      activo: horario.activo,
    }));
    const payload = {
      id_institucion: this.institucionId(),
      nombre: valor.nombre.trim(),
      direccion: valor.direccion.trim(),
      referencias_entrega: valor.referencias_entrega.trim(),
      distrito_id: valor.distrito_id,
      latitud,
      longitud,
      coordenadas_publicas: valor.coordenadas_publicas,
      horarios,
    };

    this.procesando.set(true);
    this.aviso.set('');
    const id = this.editandoId();
    const peticion = id > 0
      ? this.operaciones.reemplazarPunto(id, payload)
      : this.operaciones.crearPunto(payload);
    peticion.subscribe({
      next: () => {
        this.aviso.set(id > 0 ? 'Punto de acopio actualizado.' : 'Punto de acopio registrado.');
        this.procesando.set(false);
        this.nuevo();
        this.cargar();
      },
      error: (fallo) => {
        this.aviso.set(mensajeErrorApi(fallo, 'Guardar el punto de acopio'));
        this.procesando.set(false);
      },
    });
  }

  cambiarEstado(punto: PuntoAcopioDTO): void {
    const id = this.id(punto);
    const estado = punto.estado?.toLocaleUpperCase('es') === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.procesando.set(true);
    this.operaciones.cambiarEstadoPunto(id, estado).subscribe({
      next: () => {
        this.aviso.set(`Punto de acopio ${estado.toLocaleLowerCase('es')}.`);
        this.procesando.set(false);
        this.cargar();
      },
      error: (fallo) => {
        this.aviso.set(mensajeErrorApi(fallo, 'Cambiar el estado del punto'));
        this.procesando.set(false);
      },
    });
  }

  eliminar(punto: PuntoAcopioDTO): void {
    const id = this.id(punto);
    if (!id || !window.confirm(`¿Eliminar el punto de acopio «${punto.nombre}»?`)) return;
    this.procesando.set(true);
    this.operaciones.eliminarPunto(id).subscribe({
      next: () => {
        this.aviso.set('Punto de acopio eliminado.');
        this.procesando.set(false);
        if (this.editandoId() === id) this.nuevo();
        this.cargar();
      },
      error: (fallo) => {
        this.aviso.set(mensajeErrorApi(fallo, 'Eliminar el punto de acopio'));
        this.procesando.set(false);
      },
    });
  }

  private hora(valor: string): string {
    return valor.length === 5 ? `${valor}:00` : valor;
  }
}
