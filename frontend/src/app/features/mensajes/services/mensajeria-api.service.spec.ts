import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MensajeriaApiService, nuevoClientMessageId } from './mensajeria-api.service';

describe('MensajeriaApiService', () => {
  let servicio: MensajeriaApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(MensajeriaApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('usa los endpoints reales y el sobre paginado de conversaciones', () => {
    let total = 0;
    servicio.listarConversaciones().subscribe((respuesta) => {
      total = (respuesta as { total: number }).total;
    });
    const bandeja = http.expectOne('/api/v1/conversaciones');
    expect(bandeja.request.method).toBe('GET');
    bandeja.flush({ items: [], total: 4, page: 1, page_size: 20 });
    expect(total).toBe(4);
  });

  it('abre la conversación con un solo recurso y envía UUID de cliente', () => {
    servicio.crearConversacion({ id_necesidad: 12 }).subscribe();
    const crear = http.expectOne('/api/v1/conversaciones');
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual({ id_necesidad: 12 });
    crear.flush({ id_conversacion: 8, conversacion_id: 8, estado: 'ACTIVA' });

    servicio
      .enviarMensaje(8, { contenido: 'Hola', client_message_id: nuevoClientMessageId() })
      .subscribe();
    const enviar = http.expectOne('/api/v1/conversaciones/8/mensajes');
    expect(enviar.request.method).toBe('POST');
    expect(enviar.request.body.contenido).toBe('Hola');
    expect(enviar.request.body.client_message_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    enviar.flush({ id_mensaje: 1, mensaje_id: 1, contenido: 'Hola' });
  });

  it('pagina el historial y marca leídas conversaciones y notificaciones', () => {
    servicio.listarMensajes(8, 25, 5).subscribe();
    const historial = http.expectOne(
      (peticion) =>
        peticion.url === '/api/v1/conversaciones/8/mensajes' &&
        peticion.params.get('limit') === '25' &&
        peticion.params.get('offset') === '5',
    );
    expect(historial.request.method).toBe('GET');
    historial.flush({ items: [], total: 0 });

    servicio.marcarLeido(8, 31).subscribe();
    const leido = http.expectOne('/api/v1/conversaciones/8/leido');
    expect(leido.request.method).toBe('PATCH');
    expect(leido.request.body).toEqual({ mensaje_id: 31 });
    leido.flush({ ultimo_mensaje_leido_id: 31, no_leidos: 0 });

    servicio.listarNotificaciones().subscribe();
    const notificaciones = http.expectOne('/api/v1/notificaciones');
    notificaciones.flush({ items: [], total: 0, no_leidas: 0 });

    servicio.marcarNotificacionLeido(4).subscribe();
    const notificacion = http.expectOne('/api/v1/notificaciones/4/leido');
    expect(notificacion.request.method).toBe('PATCH');
    notificacion.flush({ notificacion_id: 4 });
  });
});
