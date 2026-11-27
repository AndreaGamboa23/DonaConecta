"""Reglas de negocio del perfil propio: consulta, PUT, PATCH y credenciales.

Toda escritura usa transacción y consultas parametrizadas. El servicio decide
qué campos puede tocar la persona; las APIs sólo verifican autenticación.
"""

import pyodbc

from app.core.cifrado import cifrar_telefono, clave_configurada, descifrar_telefono, enmascarar_telefono
from app.core.errores import ErrorNegocio, traducir_error_sql
from app.core.security import HASH_VERSION_ARGON2ID, hashear_password, verificar_password
from app.database.connection import get_connection
from app.repositories import usuarios_repo
from app.schemas.usuarios_schema import PerfilActualizarRequest, PerfilParcialRequest

CAMPOS_PERMITIDOS = {
    "nombres",
    "apellidos",
    "telefono",
    "distrito_id",
    "preferencia_notificacion",
}


def _fallo(estado: int, codigo: str, mensaje: str) -> ErrorNegocio:
    return ErrorNegocio(estado, codigo, mensaje)


def consultar_perfil(usuario_id: int) -> dict:
    perfil = usuarios_repo.obtener_perfil_completo(usuario_id)
    if not perfil:
        raise _fallo(404, "USUARIO_NO_ENCONTRADO", "No se encontró el perfil solicitado.")

    cifrado, nonce, version = perfil.pop("_telefono", (None, None, None))
    telefono = descifrar_telefono(cifrado, nonce, version) if cifrado else None
    perfil["telefono_enmascarado"] = enmascarar_telefono(telefono)
    perfil["telefono_guardado"] = bool(telefono)
    return perfil


def actividad(usuario_id: int) -> dict:
    return usuarios_repo.contar_actividad(usuario_id)


def cerrar_sesion(usuario_id: int, token: str) -> None:
    usuarios_repo.revocar_token(token, usuario_id)


def _validar_campos(datos, es_donante: bool, es_put: bool) -> set[str]:
    presentes = set(datos.model_fields_set)
    desconocidos = presentes - CAMPOS_PERMITIDOS
    if desconocidos:
        raise _fallo(
            422,
            "CAMPO_NO_PERMITIDO",
            "El perfil general no admite roles, identificadores, estados ni credenciales.",
        )

    if not es_donante and ({"distrito_id", "preferencia_notificacion"} & presentes):
        raise _fallo(
            422,
            "CAMPO_NO_PERMITIDO",
            "El distrito y la preferencia pertenecen al perfil de donante.",
        )

    if es_donante and es_put:
        if "distrito_id" not in presentes or "preferencia_notificacion" not in presentes:
            raise _fallo(
                422,
                "REPRESENTACION_INCOMPLETA",
                "La actualización completa requiere nombres, apellidos, distrito y preferencia.",
            )
    return presentes


def _preparar_telefono(valor, presente: bool, valores_actuales: tuple):
    if not presente:
        return valores_actuales
    if valor is None or not str(valor).strip():
        return (None, None, None)
    if not clave_configurada():
        raise _fallo(
            503,
            "CIFRADO_NO_CONFIGURADO",
            "No se puede guardar el celular: falta la clave de cifrado del entorno.",
        )
    return cifrar_telefono(str(valor))


def actualizar_perfil(
    usuario_id: int, datos: PerfilActualizarRequest | PerfilParcialRequest, *, es_put: bool
) -> dict:
    usuario = usuarios_repo.buscar_usuario_por_id(usuario_id)
    if not usuario:
        raise _fallo(404, "USUARIO_NO_ENCONTRADO", "No se encontró el perfil solicitado.")

    es_donante = "DONANTE" in usuario["roles"]
    presentes = _validar_campos(datos, es_donante, es_put)
    actual = usuarios_repo.obtener_perfil_completo(usuario_id)
    if not actual:
        raise _fallo(404, "USUARIO_NO_ENCONTRADO", "No se encontró el perfil solicitado.")

    donante_actual = actual["donante"] or {}
    nombres = datos.nombres if "nombres" in presentes else actual["nombres"]
    apellidos = datos.apellidos if "apellidos" in presentes else actual["apellidos"]
    telefono = _preparar_telefono(
        getattr(datos, "telefono", None),
        "telefono" in presentes,
        actual["_telefono"],
    )

    if es_donante:
        if "distrito_id" in presentes and datos.distrito_id is None:
            raise _fallo(422, "DISTRITO_INVALIDO", "El distrito no puede estar vacío.")
        if "preferencia_notificacion" in presentes and datos.preferencia_notificacion is None:
            raise _fallo(422, "PREFERENCIA_INVALIDA", "La preferencia no puede estar vacía.")
        distrito_id = (
            datos.distrito_id if "distrito_id" in presentes else donante_actual.get("distrito_id")
        )
        preferencia = (
            datos.preferencia_notificacion
            if "preferencia_notificacion" in presentes
            else donante_actual.get("preferencia_notificacion")
        )
        if not donante_actual or distrito_id is None or preferencia is None:
            raise _fallo(422, "PERFIL_DONANTE_NO_DISPONIBLE", "El perfil de donante no está completo.")
    else:
        distrito_id = None
        preferencia = None

    try:
        with get_connection(escritura=True) as conn:
            cursor = conn.cursor()
            if es_donante and not usuarios_repo.distrito_existe(cursor, int(distrito_id)):
                raise _fallo(422, "CATALOGO_INVALIDO", "Debe indicar un distrito válido de Huancayo.")

            usuarios_repo.actualizar_usuario_en_cursor(
                cursor,
                usuario_id=usuario_id,
                nombres=str(nombres).strip(),
                apellidos=str(apellidos).strip(),
                telefono_cifrado=telefono[0],
                telefono_nonce=telefono[1],
                telefono_clave_version=telefono[2],
            )
            if es_donante:
                usuarios_repo.actualizar_donante_en_cursor(
                    cursor,
                    usuario_id=usuario_id,
                    distrito_id=int(distrito_id),
                    preferencia_notificacion=str(preferencia),
                )
            usuarios_repo.registrar_evento_en_cursor(
                cursor,
                usuario_id=usuario_id,
                tipo_evento="PERFIL_ACTUALIZADO",
                descripcion=f"Perfil actualizado mediante {'PUT' if es_put else 'PATCH'}.",
            )
    except pyodbc.Error as error:
        raise traducir_error_sql(error)

    return consultar_perfil(usuario_id)


