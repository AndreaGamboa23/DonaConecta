import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SesionService } from '../../../../core/services/sesion.service';
import { RegistroDonante } from './registro-donante';

describe('RegistroDonante', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroDonante],
      providers: [
        provideRouter([{ path: 'perfil', component: RegistroDonante }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('requiere consentimientos y contraseñas coincidentes antes de habilitar el envío', () => {
    const fixture = TestBed.createComponent(RegistroDonante);
    const componente = fixture.componentInstance;

    expect(componente.form.invalid).toBe(true);

    componente.form.patchValue({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@ejemplo.com',
      distritoId: 13,
      password: 'ClaveSegura123',
      confirmacion: 'ClaveDiferente123',
      consentimientoDatos: true,
      aceptaTerminos: true,
    });

    expect(componente.form.errors?.['noCoinciden']).toBeTruthy();

    componente.form.controls.confirmacion.setValue('ClaveSegura123');
    expect(componente.form.valid).toBe(true);
  });

  it('envía el registro real y guarda la sesión devuelta por el backend', () => {
    const fixture = TestBed.createComponent(RegistroDonante);
    const componente = fixture.componentInstance;
    componente.form.patchValue({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@ejemplo.com',
      distritoId: 13,
      password: 'ClaveSegura123',
      confirmacion: 'ClaveSegura123',
      consentimientoDatos: true,
      aceptaTerminos: true,
    });

    componente.enviar();

    const http = TestBed.inject(HttpTestingController);
    const registro = http.expectOne('/api/v1/auth/registro');
    expect(registro.request.method).toBe('POST');
    expect(registro.request.body).toMatchObject({
      email: 'ana@ejemplo.com',
      rol: 'DONANTE',
      distritoId: 13,
      consentimientoDatos: true,
      aceptaTerminos: true,
    });
    registro.flush({ mensaje: 'Usuario creado' });

    http.expectOne('/api/v1/auth/login').flush({
      access_token: 'token-de-registro',
      token_type: 'bearer',
      usuario: {
        id_usuario: 7,
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana@ejemplo.com',
        roles: ['DONANTE'],
      },
    });

    expect(TestBed.inject(SesionService).token()).toBe('token-de-registro');
    http.verify();
  });

  it('explica que el backend no está disponible en lugar de culpar al correo', () => {
    const fixture = TestBed.createComponent(RegistroDonante);
    const componente = fixture.componentInstance;
    componente.form.patchValue({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@ejemplo.com',
      distritoId: 13,
      password: 'ClaveSegura123',
      confirmacion: 'ClaveSegura123',
      consentimientoDatos: true,
      aceptaTerminos: true,
    });

    componente.enviar();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('/api/v1/auth/registro')
      .flush({}, { status: 503, statusText: 'Service Unavailable' });

    expect(componente.respuesta()).toContain('base de datos');
    expect(componente.enviando()).toBe(false);
    http.verify();
  });

  it('informa el correo duplicado devuelto por el backend', () => {
    const fixture = TestBed.createComponent(RegistroDonante);
    const componente = fixture.componentInstance;
    componente.form.patchValue({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'duplicado@ejemplo.com',
      distritoId: 13,
      password: 'ClaveSegura123',
      confirmacion: 'ClaveSegura123',
      consentimientoDatos: true,
      aceptaTerminos: true,
    });

    componente.enviar();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/auth/registro').flush(
      { detail: 'El correo ya se encuentra registrado.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(componente.respuesta()).toBe('El correo ya se encuentra registrado.');
    http.verify();
  });
});
