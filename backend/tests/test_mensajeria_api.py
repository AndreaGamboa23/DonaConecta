"""Contrato HTTP de mensajería y notificaciones, sin SQL Server (Agente B)."""

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app.core.errores import ErrorNegocio
from app.core.security import obtener_usuario_actual
from app.repositories import mensajeria_repo
from app.routers import mensajeria

DONANTE = {"id_usuario": 8, "correo": "donante@prueba.local", "roles": ["DONANTE"]}
OTRO = {"id_usuario": 99, "correo": "otro@prueba.local", "roles": ["DONANTE"]}
UUID_UNO = "3f1b1c1a-1b2c-4d3e-8f40-111111111111"


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
    app.include_router(mensajeria.router)
    app.dependency_overrides[obtener_usuario_actual] = lambda: DONANTE
    with TestClient(app) as prueba:
        yield prueba, app


def conversacion_creada():
    return {
        "id_conversacion": 41,
        "conversacion_id": 41,
        "estado": "ABIERTA",
        "titulo": "Frazadas para el comedor",
        "participantes": [8, 5],
        "creada_en": "2026-11-26T12:00:00Z",
    }


def mensaje():
    return {
        "id_mensaje": 7,
        "mensaje_id": 7,
        "conversacion_id": 41,
        "remitente_usuario_id": 8,
        "contenido": "Tengo tres frazadas disponibles.",
        "tipo": "TEXTO",
        "client_message_id": UUID_UNO,
        "creado_en": "2026-11-26T12:01:00Z",
    }


def bandeja():
    return {
        "items": [
            {
                "id_conversacion": 41,
                "conversacion_id": 41,
                "id_necesidad": 9,
                "id_compromiso": None,
                "titulo": "Frazadas para el comedor",
                "estado": "ABIERTA",
                "creada_en": "2026-11-26T12:00:00Z",
                "ultimo_mensaje": "Tengo tres frazadas disponibles.",
                "ultimo_mensaje_id": 7,
                "ultimo_mensaje_en": "2026-11-26T12:01:00Z",
                "no_leidos": 2,
            }
        ],
        "total": 1,
        "page": 1,
        "page_size": 20,
    }


def test_crear_conversacion_exige_un_solo_recurso(cliente, monkeypatch):
    prueba, _ = cliente
    llamadas = []

    def falso(usuario, necesidad, compromiso, mensaje):
        llamadas.append((usuario, necesidad, compromiso, mensaje))
        return conversacion_creada()

    monkeypatch.setattr(mensajeria_repo, "crear_conversacion", falso)

    ambos = prueba.post(
        "/api/v1/conversaciones", json={"id_necesidad": 9, "id_compromiso": 12}
    )
    assert ambos.status_code == 422

    respuesta = prueba.post(
        "/api/v1/conversaciones",
        json={"id_necesidad": 9, "mensaje": "Hola, ¿sí reciben frazadas?"},
    )
    assert respuesta.status_code == 201
    assert respuesta.json()["participantes"] == [8, 5]
    assert llamadas == [(8, 9, None, "Hola, ¿sí reciben frazadas?")]
    assert not any("cifrad" in clave for clave in respuesta.json())


def test_listar_conversaciones_devuelve_no_leidos_y_ultimo_texto(cliente, monkeypatch):
    prueba, _ = cliente
    monkeypatch.setattr(mensajeria_repo, "listar_conversaciones", lambda *args: bandeja())

    respuesta = prueba.get("/api/v1/conversaciones", params={"limit": 5, "offset": 10})
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["items"][0]["no_leidos"] == 2
    assert datos["items"][0]["ultimo_mensaje"] == "Tengo tres frazadas disponibles."
    assert datos["total"] == 1


def test_historial_pasa_paginacion_y_no_expone_cifrado(cliente, monkeypatch):
    prueba, _ = cliente
    visto = {}

    def falso(usuario, conversacion, limite, desplazamiento):
        visto.update(
            usuario=usuario, conversacion=conversacion, limite=limite, offset=desplazamiento
        )
        return {
            "items": [mensaje()],
            "total": 1,
            "page": 2,
            "page_size": 25,
        }

    monkeypatch.setattr(mensajeria_repo, "historial_mensajes", falso)
    respuesta = prueba.get(
        "/api/v1/conversaciones/41/mensajes", params={"limit": 25, "offset": 25}
    )

    assert respuesta.status_code == 200
    assert visto == {"usuario": 8, "conversacion": 41, "limite": 25, "offset": 25}
    assert respuesta.json()["items"][0]["contenido"] == "Tengo tres frazadas disponibles."
    assert not any("nonce" in clave or "cifrad" in clave for clave in respuesta.json()["items"][0])


