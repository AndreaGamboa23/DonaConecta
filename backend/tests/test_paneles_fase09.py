"""Pruebas unitarias de la API de paneles de Fase 09, sin acceso a SQL Server.

Los repositorios y servicios se sustituyen con ``monkeypatch``; las peticiones
se resuelven con ``TestClient`` y una app de prueba que registra los mismos
routers. No se ejecuta DDL, DML ni conexión a base de datos.
"""

from __future__ import annotations

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.errores import ErrorNegocio
from app.core.reglas_paneles import (
    fila_version_actual,
    validar_fila_version,
    validar_transicion_institucion,
    validar_transicion_necesidad,
)
from app.core.security import obtener_usuario_actual
from app.repositories import paneles_repo
from app.routers import admin_panel, institucional_panel, instituciones, productos_panel
from app.schemas.paneles_schema import (
    ActualizarNecesidadRequest,
    CrearNecesidadInstitucionalRequest,
)
from app.services import donaciones_service, paneles_service

ADMIN = {"id_usuario": 1, "correo": "admin@prueba.local", "roles": ["ADMINISTRADOR"]}
REPRESENTANTE = {
    "id_usuario": 5,
    "correo": "repr@prueba.local",
    "roles": ["REPRESENTANTE"],
}
DONANTE = {"id_usuario": 8, "correo": "donante@prueba.local", "roles": ["DONANTE"]}


def _manejar_error(_request: Request, error: ErrorNegocio) -> JSONResponse:
    return JSONResponse(
        status_code=error.estado,
        content={
            "detail": error.mensaje,
            "error": {"codigo": error.codigo, "mensaje": error.mensaje},
        },
    )


@pytest.fixture
def contexto():
    app = FastAPI()
    app.add_exception_handler(ErrorNegocio, _manejar_error)
    app.include_router(productos_panel.router)
    app.include_router(admin_panel.router)
    app.include_router(institucional_panel.router)
    app.include_router(instituciones.router)
    app.dependency_overrides[obtener_usuario_actual] = lambda: ADMIN
    with TestClient(app) as cliente:
        yield cliente, app


def _como(app: FastAPI, usuario: dict) -> None:
    app.dependency_overrides[obtener_usuario_actual] = lambda: usuario


# --------------------------------------------------------------- Reglas puras


def test_transiciones_institucion_y_motivo_obligatorio():
    validar_transicion_institucion("PENDIENTE", "EN_REVISION")
    validar_transicion_institucion("RECHAZADA", "EN_REVISION")
    validar_transicion_institucion("SUSPENDIDA", "PENDIENTE")
    validar_transicion_institucion("VERIFICADA", "SUSPENDIDA", "Documento vencido")

    with pytest.raises(ErrorNegocio) as salto:
        validar_transicion_institucion("RECHAZADA", "VERIFICADA")
    assert salto.value.codigo == "TRANSICION_NO_PERMITIDA"

    with pytest.raises(ErrorNegocio) as motivo:
        validar_transicion_institucion("EN_REVISION", "RECHAZADA", "   ")
    assert motivo.value.codigo == "MOTIVO_REQUERIDO"

    with pytest.raises(ErrorNegocio) as igual:
        validar_transicion_institucion("VERIFICADA", "VERIFICADA")
    assert igual.value.estado == 409


def test_transiciones_necesidad_y_control_de_version():
    validar_transicion_necesidad("BORRADOR", "PUBLICADA")
    validar_transicion_necesidad("PUBLICADA", "PAUSADA")
    validar_transicion_necesidad("PAUSADA", "PUBLICADA")

    with pytest.raises(ErrorNegocio) as salto:
        validar_transicion_necesidad("PUBLICADA", "BORRADOR")
    assert salto.value.estado == 409

    with pytest.raises(ErrorNegocio) as motivo:
        validar_transicion_necesidad("PUBLICADA", "CANCELADA")
    assert motivo.value.codigo == "MOTIVO_REQUERIDO"

    version = fila_version_actual(b"12345678")
    validar_fila_version(b"12345678", version)
    validar_fila_version(b"12345678", None)
    with pytest.raises(ErrorNegocio) as concurrencia:
        validar_fila_version(b"87654321", version)
    assert concurrencia.value.codigo == "CONCURRENCIA"


# ------------------------------------------------------------- Catálogo público


