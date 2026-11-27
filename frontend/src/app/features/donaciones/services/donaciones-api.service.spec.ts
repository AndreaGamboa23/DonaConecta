import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DonacionesApiService } from './donaciones-api.service';

describe('DonacionesApiService', () => {
  let servicio: DonacionesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(DonacionesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta mis compromisos y el detalle autorizado con GET', () => {
    servicio.listarDonaciones().subscribe();
    const lista = http.expectOne('/api/v1/compromisos/mis-compromisos');
    expect(lista.request.method).toBe('GET');
    lista.flush([{ id_compromiso: 4, necesidad: 'Frazadas' }]);

    let titulo = '';
    servicio.obtenerCompromiso(4).subscribe((detalle) => (titulo = detalle.titulo ?? ''));
    const detalle = http.expectOne('/api/v1/compromisos/4');
    expect(detalle.request.method).toBe('GET');
    detalle.flush({ id_compromiso: 4, compromiso_id: 4, titulo: 'Frazadas', estado: 'PENDIENTE' });
    expect(titulo).toBe('Frazadas');
  });
});