def test_enviar_mensaje_idempotente_y_validaciones(cliente, monkeypatch):
    prueba, _ = cliente
    visto = {}

    def falso(usuario, conversacion, contenido, client_message_id):
        visto.update(
            usuario=usuario, conversacion=conversacion, contenido=contenido,
            client_message_id=client_message_id,
        )
        return mensaje()

    monkeypatch.setattr(mensajeria_repo, "enviar_mensaje", falso)
    cuerpo = {"contenido": "Tengo tres frazadas disponibles.", "client_message_id": UUID_UNO}
    respuesta = prueba.post(f"/api/v1/conversaciones/41/mensajes", json=cuerpo)
    assert respuesta.status_code == 201
    assert visto["client_message_id"] == UUID_UNO

    invalido = prueba.post(
        "/api/v1/conversaciones/41/mensajes",
        json={"contenido": "Hola", "client_message_id": "no-uuid"},
    )
    assert invalido.status_code == 422

    def duplicado(*_args):
        raise ErrorNegocio(
            409, "MENSAJE_IDEMPOTENTE_DISTINTO", "Ese identificador ya pertenece a otra conversación."
        )

    monkeypatch.setattr(mensajeria_repo, "enviar_mensaje", duplicado)
    Conflicto = prueba.post("/api/v1/conversaciones/41/mensajes", json=cuerpo)
    assert Conflicto.status_code == 409
    assert Conflicto.json()["error"]["codigo"] == "MENSAJE_IDEMPOTENTE_DISTINTO"


def test_participante_inactivo_es_rechazado_en_todas_las_operaciones(cliente, monkeypatch):
    prueba, _ = cliente

    def denegado(*_args, **_kwargs):
        raise ErrorNegocio(
            403, "PARTICIPANTE_NO_AUTORIZADO", "No tienes una participación activa."
        )

    monkeypatch.setattr(mensajeria_repo, "historial_mensajes", denegado)
    monkeypatch.setattr(mensajeria_repo, "enviar_mensaje", denegado)
    monkeypatch.setattr(mensajeria_repo, "marcar_leido", denegado)

    assert prueba.get("/api/v1/conversaciones/41/mensajes").status_code == 403
    assert (
        prueba.post(
            "/api/v1/conversaciones/41/mensajes",
            json={"contenido": "Hola", "client_message_id": UUID_UNO},
        ).status_code
        == 403
    )
    marcado = prueba.patch("/api/v1/conversaciones/41/leido", json={"mensaje_id": 7})
    assert marcado.status_code == 403
    assert marcado.json()["error"]["codigo"] == "PARTICIPANTE_NO_AUTORIZADO"


def test_marcar_leido_usa_el_ultimo_mensaje(cliente, monkeypatch):
    prueba, _ = cliente
    visto = {}

    def falso(usuario, conversacion, mensaje_id):
        visto.update(usuario=usuario, conversacion=conversacion, mensaje_id=mensaje_id)
        return {"conversacion_id": conversacion, "ultimo_mensaje_leido_id": 7, "no_leidos": 0}

    monkeypatch.setattr(mensajeria_repo, "marcar_leido", falso)
    respuesta = prueba.patch("/api/v1/conversaciones/41/leido", json={})
    assert respuesta.status_code == 200
    assert visto == {"usuario": 8, "conversacion": 41, "mensaje_id": None}
    assert respuesta.json()["no_leidos"] == 0


def test_notificaciones_son_del_destinatario_y_contador_es_real(cliente, monkeypatch):
    prueba, app = cliente
    monkeypatch.setattr(
        mensajeria_repo,
        "listar_notificaciones",
        lambda *args: {
            "items": [
                {
                    "id_notificacion": 3,
                    "notificacion_id": 3,
                    "tipo": "MENSAJE_NUEVO",
                    "titulo": "Tienes un mensaje nuevo",
                    "cuerpo": "Revisa la conversación en DonaConecta.",
                    "creado_en": "2026-11-26T12:01:00Z",
                    "leido_en": None,
                    "recursos": {
                        "mensaje_id": 7,
                        "compromiso_id": None,
                        "entrega_id": None,
                        "recepcion_id": None,
                        "institucion_id": None,
                        "verificacion_id": None,
                    },
                }
            ],
            "total": 4,
            "no_leidas": 1,
            "page": 1,
            "page_size": 20,
        },
    )
    respuesta = prueba.get("/api/v1/notificaciones")
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["no_leidas"] == 1
    assert datos["items"][0]["recursos"]["mensaje_id"] == 7

    app.dependency_overrides[obtener_usuario_actual] = lambda: OTRO

    def ajena(*_args):
        raise ErrorNegocio(404, "NOTIFICACION_NO_ENCONTRADA", "La notificación no existe o no es tuya.")

    monkeypatch.setattr(mensajeria_repo, "marcar_notificacion_leida", ajena)
    rechazo = prueba.patch("/api/v1/notificaciones/3/leido")
    assert rechazo.status_code == 404
    assert rechazo.json()["error"]["codigo"] == "NOTIFICACION_NO_ENCONTRADA"
