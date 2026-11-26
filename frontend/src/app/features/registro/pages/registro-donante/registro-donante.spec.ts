import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegistroDonante } from './registro-donante';

describe('RegistroDonante', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroDonante],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('requiere consents y contraseñas coincidentes antes de habilitar el envío', () => {
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

  it('no crea una cuenta cuando el backend todavía no está integrado', () => {
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

    expect(componente.respuesta()).toContain('no se han enviado');
  });
});
