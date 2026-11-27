import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  NecesidadInstitucional,
  PanelApiService,
  PerfilInstitucional,
} from '../../../core/services/panel-api.service';
import { InstitucionalNecesidades } from './institucional-necesidades';

const necesidad: NecesidadInstitucional = {
  id_necesidad: 4,
  titulo: 'Frazadas para el comedor',
  descripcion: 'Solicitud de invierno',
  prioridad: 'ALTA',
  estado: 'PUBLICADA',
  cantidad_requerida: 40,
  cantidad_comprometida: 12,
  cantidad_recibida: 5,
  unidad_medida_base: 'pieza',
  lineas: [],
};

const perfil: PerfilInstitucional = {
  id_institucion: 2,
  nombre: 'Comedor de prueba',
  tipo: 'Comedor comunitario',
  distrito: 'Huancayo',
  descripcion: null,
  direccion: null,
  telefono_publico: null,
  email_publico: null,
  estado_verificacion: 'VERIFICADA',
  fecha_registro: null,
};

describe('InstitucionalNecesidades', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstitucionalNecesidades],
      providers: [
        {
          provide: PanelApiService,
          useValue: {
            listarNecesidadesInstitucionales: () => of([necesidad]),
            listarProductos: () => of([]),
            listarCategorias: () => of([]),
            listarUnidades: () => of([]),
            obtenerPerfilInstitucional: () => of(perfil),
          },
        },
      ],
    }).compileComponents();
  });

  it('calcula la disponibilidad sin doble conteo', () => {
    const componente = TestBed.createComponent(InstitucionalNecesidades).componentInstance;

    expect(componente.disponible(necesidad)).toBe(23);
    expect(componente.disponibleTexto(necesidad)).toBe('23 pieza');
  });

  it('sólo ofrece transiciones permitidas para cada estado', () => {
    const componente = TestBed.createComponent(InstitucionalNecesidades).componentInstance;

    expect(componente.acciones(necesidad)).toEqual(['PAUSADA', 'CANCELADA']);
    expect(componente.acciones({ ...necesidad, estado: 'BORRADOR' })).toEqual([
      'PUBLICADA',
      'CANCELADA',
    ]);
    expect(componente.acciones({ ...necesidad, estado: 'COMPLETADA' })).toEqual([]);
  });

  it('mantiene una línea editable y valida los campos obligatorios', () => {
    const componente = TestBed.createComponent(InstitucionalNecesidades).componentInstance;

    expect(componente.form.controls.lineas.length).toBe(1);
    componente.form.patchValue({
      titulo: 'Frazadas',
      descripcion: 'Campaña de invierno',
    });
    componente.form.controls.lineas.at(0)?.patchValue({
      producto_id: 2,
      unidad_id: 3,
      cantidad: 10,
    });
    expect(componente.form.valid).toBe(true);

    componente.quitarLinea(0);
    expect(componente.form.controls.lineas.length).toBe(1);
  });
});
