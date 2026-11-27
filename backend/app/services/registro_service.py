"""Registro diferenciado con una sola transacción y el modelo físico real."""

import pyodbc

from app.core.cifrado import cifrar_telefono, clave_configurada
from app.core.errores import ErrorNegocio, error_catalogo, error_duplicado, traducir_error_sql
from app.core.security import HASH_VERSION_ARGON2ID, hashear_password
from app.database.connection import get_connection
from app.repositories import instituciones_repo, usuarios_repo
from app.schemas.auth_schema import RegistroRequest

# No hay flujo de verificación de correo implementado en esta fase. La cuenta se
# crea ACTIVA para que el inicio de sesión del frontend funcione; la institución
# del representante queda PENDIENTE hasta la verificación administrativa.
ESTADO_CUENTA_REGISTRO = "ACTIVO"


def registrar(datos: RegistroRequest) -> dict:
    email = str(datos.email).strip().lower()
    if usuarios_repo.buscar_usuario_por_correo(email):
        raise error_duplicado()

    # Si hay clave de cifrado configurada, el teléfono se persiste cifrado.
    # Sin clave, el campo se omite; nunca se guarda en texto plano.
    telefono_cifrado = telefono_nonce = telefono_clave_version = None
    if datos.telefono and datos.telefono.strip():
        if not clave_configurada():
            raise ErrorNegocio(
                503,
                "CIFRADO_NO_CONFIGURADO",
                "No se puede guardar el celular: falta la clave de cifrado del entorno.",
            )
        telefono_cifrado, telefono_nonce, telefono_clave_version = cifrar_telefono(datos.telefono)

    password_hash = hashear_password(datos.password)

    try:
        with get_connection(escritura=True) as conn:
            cursor = conn.cursor()
            rol_id = usuarios_repo.obtener_rol_id(cursor, datos.rol)
            if rol_id is None:
                raise error_catalogo("El rol solicitado no está disponible.")

            usuario = usuarios_repo.crear_usuario_en_cursor(
                cursor,
                nombres=datos.nombres.strip(),
                apellidos=datos.apellidos.strip(),
                email=email,
                password_hash=password_hash,
                hash_version=HASH_VERSION_ARGON2ID,
                estado_cuenta=ESTADO_CUENTA_REGISTRO,
                rol_id=rol_id,
                codigo_rol=datos.rol,
                telefono_cifrado=telefono_cifrado,
                telefono_nonce=telefono_nonce,
                telefono_clave_version=telefono_clave_version,
            )
            usuario_id = usuario["id_usuario"]

            institucion_id = None
            if datos.rol == "DONANTE":
                if datos.consentimiento_datos is not True or datos.acepta_terminos is not True:
                    raise ErrorNegocio(
                        422,
                        "CONSENTIMIENTOS_REQUERIDOS",
                        "Debe aceptar el tratamiento de datos y los términos del servicio.",
                    )
                if datos.distrito_id is None or not usuarios_repo.distrito_existe(
                    cursor, datos.distrito_id
                ):
                    raise error_catalogo("Debe indicar un distrito válido de Huancayo.")
                usuarios_repo.crear_donante_en_cursor(
                    cursor,
                    usuario_id=usuario_id,
                    distrito_id=datos.distrito_id,
                    preferencia_notificacion=datos.preferencia_notificacion,
                )
            elif datos.institucion is not None:
                institucion = instituciones_repo.crear_institucion_en_cursor(
                    cursor, usuario_id, datos.institucion.model_dump()
                )
                institucion_id = institucion["id_institucion"]
    except pyodbc.Error as error:
        texto = " ".join(str(arg) for arg in getattr(error, "args", ()))
        es_unico = "2627" in texto or "2601" in texto
        # Solo UQ_usuarios_email significa "correo ya registrado". Otras
        # restricciones UNIQUE (por ejemplo UQ_instituciones_foto) son fallos
        # de configuración y no deben atribuirse al dato enviado por la persona.
        if es_unico and "UQ_usuarios_email" in texto:
            raise error_duplicado()
        raise traducir_error_sql(error)

    return {
        "mensaje": "Registro completado correctamente.",
        "usuario": {
            "id_usuario": usuario_id,
            "nombres": datos.nombres.strip(),
            "apellidos": datos.apellidos.strip(),
            "correo": email,
            "roles": [datos.rol],
        },
        "usuarioId": usuario_id,
        "estadoCuenta": ESTADO_CUENTA_REGISTRO,
        "roles": [{"codigo": datos.rol, "estado": "ACTIVO"}],
        "institucionSolicitudId": institucion_id,
    }
