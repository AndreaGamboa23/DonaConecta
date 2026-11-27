import { interpretarErrorApi } from './errores-api';

describe('interpretarErrorApi', () => {
  it('distingue el backend no disponible', () => {
    const resultado = interpretarErrorApi({ status: 0 }, 'el registro');
    expect(resultado.categoria).toBe('servicio-no-disponible');
    expect(resultado.mensaje).toContain('puerto 8000');
  });

  it('distingue un fallo de conexión con la base de datos', () => {
    const resultado = interpretarErrorApi({ status: 503 }, 'el registro');
    expect(resultado.categoria).toBe('base-de-datos');
    expect(resultado.mensaje).toContain('base de datos');
  });

  it('muestra el mensaje de correo duplicado sin revelar detalles internos', () => {
    const resultado = interpretarErrorApi(
      { status: 409, error: { detail: 'El correo ya se encuentra registrado.' } },
      'el registro',
    );
    expect(resultado.categoria).toBe('duplicado');
    expect(resultado.mensaje).toBe('El correo ya se encuentra registrado.');
  });

  it('traduce errores de validación sin mostrar los valores rechazados', () => {
    const resultado = interpretarErrorApi(
      {
        status: 422,
        error: {
          detail: [
            { loc: ['body', 'email'], msg: 'invalid', input: 'secreto@correo.com' },
            { loc: ['body', 'password'], msg: 'short', input: 'Clave123' },
          ],
        },
      },
      'el registro',
    );
    expect(resultado.categoria).toBe('validacion');
    expect(resultado.mensaje).toContain('correo electrónico');
    expect(resultado.mensaje).toContain('contraseña');
    expect(resultado.mensaje).not.toContain('secreto@correo.com');
    expect(resultado.mensaje).not.toContain('Clave123');
  });

  it('distingue error de autorización y error interno', () => {
    expect(interpretarErrorApi({ status: 401 }, 'el acceso').categoria).toBe('autorizacion');
    expect(interpretarErrorApi({ status: 500 }, 'el registro').categoria).toBe('servidor');
  });
});
