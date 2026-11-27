import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendEstadoService } from './backend-estado.service';

/** Contratos de lectura y escritura de los paneles y del catálogo real. */

export type EstadoVerificacion =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'VERIFICADA'
  | 'RECHAZADA'
  | 'SUSPENDIDA';
export type EstadoCuenta = 'ACTIVO' | 'BLOQUEADO' | 'BAJA';
export type EstadoNecesidad =
  | 'BORRADOR'
  | 'PUBLICADA'
  | 'PAUSADA'
  | 'COMPLETADA'
  | 'VENCIDA'
  | 'CANCELADA';
export type PrioridadNecesidad = 'ALTA' | 'MEDIA' | 'BAJA';

export interface UnidadProducto {
  readonly unidad_id: number;
  readonly id_unidad?: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly simbolo: string;
  readonly es_preferida: boolean;
}

export interface ProductoCatalogo {
  readonly producto_id: number;
  readonly id_producto?: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly activo: boolean;
  readonly categoria_id: number;
  readonly id_categoria?: number;
  readonly categoria: string;
  readonly unidades: readonly UnidadProducto[];
}

export interface CategoriaCatalogo {
  readonly categoria_id?: number;
  readonly id_categoria?: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly orden?: number;
}

export interface UnidadMedidaCatalogo {
  readonly unidad_id?: number;
  readonly id_unidad?: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly simbolo: string;
  readonly permite_fracciones?: boolean;
  readonly decimales?: number;
}

export interface ResumenAdmin {
  readonly instituciones_pendientes: number;
  readonly usuarios_activos: number;
  readonly incidencias_abiertas: number;
  readonly instituciones_verificadas: number;
  readonly necesidades_publicadas: number;
  readonly compromisos_activos: number;
  readonly productos_activos: number;
  readonly ultima_verificacion: string | null;
}

export interface InstitucionAdmin {
  readonly id_institucion: number;
  readonly nombre: string;
  readonly tipo: string;
  readonly distrito: string;
  readonly descripcion: string | null;
  readonly direccion: string | null;
  readonly estado_verificacion: string;
  readonly representante: string | null;
  readonly correo_representante: string | null;
  readonly fecha_registro: string | null;
}

export interface VerificarInstitucionPayload {
  readonly estado_verificacion: EstadoVerificacion;
  /** Obligatorio sólo al rechazar o suspender, según las reglas del backend. */
  readonly motivo?: string;
}

export interface InstitucionVerificada {
  readonly id_institucion: number;
  readonly nombre: string;
  readonly estado_verificacion: string;
}

export interface VerificarInstitucionResponse {
  readonly mensaje: string;
  readonly institucion: InstitucionVerificada;
}

export interface UsuarioAdmin {
  readonly id_usuario: number;
  readonly nombres: string;
  readonly apellidos: string;
  readonly correo: string;
  readonly estado_cuenta: string;
  readonly roles: readonly string[];
  readonly fecha_registro?: string | null;
  readonly ultimo_acceso_en?: string | null;
}

export interface CambiarEstadoUsuarioPayload {
  readonly estado: EstadoCuenta;
  readonly motivo: string;
}

export interface CambiarEstadoUsuarioResponse {
  readonly mensaje: string;
  readonly usuario: UsuarioAdmin;
}

export interface Pagina<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface FiltrosUsuarios {
  readonly limit?: number;
  readonly offset?: number;
  readonly q?: string;
  readonly rol?: string;
}

export interface RegistroAuditoria {
  readonly evento_id: number;
  readonly usuario_id?: number | null;
  readonly tipo_evento: string;
  readonly modulo: string;
  readonly recurso_tipo: string;
  readonly recurso_id?: string | null;
  readonly origen: string;
  readonly resultado: string;
  readonly descripcion: string;
  readonly creado_en?: string | null;
}

export interface FiltrosAuditoria {
  readonly limit?: number;
  readonly offset?: number;
  readonly modulo?: string;
  readonly resultado?: string;
}

export interface ResumenInstitucional {
  readonly institucion_id: number;
  readonly nombre: string;
  readonly estado_verificacion: string;
  readonly necesidades_publicadas: number;
  readonly compromisos_recibidos: number;
  readonly recepciones_confirmadas: number;
}

export interface PerfilInstitucional {
  readonly id_institucion: number;
  readonly nombre: string;
  readonly tipo: string;
  readonly distrito: string;
  readonly descripcion: string | null;
  readonly direccion: string | null;
  readonly telefono_publico: string | null;
  readonly email_publico: string | null;
  readonly estado_verificacion: string;
  readonly fecha_registro: string | null;
}

