import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NecesidadReal } from '../../../features/exploracion/services/exploracion-api.service';
import { Icon } from '../icon/icon';

/** Tarjeta reutilizable de una necesidad real. No contiene formularios de compromiso. */
@Component({
  selector: 'app-necesidad-card',
  standalone: true,
  imports: [NgClass, RouterLink, Icon],
  templateUrl: './necesidad-card.html',
  styleUrl: './necesidad-card.scss',
})
export class NecesidadCard {
  readonly necesidad = input.required<NecesidadReal>();
  readonly compacta = input(false);

  readonly ruta = computed(() => `/necesidades/${this.necesidad().id_necesidad}`);
  readonly avance = computed(() =>
    Math.min(100, Math.max(0, Number(this.necesidad().avance_porcentaje) || 0)),
  );
  readonly clasePrioridad = computed(() => {
    switch (this.necesidad().prioridad) {
      case 'ALTA':
        return 'text-bg-warning';
      case 'MEDIA':
        return 'text-bg-primary';
      default:
        return 'text-bg-light';
    }
  });
  readonly etiquetaPrioridad = computed(() => {
    const etiquetas: Record<string, string> = {
      ALTA: 'Prioridad alta',
      MEDIA: 'Prioridad media',
      BAJA: 'Prioridad baja',
    };
    return etiquetas[this.necesidad().prioridad] ?? this.necesidad().prioridad;
  });

  fechaTexto(valor: string | null): string {
    if (!valor) return 'Sin fecha límite';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha límite';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(fecha);
  }
}
