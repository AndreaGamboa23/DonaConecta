import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PanelOperacionesApiService, puntosDe } from './panel-operaciones-api.service';

describe('PanelOperacionesApiService', () => {
  let servicio: PanelOperacionesApiService;
  let http: HttpTestingController;

  const punto = {
    id_institucion: 10,
    nombre: 'Acopio solidario',
    direccion: 'Dirección sintética',
    referencias_entrega: 'Referencia sintética',
    distrito_id: 1,
    latitud: -12.07,
    longitud: -75.21,
    coordenadas_publicas: true,
    horarios: [{ dia_semana: 1, hora_apertura: '09:00:00', hora_cierre: '12:00:00', activo: true }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(PanelOperacionesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('filtra puntos públicos y recibe el DTO directo al crear', () => {
    servicio.listarPuntos({ publico: true }).subscribe((respuesta) => {
      expect(puntosDe(respuesta)).toHaveLength(1);
    });
    const lista = http.expectOne(
      (peticion) =>
        peticion.url === '/api/v1/puntos-de-acopio' &&
        peticion.params.get('publico') === 'true',
    );
    expect(lista.request.method).toBe('GET');
    lista.flush({ items: [{ punto_id: 3, id_punto_acopio: 3, nombre: 'Acopio' }] });

    let nombre = '';
    servicio.crearPunto(punto).subscribe((respuesta) => (nombre = respuesta.nombre));
    const crear = http.expectOne('/api/v1/puntos-de-acopio');
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual(punto);
    crear.flush({ punto_id: 3, id_punto_acopio: 3, nombre: 'Acopio solidario' });
    expect(nombre).toBe('Acopio solidario');
  });

  it('pide la vista privada al consultar los puntos propios', () => {
    servicio.listarPuntos({ institucionId: 16 }).subscribe((respuesta) => {
      expect(puntosDe(respuesta)).toHaveLength(1);
    });
    const lista = http.expectOne(
      (peticion) =>
        peticion.url === '/api/v1/puntos-de-acopio' &&
        peticion.params.get('institucionId') === '16' &&
        peticion.params.get('publico') === 'false',
    );
    expect(lista.request.method).toBe('GET');
    lista.flush([{ punto_id: 6, nombre: 'Acopio institucional', coordenadas_publicas: false }]);
  });

  it('usa PUT, PATCH y DELETE para administrar un punto', () => {
    servicio.reemplazarPunto(3, punto).subscribe();
    const reemplazo = http.expectOne('/api/v1/puntos-de-acopio/3');
    expect(reemplazo.request.method).toBe('PUT');
    reemplazo.flush({ punto_id: 3, nombre: 'Acopio solidario' });

    servicio.cambiarEstadoPunto(3, 'INACTIVO').subscribe();
    const estado = http.expectOne('/api/v1/puntos-de-acopio/3/estado');
    expect(estado.request.method).toBe('PATCH');
    expect(estado.request.body).toEqual({ estado: 'INACTIVO' });
    estado.flush({ punto_id: 3, estado: 'INACTIVO' });

    servicio.eliminarPunto(3).subscribe();
    const baja = http.expectOne('/api/v1/puntos-de-acopio/3');
    expect(baja.request.method).toBe('DELETE');
    baja.flush(null);
  });

  it('programa entregas y registra recepciones con el cuerpo del contrato', () => {
    servicio
      .crearEntrega({
        id_compromiso: 5,
        id_punto_acopio: 3,
        fecha_programada: '2026-11-30T10:00:00Z',
      })
      .subscribe();
    const entrega = http.expectOne('/api/v1/entregas');
    expect(entrega.request.method).toBe('POST');
    expect(entrega.request.body.id_compromiso).toBe(5);
    entrega.flush({ entrega_id: 9, id_entrega: 9, estado: 'PROGRAMADA' });

    servicio
      .registrarRecepcion(9, {
        estado: 'PARCIAL',
        lineas: [{ producto_id: 1, unidad_id: 2, cantidad_recibida: 3 }],
      })
      .subscribe();
    const recepcion = http.expectOne('/api/v1/entregas/9/recepciones');
    expect(recepcion.request.method).toBe('POST');
    expect(recepcion.request.body.estado).toBe('PARCIAL');
    recepcion.flush({ recepcion_id: 1, entrega_id: 9, estado: 'PARCIAL' });

    servicio.cambiarEstadoEntrega(9, { estado: 'EN_CAMINO' }).subscribe();
    const cambio = http.expectOne('/api/v1/entregas/9');
    expect(cambio.request.method).toBe('PATCH');
    cambio.flush({ entrega_id: 9, estado: 'EN_CAMINO' });
  });
});
