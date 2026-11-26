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

@Injectable({ providedIn: 'root' })
export class SesionService {
  readonly token = signal<string | null>(this.leerToken());
  readonly usuario = signal<UsuarioSesion | null>(this.leerUsuario());

  readonly autenticado = computed(() => Boolean(this.token() && this.usuario()));
  readonly nombreCompleto = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombres} ${u.apellidos}`.trim() : '';
  });

  iniciar(token: string, usuario: UsuarioSesion): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    this.token.set(token);
    this.usuario.set(usuario);
  }

  actualizarUsuario(usuario: UsuarioSesion): void {
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  cerrar(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.usuario.set(null);
  }

  private leerToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }

  private leerUsuario(): UsuarioSesion | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UsuarioSesion;
    } catch {
      return null;
    }
  }
}
