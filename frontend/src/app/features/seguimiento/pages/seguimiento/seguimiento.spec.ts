import {
  CompromisoDetalle,
  EntregaDetalle,
} from '../../../../core/interfaces/integracion-final';
import { etapasSeguimiento } from './etapas-seguimiento';

describe('etapasSeguimiento', () => {
  it('muestra como actual la entrega coordinada cuando aún no hay traslado', () => {
    const compromiso: CompromisoDetalle = {
      compromiso_id: 12,
      estado: 'ACEPTADO',
      fecha_compromiso: '2026-11-20T10:00:00Z',
    };
    const entrega: EntregaDetalle = {
      entrega_id: 5,
      estado: 'PROGRAMADA',
      creado_en: '2026-11-21T10:00:00Z',
    };
    const etapas = etapasSeguimiento(compromiso, entrega);
    expect(etapas.map((etapa) => etapa.estado)).toEqual([
      'realizada',
      'actual',
      'pendiente',
      'pendiente',
      'pendiente',
      'pendiente',
    ]);
    expect(etapas[1].titulo).toBe('Entrega coordinada');
  });

  it('marca EN_CAMINO desde el historial real y la recepción confirmada desde el DTO', () => {
    const compromiso: CompromisoDetalle = {
      compromiso_id: 12,
      estado: 'COMPLETADO',
      historial_entregas: [
        {
          historial_id: 1,
          estado_anterior: 'PROGRAMADA',
          estado_nuevo: 'EN_CAMINO',
          cambiado_en: '2026-11-22T09:00:00Z',
        },
        {
          historial_id: 2,
          estado_anterior: 'EN_CAMINO',
          estado_nuevo: 'ENTREGADA',
          cambiado_en: '2026-11-22T11:00:00Z',
        },
        {
          historial_id: 3,
          estado_anterior: 'ACEPTADO',
          estado_nuevo: 'COMPLETADO',
          cambiado_en: '2026-11-22T12:00:00Z',
        },
      ],
      recepciones: [
        {
          recepcion_id: 8,
          entrega_id: 5,
          estado: 'CONFIRMADA',
          fecha_confirmacion: '2026-11-22T11:30:00Z',
        },
      ],
    };
    const entrega: EntregaDetalle = {
      entrega_id: 5,
      estado: 'ENTREGADA',
      fecha_real_fin: '2026-11-22T11:00:00Z',
    };
    const etapas = etapasSeguimiento(compromiso, entrega);
    expect(etapas.map((etapa) => etapa.estado)).toEqual([
      'realizada',
      'realizada',
      'realizada',
      'realizada',
      'realizada',
      'actual',
    ]);
    expect(etapas[2].titulo).toBe('En camino');
    expect(etapas[4].titulo).toBe('Recepción confirmada');
    expect(etapas[5].fecha).toBe('2026-11-22T12:00:00Z');
  });

  it('no afirma que estuvo en camino si el historial no lo registra', () => {
    const compromiso: CompromisoDetalle = { compromiso_id: 12, estado: 'ACEPTADO' };
    const entrega: EntregaDetalle = { entrega_id: 5, estado: 'ENTREGADA' };
    const etapas = etapasSeguimiento(compromiso, entrega);
    expect(etapas[2].estado).toBe('pendiente');
    expect(etapas[3].estado).toBe('actual');
  });

  it('distingue incidencia y recepción parcial sin completar el compromiso', () => {
    const compromiso: CompromisoDetalle = {
      compromiso_id: 12,
      estado: 'ACEPTADO',
      recepciones: [
        {
          recepcion_id: 9,
          entrega_id: 5,
          estado: 'PARCIAL',
          observaciones: 'Faltaron dos unidades',
          fecha_confirmacion: '2026-11-23T10:00:00Z',
        },
      ],
    };
    const entrega: EntregaDetalle = { entrega_id: 5, estado: 'INCIDENCIA' };
    const etapas = etapasSeguimiento(compromiso, entrega);
    expect(etapas[3].titulo).toBe('En incidencia');
    expect(etapas[4].titulo).toBe('Recepción parcial');
    expect(etapas[5].estado).toBe('pendiente');
  });
});
