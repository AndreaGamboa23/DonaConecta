/**
 * DTO de vista del contrato de integración final. Los campos opcionales cubren los
 * alias del backend (`snake_case`/`camelCase`) sin inventar valores ausentes.
 */

export interface LineaCompromisoDetalle {
  readonly producto_id: number;
  readonly producto?: string;
  readonly unidad_id: number;
  readonly unidad?: string;
  readonly unidad_codigo?: string;
  readonly simbolo?: string;
  readonly cantidad_comprometida: number;
  readonly cantidad_recibida?: number;
  readonly cantidad_pendiente?: number;
}

export interface RecepcionDetalle {
  readonly recepcion_id?: number;
  readonly id_recepcion?: number;
  readonly entrega_id?: number;
  readonly estado?: string;
  readonly observaciones?: string | null;
  readonly fecha_confirmacion?: string | null;
  readonly creado_en?: string | null;
  readonly registrado_por?: string | null;
  readonly lineas?: readonly {
    readonly producto_id: number;
    readonly producto?: string;
    readonly unidad_id?: number;
    readonly simbolo?: string;
    readonly cantidad_recibida: number;
  }[];
}

export interface EventoHistorial {
  readonly evento_id?: number;
  readonly historial_id?: number;
  readonly id?: number;
  readonly tipo?: string;
  readonly evento?: string;
  readonly estado?: string;
  readonly estado_anterior?: string | null;
  readonly estado_nuevo?: string | null;
  readonly descripcion?: string | null;
  readonly motivo?: string | null;
  readonly observaciones?: string | null;
  readonly usuario?: string | null;
  readonly usuario_id?: number;
  readonly registrado_por?: string | null;
  readonly creado_en?: string | null;
  readonly cambiado_en?: string | null;
  readonly fecha?: string | null;
}

export interface EntregaDetalle {
  readonly entrega_id?: number;
  readonly id_entrega?: number;
  readonly id?: number;
  readonly estado: string;
  readonly fecha_programada?: string | null;
  readonly fecha_entrega?: string | null;
  readonly id_punto_acopio?: number | null;
  readonly punto_acopio?: string | null;
  readonly nombre_punto?: string | null;
  readonly direccion_acopio?: string | null;
  readonly referencias_entrega?: string | null;
  readonly horarios?: readonly HorarioAcopioDTO[];
  readonly latitud?: number | null;
  readonly longitud?: number | null;
  readonly observaciones?: string | null;
  readonly creado_en?: string | null;
  readonly fecha_real_inicio?: string | null;
  readonly fecha_real_fin?: string | null;
  readonly lineas?: readonly LineaCompromisoDetalle[];
  readonly recepciones?: readonly RecepcionDetalle[];
  readonly historial?: readonly EventoHistorial[];
}

export interface CompromisoDetalle {
  readonly id_compromiso?: number;
  readonly compromiso_id?: number;
  readonly id?: number;
  readonly id_necesidad?: number;
  readonly necesidad_id?: number;
  readonly necesidad?: string;
  readonly titulo?: string;
  readonly institucion?: string;
  readonly id_institucion?: number;
  readonly institucion_id?: number;
  readonly estado: string;
  readonly creado_en?: string | null;
  readonly fecha_compromiso?: string | null;
  readonly comentario?: string | null;
  readonly observaciones?: string | null;
  readonly punto_acopio?: string | null;
  readonly nombre_punto?: string | null;
  readonly id_punto_acopio?: number | null;
  readonly direccion_acopio?: string | null;
  readonly referencias_entrega?: string | null;
  readonly latitud?: number | null;
  readonly longitud?: number | null;
  readonly horario_programado?: string | null;
  readonly lineas?: readonly LineaCompromisoDetalle[];
  readonly entregas?: readonly EntregaDetalle[];
  readonly recepciones?: readonly RecepcionDetalle[];
  readonly historial?: readonly EventoHistorial[];
  readonly historial_entregas?: readonly EventoHistorial[];
  readonly historial_compromiso?: readonly EventoHistorial[];
  /** Sólo se ofrece cancelación si el backend expone esta señal explícitamente. */
  readonly puede_cancelar?: boolean;
}

