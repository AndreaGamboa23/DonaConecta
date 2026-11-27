import {
  coordenadas,
  esMio,
  historialDe,
  idCompromiso,
  idEntrega,
  itemsDe,
  notificacionLeida,
  recepcionesDeEntrega,
  textoNotificacion,
} from './integracion-final';

describe('DTO del contrato final', () => {
  it('lee listas de sobres paginados y de arreglos directos', () => {
    expect(itemsDe({ items: [{ id: 1 }], total: 1 })).toEqual([{ id: 1 }]);
    expect(itemsDe([{ id: 2 }])).toEqual([{ id: 2 }]);
    expect(itemsDe(null)).toEqual([]);
    expect(itemsDe({ notificaciones: [{ titulo: 'Aviso', mensaje: 'Listo' }] })).toHaveLength(1);
  });

  it('sólo acepta coordenadas reales y válidas', () => {
    expect(coordenadas({ latitud: -12.07, longitud: -75.21 })).toEqual([-12.07, -75.21]);
    expect(coordenadas({ latitud: undefined, longitud: undefined })).toBeNull();
    expect(coordenadas({ latitud: 95, longitud: -75 })).toBeNull();
  });

  it('lee historial y recepciones de los campos reales del backend', () => {
    const entrega = { entrega_id: 7, entregaId: 7, estado: 'ENTREGADA' };
    const compromiso = {
      id_compromiso: 3,
      compromiso_id: 3,
      estado: 'ACEPTADO',
      historial_compromiso: [{ historial_id: 1, estado_nuevo: 'ACEPTADO', cambiado_en: '2026-01-01T00:00:00Z' }],
      historial_entregas: [{ historial_id: 2, estado_nuevo: 'ENTREGADA' }],
      recepciones: [{ recepcion_id: 5, entrega_id: 7, estado: 'PARCIAL' }],
      entregas: [entrega],
    };

    expect(idCompromiso(compromiso)).toBe(3);
    expect(idEntrega(entrega)).toBe(7);
    expect(historialDe(compromiso)).toHaveLength(2);
    expect(recepcionesDeEntrega(compromiso, entrega)).toHaveLength(1);
  });

  it('identifica al remitente y el estado real de notificaciones', () => {
    expect(esMio({ remitente_usuario_id: 9, contenido: 'Hola' }, 9)).toBe(true);
    expect(esMio({ remitente_usuario_id: 10, contenido: 'Hola' }, 9)).toBe(false);
    expect(textoNotificacion({ titulo: 'Entrega', cuerpo: 'Programada' })).toBe('Programada');
    expect(notificacionLeida({ titulo: 'Aviso', leido_en: '2026-01-01T00:00:00Z' })).toBe(true);
  });
});
