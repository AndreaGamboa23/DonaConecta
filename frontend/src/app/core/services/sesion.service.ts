import { Injectable, computed, signal } from '@angular/core';

export interface UsuarioSesion {
  readonly id_usuario: number;
  readonly nombres: string;
  readonly apellidos: string;
  readonly correo: string;
  readonly roles: readonly string[];
}

const TOKEN_KEY = 'donaconecta_token';
const USER_KEY = 'donaconecta_usuario';

/**
 * La sesión se conserva solo mientras la pestaña esté abierta. No es una base de
 * datos: los registros de negocio se consultan siempre al backend autorizado.
 */
function almacenamiento(): Storage | null {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage;
}

@Injectable({ providedIn: 'root' })
export class SesionService {
  readonly token = signal<string | null>(this.leerToken());
  readonly usuario = signal<UsuarioSesion | null>(this.leerUsuario());

  readonly autenticado = computed(() => Boolean(this.token() && this.usuario()));
  readonly nombreCompleto = computed(() => {
    const usuario = this.usuario();
    return usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : '';
  });

  iniciar(token: string, usuario: UsuarioSesion): void {
    const storage = almacenamiento();
    storage?.setItem(TOKEN_KEY, token);
    storage?.setItem(USER_KEY, JSON.stringify(usuario));
    this.token.set(token);
    this.usuario.set(usuario);
  }

  actualizarUsuario(usuario: UsuarioSesion): void {
    almacenamiento()?.setItem(USER_KEY, JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  cerrar(): void {
    const storage = almacenamiento();
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    this.token.set(null);
    this.usuario.set(null);
  }

  private leerToken(): string | null {
    return almacenamiento()?.getItem(TOKEN_KEY) ?? null;
  }

  private leerUsuario(): UsuarioSesion | null {
    const raw = almacenamiento()?.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UsuarioSesion;
    } catch {
      return null;
    }
  }
}
