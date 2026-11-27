import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  InstitucionAdmin,
  PanelApiService,
  VerificarInstitucionPayload,
} from '../../../core/services/panel-api.service';
import { AdminInstituciones } from './admin-instituciones';

const institucion: InstitucionAdmin = {
  id_institucion: 7,
  nombre: 'Comedor de prueba',
  tipo: 'Comedor comunitario',
  distrito: 'Huancayo',
  descripcion: null,
  direccion: null,
  estado_verificacion: 'PENDIENTE',
  representante: null,
  correo_representante: null,
  fecha_registro: null,
};

describe('AdminInstituciones', () => {
  let verificar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    verificar = vi.fn((_id: number, _payload: VerificarInstitucionPayload) =>
      of({
        mensaje: 'Estado de verificación actualizado',
        institucion: {
          id_institucion: 7,
          nombre: 'Comedor de prueba',
          estado_verificacion: 'VERIFICADA',
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [AdminInstituciones],
      providers: [
        {
          provide: PanelApiService,
          useValue: {
            listarInstitucionesAdmin: () => of([institucion]),
            verificarInstitucion: verificar,
          },
        },
      ],
    }).compileComponents();
  });

  it('permite verificar sin motivo cuando la decisión no es sensible', () => {
    const componente = TestBed.createComponent(AdminInstituciones).componentInstance;
    componente.cargar();

    expect(componente.requiereMotivo('VERIFICADA')).toBe(false);
    componente.formVerificacion.patchValue({ decision: 'VERIFICADA', motivo: '' });
    componente.registrarVerificacion();

    expect(verificar).toHaveBeenCalledWith(7, { estado_verificacion: 'VERIFICADA' });
  });

  it('exige motivo antes de rechazar o suspender una institución', () => {
    const componente = TestBed.createComponent(AdminInstituciones).componentInstance;
    componente.cargar();

    expect(componente.requiereMotivo('RECHAZADA')).toBe(true);
    expect(componente.requiereMotivo('SUSPENDIDA')).toBe(true);
    componente.formVerificacion.patchValue({ decision: 'RECHAZADA', motivo: '' });
    componente.registrarVerificacion();

    expect(verificar).not.toHaveBeenCalled();
    expect(componente.mensajeEsError()).toBe(true);
    expect(componente.mensaje()).toContain('motivo');

    componente.formVerificacion.controls.motivo.setValue('No cumple los requisitos de registro');
    componente.registrarVerificacion();

    expect(verificar).toHaveBeenCalledWith(7, {
      estado_verificacion: 'RECHAZADA',
      motivo: 'No cumple los requisitos de registro',
    });
  });
});
