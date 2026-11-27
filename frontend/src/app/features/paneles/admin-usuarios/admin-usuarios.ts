import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Pagina,
  PanelApiService,
  UsuarioAdmin,
} from '../../../core/services/panel-api.service';
import { mensajeErrorApi } from '../../../core/utils/errores-api';
import { PanelEncabezado } from '../components/panel-encabezado/panel-encabezado';
import { PanelEstado } from '../components/panel-estado/panel-estado';

type EstadoLista = 'cargando' | 'datos' | 'vacio' | 'error';
const LIMITE = 10;

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, PanelEncabezado, PanelEstado],
  templateUrl: './admin-usuarios.html',
  styleUrl: './admin-usuarios.scss',
})
export class AdminUsuarios implements OnInit {
  private readonly api = inject(PanelApiService);

  readonly estado = signal<EstadoLista>('cargando');
  readonly datos = signal<Pagina<UsuarioAdmin> | null>(null);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly mensajeEsError = signal(false);
  readonly offset = signal(0);
  readonly guardando = signal(false);
  readonly seleccionado = signal<UsuarioAdmin | null>(null);

  readonly filtros = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    rol: new FormControl('', { nonNullable: true }),
  });

  readonly formEstado = new FormGroup({
    estado: new FormControl<'ACTIVO' | 'BLOQUEADO' | 'BAJA'>('BLOQUEADO', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    motivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
  });

  readonly usuarios = computed(() => this.datos()?.items ?? []);
  readonly total = computed(() => this.datos()?.total ?? 0);
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / LIMITE)));
  readonly paginaActual = computed(() => Math.floor(this.offset() / LIMITE) + 1);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    const filtros = this.filtros.getRawValue();
    this.api
      .listarUsuarios({
        limit: LIMITE,
        offset: this.offset(),
        q: filtros.q.trim(),
        rol: filtros.rol || undefined,
      })
      .subscribe({
        next: (respuesta) => {
          this.datos.set(respuesta);
          this.estado.set(respuesta.items.length > 0 ? 'datos' : 'vacio');
        },
        error: (fallo) => {
          this.error.set(mensajeErrorApi(fallo, 'Consultar las cuentas'));
          this.estado.set('error');
        },
      });
  }

  aplicarFiltros(): void {
    this.offset.set(0);
    this.avisar('');
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtros.reset({ q: '', rol: '' });
    this.aplicarFiltros();
  }

  irPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.offset.set((pagina - 1) * LIMITE);
    this.avisar('');
    this.cargar();
  }

  seleccionar(usuario: UsuarioAdmin): void {
    const estadoActual = usuario.estado_cuenta.toLocaleUpperCase('es');
    const siguiente = estadoActual === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO';
    this.seleccionado.set(usuario);
    this.formEstado.reset({ estado: siguiente, motivo: '' });
    this.avisar('');
  }

  claseEstado(estado: string): string {
    const valor = estado.toLocaleUpperCase('es');
    if (valor === 'ACTIVO') return 'badge rounded-pill text-bg-success';
    if (valor === 'BAJA') return 'badge rounded-pill text-bg-secondary';
    return 'badge rounded-pill text-bg-warning';
  }

  private avisar(texto: string, esError = false): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(esError);
  }

  cambiarEstado(): void {
    const usuario = this.seleccionado();
    if (!usuario || this.formEstado.invalid) {
      this.formEstado.markAllAsTouched();
      this.avisar('Selecciona una cuenta y escribe el motivo del cambio.', true);
      return;
    }
    const valor = this.formEstado.getRawValue();
    this.guardando.set(true);
    this.avisar('');
    this.api
      .cambiarEstadoUsuario(usuario.id_usuario, {
        estado: valor.estado,
        motivo: valor.motivo.trim(),
      })
      .subscribe({
        next: (respuesta) => {
          this.datos.update((pagina) =>
            pagina
              ? {
                  ...pagina,
                  items: pagina.items.map((item) =>
                    item.id_usuario === respuesta.usuario.id_usuario
                      ? { ...item, ...respuesta.usuario }
                      : item,
                  ),
                }
              : pagina,
          );
          this.seleccionado.set(null);
          this.avisar(respuesta.mensaje);
          this.guardando.set(false);
        },
        error: (fallo) => {
          this.avisar(mensajeErrorApi(fallo, 'Actualizar el estado de la cuenta'), true);
          this.guardando.set(false);
        },
      });
  }
}
