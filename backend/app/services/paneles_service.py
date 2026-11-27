"""Reglas de aplicación de los paneles, sin lógica de presentación.

Los repositorios siguen siendo dueños de sus transacciones; aquí se coordinan
las operaciones que combinan varias consultas y se traducen errores de PyODBC a
errores públicos homogéneos.
"""

from __future__ import annotations

from typing import Any, Mapping, Optional

import pyodbc

from app.core.errores import ErrorNegocio, traducir_error_sql
from app.repositories import paneles_repo
from app.repositories.instituciones_repo import actualizar_verificacion_institucion
from app.schemas.donaciones_schema import CrearNecesidadRequest
from app.services import donaciones_service
from app.schemas.paneles_schema import (
    ActualizarNecesidadRequest,
    CrearNecesidadInstitucionalRequest,
)


def _ejecutar(func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except pyodbc.Error as error:
        raise traducir_error_sql(error)


# ---------------------------------------------------------------- Catálogo y administración


def listar_productos(categoria_id: Optional[int]) -> list[dict]:
    return _ejecutar(paneles_repo.listar_productos, categoria_id)


def resumen_admin() -> dict:
    return _ejecutar(paneles_repo.resumen_admin)


def listar_instituciones_admin() -> list[dict]:
    return _ejecutar(paneles_repo.listar_instituciones_admin)


def verificar_institucion(
    id_institucion: int, estado_verificacion: str, id_admin: int, motivo: Optional[str]
) -> dict:
    return _ejecutar(
        actualizar_verificacion_institucion,
        id_institucion=id_institucion,
        estado_verificacion=estado_verificacion,
        id_admin=id_admin,
        motivo=motivo,
    )


def listar_usuarios_admin(
    limit: int, offset: int, q: str, rol: Optional[str]
) -> dict:
    return _ejecutar(paneles_repo.listar_usuarios_admin, limit, offset, q, rol)


def cambiar_estado_usuario(
    id_admin: int, id_usuario: int, estado: str, motivo: Optional[str]
) -> dict:
    if id_admin == id_usuario:
        raise ErrorNegocio(
            403,
            "OPERACION_NO_PERMITIDA",
            "No puede modificar el estado de su propia cuenta desde el panel.",
        )
    return _ejecutar(
        paneles_repo.cambiar_estado_usuario_admin, id_usuario, estado, motivo, id_admin
    )


def listar_auditoria_admin(
    limit: int, offset: int, modulo: Optional[str], resultado: Optional[str]
) -> dict:
    return _ejecutar(paneles_repo.listar_auditoria_admin, limit, offset, modulo, resultado)


# ---------------------------------------------------------------- Panel institucional


def resumen_institucional(usuario_id: int) -> dict:
    return _ejecutar(paneles_repo.resumen_institucional, usuario_id)


def perfil_institucional(usuario_id: int) -> dict:
    return _ejecutar(paneles_repo.perfil_institucional, usuario_id)


def actualizar_perfil_institucional(
    usuario_id: int, cambios: Mapping[str, Any]
) -> dict:
    permitidos = set(paneles_repo.CAMPOS_PERFIL_PERMITIDOS)
    datos = {clave: valor for clave, valor in cambios.items() if clave in permitidos}
    return _ejecutar(paneles_repo.actualizar_perfil_institucional, usuario_id, datos)


def listar_necesidades_institucionales(usuario_id: int) -> list[dict]:
    return _ejecutar(paneles_repo.listar_necesidades_institucionales, usuario_id)


def publicar_necesidad_institucional(
    usuario_id: int, datos: CrearNecesidadInstitucionalRequest
) -> dict:
    # La institución se resuelve en servidor; el cliente nunca la elige.
    id_institucion = _ejecutar(
        paneles_repo.institucion_autorizada, usuario_id, permitir_pendiente=True
    )
    payload = datos.model_dump()
    payload["id_institucion"] = id_institucion
    solicitud = CrearNecesidadRequest.model_validate(payload)
    creada = _ejecutar(donaciones_service.publicar_necesidad, usuario_id, solicitud)
    necesidad = _ejecutar(
        paneles_repo.obtener_necesidad_institucional, usuario_id, creada["id_necesidad"]
    )
    mensaje = (
        "Borrador guardado correctamente"
        if creada.get("estado") == "BORRADOR"
        else "Necesidad publicada correctamente"
    )
    return {"mensaje": mensaje, "necesidad": necesidad}


def actualizar_necesidad_institucional(
    usuario_id: int, necesidad_id: int, datos: ActualizarNecesidadRequest
) -> dict:
    cambios = datos.model_dump(exclude_unset=True)
    _ejecutar(paneles_repo.actualizar_necesidad_institucional, usuario_id, necesidad_id, cambios)
    necesidad = _ejecutar(
        paneles_repo.obtener_necesidad_institucional, usuario_id, necesidad_id
    )
    return {"mensaje": "Necesidad actualizada correctamente", "necesidad": necesidad}


def eliminar_necesidad_institucional(usuario_id: int, necesidad_id: int) -> bool:
    return _ejecutar(paneles_repo.eliminar_necesidad_institucional, usuario_id, necesidad_id)
