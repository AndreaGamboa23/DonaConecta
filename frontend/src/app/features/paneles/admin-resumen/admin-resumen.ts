import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PanelApiService, ResumenAdmin } from '../../../core/services/panel-api.service';
import { mensajeErrorApi } from '../../../core/utils/errores-api';
import { Icon } from '../../../shared/components/icon/icon';
import { PanelEncabezado } from '../components/panel-encabezado/panel-encabezado';
import { PanelEstado } from '../components/panel-estado/panel-estado';

type EstadoResumen = 'cargando' | 'datos' | 'error';

interface Metrica {
  readonly etiqueta: string;
  readonly valor: number;
  readonly icono: string;
  readonly ruta: string;
  readonly accion: string;
}

@Component({
  selector: 'app-admin-resumen',
  standalone: true,
  imports: [Icon, PanelEncabezado, PanelEstado, RouterLink],
  templateUrl: './admin-resumen.html',
  styleUrl: './admin-resumen.scss',
})
export class AdminResumen implements OnInit {
  private readonly api = inject(PanelApiService);

  readonly estado = signal<EstadoResumen>('cargando');
  readonly resumen = signal<ResumenAdmin | null>(null);
  readonly error = signal('');

  readonly metricas = computed<readonly Metrica[]>(() => {
    const datos = this.resumen();
    if (!datos) return [];
    return [
      {
        etiqueta: 'Instituciones por verificar',
        valor: datos.instituciones_pendientes,
        icono: 'shield',
        ruta: '/admin/instituciones',
        accion: 'Revisar solicitudes',
      },
      {
        etiqueta: 'Cuentas activas',
        valor: datos.usuarios_activos,
        icono: 'people',
        ruta: '/admin/usuarios',
        accion: 'Ver cuentas',
      },
      {
        etiqueta: 'Incidencias abiertas',
        valor: datos.incidencias_abiertas,
        icono: 'alert',
        ruta: '/admin/auditoria',
        accion: 'Ver auditoría',
      },
      {
        etiqueta: 'Instituciones verificadas',
        valor: datos.instituciones_verificadas,
        icono: 'building',
        ruta: '/admin/instituciones',
        accion: 'Ver instituciones',
      },
      {
        etiqueta: 'Solicitudes publicadas',
        valor: datos.necesidades_publicadas,
        icono: 'box',
        ruta: '/necesidades',
        accion: 'Ver publicaciones',
      },
      {
        etiqueta: 'Compromisos activos',
        valor: datos.compromisos_activos,
        icono: 'hand',
        ruta: '/admin/auditoria',
        accion: 'Ver registro',
      },
      {
        etiqueta: 'Bienes activos en catálogo',
        valor: datos.productos_activos,
        icono: 'check-circle',
        ruta: '/explorar',
        accion: 'Explorar bienes',
      },
    ];
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.api.resumenAdmin().subscribe({
      next: (datos) => {
        this.resumen.set(datos);
        this.estado.set('datos');
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar el resumen'));
        this.estado.set('error');
      },
    });
  }
}
