import {
  CompromisoDetalle,
  EntregaDetalle,
  EventoHistorial,
  historialDe,
  recepcionesDeEntrega,
} from '../../../../core/interfaces/integracion-final';

export type EstadoEtapa = 'realizada' | 'actual' | 'pendiente';

export interface EtapaSeguimiento {
  readonly clave: string;
  readonly titulo: string;
  readonly detalle: string;
  readonly estado: EstadoEtapa;
  readonly fecha: string | null;
}

function normalizar(valor: string | null | undefined): string {
  return (valor ?? '').toLocaleUpperCase('es');
}

function fechaDeHistorial(
  historial: readonly EventoHistorial[],
  estado: string,
): string | null {
  const evento = historial.find((item) => normalizar(item.estado_nuevo ?? item.estado) === estado);
  return evento?.cambiado_en ?? evento?.fecha ?? null;
}

/**
 * Sólo deriva hitos de lo que existe en la base: compromiso, estado/historial de
 * la entrega y recepciones. Nunca calcula porcentajes ni inventa eventos.
 */
export function etapasSeguimiento(
  compromiso: CompromisoDetalle | null,
  entrega: EntregaDetalle | null,
): readonly EtapaSeguimiento[] {
  if (!compromiso || !entrega) return [];

  const estadoEntrega = normalizar(entrega.estado);
  const estadoCompromiso = normalizar(compromiso.estado);
  const historial = historialDe(compromiso);
  const recepciones = recepcionesDeEntrega(compromiso, entrega);
  const recepcion = [...recepciones].sort((a, b) => {
    const fechaA = Date.parse(a.fecha_confirmacion ?? a.creado_en ?? '') || 0;
    const fechaB = Date.parse(b.fecha_confirmacion ?? b.creado_en ?? '') || 0;
    return fechaB - fechaA;
  })[0];
  const estadoRecepcion = normalizar(recepcion?.estado);
  const huboEnCamino =
    estadoEntrega === 'EN_CAMINO' || Boolean(fechaDeHistorial(historial, 'EN_CAMINO'));

  const definiciones: readonly (Omit<EtapaSeguimiento, 'estado'> & { lograda: boolean })[] = [
    {
      clave: 'compromiso',
      titulo: 'Compromiso registrado',
      detalle: 'La donación de bienes quedó reservada para esta solicitud.',
      fecha: compromiso.fecha_compromiso ?? compromiso.creado_en ?? null,
      lograda: true,
    },
    {
      clave: 'coordinada',
      titulo: 'Entrega coordinada',
      detalle: entrega.nombre_punto
        ? `Punto de acopio: ${entrega.nombre_punto}.`
        : 'La institución programó una entrega para este compromiso.',
      fecha: entrega.creado_en ?? entrega.fecha_programada ?? null,
      lograda: true,
    },
    {
      clave: 'camino',
      titulo: 'En camino',
      detalle: 'El traslado fue iniciado y quedó registrado en el historial.',
      fecha: huboEnCamino
        ? fechaDeHistorial(historial, 'EN_CAMINO') ?? entrega.fecha_real_inicio ?? null
        : null,
      lograda: huboEnCamino,
    },
    {
      clave: 'llegada',
      titulo: estadoEntrega === 'INCIDENCIA' ? 'En incidencia' : 'Entregada',
      detalle:
        estadoEntrega === 'INCIDENCIA'
          ? 'La entrega registró una incidencia; revisa las observaciones.'
          : 'La entrega llegó al punto acordado.',
      fecha: entrega.fecha_real_fin ?? entrega.fecha_entrega ?? null,
      lograda: estadoEntrega === 'ENTREGADA' || estadoEntrega === 'INCIDENCIA',
    },
    {
      clave: 'recepcion',
      titulo:
        estadoRecepcion === 'OBSERVADA'
          ? 'Recepción observada'
          : estadoRecepcion === 'PARCIAL'
            ? 'Recepción parcial'
            : 'Recepción confirmada',
      detalle: recepcion?.observaciones ?? 'La institución registró las cantidades recibidas.',
      fecha: recepcion?.fecha_confirmacion ?? recepcion?.creado_en ?? null,
      lograda: Boolean(recepcion),
    },
    {
      clave: 'completada',
      titulo: 'Completada',
      detalle: 'Todos los bienes comprometidos fueron recibidos.',
      fecha: fechaDeHistorial(historial, 'COMPLETADO'),
      lograda: estadoCompromiso === 'COMPLETADO',
    },
  ];

  let actual = -1;
  definiciones.forEach((etapa, indice) => {
    if (etapa.lograda) actual = indice;
  });

  return definiciones.map((etapa, indice) => ({
    clave: etapa.clave,
    titulo: etapa.titulo,
    detalle: etapa.detalle,
    fecha: etapa.lograda ? etapa.fecha : null,
    estado: !etapa.lograda ? 'pendiente' : indice === actual ? 'actual' : 'realizada',
  }));
}
