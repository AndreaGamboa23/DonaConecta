import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SesionApiService } from './sesion-api.service';
import { SesionService } from './sesion.service';

describe('SesionApiService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('revoca la sesión en el servidor antes de limpiar la pestaña', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.iniciar('token-real', {
      id_usuario: 7,
      nombres: 'Ana',
      apellidos: 'Pérez',
      correo: 'ana@ejemplo.com',
      roles: ['DONANTE'],
    });

    TestBed.inject(SesionApiService).cerrar().subscribe();
    const http = TestBed.inject(HttpTestingController);
    const peticion = http.expectOne('/api/v1/auth/sesion');
    expect(peticion.request.method).toBe('DELETE');
    expect(sesion.autenticado()).toBe(true);

    peticion.flush(null);
    expect(sesion.autenticado()).toBe(false);
    expect(sessionStorage.getItem('donaconecta_token')).toBeNull();
    http.verify();
  });

  it('limpia la sesión local aunque falle la revocación remota', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.iniciar('token-real', {
      id_usuario: 7,
      nombres: 'Ana',
      apellidos: 'Pérez',
      correo: 'ana@ejemplo.com',
      roles: ['DONANTE'],
    });

    let fallo = false;
    TestBed.inject(SesionApiService).cerrar().subscribe({ error: () => (fallo = true) });
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/auth/sesion').flush(
      { detail: 'No se pudo revocar' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(fallo).toBe(true);
    expect(sesion.autenticado()).toBe(false);
    http.verify();
  });
});
