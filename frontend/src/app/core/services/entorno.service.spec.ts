import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EntornoService } from './entorno.service';

describe('EntornoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('toma el modo de pruebas del estado real publicado por la API', () => {
    const servicio = TestBed.inject(EntornoService);
    servicio.cargar();

    TestBed.inject(HttpTestingController).expectOne('/api/v1/health').flush({
      estado: 'ok',
      base_datos: 'DonaConectaDB',
      entorno: 'production',
      modo_pruebas: false,
    });

    expect(servicio.modoPruebas()).toBe(false);
  });

  it('mantiene la advertencia si la API no responde', () => {
    const servicio = TestBed.inject(EntornoService);
    servicio.cargar();

    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/health')
      .flush({}, { status: 503, statusText: 'Service Unavailable' });

    expect(servicio.modoPruebas()).toBe(true);
  });
});
