import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BackendEstadoService } from './backend-estado.service';

describe('BackendEstadoService', () => {
  it('declara disponibles solo las operaciones con API REST integrada', () => {
    const servicio = TestBed.inject(BackendEstadoService);

    expect(servicio.estado('registroDonante').disponible).toBe(true);
    expect(servicio.estado('registroDonante').endpoint).toBe('/api/v1/auth/registro');
    expect(servicio.estado('login').disponible).toBe(true);
    expect(servicio.estado('perfil').disponible).toBe(true);
    expect(servicio.estado('necesidades').disponible).toBe(true);
    expect(servicio.estado('instituciones').disponible).toBe(true);
    expect(servicio.estado('donaciones').disponible).toBe(true);
  });

  it('mantiene pendientes chat, GPS, recuperación y puntos de acopio', async () => {
    const servicio = TestBed.inject(BackendEstadoService);
    const estado = servicio.estado('mensajes');

    expect(estado.disponible).toBe(false);
    expect(estado.mensaje).not.toContain('/api/v1');
    expect(estado.mensaje).not.toContain('FastAPI');
    expect(servicio.disponible('seguimiento')).toBe(false);
    expect(servicio.disponible('puntosAcopio')).toBe(false);
    expect(servicio.disponible('recuperacion')).toBe(false);

    await expect(firstValueFrom(servicio.pendiente('mensajes'))).rejects.toMatchObject({
      codigo: 'SERVICIO_PENDIENTE',
      operacion: 'mensajes',
    });
  });
});