def test_productos_devuelve_unidades_y_filtra_categoria(contexto, monkeypatch):
    cliente, _ = contexto
    visto = {}

    def falso(categoria_id):
        visto["categoria"] = categoria_id
        return [
            {
                "producto_id": 4,
                "id_producto": 4,
                "nombre": "Frazadas",
                "descripcion": "Manta térmica",
                "activo": True,
                "categoria_id": 2,
                "id_categoria": 2,
                "categoria": "Abrigo",
                "unidades": [
                    {
                        "unidad_id": 1,
                        "id_unidad": 1,
                        "codigo": "UNIDAD",
                        "nombre": "Unidad",
                        "simbolo": "u",
                        "es_preferida": True,
                    }
                ],
            }
        ]

    monkeypatch.setattr(paneles_service, "listar_productos", falso)
    respuesta = cliente.get("/api/v1/productos", params={"categoriaId": 2})

    assert respuesta.status_code == 200
    assert visto == {"categoria": 2}
    cuerpo = respuesta.json()
    assert cuerpo[0]["id_producto"] == 4
    assert cuerpo[0]["unidades"][0]["es_preferida"] is True
    assert set(cuerpo[0]) == {
        "producto_id", "id_producto", "nombre", "descripcion", "activo",
        "categoria_id", "id_categoria", "categoria", "unidades",
    }


# --------------------------------------------------------------- Panel administrativo


def test_resumen_admin_exige_rol(contexto, monkeypatch):
    cliente, app = contexto
    _como(app, DONANTE)
    monkeypatch.setattr(
        paneles_service, "resumen_admin", lambda: pytest.fail("No debió consultarse")
    )

    respuesta = cliente.get("/api/v1/admin/resumen")
    assert respuesta.status_code == 403


def test_resumen_admin_expone_solo_los_ocho_indicadores(contexto, monkeypatch):
    cliente, _ = contexto
    monkeypatch.setattr(
        paneles_service,
        "resumen_admin",
        lambda: {
            "instituciones_pendientes": 2,
            "usuarios_activos": 7,
            "incidencias_abiertas": 1,
            "instituciones_verificadas": 4,
            "necesidades_publicadas": 5,
            "compromisos_activos": 3,
            "productos_activos": 41,
            "ultima_verificacion": "2026-11-25T10:30:00",
            "secreto_interno": "no debe salir",
        },
    )

    cuerpo = cliente.get("/api/v1/admin/resumen").json()
    assert len(cuerpo) == 8
    assert cuerpo["productos_activos"] == 41
    assert cuerpo["ultima_verificacion"] == "2026-11-25T10:30:00"
    assert "secreto_interno" not in cuerpo


def test_instituciones_admin_incluye_todos_los_estados(contexto, monkeypatch):
    cliente, _ = contexto
    monkeypatch.setattr(
        paneles_service,
        "listar_instituciones_admin",
        lambda: [
            {"id_institucion": 1, "nombre": "Comedor A", "tipo": "COMEDOR",
             "distrito": "Huancayo", "descripcion": None, "direccion": None,
             "estado_verificacion": "PENDIENTE", "representante": "Ana Pérez",
             "correo_representante": "ana@ejemplo.com", "fecha_registro": "2026-11-01T09:00:00"},
            {"id_institucion": 2, "nombre": "Refugio B", "tipo": "REFUGIO_ANIMAL",
             "distrito": "Huancayo", "descripcion": "Rescate", "direccion": "Jr. Uno",
             "estado_verificacion": "SUSPENDIDA", "representante": "Luis Ruiz",
             "correo_representante": "luis@ejemplo.com", "fecha_registro": "2026-11-02T09:00:00"},
        ],
    )

    cuerpo = cliente.get("/api/v1/admin/instituciones").json()
    assert [item["estado_verificacion"] for item in cuerpo] == ["PENDIENTE", "SUSPENDIDA"]
    assert set(cuerpo[0]) == {
        "id_institucion", "nombre", "tipo", "distrito", "descripcion", "direccion",
        "estado_verificacion", "representante", "correo_representante", "fecha_registro",
    }


