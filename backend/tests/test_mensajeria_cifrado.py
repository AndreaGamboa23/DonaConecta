"""Cifrado de mensajes: paquete versionado AES-256-GCM sin romper el celular."""

import base64

import pytest

from app.core import cifrado
from app.core.config import settings
from app.core.errores import ErrorNegocio


@pytest.fixture
def clave_aes(monkeypatch):
    monkeypatch.setattr(
        settings, "TELEFONO_CLAVE_BASE64", base64.b64encode(b"B" * 32).decode("ascii")
    )
    monkeypatch.setattr(settings, "TELEFONO_CLAVE_VERSION", 3)
    return settings.TELEFONO_CLAVE_BASE64


def test_texto_cifrado_se_descifra_y_no_revela_contenido(clave_aes):
    primero = cifrado.cifrar_texto("¿Necesitan cobijas para el albergue?")
    segundo = cifrado.cifrar_texto("¿Necesitan cobijas para el albergue?")

    assert primero != segundo
    assert "cobijas" not in primero
    assert cifrado.descifrar_texto(primero) == "¿Necesitan cobijas para el albergue?"
    paquete = base64.b64decode(primero, validate=True)
    assert int.from_bytes(paquete[:4], "big") == 3
    assert len(paquete[4:16]) == 12


def test_version_clave_y_integridad_del_paquete(clave_aes, monkeypatch):
    cifrado_texto = cifrado.cifrar_texto("mensaje de prueba")
    paquete = bytearray(base64.b64decode(cifrado_texto, validate=True))

    monkeypatch.setattr(settings, "TELEFONO_CLAVE_VERSION", 4)
    assert cifrado.descifrar_texto(cifrado_texto) is None
    monkeypatch.setattr(settings, "TELEFONO_CLAVE_VERSION", 3)

    paquete[-1] ^= 1
    assert cifrado.descifrar_texto(base64.b64encode(paquete).decode("ascii")) is None
    assert cifrado.descifrar_texto("no-es-base64") is None


def test_cifrar_telefono_conserva_su_contrato(clave_aes):
    cifrado_tel, nonce, version = cifrado.cifrar_telefono(" 987654321 ")
    assert version == 3
    assert len(nonce) == 12
    assert cifrado.descifrar_telefono(cifrado_tel, nonce, version) == "987654321"


def test_sin_clave_configurada_falla_seguro(monkeypatch):
    monkeypatch.setattr(settings, "TELEFONO_CLAVE_BASE64", "")
    with pytest.raises(ErrorNegocio) as error:
        cifrado.cifrar_texto("mensaje")
    assert error.value.codigo == "CIFRADO_NO_CONFIGURADO"
