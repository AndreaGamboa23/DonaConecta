import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface Institucion {
  id_institucion: number;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  tipo_institucion: string;
  descripcion?: string | null;
  distrito: string;
  direccion: string;
  estado_verificacion: string;
  id_punto_acopio?: number | null;
}

export interface CrearInstitucionPayload {
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  tipo_institucion: 'COMEDOR' | 'ALBERGUE' | 'REFUGIO_ANIMALES' | 'ORGANIZACION_SOCIAL';
  distrito: string;
  direccion: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class InstitucionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/api/v1/instituciones';

  listarVerificadas() {
    return this.http.get<Institucion[]>(this.apiUrl);
  }

  registrar(datos: CrearInstitucionPayload) {
    return this.http.post<{ mensaje: string; institucion: Institucion }>(this.apiUrl, datos);
  }
}
