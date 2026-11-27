import { CompromisoDetalle, EntregaDetalle } from '../../../../core/interfaces/integracion-final';
import { coberturaTotal } from './institucional-compromisos';

describe('coberturaTotal', () => {
  const entrega: EntregaDetalle = {
    entrega_id: 5,
    estado: 'PROGRAMADA',
  };
  const compromiso: CompromisoDetalle = {
    compromiso_id: 12,
    estado: 'ACEPTADO',
    lineas: [
      {
        producto_id: 1,
        unidad_id: 2,
        cantidad_comprometida: 10,
        cantidad_recibida: 4,
        cantidad_pendiente: 6,
      },
    ],
  };

  it('permite CONFIRMADA cuando lo registrado cubre todo el pendiente', () => {
    expect(coberturaTotal(entrega, compromiso, { '1-2': 6 })).toBe(true);
  });

  it('impide CONFIRMADA si falta cualquiera de los bienes', () => {
    expect(coberturaTotal(entrega, compromiso, { '1-2': 4 })).toBe(false);
    expect(coberturaTotal(entrega, compromiso, {})).toBe(false);
  });

  it('no ofrece CONFIRMADA sobre una entrega sin líneas reales', () => {
    expect(coberturaTotal(entrega, { ...compromiso, lineas: [] }, {})).toBe(false);
  });
});
