import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

interface RespuestaHealth {
  readonly estado: string;
  readonly base_datos: string;
  readonly entorno?: string;
  readonly modo_pruebas?: boolean;
}

/**
 * Consulta el estado publicado por la API para decidir si la interfaz debe
 * advertir que está trabajando con datos de demostración. Si la API no responde,
 * se mantiene la advertencia: es la opción segura.
 */
@Injectable({ providedIn: 'root' })
export class EntornoService {
  private readonly http = inject(HttpClient, { optional: true });
  private cargado = false;

  readonly modoPruebas = signal(true);

  cargar(): void {
    if (this.cargado || !this.http) return;
    this.cargado = true;

    this.http.get<RespuestaHealth>('/api/v1/health').subscribe({
      next: (respuesta) => this.modoPruebas.set(respuesta.modo_pruebas ?? true),
      error: () => this.modoPruebas.set(true),
    });
  }
}
