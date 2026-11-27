import { Component, input, output } from '@angular/core';
import { ConversacionDTO, idConversacion } from '../../../../core/interfaces/integracion-final';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-bandeja-conversaciones',
  standalone: true,
  imports: [Icon],
  templateUrl: './bandeja-conversaciones.html',
  styleUrl: './bandeja-conversaciones.scss',
})
export class BandejaConversaciones {
  readonly conversaciones = input<readonly ConversacionDTO[]>([]);
  readonly seleccionada = input<number | null>(null);
  readonly cargando = input(false);
  readonly seleccionar = output<number>();

  id(conversacion: ConversacionDTO): number {
    return idConversacion(conversacion);
  }

  titulo(conversacion: ConversacionDTO): string {
    return (
      conversacion.titulo ??
      conversacion.institucion ??
      conversacion.nombre_institucion ??
      `Conversación #${this.id(conversacion)}`
    );
  }

  noLeidos(conversacion: ConversacionDTO): number {
    return Number(conversacion.no_leidos ?? conversacion.noLeidos ?? 0);
  }

  fecha(valor: string | null | undefined): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(fecha);
  }
}
