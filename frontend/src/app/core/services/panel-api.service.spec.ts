import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PanelApiService } from './panel-api.service';

describe('PanelApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('consulta el catálogo real con el filtro de categoría', () => {
    const servicio = TestBed.inject(PanelApiService);
    const http = TestBed.inject(HttpTestingController);

    servicio.listarProductos(4).subscribe();
    const productos = http.expectOne((peticion) => peticion.url === '/api/v1/productos');
    expect(productos.request.method).toBe('GET');
    expect(productos.request.params.get('categoriaId')).toBe('4');
    productos.flush([]);
  });

  it('envía filtros y paginación al resumen administrativo', () => {
    const servicio = TestBed.inject(PanelApiService);
    const http = TestBed.inject(HttpTestingController);

    servicio.resumenAdmin().subscribe();
    http.expectOne('/api/v1/admin/resumen').flush({});

    servicio.listarInstitucionesAdmin().subscribe();
    http.expectOne('/api/v1/admin/instituciones').flush([]);

    servicio
      .listarUsuarios({ limit: 5, offset: 10, q: 'ana', rol: 'DONANTE' })
      .subscribe();
    const usuarios = http.expectOne((peticion) => peticion.url === '/api/v1/admin/usuarios');
    expect(usuarios.request.params.get('limit')).toBe('5');
    expect(usuarios.request.params.get('offset')).toBe('10');
    expect(usuarios.request.params.get('q')).toBe('ana');
    expect(usuarios.request.params.get('rol')).toBe('DONANTE');
    usuarios.flush({ items: [], total: 0, limit: 5, offset: 10 });

    servicio.listarAuditoria({ limit: 3, offset: 6, modulo: 'USUARIOS', resultado: 'OK' }).subscribe();
    const auditoria = http.expectOne((peticion) => peticion.url === '/api/v1/admin/auditoria');
    expect(auditoria.request.params.get('modulo')).toBe('USUARIOS');
    expect(auditoria.request.params.get('resultado')).toBe('OK');
    auditoria.flush({ items: [], total: 0, limit: 3, offset: 6 });
  });

  it('usa PATCH para la verificación con el estado y el motivo reales', () => {
    const servicio = TestBed.inject(PanelApiService);
    const http = TestBed.inject(HttpTestingController);

    servicio
      .verificarInstitucion(7, { estado_verificacion: 'VERIFICADA', motivo: 'Documentación revisada' })
      .subscribe();
    const verificacion = http.expectOne('/api/v1/instituciones/admin/instituciones/7/verificar');
    expect(verificacion.request.method).toBe('PATCH');
    expect(verificacion.request.body).toEqual({
      estado_verificacion: 'VERIFICADA',
      motivo: 'Documentación revisada',
    });
    verificacion.flush({ mensaje: 'Estado actualizado', institucion: {} });

    servicio
      .cambiarEstadoUsuario(9, { estado: 'BLOQUEADO', motivo: 'Solicitud del titular' })
      .subscribe();
    const estado = http.expectOne('/api/v1/admin/usuarios/9/estado');
    expect(estado.request.method).toBe('PATCH');
    expect(estado.request.body.estado).toBe('BLOQUEADO');
    estado.flush({ mensaje: 'Estado actualizado', usuario: {} });
  });

  it('usa PATCH, POST y DELETE para las necesidades institucionales', () => {
    const servicio = TestBed.inject(PanelApiService);
    const http = TestBed.inject(HttpTestingController);

    servicio.obtenerPerfilInstitucional().subscribe();
    http.expectOne('/api/v1/institucional/perfil').flush({});

    servicio
      .actualizarPerfilInstitucional({ direccion: 'Av. Beispiel 123', telefono_publico: '987654321' })
      .subscribe();
    const perfil = http.expectOne('/api/v1/institucional/perfil');
    expect(perfil.request.method).toBe('PATCH');
    expect(perfil.request.body).toEqual({
      direccion: 'Av. Beispiel 123',
      telefono_publico: '987654321',
    });
    perfil.flush({});

    servicio
      .crearNecesidad({
        titulo: 'Frazadas para la comunidad',
        descripcion: 'Se necesitan frazadas para la campaña de invierno.',
        prioridad: 'ALTA',
        lineas: [{ producto_id: 2, unidad_id: 3, cantidad: 12 }],
      })
      .subscribe();
    const creacion = http.expectOne('/api/v1/institucional/necesidades');
    expect(creacion.request.method).toBe('POST');
    expect(creacion.request.body.lineas[0].producto_id).toBe(2);
    expect(creacion.request.body.id_institucion).toBeUndefined();
    creacion.flush({ mensaje: 'Necesidad publicada', necesidad: {} });

    servicio.actualizarNecesidad(11, { estado: 'PAUSADA' }).subscribe();
    const publicacion = http.expectOne('/api/v1/institucional/necesidades/11');
    expect(publicacion.request.method).toBe('PATCH');
    expect(publicacion.request.body).toEqual({ estado: 'PAUSADA' });
    publicacion.flush({ mensaje: 'Necesidad actualizada', necesidad: {} });

    servicio.eliminarNecesidad(11).subscribe();
    const borrado = http.expectOne('/api/v1/institucional/necesidades/11');
    expect(borrado.request.method).toBe('DELETE');
    borrado.flush(null);
  });

  it('lee categorías y unidades de medida del catálogo compartido', () => {
    const servicio = TestBed.inject(PanelApiService);
    const http = TestBed.inject(HttpTestingController);

    servicio.listarCategorias().subscribe();
    const categorias = http.expectOne('/api/v1/categorias');
    expect(categorias.request.method).toBe('GET');
    categorias.flush([]);

    servicio.listarUnidades().subscribe();
    const unidades = http.expectOne('/api/v1/unidades-medida');
    expect(unidades.request.method).toBe('GET');
    unidades.flush([]);
  });
});
