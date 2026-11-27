import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CompromisoDetalle } from '../../../../core/interfaces/integracion-final';
import { SesionService } from '../../../../core/services/sesion.service';
import { DonacionesApiService } from '../../services/donaciones-api.service';
import { MisDonaciones } from './mis-donaciones';

describe('MisDonaciones', () => {
  const compromiso: CompromisoDetalle = {
    id_compromiso: 4,
    compromiso_id: 4,
    estado: 'CONFIRMADO',
    titulo: 'Frazadas',
    id_punto_acopio: 3,
    entregas: [
      {
        entrega_id: 9,
        id_entrega: 9,
        estado: 'ENTREGADA',
        id_punto_acopio: 3,
        nombre_punto: 'Acopio real',
        direccion_acopio: 'Av. Real 123',
        horarios: [
          { dia_semana: 1, hora_apertura: '09:00:00', hora_cierre: '12:00:00', activo: true },
        ],
      },
    ],
    lineas: [
      {
        producto_id: 1,
        producto: 'Frazadas',
        unidad_id: 2,
        unidad_codigo: 'UN',
        cantidad_comprometida: 10,
        cantidad_recibida: 4,
        cantidad_pendiente: 6,
      },
    ],
    historial_compromiso: [
      {
        historial_id: 1,
        estado_nuevo: 'CONFIRMADO',
        motivo: 'Compromiso confirmado',
        cambiado_en: '2026-11-29T10:00:00Z',
      },
    ],
    historial_entregas: [
      {
        historial_id: 2,
        estado_nuevo: 'ENTREGADA',
        motivo: 'Entrega registrada',
        cambiado_en: '2026-11-30T10:00:00Z',
      },
    ],
  };

  const conRaiz: CompromisoDetalle = {
    id_compromiso: 5,
    estado: 'CONFIRMADO',
    titulo: 'Cobijas',
    institucion: 'Comedor Esperanza',
    id_institucion: 16,
    id_punto_acopio: 6,
    nombre_punto: 'Acopio Comedor Esperanza',
    direccion_acopio: 'Av. Real 456',
    referencias_entrega: 'Junto a la municipalidad',
    latitud: -12.08,
    longitud: -75.22,
    horario_programado: 'Lunes a viernes 09:00–13:00',
    entregas: [
      {
        entrega_id: 10,
        estado: 'PENDIENTE',
        id_punto_acopio: 99,
        nombre_punto: 'Punto anterior',
        direccion_acopio: 'Dirección anterior',
        latitud: 0,
        longitud: 0,
        horarios: [
          { dia_semana: 3, hora_apertura: '10:00:00', hora_cierre: '11:00:00', activo: true },
        ],
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisDonaciones],
      providers: [
        provideRouter([]),
        {
          provide: DonacionesApiService,
          useValue: { listarDonaciones: () => of([]), obtenerCompromiso: () => of(compromiso) },
        },
        { provide: SesionService, useValue: { autenticado: () => false } },
      ],
    }).compileComponents();
  });

  it('lee punto, horarios, unidades e historial de los campos reales del backend', () => {
    const componente = TestBed.createComponent(MisDonaciones).componentInstance;

    expect(componente.puntoId(compromiso)).toBe(3);
    expect(componente.puntoNombre(compromiso)).toBe('Acopio real');
    expect(componente.horarios(compromiso)).toContain('Lunes 09:00–12:00');
    expect(componente.simboloLinea(compromiso.lineas![0])).toBe('UN');
    expect(componente.pendiente(compromiso.lineas![0])).toBe(6);
    expect(componente.avance(compromiso.lineas![0])).toBe(40);
    expect(componente.historial(compromiso)).toHaveLength(2);
    expect(componente.eventoTexto(componente.historial(compromiso)[0])).toBe('Entrega registrada');
  });

  it('prioriza el punto raíz y envía al mapa sólo parámetros reales', () => {
    const componente = TestBed.createComponent(MisDonaciones).componentInstance;

    expect(componente.puntoId(conRaiz)).toBe(6);
    expect(componente.puntoNombre(conRaiz)).toBe('Acopio Comedor Esperanza');
    expect(componente.direccionPunto(conRaiz)).toBe('Av. Real 456');
    expect(componente.referenciasPunto(conRaiz)).toBe('Junto a la municipalidad');
    expect(componente.institucionNombre(conRaiz)).toBe('Comedor Esperanza');
    expect(componente.horarios(conRaiz)).toBe('Lunes a viernes 09:00–13:00');
    expect(componente.coordenadasPunto(conRaiz)).toEqual([-12.08, -75.22]);
    expect(componente.parametrosMapa(conRaiz)).toEqual({
      punto: 6,
      compromiso: 5,
      nombre: 'Acopio Comedor Esperanza',
      direccion: 'Av. Real 456',
      horario: 'Lunes a viernes 09:00–13:00',
      institucion: 'Comedor Esperanza',
      lat: -12.08,
      lng: -75.22,
    });
  });

  it('no inventa coordenadas ni muestra "Sin punto asignado"', () => {
    const componente = TestBed.createComponent(MisDonaciones).componentInstance;
    const sinCoordenadas: CompromisoDetalle = {
      ...conRaiz,
      latitud: null,
      longitud: null,
      entregas: [{ ...conRaiz.entregas![0], latitud: null, longitud: null }],
    };
    const parametros = componente.parametrosMapa(sinCoordenadas);

    expect('lat' in parametros).toBe(false);
    expect('lng' in parametros).toBe(false);
    expect(Object.values(parametros).some((valor) => valor === '')).toBe(false);

    const sinPunto: CompromisoDetalle = {
      ...sinCoordenadas,
      nombre_punto: null,
      punto_acopio: null,
      horario_programado: null,
      entregas: [],
    };
    expect(componente.puntoNombre(sinPunto)).toBe('');
    expect(componente.horarios(sinPunto)).toBe('');
  });
});
