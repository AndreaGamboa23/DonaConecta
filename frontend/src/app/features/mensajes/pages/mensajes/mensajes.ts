import { Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, catchError, concatMap, interval, of } from 'rxjs';
import {
  ConversacionDTO,
  MensajeDTO,
  NotificacionDTO,
  idConversacion,
  idMensaje,
  idNotificacion,
  itemsDe,
  notificacionLeida,
  textoNotificacion,
} from '../../../../core/interfaces/integracion-final';
import { SesionService } from '../../../../core/services/sesion.service';
import { mensajeErrorApi } from '../../../../core/utils/errores-api';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { BandejaConversaciones } from '../../components/bandeja-conversaciones/bandeja-conversaciones';
import { PanelConversacion } from '../../components/panel-conversacion/panel-conversacion';
import {
  CrearConversacionPayload,
  MensajeriaApiService,
  nuevoClientMessageId,
} from '../../services/mensajeria-api.service';

type EstadoPagina = 'cargando' | 'datos' | 'error' | 'sin-sesion';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [RouterLink, Icon, PageHero, BandejaConversaciones, PanelConversacion],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
})
export class Mensajes implements OnDestroy {
  private readonly api = inject(MensajeriaApiService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly sesion = inject(SesionService);

  readonly estado = signal<EstadoPagina>('cargando');
  readonly error = signal('');
  readonly conversaciones = signal<readonly ConversacionDTO[]>([]);
  readonly filtro = signal('');
  readonly activaId = signal<number | null>(null);
  readonly mensajes = signal<readonly MensajeDTO[]>([]);
  readonly cargandoMensajes = signal(false);
  readonly enviando = signal(false);
  readonly notificaciones = signal<readonly NotificacionDTO[]>([]);
  readonly mensajeAccion = signal('');
  readonly mobileConversacionAbierta = signal(false);
  readonly ultimoLeidoId = signal<number | null>(null);

  private sondeo?: Subscription;

  constructor() {
    if (!this.sesion.autenticado()) {
      this.estado.set('sin-sesion');
      return;
    }

    this.cargarBandeja();
    this.cargarNotificaciones();
    this.abrirDesdeContexto();
  }

  ngOnDestroy(): void {
    this.detenerSondeo();
  }

  get conversacionesFiltradas(): readonly ConversacionDTO[] {
    const texto = this.filtro().trim().toLocaleLowerCase('es');
    if (!texto) return this.conversaciones();
    return this.conversaciones().filter((conversacion) =>
      [
        conversacion.titulo,
        conversacion.institucion,
        conversacion.nombre_institucion,
        conversacion.ultimo_mensaje,
      ]
        .filter((valor): valor is string => Boolean(valor))
        .some((valor) => valor.toLocaleLowerCase('es').includes(texto)),
    );
  }

  cambiarFiltro(evento: Event): void {
    this.filtro.set((evento.target as HTMLInputElement).value);
  }

  get activa(): ConversacionDTO | null {
    const id = this.activaId();
    return this.conversaciones().find((item) => idConversacion(item) === id) ?? null;
  }

  get noLeidos(): number {
    return this.notificaciones().filter((notificacion) => !notificacionLeida(notificacion)).length;
  }

  cargarBandeja(): void {
    this.estado.set('cargando');
    this.error.set('');
    this.api.listarConversaciones().subscribe({
      next: (respuesta) => {
        this.conversaciones.set(itemsDe(respuesta));
        this.estado.set('datos');
      },
      error: (fallo) => {
        this.error.set(mensajeErrorApi(fallo, 'Consultar tus conversaciones'));
        this.estado.set('error');
      },
    });
  }

  cargarNotificaciones(): void {
    this.api.listarNotificaciones().subscribe({
      next: (respuesta) => this.notificaciones.set(itemsDe(respuesta)),
      error: () => this.notificaciones.set([]),
    });
  }

  private abrirDesdeContexto(): void {
    const parametros = this.ruta.snapshot.queryParamMap;
    const necesidad = Number(parametros.get('necesidad'));
    const compromiso = Number(parametros.get('compromiso'));
    const payload: CrearConversacionPayload = {};
    if (Number.isInteger(necesidad) && necesidad > 0) payload.id_necesidad = necesidad;
    if (Number.isInteger(compromiso) && compromiso > 0) payload.id_compromiso = compromiso;
    if (Object.keys(payload).length === 0) return;

    this.api.crearConversacion(payload).subscribe({
      next: (conversacion) => {
        this.conversaciones.update((lista) => {
          const id = idConversacion(conversacion);
          return [conversacion, ...lista.filter((item) => idConversacion(item) !== id)];
        });
        this.seleccionar(idConversacion(conversacion));
      },
      error: (fallo) => {
        this.mensajeAccion.set(
          mensajeErrorApi(fallo, 'Abrir la conversación con la institución'),
        );
      },
    });
  }

  seleccionar(id: number): void {
    if (!Number.isInteger(id) || id <= 0) return;
    this.activaId.set(id);
    this.mobileConversacionAbierta.set(true);
    this.ultimoLeidoId.set(null);
    this.detenerSondeo();
    this.cargarMensajes(id, true);
    this.marcarLeido();

    // Polling HTTP únicamente mientras la conversación permanezca activa.
    this.sondeo = interval(5000)
      .pipe(
        concatMap(() =>
          this.api.listarMensajes(id).pipe(
            catchError(() => of(null)),
          ),
        ),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((respuesta) => {
        if (!respuesta) return;
        this.mensajes.set(itemsDe(respuesta));
      });
  }

  volver(): void {
    this.detenerSondeo();
    this.activaId.set(null);
    this.mensajes.set([]);
    this.mobileConversacionAbierta.set(false);
  }

  private cargarMensajes(id: number, inicial: boolean): void {
    if (inicial) this.cargandoMensajes.set(true);
    this.api.listarMensajes(id).subscribe({
      next: (respuesta) => {
        this.mensajes.set(itemsDe(respuesta));
        this.cargandoMensajes.set(false);
      },
      error: (fallo) => {
        if (inicial) {
          this.mensajeAccion.set(mensajeErrorApi(fallo, 'Consultar los mensajes'));
          this.cargandoMensajes.set(false);
        }
      },
    });
  }

  marcarLeido(): void {
    const id = this.activaId();
    if (!id) return;
    const ultimo = this.mensajes().at(-1);
    this.api.marcarLeido(id, ultimo ? idMensaje(ultimo) : undefined).subscribe({
      next: (respuesta) => {
        const leido = respuesta as { ultimo_mensaje_leido_id?: number | null };
        if (leido?.ultimo_mensaje_leido_id) {
          this.ultimoLeidoId.set(Number(leido.ultimo_mensaje_leido_id));
        }
        this.conversaciones.update((lista) =>
          lista.map((item) =>
            idConversacion(item) === id ? { ...item, no_leidos: 0, noLeidos: 0 } : item,
          ),
        );
      },
      error: () => undefined,
    });
  }

  enviar(envio: { texto: string; limpiar: () => void }): void {
    const id = this.activaId();
    const contenido = envio.texto.trim();
    if (!id || !contenido) return;
    this.enviando.set(true);
    this.mensajeAccion.set('');
    this.api
      .enviarMensaje(id, {
        contenido,
        client_message_id: nuevoClientMessageId(),
      })
      .subscribe({
        next: (mensaje) => {
          this.mensajes.update((lista) =>
            lista.some((item) => idMensaje(item) === idMensaje(mensaje))
              ? lista
              : [...lista, mensaje],
          );
          this.conversaciones.update((lista) =>
            lista.map((item) =>
              idConversacion(item) === id
                ? {
                    ...item,
                    ultimo_mensaje: mensaje.contenido,
                    ultimo_mensaje_en: mensaje.creado_en,
                    ultimo_mensaje_id: idMensaje(mensaje),
                  }
                : item,
            ),
          );
          envio.limpiar();
          this.enviando.set(false);
        },
        error: (fallo) => {
          // El borrador se conserva: el servidor no confirmó el almacenamiento.
          this.mensajeAccion.set(mensajeErrorApi(fallo, 'Enviar el mensaje'));
          this.enviando.set(false);
        },
      });
  }

  marcarNotificacionComoLeida(notificacion: NotificacionDTO): void {
    const id = idNotificacion(notificacion);
    if (id <= 0 || notificacionLeida(notificacion)) return;
    this.api.marcarNotificacionLeido(id).subscribe({
      next: () =>
        this.notificaciones.update((lista) =>
          lista.map((item) =>
            idNotificacion(item) === id
              ? { ...item, leida: true, leido_en: new Date().toISOString() }
              : item,
          ),
        ),
      error: () => undefined,
    });
  }

  textoNotificacion(notificacion: NotificacionDTO): string {
    return textoNotificacion(notificacion);
  }

  notificacionLeida(notificacion: NotificacionDTO): boolean {
    return notificacionLeida(notificacion);
  }

  private detenerSondeo(): void {
    this.sondeo?.unsubscribe();
    this.sondeo = undefined;
  }
}
