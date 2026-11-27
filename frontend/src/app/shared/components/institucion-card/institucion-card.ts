import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

/** DTO de vista preparado para el directorio real de instituciones. */
export interface InstitucionDirectorio {
  readonly institucionId: number;
  readonly nombre: string;
  readonly tipo: string;
  readonly distrito: string;
  readonly estadoVerificacion: string;
  readonly descripcion?: string;
  readonly fotoUrl?: string;
  readonly necesidadesActivas?: number;
  /** Solo se habilita si existe una ruta de perfil público implementada. */
  readonly perfilRuta?: string;
}

/** Tarjeta reutilizable: renderiza únicamente datos reales del servicio. */
@Component({
  selector: 'app-institucion-card',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './institucion-card.html',
  styleUrl: './institucion-card.scss',
})
export class InstitucionCard {
  readonly institucion = input<InstitucionDirectorio | null>(null);
}
