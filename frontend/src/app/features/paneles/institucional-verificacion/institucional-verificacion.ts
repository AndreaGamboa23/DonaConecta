import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PanelApiService, PerfilInstitucional } from '../../../core/services/panel-api.service';
import { mensajeErrorApi } from '../../../core/utils/errores-api';
import { PanelEncabezado } from '../components/panel-encabezado/panel-encabezado';
import { PanelEstado } from '../components/panel-estado/panel-estado';

type EstadoVerificacionPagina = 'cargando' | 'datos' | 'error';

@Component({
  selector: 'app-institucional-verificacion',
  standalone: true,
  imports: [PanelEncabezado, PanelEstado, RouterLink],
  templateUrl: './institucional-verificacion.html',
  styleUrl: './institucional-verificacion.scss',
})
export class InstitucionalVerificacion implements OnInit {
  private readonly api = inject(PanelApiService);

  readonly estado = signal<EstadoVerificacionPagina>('cargando');
  readonly perfil = signal<PerfilInstitucional | null>(null);
  readonly error = signal('');

  readonly verificada = () =>
    (this.perfil()?.estado_verificacion ?? '').toLocaleUpperCase('es') === 'VERIFICADA';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.api.obtenerPerfilInstitucional().subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.estado.set('datos');
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar el estado de verificación'));
        this.estado.set('error');
      },
    });
  }

  clase(estado: string | undefined): string {
    const valor = (estado ?? '').toLocaleUpperCase('es');
    if (valor === 'VERIFICADA') return 'badge rounded-pill text-bg-success';
    if (valor === 'RECHAZADA' || valor === 'SUSPENDIDA') {
      return 'badge rounded-pill text-bg-secondary';
    }
    return 'badge rounded-pill text-bg-warning';
  }
}
