import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AutenticacionApiService } from './autenticacion-api.service';

describe('AutenticacionApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('publica el inicio de sesión en el endpoint real del backend', () => {
    const servicio = TestBed.inject(AutenticacionApiService);
    let recibido: { access_token: string } | undefined;

    servicio.login({ email: 'ana@ejemplo.com', password: 'ClaveSegura123' }).subscribe((respuesta) => {
      recibido = { access_token: respuesta.access_token };
    });

    const http = TestBed.inject(HttpTestingController);
    const peticion = http.expectOne('/api/v1/auth/login');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      correo: 'ana@ejemplo.com',
      password: 'ClaveSegura123',
    });
    peticion.flush({
      access_token: 'token-real',
      token_type: 'bearer',
      usuario: {
        id_usuario: 1,
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana@ejemplo.com',
        roles: ['DONANTE'],
      },
    });

    expect(recibido?.access_token).toBe('token-real');
    http.verify();
  });

  it('no inventa recuperación de clave mientras el endpoint no exista', async () => {
    const servicio = TestBed.inject(AutenticacionApiService);

    await expect(
      firstValueFrom(servicio.recuperarClave({ email: 'ana@ejemplo.com' })),
    ).rejects.toThrowError(
      'La operación recuperacion estará disponible al integrar /api/v1/auth/recuperar-clave.',
    );
  });
});
