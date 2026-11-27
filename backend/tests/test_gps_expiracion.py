"""Expiración automática y cifrado de la única fila de ubicación (Agente B)."""

import base64
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.core import cifrado
from app.core.config import settings
from app.core.errores import ErrorNegocio
from app.repositories import gps_repo


@pytest.fixture
def clave_aes(monkeypatch):
    monkeypatch.setattr(
        settings, "TELEFONO_CLAVE_BASE64", base64.b64encode(b"C" * 32).decode("ascii")
    )
    monkeypatch.setattr(settings, "TELEFONO_CLAVE_VERSION", 2)


class _CursorFalso:
    def __init__(self, sesion, ubicacion=None):
        self.sesion = sesion
        self.ubicacion = ubicacion
        self.sentencias = []

    def execute(self, sql, parametros=None):
        self.sentencias.append((sql, parametros))
        return self

    def fetchone(self):
        sql = self.sentencias[-1][0]
        if "FROM dbo.sesiones_gps s" in sql:
            return self.sesion
        if "FROM dbo.gps_ultima_ubicacion" in sql:
            return self.ubicacion
        if "dbo.vw_participantes_entrega" in sql:
            return SimpleNamespace(rol="DONANTE", activo=1)
        return None

    def fetchall(self):
        return [SimpleNamespace(rol="DONANTE", activo=1)]


class _ConexionFalsa:
    def __init__(self, cursor):
        self._cursor = cursor
        self.confirmaciones = 0

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def cursor(self):
        return self._cursor

    def commit(self):
        self.confirmaciones += 1

    def rollback(self):
        pass


def _sesion(estado="ACTIVA", expirada=True):
    ahora = datetime.now(timezone.utc).replace(tzinfo=None)
    return SimpleNamespace(
        sesion_id=12,
        entrega_id=30,
        usuario_id=8,
        consentimiento_dado=True,
        fecha_inicio=ahora - timedelta(minutes=40),
        expira_en=ahora - timedelta(minutes=10) if expirada else ahora + timedelta(minutes=10),
        fecha_fin=None,
        estado=estado,
    )


def test_sesion_vencida_se_expira_y_una_vigente_no(clave_aes):
    cursor = _CursorFalso(_sesion())
    assert gps_repo.expirar_sesion_si_corresponde(cursor, cursor.sesion) is True
    assert "estado = N'EXPIRADA'" in cursor.sentencias[-1][0]
    assert "sesion_id = ? AND estado = N'ACTIVA'" in cursor.sentencias[-1][0]

    cursor_vigente = _CursorFalso(_sesion(expirada=False))
    assert gps_repo.expirar_sesion_si_corresponde(cursor_vigente, cursor_vigente.sesion) is False
    assert cursor_vigente.sentencias == []

    detenida = _CursorFalso(_sesion(estado="DETENIDA", expirada=True))
    assert gps_repo.expirar_sesion_si_corresponde(detenida, detenida.sesion) is False


def test_actualizar_expira_antes_de_rechazar_la_escritura(clave_aes, monkeypatch):
    cursor = _CursorFalso(_sesion())
    conexion = _ConexionFalsa(cursor)
    monkeypatch.setattr(gps_repo, "get_connection", lambda **_kwargs: conexion)

    with pytest.raises(ErrorNegocio) as error:
        gps_repo.actualizar_ubicacion(8, 12, -12.07, -75.21, 8)

    assert error.value.codigo == "GPS_SESION_EXPIRADA"
    assert error.value.estado == 409
    assert conexion.confirmaciones == 1
    assert any("estado = N'EXPIRADA'" in sql for sql, _ in cursor.sentencias)
    assert not any("gps_ultima_ubicacion" in sql for sql, _ in cursor.sentencias)


def test_consultar_expira_y_devuelve_coordenadas_descifradas(clave_aes, monkeypatch):
    cifrado_texto, nonce, version = cifrado.cifrar_datos(
        '{"latitud":-12.07,"longitud":-75.21}'
    )
    ubicacion = SimpleNamespace(
        coordenadas_cifradas=cifrado_texto,
        nonce=nonce,
        clave_version=version,
        precision_metros=8,
        actualizado_en=datetime(2026, 11, 26, 12, 5),
    )
    cursor = _CursorFalso(_sesion(), ubicacion)
    monkeypatch.setattr(gps_repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    respuesta = gps_repo.obtener_ultima_ubicacion(8, 30)
    assert respuesta["estado"] == "EXPIRADA"
    assert respuesta["latitud"] == -12.07
    assert respuesta["longitud"] == -75.21
    assert any("estado = N'EXPIRADA'" in sql for sql, _ in cursor.sentencias)
    assert all("coordenadas_cifradas" not in str(clave) for clave in respuesta)


def test_sesion_detenida_no_devuelve_coordenadas(clave_aes, monkeypatch):
    cifrado_texto, nonce, version = cifrado.cifrar_datos(
        '{"latitud":-12.07,"longitud":-75.21}'
    )
    ubicacion = SimpleNamespace(
        coordenadas_cifradas=cifrado_texto,
        nonce=nonce,
        clave_version=version,
        precision_metros=8,
        actualizado_en=datetime(2026, 11, 26, 12, 5),
    )
    cursor = _CursorFalso(_sesion(estado="DETENIDA", expirada=False), ubicacion)
    monkeypatch.setattr(gps_repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    respuesta = gps_repo.obtener_ultima_ubicacion(5, 30)
    assert respuesta["estado"] == "DETENIDA"
    assert respuesta["latitud"] is None
    assert respuesta["longitud"] is None


def test_coordenadas_cifradas_rondtrip(clave_aes):
    cifrado_texto, nonce, version = gps_repo._cifrar_coordenadas(-12.0712349, -75.2098769)
    fila = SimpleNamespace(
        coordenadas_cifradas=cifrado_texto, nonce=nonce, clave_version=version
    )
    assert gps_repo._descifrar_coordenadas(fila) == (-12.071235, -75.209877)
    assert b"-12.07" not in cifrado_texto
