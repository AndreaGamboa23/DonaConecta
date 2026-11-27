"""Panel administrativo: resumen, verificación de instituciones y auditoría."""

from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query

from app.core.security import requerir_roles
from app.schemas.paneles_schema import (
    AdminAuditoriaResponse,
    AdminInstitucionResponse,
    AdminResumenResponse,
    AdminUsuariosResponse,
    CambiarEstadoUsuarioRequest,
    CambiarEstadoUsuarioResponse,
)
from app.services import paneles_service

router = APIRouter(prefix="/api/v1/admin", tags=["Panel administrativo"])

_ERRORES = {
    401: {"description": "Token ausente, expirado, revocado o cuenta inactiva."},
    403: {"description": "Se requiere el rol ADMINISTRADOR."},
    404: {"description": "Recurso no encontrado."},
    409: {"description": "Conflicto con el estado real de los datos."},
    422: {"description": "Parámetros o cuerpo inválidos."},
}

_ADMIN = Depends(requerir_roles("ADMINISTRADOR"))


@router.get(
    "/resumen",
    response_model=AdminResumenResponse,
    summary="Indicadores reales del panel administrativo",
    description="Cuentas calculadas desde vistas y tablas de SQL Server; sin valores estimados.",
    responses=_ERRORES,
)
def obtener_resumen_admin(_usuario: dict = _ADMIN):
    return paneles_service.resumen_admin()


@router.get(
    "/instituciones",
    response_model=list[AdminInstitucionResponse],
    summary="Listar todas las instituciones para su revisión",
    description="Incluye instituciones en todos los estados de verificación, no sólo pendientes.",
    responses=_ERRORES,
)
def obtener_instituciones_admin(_usuario: dict = _ADMIN):
    return paneles_service.listar_instituciones_admin()


@router.get(
    "/usuarios",
    response_model=AdminUsuariosResponse,
    summary="Listar usuarios con paginación y filtros",
    description=(
        "Devuelve sólo campos públicos para el panel. Nunca expone contraseñas, "
        "tokens, teléfonos cifrados ni nonces."
    ),
    responses=_ERRORES,
)
def obtener_usuarios_admin(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: str = Query(default="", max_length=120),
    rol: Optional[Literal["DONANTE", "REPRESENTANTE", "ADMINISTRADOR"]] = Query(default=None),
    _usuario: dict = _ADMIN,
):
    return paneles_service.listar_usuarios_admin(limit, offset, q, rol)


@router.patch(
    "/usuarios/{id_usuario}/estado",
    response_model=CambiarEstadoUsuarioResponse,
    summary="Cambiar el estado de una cuenta de usuario",
    description=(
        "BLOQUEADO y BAJA revocan las sesiones activas y desactivan sus roles. "
        "Un administrador no puede modificarse a sí mismo desde este endpoint."
    ),
    responses=_ERRORES,
)
def modificar_estado_usuario(
    id_usuario: int,
    datos: CambiarEstadoUsuarioRequest,
    usuario: dict = _ADMIN,
):
    actualizado = paneles_service.cambiar_estado_usuario(
        id_admin=usuario["id_usuario"],
        id_usuario=id_usuario,
        estado=datos.estado,
        motivo=datos.motivo,
    )
    return {"mensaje": "Estado de la cuenta actualizado", "usuario": actualizado}


@router.get(
    "/auditoria",
    response_model=AdminAuditoriaResponse,
    summary="Consultar la auditoría con paginación y filtros",
    description="Lee dbo.auditoria_eventos; filtra por módulo y resultado sin exponer datos sensibles.",
    responses=_ERRORES,
)
def obtener_auditoria_admin(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    modulo: Optional[str] = Query(default=None, max_length=40),
    resultado: Optional[Literal["OK", "DENEGADO", "ERROR"]] = Query(default=None),
    _usuario: dict = _ADMIN,
):
    return paneles_service.listar_auditoria_admin(limit, offset, modulo, resultado)
