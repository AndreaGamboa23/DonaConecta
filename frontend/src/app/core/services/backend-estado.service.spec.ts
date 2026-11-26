import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BackendEstadoService } from './backend-estado.service';

describe('BackendEstadoService', () => {
  it('informa que ninguna operación está integrada en esta fase', async () => {
    const servicio = TestBed.inject(BackendEstadoService);
    const estado = servicio.estado('registroDonante');

    expect(estado.disponible).toBe(false);
    expect(estado.endpoint).toBe('/api/v1/autenticacion/registro');
    expect(estado.mensaje).not.toContain('/api/v1');
    expect(estado.mensaje).not.toContain('FastAPI');

    await expect(firstValueFrom(servicio.pendiente('login'))).rejects.toMatchObject({
      codigo: 'SERVICIO_PENDIENTE',
      operacion: 'login',
    });
  });
});