def test_verificacion_rechaza_transicion_y_motivo_ausente(contexto, monkeypatch):
    cliente, _ = contexto

    def fallar(**_kwargs):
        raise ErrorNegocio(409, "TRANSICION_NO_PERMITIDA", "Transición no permitida.")

    monkeypatch.setattr(paneles_service, "verificar_institucion", fallar)
    respuesta = cliente.patch(
        "/api/v1/admin/instituciones/3/verificar",
        json={"estado_verificacion": "VERIFICADA"},
    )
    assert respuesta.status_code == 409
    assert respuesta.json()["error"]["codigo"] == "TRANSICION_NO_PERMITIDA"

    sin_motivo = cliente.patch(
        "/api/v1/admin/instituciones/3/verificar",
        json={"estado_verificacion": "RECHAZADA"},
    )
    assert sin_motivo.status_code == 422

    # PENDIENTE forma parte del contrato para devolver una suspensión a revisión.
    permitido = {"capturado": None}

    def aceptar(**kwargs):
        permitido["capturado"] = kwargs
        return {"id_institucion": 3, "nombre": "Comedor A", "estado_verificacion": "PENDIENTE"}

    monkeypatch.setattr(paneles_service, "verificar_institucion", aceptar)
    respuesta = cliente.patch(
        "/api/v1/admin/instituciones/3/verificar",
        json={"estado_verificacion": "PENDIENTE", "motivo": "Regularizado"},
    )
    assert respuesta.status_code == 200
    assert permitido["capturado"]["estado_verificacion"] == "PENDIENTE"
    assert permitido["capturado"]["id_admin"] == 1


def test_usuarios_admin_pagina_y_no_devuelve_secretos(contexto, monkeypatch):
    cliente, _ = contexto
    visto = {}

    def falso(limit, offset, q, rol):
        visto.update(limit=limit, offset=offset, q=q, rol=rol)
        return {
            "items": [
                {
                    "id_usuario": 9,
                    "nombres": "Ana",
                    "apellidos": "Pérez",
                    "correo": "ana@ejemplo.com",
                    "estado_cuenta": "ACTIVO",
                    "roles": ["DONANTE"],
                    "fecha_registro": "2026-11-01T09:00:00",
                    "ultimo_acceso_en": None,
                    "password_hash": "$argon2id$secreto",
                    "telefono_cifrado": "binary",
                }
            ],
            "total": 1,
            "limit": limit,
            "offset": offset,
        }

    monkeypatch.setattr(paneles_service, "listar_usuarios_admin", falso)
    respuesta = cliente.get(
        "/api/v1/admin/usuarios",
        params={"limit": 5, "offset": 10, "q": "ana", "rol": "DONANTE"},
    )
    assert respuesta.status_code == 200
    assert visto == {"limit": 5, "offset": 10, "q": "ana", "rol": "DONANTE"}
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 1 and cuerpo["limit"] == 5 and cuerpo["offset"] == 10
    assert "password_hash" not in cuerpo["items"][0]
    assert "telefono_cifrado" not in cuerpo["items"][0]


def test_admin_no_puede_cambiarse_a_si_mismo(monkeypatch):
    def no_llamar(*_args, **_kwargs):
        pytest.fail("No debió escribirse en el repositorio")

    monkeypatch.setattr(paneles_repo, "cambiar_estado_usuario_admin", no_llamar)
    with pytest.raises(ErrorNegocio) as error:
        paneles_service.cambiar_estado_usuario(1, 1, "BAJA", None)
    assert error.value.codigo == "OPERACION_NO_PERMITIDA"
    assert error.value.estado == 403


def test_patch_estado_usuario_devuelve_mensaje_y_usuario(contexto, monkeypatch):
    cliente, _ = contexto
    capturado = {}

    def falso(**kwargs):
        capturado.update(kwargs)
        return {
            "id_usuario": 9,
            "nombres": "Ana",
            "apellidos": "Pérez",
            "correo": "ana@ejemplo.com",
            "estado_cuenta": "BLOQUEADO",
            "roles": [],
            "fecha_registro": "2026-11-01T09:00:00",
            "ultimo_acceso_en": None,
        }

    monkeypatch.setattr(paneles_service, "cambiar_estado_usuario", falso)
    respuesta = cliente.patch(
        "/api/v1/admin/usuarios/9/estado",
        json={"estado": "BLOQUEADO", "motivo": "Intentos fallidos"},
    )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert set(cuerpo) == {"mensaje", "usuario"}
    assert cuerpo["usuario"]["estado_cuenta"] == "BLOQUEADO"
    assert capturado == {
        "id_admin": 1,
        "id_usuario": 9,
        "estado": "BLOQUEADO",
        "motivo": "Intentos fallidos",
    }


