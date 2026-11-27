import { TestBed } from '@angular/core/testing';
import { SesionService, UsuarioSesion } from './sesion.service';

describe('SesionService', () => {
  const usuario: UsuarioSesion = {
    id_usuario: 7,
    nombres: 'Ana',
    apellidos: 'Pérez',
    correo: 'ana@ejemplo.com',
    roles: ['DONANTE'],
  };

  beforeEach(() => sessionStorage.clear());

  it('guarda la sesión solo durante la pestaña activa', () => {
    const sesion = TestBed.inject(SesionService);

    sesion.iniciar('token-de-sesion', usuario);

    expect(sesion.autenticado()).toBe(true);
    expect(sesion.nombreCompleto()).toBe('Ana Pérez');
    expect(sessionStorage.getItem('donaconecta_token')).toBe('token-de-sesion');
    expect(localStorage.getItem('donaconecta_token')).toBeNull();
  });

  it('actualiza los datos del usuario y cierra la sesión sin dejar rastros', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.iniciar('token-de-sesion', usuario);

    sesion.actualizarUsuario({ ...usuario, nombres: 'Ana María' });
    expect(sesion.usuario()?.nombres).toBe('Ana María');

    sesion.cerrar();
    expect(sesion.autenticado()).toBe(false);
    expect(sessionStorage.getItem('donaconecta_token')).toBeNull();
    expect(sessionStorage.getItem('donaconecta_usuario')).toBeNull();
  });
});
