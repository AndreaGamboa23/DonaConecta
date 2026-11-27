import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SesionService } from '../../../../core/services/sesion.service';
import { RegistroInstitucion } from './registro-institucion';

describe('RegistroInstitucion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroInstitucion],
      providers: [
        provideRouter([{ path: 'perfil', component: RegistroInstitucion }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('envía cuenta, vínculo e institución en una sola transacción del backend', () => {
    const fixture = TestBed.createComponent(RegistroInstitucion);
    const componente = fixture.componentInstance;
    componente.form.patchValue({
      email: 'rep@ejemplo.com',
      password: 'ClaveSegura123',
      confirmacion: 'ClaveSegura123',
      nombres: 'Sintetico',
      apellidos: 'Representante',
      cargoRepresentante: 'Coordinador',
      nombreInstitucion: 'Institucion sintetica F08',
      tipoId: 1,
      distritoId: 13,
    });
    componente.siguiente();
    componente.siguiente();
    componente.siguiente();
    componente.enviar();

    const http = TestBed.inject(HttpTestingController);
    const registro = http.expectOne('/api/v1/auth/registro');
    expect(registro.request.body).toMatchObject({
      email: 'rep@ejemplo.com',
      rol: 'REPRESENTANTE',
      institucion: {
        nombre: 'Institucion sintetica F08',
        tipoId: 1,
        distritoId: 13,
        cargoRepresentante: 'Coordinador',
      },
    });
    expect(registro.request.body.institucion.ruc).toBeUndefined();
    registro.flush({ mensaje: 'Registro completado correctamente.' });

    http.expectOne('/api/v1/auth/login').flush({
      access_token: 'token-representante',
      token_type: 'bearer',
      usuario: {
        id_usuario: 9,
        nombres: 'Sintetico',
        apellidos: 'Representante',
        correo: 'rep@ejemplo.com',
        roles: ['REPRESENTANTE'],
      },
    });

    expect(TestBed.inject(SesionService).token()).toBe('token-representante');
    http.verify();
  });
});
