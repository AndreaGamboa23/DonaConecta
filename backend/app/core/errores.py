"""Errores de negocio y traducción segura de errores de SQL Server.

Ningún mensaje enviado al cliente incluye texto de SQL Server, números de
error internos, trazas ni credenciales. Los códigos 52xxx son los ``THROW``
declarados en ``database/scripts/007_procedimientos_almacenados.sql``.
"""

import re
from typing import Optional

import pyodbc


class ErrorNegocio(Exception):
    def __init__(self, estado: int, codigo: str, mensaje: str):
        super().__init__(mensaje)
        self.estado = estado
        self.codigo = codigo
        self.mensaje = mensaje


# Código de error -> (HTTP, código público, mensaje público).
_MAPA_ERRORES_SQL: dict[int, tuple[int, str, str]] = {
    52001: (409, "COMPROMISO_EXCEDE_DISPONIBILIDAD", "La cantidad solicitada supera la disponibilidad actual."),
    52002: (409, "NECESIDAD_NO_PUBLICADA", "La necesidad ya no está disponible para recibir compromisos."),
    52003: (409, "DONANTE_NO_AUTORIZADO", "La cuenta no tiene un perfil de donante habilitado."),
    52004: (400, "LINEAS_INVALIDAS", "Las líneas de la donación no son válidas para esta necesidad."),
    52005: (400, "EXPIRACION_INVALIDA", "El tiempo de expiración indicado no es válido."),
    52006: (409, "RECEPCION_DUPLICADA", "La entrega ya tiene una recepción registrada."),
    52007: (409, "REPRESENTANTE_NO_AUTORIZADO", "El representante no está autorizado para esta institución."),
    52008: (400, "CANTIDAD_RECIBIDA_INVALIDA", "Las cantidades recibidas no son válidas."),
    52009: (409, "ENTREGA_NO_VALIDA", "La entrega no admite esa operación en su estado actual."),
    52010: (400, "ESTADO_RECEPCION_INVALIDO", "El estado de la recepción no es válido."),
    52011: (400, "EVIDENCIA_INVALIDA", "Una de las evidencias indicadas no es válida."),
}

_ERROR_GENERICO = (500, "OPERACION_NO_DISPONIBLE", "No se pudo completar la operación. Intente nuevamente.")


def traducir_error_sql(error: pyodbc.Error) -> ErrorNegocio:
    """Convierte un error de base de datos en un error público y seguro."""

    texto = " ".join(str(arg) for arg in getattr(error, "args", ()))
    coincide = re.search(r"(?<!\d)(52\d{3})(?!\d)", texto)
    if coincide:
        estado, codigo, mensaje = _MAPA_ERRORES_SQL.get(
            int(coincide.group(1)), _ERROR_GENERICO
        )
        return ErrorNegocio(estado, codigo, mensaje)

    # Violaciones de UNIQUE/FK/CHECK distintas de los THROW de negocio.
    estado, codigo, mensaje = _ERROR_GENERICO
    return ErrorNegocio(estado, codigo, mensaje)


def error_duplicado() -> ErrorNegocio:
    return ErrorNegocio(409, "REGISTRO_DUPLICADO", "El correo ya se encuentra registrado.")


def error_catalogo(mensaje: str) -> ErrorNegocio:
    return ErrorNegocio(422, "CATALOGO_INVALIDO", mensaje)