def test_auditoria_admin_reenvia_filtros_y_formato(contexto, monkeypatch):
    cliente, _ = contexto
    visto = {}

    def falso(limit, offset, modulo, resultado):
        visto.update(limit=limit, offset=offset, modulo=modulo, resultado=resultado)
        return {
            "items": [
                {
                    "evento_id": 12,
                    "usuario_id": 1,
                    "tipo_evento": "INSTITUCION_ESTADO",
                    "modulo": "INSTITUCIONES",
                    "recurso_tipo": "INSTITUCION",
                    "recurso_id": "3",
                    "origen": "WEB",
                    "resultado": "OK",
                    "descripcion": "Verificación actualizada",
                    "creado_en": "2026-11-25T10:30:00",
                    "dato_interno": "no debe salir",
                }
            ],
            "total": 1,
            "limit": 20,
            "offset": 0,
        }

    monkeypatch.setattr(paneles_service, "listar_auditoria_admin", falso)
    respuesta = cliente.get(
        "/api/v1/admin/auditoria",
        params={"modulo": "INSTITUCIONES", "resultado": "OK"},
    )
    assert respuesta.status_code == 200
    assert visto == {"limit": 20, "offset": 0, "modulo": "INSTITUCIONES", "resultado": "OK"}
    item = respuesta.json()["items"][0]
    assert set(item) == {
        "evento_id", "usuario_id", "tipo_evento", "modulo", "recurso_tipo",
        "recurso_id", "origen", "resultado", "descripcion", "creado_en",
    }
    assert "dato_interno" not in item


# ------------------------------------------------------------- Panel institucional


def test_resumen_institucional_exige_institucion(contexto, monkeypatch):
    cliente, app = contexto
    _como(app, REPRESENTANTE)

    def sin_institucion(_usuario_id):
        raise ErrorNegocio(
            403, "REPRESENTANTE_NO_AUTORIZADO", "Sin institución verificada asociada."
        )

    monkeypatch.setattr(paneles_service, "resumen_institucional", sin_institucion)
    respuesta = cliente.get("/api/v1/institucional/resumen")
    assert respuesta.status_code == 403
    assert respuesta.json()["error"]["codigo"] == "REPRESENTANTE_NO_AUTORIZADO"


def test_perfil_patch_solo_acepta_campos_permitidos(contexto, monkeypatch):
    cliente, app = contexto
    _como(app, REPRESENTANTE)
    capturado = {}

    def falso(usuario_id, cambios):
        capturado.update(usuario_id=usuario_id, cambios=cambios)
        return {
            "id_institucion": 3,
            "nombre": "Comedor A",
            "tipo": "COMEDOR",
            "distrito": "Huancayo",
            "descripcion": "Atención diaria",
            "direccion": "Jr. Dos 123",
            "telefono_publico": "999111222",
            "email_publico": "contacto@ejemplo.com",
            "estado_verificacion": "VERIFICADA",
            "fecha_registro": "2026-11-01T09:00:00",
        }

    monkeypatch.setattr(paneles_service, "actualizar_perfil_institucional", falso)
    respuesta = cliente.patch(
        "/api/v1/institucional/perfil",
        json={"direccion": "Jr. Dos 123", "telefonoPublico": "999111222"},
    )
    assert respuesta.status_code == 200
    assert capturado["usuario_id"] == 5
    assert capturado["cambios"] == {
        "direccion": "Jr. Dos 123",
        "telefono_publico": "999111222",
    }

    rechazado = cliente.patch(
        "/api/v1/institucional/perfil", json={"estado_verificacion": "VERIFICADA"}
    )
    assert rechazado.status_code == 422


