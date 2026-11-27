"""Pruebas herméticas de puntos de acopio del contrato final (Agente A).

Sin conexión a SQL Server: se sustituyen ``get_connection`` y los repositorios.
No dependen de identificadores reales ni de datos mutables de la base de pruebas.
"""

from types import SimpleNamespace

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.errores import ErrorNegocio
from app.core.security import obtener_usuario_actual
from app.repositories import puntos_acopio_repo as repo
from app.routers import puntos_acopio as router_puntos
from app.schemas.puntos_acopio_schema import PuntoAcopioRequest

REPRESENTANTE = {
    "id_usuario": 501,
    "correo": "representante@prueba.local",
    "roles": ["REPRESENTANTE"],
}
DONANTE = {"id_usuario": 700, "correo": "donante@prueba.local", "roles": ["DONANTE"]}


def _manejar_error(_request: Request, error: ErrorNegocio) -> JSONResponse:
    return JSONResponse(
        status_code=error.estado,
        content={
            "detail": error.mensaje,
            "error": {"codigo": error.codigo, "mensaje": error.mensaje},
        },
    )


@pytest.fixture
def cliente():
    app = FastAPI()
    app.add_exception_handler(ErrorNegocio, _manejar_error)
    app.include_router(router_puntos.router)
    app.dependency_overrides[obtener_usuario_actual] = lambda: REPRESENTANTE
    app.dependency_overrides[router_puntos.usuario_opcional] = lambda: None
    with TestClient(app) as prueba:
        yield prueba, app


def _fila_punto(**cambios):
    datos = {
        "punto_id": 321,
        "institucion_id": 210,
        "distrito_id": 4,
        "nombre": "Acopio solidario de prueba",
        "direccion": "Dirección sintética de demostración",
        "referencias_entrega": "Referencia sintética",
        "latitud": -12.07,
        "longitud": -75.21,
        "estado": "ACTIVO",
        "distrito": "Huancayo",
        "estado_verificacion": "VERIFICADA",
        "autorizacion_coordenadas": repo.EVENTO_PUBLICAR,
    }
    datos.update(cambios)
    return SimpleNamespace(**datos)


def _cuerpo(**cambios):
    datos = {
        "id_institucion": 210,
        "nombre": "Acopio solidario de prueba",
        "direccion": "Dirección sintética de demostración",
        "referencias_entrega": "Referencia sintética",
        "distrito_id": 4,
        "latitud": -12.07,
        "longitud": -75.21,
        "coordenadas_publicas": True,
        "horarios": [
            {
                "dia_semana": 1,
                "hora_apertura": "09:00:00",
                "hora_cierre": "12:00:00",
                "activo": True,
            }
        ],
    }
    datos.update(cambios)
    return datos


def _respuesta_punto():
    """DTO sintético válido para sustituir la respuesta del repositorio."""

    return {
        "punto_id": 321,
        "id_punto_acopio": 321,
        "id_institucion": 210,
        "nombre": "Acopio solidario de prueba",
        "direccion": "Dirección sintética de demostración",
        "referencias_entrega": "Referencia sintética",
        "distrito_id": 4,
        "distrito": "Huancayo",
        "latitud": -12.07,
        "longitud": -75.21,
        "estado": "ACTIVO",
        "coordenadas_visibles": True,
        "horarios": [
            {
                "punto_id": 321,
                "dia_semana": 1,
                "hora_apertura": "09:00:00",
                "hora_cierre": "12:00:00",
                "activo": True,
            }
        ],
    }


# ------------------------------------------------------------------ Reglas puras


def test_coordenadas_publicas_exigen_verificacion_activo_y_ultimo_evento():
    lat, lon, visibles = repo.resolver_coordenadas(_fila_punto(), publico=True)
    assert visibles is True
    assert (lat, lon) == (-12.07, -75.21)

    lat, lon, visibles = repo.resolver_coordenadas(
        _fila_punto(autorizacion_coordenadas=repo.EVENTO_PRIVAR), publico=True
    )
    assert (lat, lon, visibles) == (None, None, False)

    lat, lon, visibles = repo.resolver_coordenadas(
        _fila_punto(estado="INACTIVO"), publico=True
    )
    assert (lat, lon, visibles) == (None, None, False)

    lat, lon, visibles = repo.resolver_coordenadas(
        _fila_punto(estado_verificacion="PENDIENTE"), publico=True
    )
    assert (lat, lon, visibles) == (None, None, False)

    # La consulta privada sí puede verlas aunque el último evento sea privado.
    lat, lon, visibles = repo.resolver_coordenadas(
        _fila_punto(autorizacion_coordenadas=repo.EVENTO_PRIVAR),
        publico=False,
        privado_autorizado=True,
    )
    assert (lat, lon) == (-12.07, -75.21)
    assert visibles is True


def test_representante_sin_vinculo_activo_es_rechazado():
    class _CursorSinAutorizacion:
        def execute(self, _sql, _parametros):
            return self

        def fetchone(self):
            return None

    with pytest.raises(ErrorNegocio) as resultado:
        repo.validar_representante_en_cursor(_CursorSinAutorizacion(), 1, 2)

    assert resultado.value.estado == 403
    assert resultado.value.codigo == "REPRESENTANTE_NO_AUTORIZADO"