export function idCompromiso(compromiso: CompromisoDetalle): number {
  return Number(compromiso.id_compromiso ?? compromiso.compromiso_id ?? compromiso.id ?? 0);
}

export function idEntrega(entrega: EntregaDetalle): number {
  return Number(entrega.entrega_id ?? entrega.id_entrega ?? entrega.id ?? 0);
}

export function idInstitucion(compromiso: CompromisoDetalle): number {
  return Number(compromiso.id_institucion ?? compromiso.institucion_id ?? 0);
}

export function idPunto(compromiso: CompromisoDetalle): number {
  return Number(compromiso.id_punto_acopio ?? 0);
}

export function tituloCompromiso(compromiso: CompromisoDetalle): string {
  return compromiso.necesidad ?? compromiso.titulo ?? 'Solicitud registrada';
}

export function textoCantidad(valor: number | undefined, simbolo?: string): string {
  return `${Number(valor ?? 0)} ${simbolo ?? ''}`.trim();
}

/** El backend separa el historial de compromiso y el de entregas. */
export function historialDe(compromiso: CompromisoDetalle): readonly EventoHistorial[] {
  return [
    ...(compromiso.historial_compromiso ?? []),
    ...(compromiso.historial_entregas ?? []),
    ...(compromiso.historial ?? []),
  ];
}

/** Las recepciones llegan agrupadas en el compromiso, no dentro de cada entrega. */
export function recepcionesDeEntrega(
  compromiso: CompromisoDetalle,
  entrega: EntregaDetalle,
): readonly RecepcionDetalle[] {
  const entregaId = idEntrega(entrega);
  return (compromiso.recepciones ?? []).filter(
    (recepcion) => recepcion.entrega_id === entregaId || (entrega.recepciones?.length ? entrega.recepciones.includes(recepcion) : false),
  );
}

/** Sólo coordenadas reales y válidas del DTO; nunca se inventa un punto. */
export function coordenadas(
  fuente: { readonly latitud?: number | null; readonly longitud?: number | null },
): readonly [number, number] | null {
  const latitud = Number(fuente.latitud);
  const longitud = Number(fuente.longitud);
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return null;
  if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) return null;
  return [latitud, longitud];
}

export interface ConversacionDTO {
  readonly conversacion_id?: number;
  readonly conversacionId?: number;
  readonly id?: number;
  readonly titulo?: string;
  readonly institucion?: string;
  readonly nombre_institucion?: string;
  readonly estado?: string;
  readonly no_leidos?: number;
  readonly noLeidos?: number;
  readonly ultimo_mensaje?: string | null;
  readonly ultimo_mensaje_en?: string | null;
  readonly actualizado_en?: string | null;
  readonly id_compromiso?: number;
  readonly compromiso_id?: number;
  readonly id_necesidad?: number;
}

export interface MensajeDTO {
  readonly mensaje_id?: number;
  readonly mensajeId?: number;
  readonly id?: number;
  readonly contenido: string;
  readonly remitente_id?: number;
  readonly remitente_usuario_id?: number;
  readonly conversacion_id?: number;
  readonly tipo?: string;
  readonly remitente?: string;
  readonly nombre_remitente?: string;
  readonly es_mio?: boolean;
  readonly leido?: boolean;
  readonly creado_en?: string | null;
  readonly creadoEn?: string | null;
  readonly client_message_id?: string;
}

export interface NotificacionDTO {
  readonly notificacion_id?: number;
  readonly id?: number;
  readonly titulo: string;
  readonly mensaje?: string;
  readonly cuerpo?: string;
  readonly leida?: boolean;
  readonly leido_en?: string | null;
  readonly creado_en?: string | null;
  readonly recurso_tipo?: string | null;
  readonly recurso_id?: number | null;
}

export interface RespuestaPaginada<T> {
  readonly items?: readonly T[];
  readonly data?: readonly T[];
  readonly mensajes?: readonly T[];
  readonly conversaciones?: readonly T[];
  readonly notificaciones?: readonly T[];
  readonly total?: number;
  readonly page?: number;
  readonly page_size?: number;
  readonly limit?: number;
  readonly offset?: number;
  readonly no_leidas?: number;
}

