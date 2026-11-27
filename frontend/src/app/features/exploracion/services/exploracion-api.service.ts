import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from '../../../core/services/backend-estado.service';

/** Datos públicos devueltos por la API real sobre SQL Server. */
export interface NecesidadReal {
  readonly id_necesidad: number;
  readonly titulo: string;
  readonly descripcion: string | null;
  readonly cantidad_requerida: number;
  readonly cantidad_comprometida: number;
  readonly cantidad_recibida: number;
  readonly cantidad_disponible: number;
  readonly avance_porcentaje: number;
  readonly lineas_totales: number;
  readonly lineas_cubiertas: number;
  readonly unidad_medida_base: string;
  readonly prioridad: string;
  readonly estado: string;
  readonly fecha_publicacion: string | null;
  readonly fecha_limite: string | null;
  readonly institucion: string;
  readonly id_institucion: number;
  readonly distrito: string;
  readonly id_categoria: number | null;
  readonly categoria: string;
  readonly punto_acopio?: string;
  readonly direccion_acopio?: string;
}

export interface LineaNecesidadReal {
  readonly producto_id: number;
  readonly producto: string;
  readonly categoria: string;
  readonly unidad_id: number;
  readonly unidad_codigo: string;
  readonly unidad: string;
  readonly simbolo: string;
  readonly cantidad_requerida: number;
  readonly cantidad_reservada_vigente: number;
  readonly cantidad_recibida: number;
  readonly cantidad_disponible: number;
}

export interface NecesidadDetalle extends NecesidadReal {
  readonly referencias_entrega: string;
  readonly lineas: readonly LineaNecesidadReal[];
}

export interface InstitucionReal {
  readonly id_institucion: number;
  readonly nombre: string;
  readonly nombre_comercial?: string;
  readonly tipo: string;
  readonly tipo_institucion?: string;
  readonly tipo_codigo?: string;
  readonly descripcion: string | null;
  readonly distrito: string;
  readonly direccion: string | null;
  readonly estado_verificacion: string;
  readonly id_punto_acopio?: number | null;
  readonly necesidades_activas?: number;
}

export interface PuntoAcopioPublico {
  readonly punto_id: number;
  readonly nombre: string;
  readonly direccion: string | null;
  readonly referencias_entrega: string | null;
}

export interface HorarioPublico {
  readonly punto_id: number;
  readonly dia_semana: number;
  readonly hora_apertura: string;
  readonly hora_cierre: string;
}

export interface BienSolicitado {
  readonly producto_id: number;
  readonly producto: string;
  readonly categoria: string;
  readonly unidad_id: number;
  readonly unidad_codigo: string;
  readonly simbolo: string;
}

export interface InstitucionDetalle extends InstitucionReal {
  readonly slug: string;
  readonly telefono_publico: string | null;
  readonly email_publico: string | null;
  readonly fecha_verificacion: string | null;
  readonly tiene_foto: boolean;
  readonly puntos_acopio: readonly PuntoAcopioPublico[];
  readonly horarios: readonly HorarioPublico[];
  readonly necesidades: readonly NecesidadReal[];
  readonly bienes_solicitados: readonly BienSolicitado[];
}

export interface TipoInstitucionReal {
  readonly tipo_id: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly total_verificadas: number;
}

export interface FiltrosNecesidades {
  readonly categoriaId?: number;
  readonly distritoId?: number;
  readonly institucionId?: number;
  readonly prioridad?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface FiltrosInstituciones {
  readonly tipoCodigo?: string;
  readonly distritoId?: number;
  readonly q?: string;
}

@Injectable({ providedIn: 'root' })
export class ExploracionApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  listarNecesidades(filtros: FiltrosNecesidades = {}): Observable<readonly NecesidadReal[]> {
    if (!this.estado.disponible('necesidades')) {
      return this.estado.pendiente<readonly NecesidadReal[]>('necesidades');
    }
    let parametros = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        parametros = parametros.set(clave, String(valor));
      }
    }
    return this.injector.get(HttpClient).get<readonly NecesidadReal[]>('/api/v1/necesidades', {
      params: parametros,
    });
  }

  obtenerNecesidad(id: number): Observable<NecesidadDetalle> {
    if (!this.estado.disponible('necesidades')) {
      return this.estado.pendiente<NecesidadDetalle>('necesidades');
    }
    return this.injector
      .get(HttpClient)
      .get<NecesidadDetalle>(`/api/v1/necesidades/${id}`);
  }

  listarTiposInstitucion(): Observable<readonly TipoInstitucionReal[]> {
    if (!this.estado.disponible('instituciones')) {
      return this.estado.pendiente<readonly TipoInstitucionReal[]>('instituciones');
    }
    return this.injector
      .get(HttpClient)
      .get<readonly TipoInstitucionReal[]>('/api/v1/instituciones/tipos');
  }

  listarInstituciones(
    filtros: FiltrosInstituciones = {},
  ): Observable<readonly InstitucionReal[]> {
    if (!this.estado.disponible('instituciones')) {
      return this.estado.pendiente<readonly InstitucionReal[]>('instituciones');
    }
    let parametros = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        parametros = parametros.set(clave, String(valor));
      }
    }
    return this.injector
      .get(HttpClient)
      .get<readonly InstitucionReal[]>('/api/v1/instituciones', { params: parametros });
  }

  obtenerInstitucion(id: number): Observable<InstitucionDetalle> {
    if (!this.estado.disponible('instituciones')) {
      return this.estado.pendiente<InstitucionDetalle>('instituciones');
    }
    return this.injector
      .get(HttpClient)
      .get<InstitucionDetalle>(`/api/v1/instituciones/${id}`);
  }
}
