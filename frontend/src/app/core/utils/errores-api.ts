/**
 * Traducción de errores HTTP a mensajes comprensibles para el usuario.
 *
 * El backend no devuelve trazas ni texto de SQL Server; este archivo tampoco
 * muestra los valores que Pydantic rechazó (podrían incluir una contraseña).
 */

export type CategoriaErrorApi =
  | 'servicio-no-disponible'
  | 'base-de-datos'
  | 'duplicado'
  | 'validacion'
  | 'autorizacion'
  | 'servidor'
  | 'pendiente'
  | 'desconocido';

export interface ErrorApiInterpretado {
  readonly categoria: CategoriaErrorApi;
  readonly mensaje: string;
}

const ETIQUETAS_CAMPO: Readonly<Record<string, string>> = {
  nombres: 'nombres',
  apellidos: 'apellidos',
  email: 'correo electrónico',
  correo: 'correo electrónico',
  password: 'contraseña',
  distritoId: 'distrito',
  distrito_id: 'distrito',
  tipoId: 'tipo de institución',
  tipo_id: 'tipo de institución',
  nombreInstitucion: 'nombre de la institución',
  nombre: 'nombre',
  cargoRepresentante: 'cargo del representante',
  consentimientoDatos: 'consentimiento de datos',
  aceptaTerminos: 'términos del servicio',
};

function textoDetalle(detalle: unknown): string {
  return typeof detalle === 'string' && detalle.trim() ? detalle.trim() : '';
}

function mensajeValidacion(detalle: unknown): string {
  if (!Array.isArray(detalle)) {
    return 'Los datos enviados no son válidos. Revisa los campos obligatorios.';
  }

  const campos = [
    ...new Set(
      detalle
        .map((item: { loc?: unknown }) => {
          const ubicacion = Array.isArray(item?.loc) ? item.loc : [];
          const ultimo = ubicacion[ubicacion.length - 1];
          return typeof ultimo === 'string' ? (ETIQUETAS_CAMPO[ultimo] ?? ultimo) : '';
        })
        .filter(Boolean),
    ),
  ];

  return campos.length
    ? `Revisa los campos marcados como inválidos: ${campos.join(', ')}.`
    : 'Los datos enviados no son válidos. Revisa los campos obligatorios.';
}

/** Interpreta un error de HttpClient o un error controlado del backend. */
export function interpretarErrorApi(error: unknown, accion: string): ErrorApiInterpretado {
  const respuesta = error as {
    readonly status?: number;
    readonly error?: { readonly detail?: unknown; readonly error?: { readonly codigo?: string } };
    readonly name?: string;
    readonly codigo?: string;
  };
  const estado = Number(respuesta?.status ?? 0);
  const detalle = textoDetalle(respuesta?.error?.detail);
  const codigoBackend = respuesta?.error?.error?.codigo ?? respuesta?.codigo;

  if (respuesta?.name === 'ServicioPendienteError' || codigoBackend === 'SERVICIO_PENDIENTE') {
    return {
      categoria: 'pendiente',
      mensaje: `${accion}: esta función todavía no está conectada al servicio oficial.`,
    };
  }

  if (estado === 0) {
    return {
      categoria: 'servicio-no-disponible',
      mensaje: `No se pudo conectar con el servicio para ${accion}. Comprueba que la API esté iniciada en el puerto 8000.`,
    };
  }

  if (estado === 503) {
    return {
      categoria: 'base-de-datos',
      mensaje: `${accion}: el servicio no pudo conectar con la base de datos. Inténtalo nuevamente en unos minutos.`,
    };
  }

  if (estado === 409 || codigoBackend === 'REGISTRO_DUPLICADO') {
    return {
      categoria: 'duplicado',
      mensaje: detalle || `${accion}: el correo ya se encuentra registrado.`,
    };
  }

  if (estado === 422) {
    return { categoria: 'validacion', mensaje: mensajeValidacion(respuesta?.error?.detail) };
  }

  if (estado === 401 || estado === 403) {
    return {
      categoria: 'autorizacion',
      mensaje: detalle || `${accion}: no tienes permiso para realizar esta operación.`,
    };
  }

  if (estado >= 500) {
    return {
      categoria: 'servidor',
      mensaje: `${accion}: error interno del servidor. Inténtalo de nuevo más tarde.`,
    };
  }

  return {
    categoria: 'desconocido',
    mensaje: detalle || `${accion}: no se pudo completar la operación. Inténtalo de nuevo.`,
  };
}

/** Mensaje listo para mostrar en el componente. */
export function mensajeErrorApi(error: unknown, accion: string): string {
  return interpretarErrorApi(error, accion).mensaje;
}
