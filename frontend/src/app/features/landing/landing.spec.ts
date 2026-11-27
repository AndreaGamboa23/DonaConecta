import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Landing } from './landing';

describe('Landing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('renderiza las secciones públicas principales', async () => {
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne((peticion) => peticion.url === '/api/v1/necesidades')
      .flush([]);
    await fixture.whenStable();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;

    expect(html).toContain('id="inicio"');
    expect(html).toContain('id="donar"');
    expect(html).toContain('id="como-funciona"');
    expect(html).toContain('id="nosotros"');
    expect(html).toContain('id="participa"');
    expect(html).not.toContain('Pronto, cada necesidad será visible');
  });

  it('muestra solicitudes publicadas reales en el inicio', async () => {
    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne((peticion) => peticion.url === '/api/v1/necesidades')
      .flush([
        {
          id_necesidad: 9,
          titulo: 'Solicitud real de prueba',
          descripcion: 'Solicitud sintética',
          cantidad_requerida: 5,
          cantidad_comprometida: 0,
          cantidad_recibida: 0,
          cantidad_disponible: 5,
          avance_porcentaje: 0,
          lineas_totales: 1,
          lineas_cubiertas: 0,
          unidad_medida_base: 'un',
          prioridad: 'ALTA',
          estado: 'PUBLICADA',
          institucion: 'Institución verificada',
          id_institucion: 10,
          distrito: 'Huancayo',
          id_categoria: 1,
          categoria: 'Alimentos',
          fecha_publicacion: '2026-11-01T00:00:00',
          fecha_limite: '2026-12-01T00:00:00',
        },
      ]);
    await fixture.whenStable();

    const raiz = fixture.nativeElement as HTMLElement;
    const tarjeta = raiz.querySelector('app-necesidad-card');
    expect(tarjeta?.textContent).toContain('Solicitud real de prueba');
    expect(tarjeta?.querySelector('.h4')?.textContent?.trim()).toBe('1');
    expect(tarjeta?.textContent).toContain('líneas solicitadas');
    expect(tarjeta?.textContent).not.toContain('un disponibles');
  });
});