def _verificar_credenciales(usuario_id: int, password: str) -> dict:
    basico = usuarios_repo.buscar_usuario_por_id(usuario_id)
    if not basico or not basico["activo"]:
        raise _fallo(401, "CUENTA_NO_ACTIVA", "La cuenta no está activa.")
    completo = usuarios_repo.buscar_usuario_por_correo(basico["correo"])
    if not completo or not verificar_password(password, completo["password_hash"]):
        raise _fallo(401, "CREDENCIALES_INVALIDAS", "La contraseña indicada no es correcta.")
    return completo


def cambiar_contrasena(usuario_id: int, datos) -> None:
    completo = _verificar_credenciales(usuario_id, datos.password_actual)
    nuevo_hash = hashear_password(datos.password_nueva)

    try:
        with get_connection(escritura=True) as conn:
            cursor = conn.cursor()
            usuarios_repo.actualizar_password_en_cursor(
                cursor,
                usuario_id=usuario_id,
                password_hash=nuevo_hash,
                hash_version=HASH_VERSION_ARGON2ID,
            )
            usuarios_repo.revocar_sesiones_en_cursor(cursor, usuario_id)
            usuarios_repo.registrar_evento_en_cursor(
                cursor,
                usuario_id=usuario_id,
                tipo_evento="CONTRASENA_CAMBIADA",
                descripcion="Contraseña actualizada; se revocaron las sesiones activas.",
            )
    except pyodbc.Error as error:
        raise traducir_error_sql(error)


def cambiar_correo(usuario_id: int, datos) -> None:
    completo = _verificar_credenciales(usuario_id, datos.password)
    correo = str(datos.nuevo_correo).strip().lower()
    if not usuarios_repo.verificar_correo_disponible(correo, usuario_id):
        raise _fallo(409, "REGISTRO_DUPLICADO", "El correo ya se encuentra registrado.")

    try:
        with get_connection(escritura=True) as conn:
            cursor = conn.cursor()
            usuarios_repo.actualizar_correo_en_cursor(
                cursor, usuario_id=usuario_id, correo=correo
            )
            usuarios_repo.revocar_sesiones_en_cursor(cursor, usuario_id)
            usuarios_repo.registrar_evento_en_cursor(
                cursor,
                usuario_id=usuario_id,
                tipo_evento="CORREO_CAMBIADO",
                descripcion="Correo actualizado; pendiente de verificación. Sin envío de correo.",
            )
    except pyodbc.Error as error:
        texto = " ".join(str(arg) for arg in getattr(error, "args", ()))
        if ("2627" in texto or "2601" in texto) and "UQ_usuarios_email" in texto:
            raise _fallo(409, "REGISTRO_DUPLICADO", "El correo ya se encuentra registrado.")
        raise traducir_error_sql(error)


def baja_cuenta(usuario_id: int, datos) -> None:
    _verificar_credenciales(usuario_id, datos.password)
    if usuarios_repo.tiene_compromisos_activos(usuario_id):
        raise _fallo(
            409,
            "BAJA_CON_COMPROMISOS_ACTIVOS",
            "Tienes compromisos activos. Cancélalos o espera a que finalicen antes de dar de baja la cuenta.",
        )

    try:
        with get_connection(escritura=True) as conn:
            cursor = conn.cursor()
            usuarios_repo.dar_baja_usuario_en_cursor(cursor, usuario_id)
            usuarios_repo.registrar_evento_en_cursor(
                cursor,
                usuario_id=usuario_id,
                tipo_evento="CUENTA_BAJA",
                descripcion="Baja lógica de cuenta; datos relacionados conservados.",
            )
    except pyodbc.Error as error:
        raise traducir_error_sql(error)
