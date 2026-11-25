import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface Necesidad {
  id_necesidad: number;
  titulo: string;
  descripcion: string;
  cantidad_requerida: number;
  cantidad_comprometida: number;
  cantidad_recibida: number;
  unidad_medida_base: string;
  prioridad: string;
  estado: string;
  fecha_limite?: string | null;
  institucion: string;
  distrito: string;
  categoria: string;
  punto_acopio: string;
  direccion_acopio: string;
}

export interface CategoriaBien {
  id_categoria: number;
  nombre: string;
  descripcion: string;
  unidad_medida_base: string;
}

export interface CompromisoDonante {
  id_compromiso: number;
  necesidad: string;
  institucion: string;
  cantidad_comprometida: number;
  unidad_medida_base: string;
  comentario?: string | null;
  estado: string;
  punto_acopio: string;
  direccion_acopio: string;
  creado_en: string;
}

@Injectable({ providedIn: 'root' })
export class NecesidadesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/api/v1';

  listarNecesidades() {
    return this.http.get<Necesidad[]>(`${this.baseUrl}/necesidades`);
  }

  listarCategorias() {
    return this.http.get<CategoriaBien[]>(`${this.baseUrl}/categorias`);
  }

  publicarNecesidad(datos: {
    id_institucion: number;
    id_categoria: number;
    id_punto_acopio: number;
    titulo: string;
    descripcion: string;
    cantidad_requerida: number;
    prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
    fecha_limite?: string;
  }) {
    return this.http.post(`${this.baseUrl}/necesidades`, datos);
  }

  comprometerDonacion(datos: {
    id_necesidad: number;
    cantidad_comprometida: number;
    comentario?: string;
  }) {
    return this.http.post(`${this.baseUrl}/compromisos`, datos);
  }

  misCompromisos() {
    return this.http.get<CompromisoDonante[]>(`${this.baseUrl}/compromisos/mis-compromisos`);
  }
}
