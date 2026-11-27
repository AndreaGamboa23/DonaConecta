"""Reglas puras de transición de los paneles administrativo e institucional.

Son funciones sin acceso a base de datos: permiten validar las reglas con
pruebas unitarias y que los repositorios apliquen exactamente la misma política
dentro de su transacción. Ningún mensaje expone SQL ni datos del servidor.
"""

from __future__ import annotations

import base64
from typing import Optional

from app.core.errores import ErrorNegocio

ESTADOS_INSTITUCION = {
    "PENDIENTE",
    "EN_REVISION",
    "VERIFICADA",
    "RECHAZADA",
    "SUSPENDIDA",
}

TRANSICIONES_INSTITUCION: dict[str, set[str]] = {
    "PENDIENTE": {"EN_REVISION", "VERIFICADA", "RECHAZADA"},
    "EN_REVISION": {"VERIFICADA", "RECHAZADA"},
    "RECHAZADA": {"EN_REVISION"},
    "VERIFICADA": {"SUSPENDIDA"},
    "SUSPENDIDA": {"VERIFICADA", "PENDIENTE"},
}

ESTADOS_NECESIDAD = {
    "BORRADOR",
    "PUBLICADA",
    "PAUSADA",
    "COMPLETADA",
    "VENCIDA",
    "CANCELADA",
}

TRANSICIONES_NECESIDAD: dict[str, set[str]] = {
    "BORRADOR": {"PUBLICADA", "CANCELADA"},
    "PUBLICADA": {"PAUSADA", "COMPLETADA", "VENCIDA", "CANCELADA"},
    "PAUSADA": {"PUBLICADA", "CANCELADA"},
}


def validar_transicion_institucion(
    estado_actual: str, estado_nuevo: str, motivo: Optional[str] = None
) -> None:
    """Aplica las transiciones permitidas y exige motivo en los estados sensibles."""

    if estado_nuevo not in ESTADOS_INSTITUCION:
        raise ErrorNegocio(422, "ESTADO_NO_VALIDO", "El estado indicado no es válido.")
    if estado_actual == estado_nuevo:
        raise ErrorNegocio(
            409, "ESTADO_SIN_CAMBIO", "La institución ya se encuentra en el estado indicado."
        )
    if estado_nuevo not in TRANSICIONES_INSTITUCION.get(estado_actual, set()):
        raise ErrorNegocio(
            409,
            "TRANSICION_NO_PERMITIDA",
            "La transición de estado indicada no está permitida.",
        )
    if estado_nuevo in {"RECHAZADA", "SUSPENDIDA"} and not (motivo or "").strip():
        raise ErrorNegocio(
            422, "MOTIVO_REQUERIDO", "Debe indicar el motivo de la decisión."
        )


def validar_transicion_necesidad(
    estado_actual: str, estado_nuevo: str, motivo: Optional[str] = None
) -> None:
    """Aplica las transiciones permitidas de una necesidad y exige motivo al cancelar."""

    if estado_nuevo not in ESTADOS_NECESIDAD:
        raise ErrorNegocio(422, "ESTADO_NO_VALIDO", "El estado indicado no es válido.")
    if estado_actual == estado_nuevo:
        raise ErrorNegocio(
            409, "ESTADO_SIN_CAMBIO", "La necesidad ya se encuentra en el estado indicado."
        )
    if estado_nuevo not in TRANSICIONES_NECESIDAD.get(estado_actual, set()):
        raise ErrorNegocio(
            409,
            "TRANSICION_NO_PERMITIDA",
            "La transición de estado indicada no está permitida.",
        )
    if estado_nuevo == "CANCELADA" and not (motivo or "").strip():
        raise ErrorNegocio(
            422, "MOTIVO_REQUERIDO", "Debe indicar el motivo de la cancelación."
        )


def fila_version_actual(valor: Optional[bytes]) -> Optional[str]:
    """Representa un ``ROWVERSION`` de SQL Server como cadena base64."""

    if valor is None:
        return None
    return base64.b64encode(bytes(valor)).decode("ascii")


def validar_fila_version(actual: Optional[bytes], enviada: Optional[str]) -> None:
    """Confirma la versión recibida; si no se envía, no hay control optimista."""

    if enviada is None:
        return
    if fila_version_actual(actual) != enviada:
        raise ErrorNegocio(
            409,
            "CONCURRENCIA",
            "La necesidad fue modificada por otra operación. Recargue los datos.",
        )
