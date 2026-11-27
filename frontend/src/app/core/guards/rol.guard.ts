import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

/**
 * Protección de navegación, no control de acceso definitivo: el backend valida
 * la sesión, los roles activos y la propiedad del recurso en cada petición.
 */
export const rolGuard =
  (...rolesPermitidos: readonly string[]): CanActivateFn =>
  () => {
    const sesion = inject(SesionService);
    const router = inject(Router);
    const usuario = sesion.usuario();

    if (!sesion.autenticado() || !usuario) {
      return router.createUrlTree(['/iniciar-sesion']);
    }

    const roles = usuario.roles.map((rol) => rol.toLocaleUpperCase('es'));
    const permitido = roles.some((rol) =>
      rolesPermitidos.some((requerido) => requerido.toLocaleUpperCase('es') === rol),
    );

    return permitido ? true : router.createUrlTree(['/perfil']);
  };
