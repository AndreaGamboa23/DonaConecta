import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface Institucion {
  id_institucion: number;
  nombre: string;
  ruc?: string | null;
  tipo_institucion: string;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  descripcion?: string | null;
  estado_verificacion: string;
}

export interface CrearInstitucionPayload {
  nombre: string;
  ruc?: string;
  tipo_institucion: string;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
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
