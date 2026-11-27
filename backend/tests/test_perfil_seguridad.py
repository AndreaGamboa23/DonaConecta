"""Pruebas unitarias del perfil y la seguridad, sin escribir en SQL Server.

La integración real (CRUD contra DonaConectaDB_Pruebas) se documenta por
separado; aquí se validan reglas puras que no dependen de datos de negocio.
"""

import base64

import jwt
import pytest
from pydantic import ValidationError

from app.core import cifrado
from app.core.config import settings
from app.core.errores import ErrorNegocio
from app.core.security import crear_token_acceso
from app.schemas.usuarios_schema import (
    BajaCuentaRequest,
    CambiarContrasenaRequest,
    PerfilActualizarRequest,
    PerfilParcialRequest,
)
from app.services import perfil_service


@pytest.fixture
def clave_aes(monkeypatch):
    valor = base64.b64encode(b"A" * 32).decode("ascii")
    monkeypatch.setattr(settings, "TELEFONO_CLAVE_BASE64", valor)
    monkeypatch.setattr(settings, "TELEFONO_CLAVE_VERSION", 1)
    return valor


def test_cifrado_genera_nonces_distintos_y_descifra(clave_aes):
    cifrado_1, nonce_1, version = cifrado.cifrar_telefono("987654321")
    cifrado_2, nonce_2, _ = cifrado.cifrar_telefono("987654321")

    assert nonce_1 != nonce_2
    assert cifrado_1 != cifrado_2
    assert version == 1
    assert b"987654321" not in cifrado_1
    assert cifrado.descifrar_telefono(cifrado_1, nonce_1, version) == "987654321"
    assert cifrado.descifrar_telefono(cifrado_1, nonce_1, 2) is None
    assert cifrado.descifrar_telefono(bytes([cifrado_1[0] ^ 1]) + cifrado_1[1:], nonce_1, 1) is None


def test_enmascaramiento_y_clave_invalida(monkeypatch):
    assert cifrado.enmascarar_telefono("987654321") == "•••• 4321"
    assert cifrado.enmascarar_telefono(None) is None

    monkeypatch.setattr(settings, "TELEFONO_CLAVE_BASE64", "no-es-base64")
    with pytest.raises(ErrorNegocio) as error:
        cifrado.cifrar_telefono("987654321")
    assert error.value.estado == 503
    assert error.value.codigo == "CIFRADO_NO_CONFIGURADO"


def test_jwt_incluye_jti_unico(monkeypatch):
    monkeypatch.setattr(settings, "JWT_SECRET_KEY", "clave-de-prueba-suficientemente-larga-para-hs256")
    token_1, expira_1 = crear_token_acceso(7, "prueba@ejemplo.com", ["DONANTE"])
    token_2, _ = crear_token_acceso(7, "prueba@ejemplo.com", ["DONANTE"])

    carga_1 = jwt.decode(token_1, settings.JWT_SECRET_KEY, algorithms=["HS256"])
    carga_2 = jwt.decode(token_2, settings.JWT_SECRET_KEY, algorithms=["HS256"])

    assert carga_1["jti"] != carga_2["jti"]
    assert carga_1["sub"] == "7"
    assert carga_1["roles"] == ["DONANTE"]
    assert expira_1.timestamp() > carga_1["iat"]


def test_put_rechaza_campos_administrativos_y_exige_nombres():
    with pytest.raises(ValidationError):
        PerfilActualizarRequest.model_validate({"roles": ["ADMINISTRADOR"]})

    with pytest.raises(ValidationError):
        PerfilActualizarRequest.model_validate({"nombres": "Ana"})

    completo = PerfilActualizarRequest.model_validate({"nombres": "Ana", "apellidos": "Pérez"})
    assert completo.nombres == "Ana"
    assert completo.apellidos == "Pérez"


def test_patch_distingue_campo_omitido_de_null():
    sin_cambios = PerfilParcialRequest.model_validate({})
    sin_telefono = PerfilParcialRequest.model_validate({"telefono": None})

    assert "telefono" not in sin_cambios.model_fields_set
    assert "telefono" in sin_telefono.model_fields_set
    assert sin_telefono.telefono is None


def test_validadores_de_credenciales_y_baja():
    with pytest.raises(ValidationError):
        CambiarContrasenaRequest.model_validate(
            {"passwordActual": "abc", "passwordNueva": "nueva12345", "confirmacion": "otra12345"}
        )

    with pytest.raises(ValidationError):
        BajaCuentaRequest.model_validate({"password": "abc", "confirmacion": "ELIMINAR"})


def test_servicio_rechaza_campos_segun_rol():
    con_distrito = PerfilParcialRequest.model_validate({"distritoId": 13})
    solo_nombre = PerfilParcialRequest.model_validate({"nombres": "Ana María"})
    perfil_donante = PerfilActualizarRequest.model_validate(
        {"nombres": "Ana", "apellidos": "Pérez"}
    )

    with pytest.raises(ErrorNegocio) as error:
        perfil_service._validar_campos(con_distrito, es_donante=False, es_put=False)
    assert error.value.codigo == "CAMPO_NO_PERMITIDO"

    with pytest.raises(ErrorNegocio) as error:
        perfil_service._validar_campos(perfil_donante, es_donante=True, es_put=True)
    assert error.value.codigo == "REPRESENTACION_INCOMPLETA"

    assert perfil_service._validar_campos(solo_nombre, es_donante=True, es_put=False) == {
        "nombres"
    }
