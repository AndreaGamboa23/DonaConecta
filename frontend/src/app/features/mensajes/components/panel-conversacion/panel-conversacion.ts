import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ConversacionDTO,
  MensajeDTO,
  esMio,
  idConversacion,
  idMensaje,
} from '../../../../core/interfaces/integracion-final';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-panel-conversacion',
  standalone: true,
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './panel-conversacion.html',
  styleUrl: './panel-conversacion.scss',
})
export class PanelConversacion {
  readonly conversacion = input<ConversacionDTO | null>(null);
  readonly mensajes = input<readonly MensajeDTO[]>([]);
  readonly cargando = input(false);
  readonly enviando = input(false);
  readonly usuarioId = input<number | null>(null);
  readonly ultimoLeidoId = input<number | null>(null);

  readonly volver = output<void>();
  readonly enviarMensaje = output<{ texto: string; limpiar: () => void }>();
  readonly marcarLeido = output<void>();

  readonly contenido = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(2000)],
  });

  id(): number {
    const conversacion = this.conversacion();
    return conversacion ? idConversacion(conversacion) : 0;
  }

  titulo(): string {
    const conversacion = this.conversacion();
    if (!conversacion) return '';
    return (
      conversacion.titulo ??
      conversacion.institucion ??
      conversacion.nombre_institucion ??
      `Conversación #${this.id()}`
    );
  }

  esMio(mensaje: MensajeDTO): boolean {
    return esMio(mensaje, this.usuarioId());
  }

  remitente(mensaje: MensajeDTO): string {
    return mensaje.nombre_remitente ?? mensaje.remitente ?? (this.esMio(mensaje) ? 'Tú' : 'Participante');
  }

  iniciales(mensaje: MensajeDTO): string {
    const nombre = this.remitente(mensaje).trim();
    if (!nombre) return '?';
    const partes = nombre.split(/\s+/).filter(Boolean);
    return (partes.length > 1 ? partes[0][0] + partes[1][0] : nombre.slice(0, 2)).toLocaleUpperCase('es');
  }

  fechaTexto(valor: string | null | undefined): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  }

  claveMensaje(mensaje: MensajeDTO, indice: number): string {
    return `${idMensaje(mensaje) || 'temp'}-${mensaje.client_message_id ?? indice}`;
  }

  /** `Visto` se deriva del último mensaje leído devuelto por el backend, no se inventa. */
  estadoLectura(mensaje: MensajeDTO): string {
    const leido = this.ultimoLeidoId();
    const id = idMensaje(mensaje);
    if (mensaje.leido) return 'Leído';
    if (leido !== null && id > 0 && id <= leido) return 'Visto';
    return 'Enviado';
  }

  /** El `<form>` no tiene `[formGroup]`: evitamos el submit nativo explícitamente. */
  enviar(evento?: Event): void {
    evento?.preventDefault();
    if (this.contenido.invalid || this.enviando()) {
      this.contenido.markAsTouched();
      return;
    }
    const texto = this.contenido.value.trim();
    if (!texto) return;
    this.enviarMensaje.emit({
      texto,
      limpiar: () => this.contenido.setValue(''),
    });
  }

  marcarComoLeido(): void {
    this.marcarLeido.emit();
  }
}
