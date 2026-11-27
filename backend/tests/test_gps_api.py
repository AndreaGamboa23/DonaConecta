"""Contrato HTTP del GPS autorizado, sin SQL Server (Agente B)."""

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app.core.errores import ErrorNegocio
from app.core.security import obtener_usuario_actual
from app.repositories import gps_repo
from app.routers import gps

DONANTE = {"id_usuario": 8, "correo": "donante@prueba.local", "roles": ["DONANTE"]}
REPRESENTANTE = {
    "id_usuario": 5,
    "correo": "repr@prueba.local",
    "roles": ["REPRESENTANTE"],
}


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
    app.include_router(gps.router)
    app.dependency_overrides[obtener_usuario_actual] = lambda: DONANTE
    with TestClient(app) as prueba:
        yield prueba, app


def sesion():
    return {
        "sesion_id": 12,
        "entrega_id": 30,
        "estado": "ACTIVA",
        "consentimiento_dado": True,
        "fecha_inicio": "2026-11-26T12:00:00Z",
        "expira_en": "2026-11-26T12:30:00Z",
        "fecha_fin": None,
    }


def ubicacion():
    return {
        "sesion_id": 12,
        "entrega_id": 30,
        "estado": "ACTIVA",
        "latitud": -12.07,
        "longitud": -75.21,
        "precision_metros": 8,
        "actualizado_en": "2026-11-26T12:05:00Z",
        "expira_en": "2026-11-26T12:30:00Z",
    }


def test_iniciar_sesion_exige_consentimiento_explicito(cliente, monkeypatch):
    prueba, _ = cliente
    assert (
        prueba.post("/api/v1/entregas/30/gps/sesiones", json={"duracion_minutos": 10}).status_code
        == 422
    )
    assert (
        prueba.post(
            "/api/v1/entregas/30/gps/sesiones",
            json={"consentimiento_dado": False, "duracion_minutos": 10},
        ).status_code
        == 422
    )

    visto = {}

    def falso(usuario, entrega, duracion):
        visto.update(usuario=usuario, entrega=entrega, duracion=duracion)
        return sesion()

    monkeypatch.setattr(gps_repo, "iniciar_sesion", falso)
    respuesta = prueba.post(
        "/api/v1/entregas/30/gps/sesiones",
        json={"consentimiento": True, "duracion_minutos": 10},
    )
    assert respuesta.status_code == 201
    assert visto == {"usuario": 8, "entrega": 30, "duracion": 10}
    assert respuesta.json()["expira_en"] == "2026-11-26T12:30:00Z"
    assert not any("nonce" in clave or "clave_version" in clave for clave in respuesta.json())


def test_actualizar_ubicacion_valida_rango_y_rechaza_sesion_vencida(cliente, monkeypatch):
    prueba, _ = cliente
    cuerpo = {"latitud": -91, "longitud": -75.21}
    assert prueba.post("/api/v1/gps/sesiones/12/ubicacion", json=cuerpo).status_code == 422

    def vencida(*_args):
        raise ErrorNegocio(409, "GPS_SESION_EXPIRADA", "La sesión de seguimiento ya no está activa.")

    monkeypatch.setattr(gps_repo, "actualizar_ubicacion", vencida)
    respuesta = prueba.post(
        "/api/v1/gps/sesiones/12/ubicacion",
        json={"latitud": -12.07, "longitud": -75.21, "precision_metros": 8},
    )
    assert respuesta.status_code == 409
    assert respuesta.json()["error"]["codigo"] == "GPS_SESION_EXPIRADA"


def test_ultima_ubicacion_autoriza_donante_y_representante(cliente, monkeypatch):
    prueba, app = cliente
    monkeypatch.setattr(gps_repo, "obtener_ultima_ubicacion", lambda *args: ubicacion())
    respuesta = prueba.get("/api/v1/entregas/30/gps/ultima")
    assert respuesta.status_code == 200
    assert respuesta.json()["latitud"] == -12.07

    app.dependency_overrides[obtener_usuario_actual] = lambda: REPRESENTANTE
    assert prueba.get("/api/v1/entregas/30/gps/ultima").status_code == 200

    app.dependency_overrides[obtener_usuario_actual] = lambda: {
        "id_usuario": 99,
        "correo": "externo@prueba.local",
        "roles": ["DONANTE"],
    }

    def denegado(*_args):
        raise ErrorNegocio(
            403, "GPS_PARTICIPANTE_NO_AUTORIZADO", "No participas activamente de esta entrega."
        )

    monkeypatch.setattr(gps_repo, "obtener_ultima_ubicacion", denegado)
    rechazo = prueba.get("/api/v1/entregas/30/gps/ultima")
    assert rechazo.status_code == 403
    assert rechazo.json()["error"]["codigo"] == "GPS_PARTICIPANTE_NO_AUTORIZADO"


def test_detener_devuelve_estado_final(cliente, monkeypatch):
    prueba, _ = cliente
    final = sesion()
    final["estado"] = "DETENIDA"
    final["fecha_fin"] = "2026-11-26T12:10:00Z"
    monkeypatch.setattr(gps_repo, "detener_sesion", lambda *args: final)

    respuesta = prueba.post("/api/v1/gps/sesiones/12/detener")
    assert respuesta.status_code == 200
    assert respuesta.json()["estado"] == "DETENIDA"
    assert respuesta.json()["consentimiento_dado"] is True