export function idConversacion(conversacion: ConversacionDTO): number {
  return Number(conversacion.conversacion_id ?? conversacion.conversacionId ?? conversacion.id ?? 0);
}

export function idMensaje(mensaje: MensajeDTO): number {
  return Number(mensaje.mensaje_id ?? mensaje.mensajeId ?? mensaje.id ?? 0);
}

/** El DTO real expone `remitente_usuario_id`; el alias se conserva por compatibilidad. */
export function esMio(mensaje: MensajeDTO, usuarioId: number | null): boolean {
  if (mensaje.es_mio !== undefined) return mensaje.es_mio;
  if (usuarioId === null) return false;
  return Number(mensaje.remitente_usuario_id ?? mensaje.remitente_id ?? 0) === usuarioId;
}

export function idNotificacion(notificacion: NotificacionDTO): number {
  return Number(notificacion.notificacion_id ?? notificacion.id ?? 0);
}

export function textoNotificacion(notificacion: NotificacionDTO): string {
  return notificacion.cuerpo ?? notificacion.mensaje ?? '';
}

export function notificacionLeida(notificacion: NotificacionDTO): boolean {
  return Boolean(notificacion.leida || notificacion.leido_en);
}

export function itemsDe<T>(respuesta: RespuestaPaginada<T> | readonly T[] | null): readonly T[] {
  if (!respuesta) return [];
  if (Array.isArray(respuesta)) return respuesta as readonly T[];
  const sobre = respuesta as RespuestaPaginada<T>;
  return (
    sobre.items ??
    sobre.data ??
    sobre.mensajes ??
    sobre.conversaciones ??
    sobre.notificaciones ??
    []
  );
}

export interface HorarioAcopioDTO {
  readonly horario_id?: number;
  readonly id?: number;
  readonly dia_semana: number;
  readonly hora_apertura: string;
  readonly hora_cierre: string;
  readonly activo?: boolean;
}

export interface PuntoAcopioDTO {
  readonly punto_id?: number;
  readonly id_punto_acopio?: number;
  readonly id?: number;
  readonly nombre: string;
  readonly direccion?: string | null;
  readonly referencias_entrega?: string | null;
  readonly distrito_id?: number;
  readonly distrito?: string;
  readonly estado?: string;
  readonly latitud?: number | null;
  readonly longitud?: number | null;
  readonly coordenadas_publicas?: boolean;
  readonly coordenadas_visibles?: boolean;
  readonly horarios?: readonly HorarioAcopioDTO[];
}

export function idPuntoAcopio(punto: PuntoAcopioDTO): number {
  return Number(punto.punto_id ?? punto.id_punto_acopio ?? punto.id ?? 0);
}

export interface HorarioAcopioPayload {
  readonly dia_semana: number;
  readonly hora_apertura: string;
  readonly hora_cierre: string;
  readonly activo: boolean;
}

export interface PuntoAcopioPayload {
  readonly id_institucion: number;
  readonly nombre: string;
  readonly direccion: string;
  readonly referencias_entrega: string;
  readonly distrito_id: number;
  readonly latitud?: number | null;
  readonly longitud?: number | null;
  readonly coordenadas_publicas: boolean;
  readonly horarios: readonly HorarioAcopioPayload[];
}

export interface SesionGpsDTO {
  readonly sesion_id?: number;
  readonly session_id?: number;
  readonly id?: number;
  readonly entrega_id?: number;
  readonly expira_en?: string | null;
  readonly expiracion?: string | null;
  readonly expiraEn?: string | null;
}

export interface UltimaUbicacionDTO {
  readonly latitud?: number | null;
  readonly longitud?: number | null;
  readonly actualizado_en?: string | null;
  readonly creado_en?: string | null;
}

export function idSesionGps(sesion: SesionGpsDTO): number {
  return Number(sesion.sesion_id ?? sesion.session_id ?? sesion.id ?? 0);
}
