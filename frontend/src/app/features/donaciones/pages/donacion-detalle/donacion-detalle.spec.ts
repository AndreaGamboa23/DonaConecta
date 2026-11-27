import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CompromisoDetalle } from '../../../../core/interfaces/integracion-final';
import { SesionService } from '../../../../core/services/sesion.service';
import { DonacionesApiService } from '../../services/donaciones-api.service';
import { DonacionDetalle } from './donacion-detalle';

describe('DonacionDetalle', () => {
  const compromiso: CompromisoDetalle = {
    id_compromiso: 4,
    compromiso_id: 4,
    estado: 'CONFIRMADO',
    titulo: 'Frazadas',
    id_punto_acopio: 3,
    latitud: -12.07,
    longitud: -75.21,
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
    recepciones: [
      {
        recepcion_id: 5,
        entrega_id: 9,
        estado: 'PARCIAL',
        fecha_confirmacion: '2026-11-30T10:00:00Z',
      },
    ],
    historial_compromiso: [
      { historial_id: 1, estado_nuevo: 'CONFIRMADO', cambiado_en: '2026-11-29T10:00:00Z' },
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
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonacionDetalle],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '4' }, queryParamMap: { get: () => null } } },
        },
        {
          provide: DonacionesApiService,
          useValue: { obtenerCompromiso: () => of(compromiso) },
        },
        { provide: SesionService, useValue: { autenticado: () => false } },
      ],
    }).compileComponents();
  });

  it('construye el marcador autorizado y la línea de tiempo con recepciones reales', () => {
    const componente = TestBed.createComponent(DonacionDetalle).componentInstance;

    expect(componente.puntoId(compromiso)).toBe(3);
    expect(componente.nombrePunto(compromiso)).toBe('Acopio real');
    expect(componente.horarios(compromiso)).toContain('Lunes 09:00–12:00');
    expect(componente.marcadores(compromiso)).toEqual([
      { id: 3, nombre: 'Acopio real', latitud: -12.07, longitud: -75.21 },
    ]);

    const hitos = componente.hitos(compromiso);
    expect(hitos.some((hito) => hito.id === 'recepcion-5')).toBe(true);
    expect(hitos.some((hito) => hito.titulo === 'CONFIRMADO')).toBe(true);
    expect(componente.etiquetaEstado('EN_CAMINO')).toBe('en camino');
  });

  it('usa el punto raíz antes que la entrega y centra el destino autorizado', () => {
    const componente = TestBed.createComponent(DonacionDetalle).componentInstance;

    expect(componente.puntoId(conRaiz)).toBe(6);
    expect(componente.nombrePunto(conRaiz)).toBe('Acopio Comedor Esperanza');
    expect(componente.direccionPunto(conRaiz)).toBe('Av. Real 456');
    expect(componente.referenciasPunto(conRaiz)).toBe('Junto a la municipalidad');
    expect(componente.institucionNombre(conRaiz)).toBe('Comedor Esperanza');
    expect(componente.horarios(conRaiz)).toBe('Lunes a viernes 09:00–13:00');
    expect(componente.destinoMapa(conRaiz)).toEqual({
      latitud: -12.08,
      longitud: -75.22,
      nombre: 'Acopio Comedor Esperanza',
    });
    expect(componente.marcadores(conRaiz)).toEqual([
      { id: 6, nombre: 'Acopio Comedor Esperanza', latitud: -12.08, longitud: -75.22 },
    ]);
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

  it('omite lat/lng cuando el backend no entrega coordenadas válidas', () => {
    const componente = TestBed.createComponent(DonacionDetalle).componentInstance;
    const sinCoordenadas: CompromisoDetalle = {
      ...conRaiz,
      latitud: null,
      longitud: null,
      entregas: [{ ...conRaiz.entregas![0], latitud: null, longitud: null }],
    };
    const parametros = componente.parametrosMapa(sinCoordenadas);

    expect('lat' in parametros).toBe(false);
    expect('lng' in parametros).toBe(false);
    expect(componente.destinoMapa(sinCoordenadas)).toBeNull();
    expect(componente.marcadores(sinCoordenadas)).toEqual([]);
  });
});
