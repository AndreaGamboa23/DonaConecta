import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { EstadoServicio } from '../interfaces/dona-conecta';

/** Error controlado: la interfaz existe, pero la operación todavía no está integrada. */
export class ServicioPendienteError extends Error {
  readonly codigo = 'SERVICIO_PENDIENTE';

  constructor(
    readonly operacion: string,
    readonly endpoint: string,
  ) {
    super(`La operación ${operacion} estará disponible al integrar ${endpoint}.`);
    this.name = 'ServicioPendienteError';
  }
}

const OPERACIONES = {
  registroDonante: '/api/v1/auth/registro',
  registroRepresentante: '/api/v1/auth/registro',
  login: '/api/v1/auth/login',
  recuperacion: '/api/v1/auth/recuperar-clave',
  conversaciones: '/api/v1/conversaciones',
  mensajes: '/api/v1/conversaciones/{id}/mensajes',
  donaciones: '/api/v1/compromisos/mis-compromisos',
  compromisos: '/api/v1/compromisos',
  seguimiento: '/api/v1/seguimientos/{id}',
  necesidades: '/api/v1/necesidades',
  instituciones: '/api/v1/instituciones',
  puntosAcopio: '/api/v1/puntos-de-acopio',
  perfil: '/api/v1/usuarios/me',
  perfilActividad: '/api/v1/usuarios/me/actividad',
  perfilActualizar: '/api/v1/usuarios/me',
  perfilCambiarContrasena: '/api/v1/usuarios/me/contrasena',
  perfilCambiarCorreo: '/api/v1/usuarios/me/correo',
  perfilBaja: '/api/v1/usuarios/me',
  cerrarSesionServidor: '/api/v1/auth/sesion',
  categorias: '/api/v1/categorias',
  unidadesMedida: '/api/v1/unidades-medida',
  productos: '/api/v1/productos',
  adminResumen: '/api/v1/admin/resumen',
  adminInstituciones: '/api/v1/admin/instituciones',
  verificarInstitucion: '/api/v1/admin/instituciones/{id}/verificar',
  adminUsuarios: '/api/v1/admin/usuarios',
  cambiarEstadoUsuario: '/api/v1/admin/usuarios/{id}/estado',
  adminAuditoria: '/api/v1/admin/auditoria',
  institucionalResumen: '/api/v1/institucional/resumen',
  institucionalPerfil: '/api/v1/institucional/perfil',
  institucionalNecesidades: '/api/v1/institucional/necesidades',
  crearNecesidad: '/api/v1/institucional/necesidades',
  actualizarNecesidad: '/api/v1/institucional/necesidades/{id}',
  eliminarNecesidad: '/api/v1/institucional/necesidades/{id}',
} as const;

export type OperacionBackend = keyof typeof OPERACIONES;

/** Operaciones con API REST real ya implementada en el backend integrado. */
const OPERACIONES_DISPONIBLES: ReadonlySet<OperacionBackend> = new Set<OperacionBackend>([
  'registroDonante',
  'registroRepresentante',
  'login',
  'perfil',
  'perfilActividad',
  'perfilActualizar',
  'perfilCambiarContrasena',
  'perfilCambiarCorreo',
  'perfilBaja',
  'cerrarSesionServidor',
  'donaciones',
  'compromisos',
  'necesidades',
  'instituciones',
  'categorias',
  'unidadesMedida',
  'productos',
  'adminResumen',
  'adminInstituciones',
  'verificarInstitucion',
  'adminUsuarios',
  'cambiarEstadoUsuario',
  'adminAuditoria',
  'institucionalResumen',
  'institucionalPerfil',
  'institucionalNecesidades',
  'crearNecesidad',
  'actualizarNecesidad',
  'eliminarNecesidad',
]);

/**
 * Único lugar que declara qué operaciones están integradas. Las operaciones
 * disponibles usan HttpClient real; el resto devuelve un error controlado y la
 * interfaz lo comunica sin fingir éxito.
 */
@Injectable({ providedIn: 'root' })
export class BackendEstadoService {
  disponible(operacion: OperacionBackend): boolean {
    return OPERACIONES_DISPONIBLES.has(operacion);
  }

  estado(operacion: OperacionBackend): EstadoServicio {
    const endpoint = OPERACIONES[operacion];
    const disponible = this.disponible(operacion);
    return {
      disponible,
      endpoint,
      mensaje: disponible
        ? 'Servicio disponible.'
        : 'Esta función estará disponible cuando el servicio oficial esté conectado.',
    };
  }

  pendiente<T>(operacion: OperacionBackend): Observable<T> {
    const estado = this.estado(operacion);
    return throwError(() => new ServicioPendienteError(operacion, estado.endpoint));
  }
}
