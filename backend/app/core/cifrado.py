"""Cifrado autenticado AES-256-GCM del proyecto.

La misma clave de entorno protege el celular, el contenido de mensajes y las
coordenadas de GPS. Cada operación genera un nonce aleatorio de 12 bytes y
registra la versión de clave para permitir rotación. No se registran claves,
nonces ni valores en texto plano en los logs.

Los textos persistidos en columnas ``NVARCHAR`` (mensajes) se empaquetan como
Base64 de ``versión(4 bytes) + nonce(12 bytes) + ciphertext``; los valores
binarios (GPS) guardan versión y nonce en columnas propias.
"""

import base64
import binascii
import os
import struct
from typing import Optional

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings
from app.core.errores import ErrorNegocio

NONCE_BYTES = 12
CLAVE_BYTES = 32
VERSION_BYTES = 4
TAG_GCM_BYTES = 16


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


def cifrar_datos(valor: str) -> tuple[bytes, bytes, int]:
    """Cifra cualquier texto y devuelve ``(ciphertext, nonce, clave_version)``."""

    nonce = os.urandom(NONCE_BYTES)
    cifrado = AESGCM(_clave()).encrypt(nonce, valor.encode("utf-8"), None)
    return cifrado, nonce, int(settings.TELEFONO_CLAVE_VERSION)


def descifrar_datos(
    cifrado: bytes, nonce: bytes, clave_version: int
) -> Optional[str]:
    """Devuelve ``None`` si la versión, el nonce o la autenticación fallan."""

    if not cifrado or not nonce or int(clave_version) != settings.TELEFONO_CLAVE_VERSION:
        return None
    try:
        return AESGCM(_clave()).decrypt(bytes(nonce), bytes(cifrado), None).decode("utf-8")
    except (InvalidTag, ValueError, UnicodeDecodeError, TypeError):
        # Un fallo de autenticación no se informa al cliente como error de dato:
        # simplemente el valor no se muestra.
        return None


def cifrar_telefono(telefono: str) -> tuple[bytes, bytes, int]:
    return cifrar_datos(telefono.strip())


def descifrar_telefono(
    cifrado: bytes, nonce: bytes, clave_version: int
) -> Optional[str]:
    return descifrar_datos(cifrado, nonce, clave_version)


def cifrar_texto(texto: str) -> str:
    """Empaqueta versión, nonce y ciphertext en una cadena Base64 para SQL."""

    cifrado, nonce, version = cifrar_datos(texto)
    paquete = struct.pack(">I", version) + nonce + cifrado
    return base64.b64encode(paquete).decode("ascii")


def descifrar_texto(valor: str) -> Optional[str]:
    """Invierte :func:`cifrar_texto`; nunca devuelve el valor cifrado."""

    try:
        paquete = base64.b64decode(valor, validate=True)
    except (binascii.Error, ValueError, TypeError):
        return None
    minimo = VERSION_BYTES + NONCE_BYTES + TAG_GCM_BYTES
    if len(paquete) < minimo:
        return None
    version = int.from_bytes(paquete[:VERSION_BYTES], "big")
    nonce = paquete[VERSION_BYTES : VERSION_BYTES + NONCE_BYTES]
    cifrado = paquete[VERSION_BYTES + NONCE_BYTES :]
    return descifrar_datos(cifrado, nonce, version)


def enmascarar_telefono(telefono: Optional[str]) -> Optional[str]:
    if not telefono:
        return None
    digitales = "".join(caracter for caracter in telefono if caracter.isdigit())
    if len(digitales) < 4:
        return "••••"
    return f"•••• {digitales[-4:]}"
