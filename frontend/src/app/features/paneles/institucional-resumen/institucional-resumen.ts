import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PanelApiService,
  ResumenInstitucional,
} from '../../../core/services/panel-api.service';
import { mensajeErrorApi } from '../../../core/utils/errores-api';
import { Icon } from '../../../shared/components/icon/icon';
import { PanelEncabezado } from '../components/panel-encabezado/panel-encabezado';
import { PanelEstado } from '../components/panel-estado/panel-estado';

type EstadoResumen = 'cargando' | 'datos' | 'error';

interface MetricaInstitucional {
  readonly etiqueta: string;
  readonly valor: number;
  readonly icono: string;
}

@Component({
  selector: 'app-institucional-resumen',
  standalone: true,
  imports: [Icon, PanelEncabezado, PanelEstado, RouterLink],
  templateUrl: './institucional-resumen.html',
  styleUrl: './institucional-resumen.scss',
})
export class InstitucionalResumen implements OnInit {
  private readonly api = inject(PanelApiService);

  readonly estado = signal<EstadoResumen>('cargando');
  readonly resumen = signal<ResumenInstitucional | null>(null);
  readonly error = signal('');

  readonly verificacion = computed(() => this.resumen()?.estado_verificacion ?? '');

  readonly pendienteVerificacion = computed(
    () => this.verificacion().toLocaleUpperCase('es') === 'PENDIENTE',
  );

  readonly metricas = computed<readonly MetricaInstitucional[]>(() => {
    const datos = this.resumen();
    if (!datos) return [];
    return [
      {
        etiqueta: 'Solicitudes publicadas',
        valor: datos.necesidades_publicadas,
        icono: 'box',
      },
      {
        etiqueta: 'Compromisos recibidos',
        valor: datos.compromisos_recibidos,
        icono: 'hand',
      },
      {
        etiqueta: 'Recepciones confirmadas',
        valor: datos.recepciones_confirmadas,
        icono: 'check-circle',
      },
    ];
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.api.resumenInstitucional().subscribe({
      next: (datos) => {
        this.resumen.set(datos);
        this.estado.set('datos');
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar el resumen institucional'));
        this.estado.set('error');
      },
    });
  }

  claseVerificacion(estado: string): string {
    const valor = estado.toLocaleUpperCase('es');
    if (valor === 'VERIFICADA') return 'badge rounded-pill text-bg-success';
    if (valor === 'RECHAZADA') return 'badge rounded-pill text-bg-secondary';
    return 'badge rounded-pill text-bg-warning';
  }
}
