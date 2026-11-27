import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { SesionService, UsuarioSesion } from '../services/sesion.service';
import { rolGuard } from './rol.guard';

describe('rolGuard', () => {
  const administrador: UsuarioSesion = {
    id_usuario: 1,
    nombres: 'Admin',
    apellidos: 'Sintético',
    correo: 'admin@ejemplo.com',
    roles: ['ADMINISTRADOR'],
  };
  const donante: UsuarioSesion = { ...administrador, roles: ['DONANTE'] };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  const evaluar = (...roles: readonly string[]) =>
    TestBed.runInInjectionContext(() => rolGuard(...roles)({} as never, {} as never));

  it('redirige a iniciar sesión cuando no hay sesión', () => {
    const resultado = evaluar('ADMINISTRADOR');
    const router = TestBed.inject(Router);
    expect(resultado instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/iniciar-sesion');
  });

  it('permite el acceso al rol autorizado', () => {
    TestBed.inject(SesionService).iniciar('token', administrador);
    expect(evaluar('ADMINISTRADOR')).toBe(true);
  });

  it('redirige al perfil cuando el rol no está autorizado', () => {
    TestBed.inject(SesionService).iniciar('token', donante);
    const resultado = evaluar('ADMINISTRADOR');
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/perfil');
  });
});