def test_necesidades_institucionales_incluyen_lineas_y_todos_los_estados(contexto, monkeypatch):
    cliente, app = contexto
    _como(app, REPRESENTANTE)
    monkeypatch.setattr(
        paneles_service,
        "listar_necesidades_institucionales",
        lambda _usuario_id: [
            {
                "id_necesidad": 11,
                "titulo": "Frazadas para el comedor",
                "descripcion": "Se requieren mantas térmicas",
                "prioridad": "ALTA",
                "estado": "BORRADOR",
                "fecha_publicacion": None,
                "fecha_limite": "2026-12-01T23:59:59",
                "cantidad_requerida": 20.0,
                "cantidad_comprometida": 0.0,
                "cantidad_recibida": 0.0,
                "unidad_medida_base": "u",
                "lineas": [
                    {"producto_id": 4, "producto": "Frazadas", "unidad_id": 1,
                     "unidad": "Unidad", "cantidad_requerida": 20.0}
                ],
            }
        ],
    )

    cuerpo = cliente.get("/api/v1/institucional/necesidades").json()
    assert cuerpo[0]["estado"] == "BORRADOR"
    assert cuerpo[0]["lineas"][0]["producto"] == "Frazadas"
    assert set(cuerpo[0]) == {
        "id_necesidad", "titulo", "descripcion", "prioridad", "estado",
        "fila_version", "fecha_publicacion", "fecha_limite", "cantidad_requerida",
        "cantidad_comprometida", "cantidad_recibida", "unidad_medida_base", "lineas",
    }


def test_publicar_necesidad_deriva_institucion_del_representante(monkeypatch):
    capturado = {}

    monkeypatch.setattr(
        paneles_repo,
        "institucion_autorizada",
        lambda _usuario_id, permitir_pendiente=False: 9,
    )

    def publicar(usuario_id, datos):
        capturado["id_usuario"] = usuario_id
        capturado["payload"] = datos.model_dump()
        return {"id_necesidad": 77}

    monkeypatch.setattr(donaciones_service, "publicar_necesidad", publicar)
    monkeypatch.setattr(
        paneles_repo,
        "obtener_necesidad_institucional",
        lambda _usuario_id, necesidad_id: {"id_necesidad": necesidad_id, "estado": "PUBLICADA"},
    )

    solicitud = CrearNecesidadInstitucionalRequest.model_validate(
        {
            "titulo": "Frazadas para el comedor",
            "descripcion": "Se requieren mantas térmicas",
            "lineas": [{"producto_id": 4, "unidad_id": 1, "cantidad": 20}],
        }
    )
    resultado = paneles_service.publicar_necesidad_institucional(5, solicitud)

    assert capturado["payload"]["id_institucion"] == 9
    assert capturado["id_usuario"] == 5
    assert resultado["necesidad"]["id_necesidad"] == 77

    with pytest.raises(ValidationError):
        CrearNecesidadInstitucionalRequest.model_validate(
            {
                "id_institucion": 9,
                "titulo": "Frazadas para el comedor",
                "descripcion": "Se requieren mantas térmicas",
                "lineas": [{"producto_id": 4, "unidad_id": 1, "cantidad": 20}],
            }
        )


def test_patch_necesidad_persiste_motivo_de_cancelacion(monkeypatch):
    capturado = {}
    monkeypatch.setattr(
        paneles_repo,
        "actualizar_necesidad_institucional",
        lambda _usuario_id, _necesidad_id, cambios: capturado.update(cambios),
    )
    monkeypatch.setattr(
        paneles_repo,
        "obtener_necesidad_institucional",
        lambda _usuario_id, necesidad_id: {"id_necesidad": necesidad_id, "estado": "CANCELADA"},
    )

    datos = ActualizarNecesidadRequest.model_validate(
        {"estado": "CANCELADA", "motivo": "Ya no se requiere", "fila_version": "MTIzNDU2Nzg="}
    )
    resultado = paneles_service.actualizar_necesidad_institucional(5, 12, datos)

    assert capturado["estado"] == "CANCELADA"
    assert capturado["motivo"] == "Ya no se requiere"
    assert capturado["fila_version"] == "MTIzNDU2Nzg="
    assert resultado["necesidad"]["estado"] == "CANCELADA"


def test_eliminar_necesidad_devuelve_204(contexto, monkeypatch):
    cliente, app = contexto
    _como(app, REPRESENTANTE)
    monkeypatch.setattr(paneles_service, "eliminar_necesidad_institucional", lambda _u, _n: True)

    respuesta = cliente.delete("/api/v1/institucional/necesidades/12")
    assert respuesta.status_code == 204
    assert respuesta.content == b""
