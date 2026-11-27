import { TestBed } from '@angular/core/testing';
import { BackendEstadoService } from './backend-estado.service';

describe('BackendEstadoService', () => {
  it('declara disponibles las operaciones con API REST integrada', () => {
    const servicio = TestBed.inject(BackendEstadoService);

    expect(servicio.estado('registroDonante').disponible).toBe(true);
    expect(servicio.estado('registroDonante').endpoint).toBe('/api/v1/auth/registro');
    expect(servicio.estado('login').disponible).toBe(true);
    expect(servicio.estado('perfil').disponible).toBe(true);
    expect(servicio.estado('necesidades').disponible).toBe(true);
    expect(servicio.estado('instituciones').disponible).toBe(true);
    expect(servicio.estado('donaciones').disponible).toBe(true);
  });

  it('habilita las operaciones del contrato de integración final', () => {
    const servicio = TestBed.inject(BackendEstadoService);
    const operaciones = [
      'conversaciones',
      'mensajes',
      'conversacionCrear',
      'conversacionLeido',
      'notificaciones',
      'notificacionLeido',
      'detalleCompromiso',
      'compromisosInstitucion',
      'entregas',
      'entregaEstado',
      'recepciones',
      'gpsSesion',
      'gpsUbicacion',
      'gpsUltima',
      'gpsDetener',
      'puntosAcopio',
      'puntosAcopioDetalle',
      'puntosAcopioEstado',
    ] as const;

    for (const operacion of operaciones) {
      expect(servicio.disponible(operacion), operacion).toBe(true);
      expect(servicio.estado(operacion).endpoint).toContain('/api/v1/');
    }
  });

  it('mantiene pendiente sólo la recuperación todavía no integrada', () => {
    const servicio = TestBed.inject(BackendEstadoService);

    expect(servicio.disponible('recuperacion')).toBe(false);
    expect(servicio.estado('recuperacion').mensaje).not.toContain('/api/v1');
    expect(servicio.estado('recuperacion').mensaje).not.toContain('FastAPI');
  });
});
