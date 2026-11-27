import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IniciarSesion } from './iniciar-sesion';

describe('IniciarSesion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IniciarSesion],
      providers: [
        provideRouter([{ path: 'perfil', component: IniciarSesion }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('renderiza el encabezado de la página', async () => {
    const fixture = TestBed.createComponent(IniciarSesion);
    await fixture.whenStable();
    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');

    expect(h1?.textContent).toContain('Bienvenido de nuevo');
  });

  it('valida correo y contraseña sin iniciar sesiones simuladas', () => {
    const fixture = TestBed.createComponent(IniciarSesion);
    const componente = fixture.componentInstance;

    componente.form.patchValue({ email: 'correo-invalido', password: 'corta' });
    componente.entrar();
    expect(componente.respuesta()).toBe('');
    expect(componente.form.invalid).toBe(true);

    componente.form.patchValue({ email: 'ana@ejemplo.com', password: 'ClaveSegura123' });
    componente.entrar();

    const http = TestBed.inject(HttpTestingController);
    const peticion = http.expectOne('/api/v1/auth/login');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      correo: 'ana@ejemplo.com',
      password: 'ClaveSegura123',
    });
    peticion.flush({ detail: 'Correo o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });
    expect(componente.respuesta()).toContain('Correo o contraseña incorrectos.');
    http.verify();
  });

  it('guarda la sesión real cuando el backend responde con un token', () => {
    const fixture = TestBed.createComponent(IniciarSesion);
    const componente = fixture.componentInstance;

    componente.form.patchValue({ email: 'ana@ejemplo.com', password: 'ClaveSegura123' });
    componente.entrar();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/auth/login').flush({
      access_token: 'token-de-prueba',
      token_type: 'bearer',
      usuario: {
        id_usuario: 7,
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana@ejemplo.com',
        roles: ['DONANTE'],
      },
    });
    http.verify();
  });
});
