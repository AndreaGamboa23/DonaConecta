import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PerfilApiService } from './perfil-api.service';

describe('PerfilApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('usa GET, PUT, PATCH y DELETE con los cuerpos del contrato real', () => {
    const servicio = TestBed.inject(PerfilApiService);
    const http = TestBed.inject(HttpTestingController);

    servicio.obtenerPerfil().subscribe();
    const consulta = http.expectOne('/api/v1/usuarios/me');
    expect(consulta.request.method).toBe('GET');
    consulta.flush({});

    servicio.obtenerActividad().subscribe();
    const actividad = http.expectOne('/api/v1/usuarios/me/actividad');
    expect(actividad.request.method).toBe('GET');
    actividad.flush({});

    servicio
      .reemplazarPerfil({
        nombres: 'Ana',
        apellidos: 'Pérez',
        telefono: '987654321',
        distritoId: 13,
        preferenciaNotificacion: 'TODAS',
      })
      .subscribe();
    const reemplazo = http.expectOne('/api/v1/usuarios/me');
    expect(reemplazo.request.method).toBe('PUT');
    expect(reemplazo.request.body.distritoId).toBe(13);
    reemplazo.flush({});

    servicio.parchearPerfil({ distritoId: 14 }).subscribe();
    const parche = http.expectOne('/api/v1/usuarios/me');
    expect(parche.request.method).toBe('PATCH');
    expect(parche.request.body).toEqual({ distritoId: 14 });
    expect(parche.request.body.nombres).toBeUndefined();
    parche.flush({});

    servicio.cambiarContrasena('actual123', 'nueva123456', 'nueva123456').subscribe();
    const contrasena = http.expectOne('/api/v1/usuarios/me/contrasena');
    expect(contrasena.request.method).toBe('PATCH');
    contrasena.flush(null);

    servicio.cambiarCorreo('nuevo@ejemplo.com', 'actual123').subscribe();
    const correo = http.expectOne('/api/v1/usuarios/me/correo');
    expect(correo.request.method).toBe('PATCH');
    expect(correo.request.body).toEqual({
      nuevoCorreo: 'nuevo@ejemplo.com',
      confirmacionCorreo: 'nuevo@ejemplo.com',
      password: 'actual123',
    });
    correo.flush(null);

    servicio.bajaCuenta('actual123').subscribe();
    const baja = http.expectOne('/api/v1/usuarios/me');
    expect(baja.request.method).toBe('DELETE');
    expect(baja.request.body).toEqual({ password: 'actual123', confirmacion: 'BAJA' });
    baja.flush(null);
  });
});
