import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PanelApiService, RegistroAuditoria } from '../../../core/services/panel-api.service';
import { mensajeErrorApi } from '../../../core/utils/errores-api';
import { PanelEncabezado } from '../components/panel-encabezado/panel-encabezado';
import { PanelEstado } from '../components/panel-estado/panel-estado';

type EstadoLista = 'cargando' | 'datos' | 'vacio' | 'error';
const LIMITE = 10;

@Component({
  selector: 'app-admin-auditoria',
  standalone: true,
  imports: [ReactiveFormsModule, PanelEncabezado, PanelEstado],
  templateUrl: './admin-auditoria.html',
  styleUrl: './admin-auditoria.scss',
})
export class AdminAuditoria implements OnInit {
  private readonly api = inject(PanelApiService);

  readonly estado = signal<EstadoLista>('cargando');
  readonly registros = signal<readonly RegistroAuditoria[]>([]);
  readonly total = signal(0);
  readonly offset = signal(0);
  readonly error = signal('');

  readonly filtros = new FormGroup({
    modulo: new FormControl('', { nonNullable: true }),
    resultado: new FormControl('', { nonNullable: true }),
  });

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
      .listarAuditoria({
        limit: LIMITE,
        offset: this.offset(),
        modulo: filtros.modulo || undefined,
        resultado: filtros.resultado || undefined,
      })
      .subscribe({
        next: (respuesta) => {
          this.registros.set(respuesta.items);
          this.total.set(respuesta.total);
          this.estado.set(respuesta.items.length > 0 ? 'datos' : 'vacio');
        },
        error: (fallo) => {
          this.error.set(mensajeErrorApi(fallo, 'Consultar la auditoría'));
          this.estado.set('error');
        },
      });
  }

  aplicarFiltros(): void {
    this.offset.set(0);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtros.reset({ modulo: '', resultado: '' });
    this.aplicarFiltros();
  }

  irPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.offset.set((pagina - 1) * LIMITE);
    this.cargar();
  }

  fecha(registro: RegistroAuditoria): string {
    return registro.creado_en ?? 'Sin fecha';
  }

  claseResultado(resultado: string | undefined): string {
    const valor = (resultado ?? '').toLocaleUpperCase('es');
    if (valor === 'OK') return 'badge rounded-pill text-bg-success';
    if (valor === 'ERROR') return 'badge rounded-pill text-bg-warning';
    if (valor === 'DENEGADO') return 'badge rounded-pill text-bg-secondary';
    return 'badge rounded-pill text-bg-light';
  }
}
