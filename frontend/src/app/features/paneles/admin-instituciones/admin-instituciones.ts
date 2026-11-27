import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  InstitucionAdmin,
  PanelApiService,
  VerificarInstitucionPayload,
} from '../../../core/services/panel-api.service';
import { mensajeErrorApi } from '../../../core/utils/errores-api';
import { normalizarTexto } from '../../../core/utils/busqueda-texto';
import { PanelEncabezado } from '../components/panel-encabezado/panel-encabezado';
import { PanelEstado } from '../components/panel-estado/panel-estado';

type EstadoLista = 'cargando' | 'datos' | 'vacio' | 'error';

@Component({
  selector: 'app-admin-instituciones',
  standalone: true,
  imports: [ReactiveFormsModule, PanelEncabezado, PanelEstado],
  templateUrl: './admin-instituciones.html',
  styleUrl: './admin-instituciones.scss',
})
export class AdminInstituciones implements OnInit {
  private readonly api = inject(PanelApiService);

  readonly estado = signal<EstadoLista>('cargando');
  readonly instituciones = signal<readonly InstitucionAdmin[]>([]);
  readonly termino = signal('');
  readonly seleccionada = signal<InstitucionAdmin | null>(null);
  readonly mensaje = signal('');
  readonly mensajeEsError = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');

  readonly formVerificacion = new FormGroup({
    decision: new FormControl<VerificarInstitucionPayload['estado_verificacion']>('VERIFICADA', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(5), Validators.maxLength(500)],
    }),
  });

  readonly filtradas = computed(() => {
    const texto = normalizarTexto(this.termino());
    if (!texto) return this.instituciones();
    return this.instituciones().filter((institucion) =>
      normalizarTexto(
        `${institucion.nombre} ${institucion.tipo ?? ''} ${institucion.distrito ?? ''}`,
      ).includes(texto),
    );
  });

  readonly pendientes = computed(
    () =>
      this.instituciones().filter(
        (institucion) => institucion.estado_verificacion.toLocaleUpperCase('es') !== 'VERIFICADA',
      ).length,
  );

  /** Sólo decisiones permitidas por las reglas de negocio del backend. */
  readonly decisiones = computed<readonly VerificarInstitucionPayload['estado_verificacion'][]>(
    () => {
      const actual = (this.seleccionada()?.estado_verificacion ?? 'PENDIENTE').toLocaleUpperCase('es');
      const permitidas: Readonly<Record<string, readonly VerificarInstitucionPayload['estado_verificacion'][]>> = {
        PENDIENTE: ['EN_REVISION', 'VERIFICADA', 'RECHAZADA'],
        EN_REVISION: ['VERIFICADA', 'RECHAZADA'],
        RECHAZADA: ['EN_REVISION'],
        VERIFICADA: ['SUSPENDIDA'],
        SUSPENDIDA: ['VERIFICADA', 'PENDIENTE'],
      };
      return permitidas[actual] ?? [];
    },
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.api.listarInstitucionesAdmin().subscribe({
      next: (lista) => {
        this.instituciones.set(lista);
        this.estado.set(lista.length > 0 ? 'datos' : 'vacio');
        if (lista.length > 0) this.seleccionar(lista[0] ?? null);
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar las instituciones'));
        this.estado.set('error');
      },
    });
  }

  seleccionar(institucion: InstitucionAdmin | null): void {
    this.seleccionada.set(institucion);
    this.avisar('');
    const primera = this.decisiones()[0] ?? 'PENDIENTE';
    this.formVerificacion.reset({ decision: primera, motivo: '' });
  }

  /** El backend exige sustento únicamente para rechazar o suspender. */
  requiereMotivo(decision: VerificarInstitucionPayload['estado_verificacion']): boolean {
    return decision === 'RECHAZADA' || decision === 'SUSPENDIDA';
  }

  etiquetaDecision(decision: VerificarInstitucionPayload['estado_verificacion']): string {
    const etiquetas: Readonly<Record<string, string>> = {
      PENDIENTE: 'Devolver a pendiente',
      EN_REVISION: 'Poner en revisión',
      VERIFICADA: 'Verificada',
      RECHAZADA: 'Rechazada',
      SUSPENDIDA: 'Suspender verificación',
    };
    return etiquetas[decision] ?? decision;
  }

  claseEstado(estado: string): string {
    const valor = estado.toLocaleUpperCase('es');
    if (valor === 'VERIFICADA') return 'badge rounded-pill text-bg-success';
    if (valor === 'RECHAZADA' || valor === 'SUSPENDIDA') {
      return 'badge rounded-pill text-bg-secondary';
    }
    if (valor === 'PENDIENTE' || valor === 'EN_REVISION') {
      return 'badge rounded-pill text-bg-warning';
    }
    return 'badge rounded-pill text-bg-light';
  }

  private avisar(texto: string, esError = false): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(esError);
  }

  registrarVerificacion(): void {
    const institucion = this.seleccionada();
    const valor = this.formVerificacion.getRawValue();
    const motivo = valor.motivo.trim();
    const sinMotivoObligatorio = this.requiereMotivo(valor.decision) && motivo.length === 0;
    if (!institucion || this.formVerificacion.invalid || sinMotivoObligatorio) {
      this.formVerificacion.markAllAsTouched();
      const aviso = this.requiereMotivo(valor.decision)
        ? 'Selecciona una institución y escribe el motivo de la decisión.'
        : 'Selecciona una institución y revisa los datos registrados.';
      this.avisar(aviso, true);
      return;
    }

    const payload: VerificarInstitucionPayload = {
      estado_verificacion: valor.decision,
      ...(motivo ? { motivo } : {}),
    };
    this.guardando.set(true);
    this.avisar('');
    this.api
      .verificarInstitucion(institucion.id_institucion, payload)
      .subscribe({
        next: (respuesta) => {
          const estadoNuevo = respuesta.institucion.estado_verificacion;
          this.instituciones.update((lista) =>
            lista.map((item) =>
              item.id_institucion === respuesta.institucion.id_institucion
                ? { ...item, estado_verificacion: estadoNuevo }
                : item,
            ),
          );
          this.seleccionar({ ...institucion, estado_verificacion: estadoNuevo });
          this.avisar(respuesta.mensaje);
          this.guardando.set(false);
        },
        error: (fallo) => {
          this.avisar(mensajeErrorApi(fallo, 'Registrar la verificación'), true);
          this.guardando.set(false);
        },
      });
  }
}
