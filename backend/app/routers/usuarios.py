"""CRUD del perfil propio y operaciones sensibles de credenciales."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import obtener_usuario_actual
from app.schemas.usuarios_schema import (
    ActividadResponse,
    BajaCuentaRequest,
    CambiarContrasenaRequest,
    CambiarCorreoRequest,
    PerfilActualizarRequest,
    PerfilParcialRequest,
    PerfilResponse,
)
from app.services import perfil_service

router = APIRouter(prefix="/api/v1/usuarios", tags=["Mi perfil"])

_ERRORES = {
    401: {"description": "Token ausente, expirado, revocado o cuenta inactiva."},
    403: {"description": "Rol sin permiso para la operación."},
    404: {"description": "Perfil no encontrado."},
    409: {"description": "Conflicto con el estado real de los datos."},
    422: {"description": "Cuerpo inválido o campo no permitido."},
}


@router.get(
    "/me",
    response_model=PerfilResponse,
    responses=_ERRORES,
    summary="Consultar el perfil completo del usuario autenticado",
)
def obtener_mi_perfil(usuario: dict = Depends(obtener_usuario_actual)):
    return perfil_service.consultar_perfil(usuario["id_usuario"])


@router.get(
    "/me/actividad",
    response_model=ActividadResponse,
    responses=_ERRORES,
    summary="Contar actividad real del usuario desde SQL Server",
)
def obtener_mi_actividad(usuario: dict = Depends(obtener_usuario_actual)):
    return perfil_service.actividad(usuario["id_usuario"])


@router.get(
    "/{usuario_id}/perfil",
    response_model=PerfilResponse,
    responses=_ERRORES,
    summary="Consultar un perfil por identificador (sólo el propio)",
)
def obtener_perfil_por_id(usuario_id: int, usuario: dict = Depends(obtener_usuario_actual)):
    # No se distingue "ajeno" de "inexistente": evita enumeration de cuentas.
    if usuario_id != usuario["id_usuario"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")
    return perfil_service.consultar_perfil(usuario_id)


@router.put(
    "/me",
    response_model=PerfilResponse,
    responses=_ERRORES,
    summary="Actualizar completamente la representación editable del perfil",
)
def reemplazar_mi_perfil(
    datos: PerfilActualizarRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return perfil_service.actualizar_perfil(
        usuario["id_usuario"], datos, es_put=True
    )


@router.patch(
    "/me",
    response_model=PerfilResponse,
    responses=_ERRORES,
    summary="Actualizar parcialmente el perfil",
)
def modificar_mi_perfil(
    datos: PerfilParcialRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return perfil_service.actualizar_perfil(
        usuario["id_usuario"], datos, es_put=False
    )


@router.patch(
    "/me/contrasena",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=_ERRORES,
    summary="Cambiar contraseña con reautenticación y revocar sesiones",
)
def cambiar_mi_contrasena(
    datos: CambiarContrasenaRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    perfil_service.cambiar_contrasena(usuario["id_usuario"], datos)


@router.patch(
    "/me/correo",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=_ERRORES,
    summary="Cambiar correo con reautenticación (sin envío de correo)",
)
def cambiar_mi_correo(
    datos: CambiarCorreoRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    perfil_service.cambiar_correo(usuario["id_usuario"], datos)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=_ERRORES,
    summary="Dar de baja la cuenta (eliminación lógica, no física)",
)
def bajar_mi_cuenta(
    datos: BajaCuentaRequest,
    usuario: dict = Depends(obtener_usuario_actual),
):
    perfil_service.baja_cuenta(usuario["id_usuario"], datos)