def test_evento_de_autorizacion_es_publico_o_privado():
    vistos = []

    class _CursorAuditoria:
        def execute(self, sql, parametros):
            vistos.append((sql, parametros))
            return self

    repo._registrar_autorizacion_en_cursor(_CursorAuditoria(), 501, 321, True)
    repo._registrar_autorizacion_en_cursor(_CursorAuditoria(), 501, 321, False)

    assert repo.EVENTO_PUBLICAR in vistos[0][1]
    assert repo.EVENTO_PRIVAR in vistos[1][1]
    assert all("dbo.auditoria_eventos" in sql for sql, _ in vistos)


def test_esquema_valida_coordenadas_dias_y_franjas():
    with pytest.raises(ValidationError):
        PuntoAcopioRequest(**_cuerpo(longitud=None))

    # La PK real es (punto_id, dia_semana, hora_apertura).
    with pytest.raises(ValidationError):
        PuntoAcopioRequest(
            **_cuerpo(
                horarios=[
                    {
                        "dia_semana": 1,
                        "hora_apertura": "09:00:00",
                        "hora_cierre": "12:00:00",
                    },
                    {
                        "dia_semana": 1,
                        "hora_apertura": "09:00:00",
                        "hora_cierre": "13:00:00",
                    },
                ]
            )
        )

    # Sí se admiten dos franjas el mismo día con aperturas distintas.
    valido = PuntoAcopioRequest(
        **_cuerpo(
            horarios=[
                {
                    "dia_semana": 1,
                    "hora_apertura": "09:00:00",
                    "hora_cierre": "12:00:00",
                },
                {
                    "dia_semana": 1,
                    "hora_apertura": "15:00:00",
                    "hora_cierre": "18:00:00",
                },
            ]
        )
    )
    assert len(valido.horarios) == 2

    with pytest.raises(ValidationError):
        PuntoAcopioRequest(
            **_cuerpo(
                horarios=[
                    {
                        "dia_semana": 8,
                        "hora_apertura": "09:00:00",
                        "hora_cierre": "12:00:00",
                    }
                ]
            )
        )


# ----------------------------------------------------------------------- API REST


def test_listado_publico_no_requiere_token(cliente, monkeypatch):
    prueba, _ = cliente
    vistos = {}

    def falso(**parametros):
        vistos.update(parametros)
        return []

    monkeypatch.setattr(repo, "listar_puntos_acopio", falso)
    respuesta = prueba.get(
        "/api/v1/puntos-de-acopio",
        params={"institucionId": 210, "distritoId": 4, "publico": "true"},
    )

    assert respuesta.status_code == 200
    assert vistos["publico"] is True
    assert vistos["institucion_id"] == 210
    assert vistos["distrito_id"] == 4
    assert vistos["usuario_id"] is None


def test_consulta_privada_sin_token_es_401(cliente):
    prueba, _ = cliente
    respuesta = prueba.get(
        "/api/v1/puntos-de-acopio", params={"publico": "false"}
    )
    assert respuesta.status_code == 401


def test_consulta_privada_pasa_identidad_del_representante(cliente, monkeypatch):
    prueba, app = cliente
    app.dependency_overrides[router_puntos.usuario_opcional] = lambda: REPRESENTANTE
    vistos = {}
    monkeypatch.setattr(
        repo,
        "listar_puntos_acopio",
        lambda **parametros: (vistos.update(parametros), [])[1],
    )

    respuesta = prueba.get(
        "/api/v1/puntos-de-acopio", params={"publico": "false"}
    )
    assert respuesta.status_code == 200
    assert vistos["publico"] is False
    assert vistos["usuario_id"] == REPRESENTANTE["id_usuario"]


def test_alta_solo_para_representante_autorizado(cliente, monkeypatch):
    prueba, app = cliente
    llamado = []
    monkeypatch.setattr(
        repo,
        "crear_punto_acopio",
        lambda usuario_id, datos: (llamado.append((usuario_id, datos)), _respuesta_punto())[1],
    )

    app.dependency_overrides[obtener_usuario_actual] = lambda: DONANTE
    rechazado = prueba.post("/api/v1/puntos-de-acopio", json=_cuerpo())
    assert rechazado.status_code == 403
    assert llamado == []

    app.dependency_overrides[obtener_usuario_actual] = lambda: REPRESENTANTE
    aceptado = prueba.post("/api/v1/puntos-de-acopio", json=_cuerpo())
    assert aceptado.status_code == 201
    assert llamado[0][0] == REPRESENTANTE["id_usuario"]
    assert llamado[0][1]["coordenadas_publicas"] is True


def test_delete_rechaza_punto_con_relaciones(monkeypatch):
    class _CursorRelaciones:
        def execute(self, sql, parametros=()):
            self.sql = sql
            return self

        def fetchone(self):
            return SimpleNamespace(necesidades=1, entregas=0)

    class _ConexionFalsa:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def cursor(self):
            return _CursorRelaciones()

    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa())
    monkeypatch.setattr(repo, "_leer_punto_en_cursor", lambda _cursor, _id: _fila_punto())
    monkeypatch.setattr(repo, "validar_representante_en_cursor", lambda *_args: None)

    with pytest.raises(ErrorNegocio) as resultado:
        repo.eliminar_punto_acopio(501, 321)

    assert resultado.value.estado == 409
    assert resultado.value.codigo == "PUNTO_CON_RELACIONES"