/** Sólo campos públicos editables, según el esquema del backend. */
export interface ParchePerfilInstitucional {
  readonly direccion?: string | null;
  readonly descripcion?: string | null;
  readonly telefono_publico?: string | null;
  readonly email_publico?: string | null;
}

export interface LineaNecesidad {
  readonly producto_id: number;
  readonly unidad_id: number;
  readonly cantidad: number;
}

export interface CrearNecesidadPayload {
  readonly titulo: string;
  readonly descripcion: string;
  readonly prioridad: PrioridadNecesidad;
  readonly fecha_limite?: string | null;
  readonly id_categoria?: number | null;
  readonly lineas: readonly LineaNecesidad[];
}

export interface ParcheNecesidad {
  readonly estado?: EstadoNecesidad;
  readonly titulo?: string;
  readonly descripcion?: string;
  readonly prioridad?: PrioridadNecesidad;
  readonly fecha_limite?: string | null;
  readonly motivo?: string;
}

export interface LineaNecesidadDetalle {
  readonly producto_id: number;
  readonly producto: string;
  readonly unidad_id: number;
  readonly unidad: string;
  readonly cantidad_requerida: number;
}

export interface NecesidadInstitucional {
  readonly id_necesidad: number;
  readonly titulo: string;
  readonly descripcion: string;
  readonly prioridad: string;
  readonly estado: string;
  readonly fecha_publicacion?: string | null;
  readonly fecha_limite?: string | null;
  readonly cantidad_requerida: number;
  readonly cantidad_comprometida: number;
  readonly cantidad_recibida: number;
  readonly unidad_medida_base: string;
  readonly lineas: readonly LineaNecesidadDetalle[];
}

export interface NecesidadMutacionResponse {
  readonly mensaje: string;
  readonly necesidad: NecesidadInstitucional;
}

/**
 * Único cliente HTTP de los paneles. Cada método comprueba el registro central
 * de operaciones disponibles antes de usar HttpClient; nunca simula respuestas.
 */
@Injectable({ providedIn: 'root' })
export class PanelApiService {
  private readonly injector = inject(Injector);
  private readonly estado = inject(BackendEstadoService);

  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  listarProductos(categoriaId?: number | null): Observable<readonly ProductoCatalogo[]> {
    if (!this.estado.disponible('productos')) {
      return this.estado.pendiente<readonly ProductoCatalogo[]>('productos');
    }
    let parametros = new HttpParams();
    if (categoriaId && categoriaId > 0) parametros = parametros.set('categoriaId', categoriaId);
    return this.http.get<readonly ProductoCatalogo[]>('/api/v1/productos', {
      params: parametros,
    });
  }

  listarCategorias(): Observable<readonly CategoriaCatalogo[]> {
    if (!this.estado.disponible('categorias')) {
      return this.estado.pendiente<readonly CategoriaCatalogo[]>('categorias');
    }
    return this.http.get<readonly CategoriaCatalogo[]>('/api/v1/categorias');
  }

  listarUnidades(): Observable<readonly UnidadMedidaCatalogo[]> {
    if (!this.estado.disponible('unidadesMedida')) {
      return this.estado.pendiente<readonly UnidadMedidaCatalogo[]>('unidadesMedida');
    }
    return this.http.get<readonly UnidadMedidaCatalogo[]>('/api/v1/unidades-medida');
  }

  resumenAdmin(): Observable<ResumenAdmin> {
    if (!this.estado.disponible('adminResumen')) {
      return this.estado.pendiente<ResumenAdmin>('adminResumen');
    }
    return this.http.get<ResumenAdmin>('/api/v1/admin/resumen');
  }

  listarInstitucionesAdmin(): Observable<readonly InstitucionAdmin[]> {
    if (!this.estado.disponible('adminInstituciones')) {
      return this.estado.pendiente<readonly InstitucionAdmin[]>('adminInstituciones');
    }
    return this.http.get<readonly InstitucionAdmin[]>('/api/v1/admin/instituciones');
  }

  verificarInstitucion(
    id: number,
    payload: VerificarInstitucionPayload,
  ): Observable<VerificarInstitucionResponse> {
    if (!this.estado.disponible('verificarInstitucion')) {
      return this.estado.pendiente<VerificarInstitucionResponse>('verificarInstitucion');
    }
    return this.http.patch<VerificarInstitucionResponse>(
      `/api/v1/instituciones/admin/instituciones/${encodeURIComponent(String(id))}/verificar`,
      payload,
    );
  }

