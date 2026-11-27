import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GpsApiService } from './gps-api.service';

describe('GpsApiService', () => {
  let servicio: GpsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(GpsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía consentimiento explícito y duración al iniciar la sesión', () => {
    let sesionId = 0;
    servicio
      .iniciarSesion(11, { consentimiento_dado: true, duracion_minutos: 30 })
      .subscribe((respuesta) => (sesionId = servicio.idSesion(respuesta)));
    const inicio = http.expectOne('/api/v1/entregas/11/gps/sesiones');
    expect(inicio.request.method).toBe('POST');
    expect(inicio.request.body).toEqual({ consentimiento_dado: true, duracion_minutos: 30 });
    inicio.flush({ sesion_id: 22, entrega_id: 11, expira_en: '2026-11-30T11:00:00Z' });
    expect(sesionId).toBe(22);
  });

  it('publica la posición autorizada y lee la última coordenada real', () => {
    servicio
      .enviarUbicacion(22, { latitud: -12.07, longitud: -75.21, precision_metros: 12 })
      .subscribe();
    const posicion = http.expectOne('/api/v1/gps/sesiones/22/ubicacion');
    expect(posicion.request.method).toBe('POST');
    expect(posicion.request.body).toEqual({
      latitud: -12.07,
      longitud: -75.21,
      precision_metros: 12,
    });
    posicion.flush({ latitud: -12.07, longitud: -75.21 });

    servicio.ultimaUbicacion(11).subscribe();
    const ultima = http.expectOne('/api/v1/entregas/11/gps/ultima');
    expect(ultima.request.method).toBe('GET');
    ultima.flush({ latitud: -12.07, longitud: -75.21, actualizado_en: '2026-11-30T10:59:00Z' });
  });

  it('detiene la sesión con POST', () => {
    servicio.detenerSesion(22).subscribe();
    const detencion = http.expectOne('/api/v1/gps/sesiones/22/detener');
    expect(detencion.request.method).toBe('POST');
    expect(detencion.request.body).toEqual({});
    detencion.flush({ sesion_id: 22, estado: 'DETENIDA' });
  });
});
