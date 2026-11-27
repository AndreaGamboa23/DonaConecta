"""Reglas de negocio previas a la persistencia de necesidades y compromisos."""

import pyodbc

from app.core.errores import ErrorNegocio, traducir_error_sql
from app.repositories import donaciones_repo
from app.schemas.donaciones_schema import CrearCompromisoRequest, CrearNecesidadRequest


def publicar_necesidad(usuario_id: int, datos: CrearNecesidadRequest) -> dict:
    payload = datos.model_dump()
    lineas = payload.get("lineas") or []
    if not lineas:
        if None in (
            payload.get("id_producto"),
            payload.get("id_unidad"),
            payload.get("cantidad_requerida"),
        ):
            raise ErrorNegocio(
                422,
                "LINEAS_REQUERIDAS",
                "La necesidad debe indicar líneas reales de producto, unidad y cantidad.",
            )
        lineas = [
            {
                "producto_id": payload["id_producto"],
                "unidad_id": payload["id_unidad"],
                "cantidad": payload["cantidad_requerida"],
            }
        ]
    payload["lineas"] = lineas
    try:
        return donaciones_repo.crear_necesidad(usuario_id, payload)
    except pyodbc.Error as error:
        raise traducir_error_sql(error)


def registrar_compromiso(donante_usuario_id: int, datos: CrearCompromisoRequest) -> dict:
    payload = datos.model_dump()
    if not payload.get("lineas") and payload.get("cantidad_comprometida") is None:
        raise ErrorNegocio(
            422,
            "LINEAS_INVALIDAS",
            "Debe indicar la cantidad o el detalle de líneas de la donación.",
        )
    return donaciones_repo.registrar_compromiso(donante_usuario_id, payload)
