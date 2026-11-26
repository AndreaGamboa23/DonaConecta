import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IniciarSesion } from './iniciar-sesion';

describe('IniciarSesion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IniciarSesion],
      providers: [provideRouter([])],
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
    expect(componente.respuesta()).toContain('No hay una sesión disponible');
  });
});
