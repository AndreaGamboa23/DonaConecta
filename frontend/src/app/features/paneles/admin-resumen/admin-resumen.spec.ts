import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PanelApiService, ResumenAdmin } from '../../../core/services/panel-api.service';
import { AdminResumen } from './admin-resumen';

const resumen: ResumenAdmin = {
  instituciones_pendientes: 3,
  usuarios_activos: 12,
  incidencias_abiertas: 1,
  instituciones_verificadas: 5,
  necesidades_publicadas: 8,
  compromisos_activos: 4,
  productos_activos: 41,
  ultima_verificacion: null,
};

describe('AdminResumen', () => {
  it('muestra únicamente indicadores calculados por el backend', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminResumen],
      providers: [
        provideRouter([]),
        { provide: PanelApiService, useValue: { resumenAdmin: () => of(resumen) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminResumen);
    fixture.detectChanges();

    expect(fixture.componentInstance.estado()).toBe('datos');
    expect(fixture.componentInstance.metricas().map((metrica) => metrica.valor)).toEqual([
      3, 12, 1, 5, 8, 4, 41,
    ]);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Instituciones por verificar');
    expect(texto).toContain('Bienes activos en catálogo');
  });

  it('informa del fallo sin mostrar cifras estimadas', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminResumen],
      providers: [
        provideRouter([]),
        {
          provide: PanelApiService,
          useValue: { resumenAdmin: () => throwError(() => new Error('fallo de red')) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminResumen);
    fixture.detectChanges();

    expect(fixture.componentInstance.estado()).toBe('error');
    expect(fixture.componentInstance.metricas()).toEqual([]);
    expect(fixture.componentInstance.error().length).toBeGreaterThan(0);
  });
});
