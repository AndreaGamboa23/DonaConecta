import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface UsuarioSesion {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: UsuarioSesion;
}

export interface RegistroPayload {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
  password: string;
  rol: 'DONANTE' | 'REPRESENTANTE';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://127.0.0.1:8000/api/v1/auth';

  readonly usuarioActual = signal<UsuarioSesion | null>(this.leerUsuarioGuardado());
  readonly estaAutenticado = computed(() => this.usuarioActual() !== null);

  login(correo: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { correo, password }).pipe(
      tap((res) => {
        localStorage.setItem('dc_token', res.access_token);
        localStorage.setItem('dc_usuario', JSON.stringify(res.usuario));
        this.usuarioActual.set(res.usuario);
      }),
    );
  }

  registro(datos: RegistroPayload) {
    return this.http.post(`${this.apiUrl}/registro`, datos);
  }

  cerrarSesion() {
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_usuario');
    this.usuarioActual.set(null);
    this.router.navigateByUrl('/');
  }

  private leerUsuarioGuardado(): UsuarioSesion | null {
    const raw = localStorage.getItem('dc_usuario');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UsuarioSesion;
    } catch {
      return null;
    }
  }
}