  listarUsuarios(filtros: FiltrosUsuarios = {}): Observable<Pagina<UsuarioAdmin>> {
    if (!this.estado.disponible('adminUsuarios')) {
      return this.estado.pendiente<Pagina<UsuarioAdmin>>('adminUsuarios');
    }
    let parametros = new HttpParams()
      .set('limit', filtros.limit ?? 10)
      .set('offset', filtros.offset ?? 0);
    if (filtros.q?.trim()) parametros = parametros.set('q', filtros.q.trim());
    if (filtros.rol) parametros = parametros.set('rol', filtros.rol);
    return this.http.get<Pagina<UsuarioAdmin>>('/api/v1/admin/usuarios', { params: parametros });
  }

  cambiarEstadoUsuario(
    id: number,
    payload: CambiarEstadoUsuarioPayload,
  ): Observable<CambiarEstadoUsuarioResponse> {
    if (!this.estado.disponible('cambiarEstadoUsuario')) {
      return this.estado.pendiente<CambiarEstadoUsuarioResponse>('cambiarEstadoUsuario');
    }
    return this.http.patch<CambiarEstadoUsuarioResponse>(
      `/api/v1/admin/usuarios/${encodeURIComponent(String(id))}/estado`,
      payload,
    );
  }

  listarAuditoria(filtros: FiltrosAuditoria = {}): Observable<Pagina<RegistroAuditoria>> {
    if (!this.estado.disponible('adminAuditoria')) {
      return this.estado.pendiente<Pagina<RegistroAuditoria>>('adminAuditoria');
    }
    let parametros = new HttpParams()
      .set('limit', filtros.limit ?? 10)
      .set('offset', filtros.offset ?? 0);
    if (filtros.modulo) parametros = parametros.set('modulo', filtros.modulo);
    if (filtros.resultado) parametros = parametros.set('resultado', filtros.resultado);
    return this.http.get<Pagina<RegistroAuditoria>>('/api/v1/admin/auditoria', {
      params: parametros,
    });
  }

  resumenInstitucional(): Observable<ResumenInstitucional> {
    if (!this.estado.disponible('institucionalResumen')) {
      return this.estado.pendiente<ResumenInstitucional>('institucionalResumen');
    }
    return this.http.get<ResumenInstitucional>('/api/v1/institucional/resumen');
  }

  obtenerPerfilInstitucional(): Observable<PerfilInstitucional> {
    if (!this.estado.disponible('institucionalPerfil')) {
      return this.estado.pendiente<PerfilInstitucional>('institucionalPerfil');
    }
    return this.http.get<PerfilInstitucional>('/api/v1/institucional/perfil');
  }

  actualizarPerfilInstitucional(
    datos: ParchePerfilInstitucional,
  ): Observable<PerfilInstitucional> {
    if (!this.estado.disponible('institucionalPerfil')) {
      return this.estado.pendiente<PerfilInstitucional>('institucionalPerfil');
    }
    return this.http.patch<PerfilInstitucional>('/api/v1/institucional/perfil', datos);
  }

  listarNecesidadesInstitucionales(): Observable<readonly NecesidadInstitucional[]> {
    if (!this.estado.disponible('institucionalNecesidades')) {
      return this.estado.pendiente<readonly NecesidadInstitucional[]>('institucionalNecesidades');
    }
    return this.http.get<readonly NecesidadInstitucional[]>('/api/v1/institucional/necesidades');
  }

  crearNecesidad(datos: CrearNecesidadPayload): Observable<NecesidadMutacionResponse> {
    if (!this.estado.disponible('crearNecesidad')) {
      return this.estado.pendiente<NecesidadMutacionResponse>('crearNecesidad');
    }
    return this.http.post<NecesidadMutacionResponse>('/api/v1/institucional/necesidades', datos);
  }

  actualizarNecesidad(
    id: number,
    datos: ParcheNecesidad,
  ): Observable<NecesidadMutacionResponse> {
    if (!this.estado.disponible('actualizarNecesidad')) {
      return this.estado.pendiente<NecesidadMutacionResponse>('actualizarNecesidad');
    }
    return this.http.patch<NecesidadMutacionResponse>(
      `/api/v1/institucional/necesidades/${encodeURIComponent(String(id))}`,
      datos,
    );
  }

  eliminarNecesidad(id: number): Observable<void> {
    if (!this.estado.disponible('eliminarNecesidad')) {
      return this.estado.pendiente<void>('eliminarNecesidad');
    }
    return this.http.delete<void>(
      `/api/v1/institucional/necesidades/${encodeURIComponent(String(id))}`,
    );
  }
}
