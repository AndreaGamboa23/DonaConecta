"""Cifrado autenticado AES-256-GCM del celular.

La clave vive únicamente en variables de entorno. Cada cifrado genera un nonce
aleatorio de 12 bytes y se registra la versión de clave para permitir rotación.
No se registran claves, nonces ni valores en texto plano en los logs.
"""

import base64
import binascii
import os
from typing import Optional

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings
from app.core.errores import ErrorNegocio

NONCE_BYTES = 12
CLAVE_BYTES = 32


def clave_configurada() -> bool:
    return bool(settings.TELEFONO_CLAVE_BASE64.strip())


def _clave() -> bytes:
    if not clave_configurada():
        raise ErrorNegocio(
            503,
            "CIFRADO_NO_CONFIGURADO",
            "No se puede guardar el celular: falta la clave de cifrado del entorno.",
        )
    try:
        clave = base64.b64decode(settings.TELEFONO_CLAVE_BASE64, validate=True)
    except (binascii.Error, ValueError):
        raise ErrorNegocio(
            503,
            "CIFRADO_NO_CONFIGURADO",
            "La clave de cifrado del entorno no es válida.",
        )
    if len(clave) != CLAVE_BYTES:
        raise ErrorNegocio(
            503,
            "CIFRADO_NO_CONFIGURADO",
            "La clave de cifrado del entorno debe tener 32 bytes.",
        )
    return clave


def cifrar_telefono(telefono: str) -> tuple[bytes, bytes, int]:
    nonce = os.urandom(NONCE_BYTES)
    cifrado = AESGCM(_clave()).encrypt(nonce, telefono.strip().encode("utf-8"), None)
    return cifrado, nonce, int(settings.TELEFONO_CLAVE_VERSION)


def descifrar_telefono(
    cifrado: bytes, nonce: bytes, clave_version: int
) -> Optional[str]:
    if not cifrado or not nonce or clave_version != settings.TELEFONO_CLAVE_VERSION:
        return None
    try:
        return AESGCM(_clave()).decrypt(bytes(nonce), bytes(cifrado), None).decode("utf-8")
    except (InvalidTag, ValueError, UnicodeDecodeError):
        # Un fallo de autenticación no se informa al cliente como error de dato:
        # simplemente el valor no se muestra.
        return None


def enmascarar_telefono(telefono: Optional[str]) -> Optional[str]:
    if not telefono:
        return None
    digitales = "".join(caracter for caracter in telefono if caracter.isdigit())
    if len(digitales) < 4:
        return "••••"
    return f"•••• {digitales[-4:]}"
