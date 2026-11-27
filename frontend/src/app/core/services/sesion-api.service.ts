import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { BackendEstadoService } from './backend-estado.service';
import { SesionService } from './sesion.service';

/**
 * Cierra la sesión en el servidor antes de borrar el token local.
 * sessionStorage sólo guarda el JWT del navegador: no equivale a una cookie HttpOnly.
 */
@Injectable({ providedIn: 'root' })
export class SesionApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);
  private readonly sesion = inject(SesionService);

  cerrar(): Observable<void> {
    if (!this.estado.disponible('cerrarSesionServidor')) {
      // Cierre local honesto: no puede revocarse un token sin endpoint real.
      this.sesion.cerrar();
      return this.estado.pendiente<void>('cerrarSesionServidor');
    }
    if (!this.sesion.autenticado()) {
      this.sesion.cerrar();
      return new Observable<void>((suscriptor) => {
        suscriptor.next();
        suscriptor.complete();
      });
    }

    return this.injector
      .get(HttpClient)
      .delete<void>('/api/v1/auth/sesion')
      .pipe(
        tap(() => this.sesion.cerrar()),
        finalize(() => {
          // Incluso si falla la revocación remota, la pestaña deja de usar el token.
          if (this.sesion.autenticado()) this.sesion.cerrar();
        }),
      );
  }
}
