"""Pruebas herméticas de entregas y recepciones del contrato final (Agente A).

Los cursores son falsos: comprueban SQL parametrizado, autorización, líneas y
traducción de errores del procedimiento sin tocar SQL Server ni IDs reales.
"""

import json
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pyodbc
import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.errores import ErrorNegocio
from app.core.security import obtener_usuario_actual
from app.repositories import entregas_repo as repo
from app.routers import entregas as router_entregas
from app.schemas.entregas_schema import ConfirmarRecepcionRequest, DetalleCompromisoResponse

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
    app.include_router(router_entregas.router)
    app.dependency_overrides[obtener_usuario_actual] = lambda: DONANTE
    with TestClient(app) as prueba:
        yield prueba, app


class _ConexionFalsa:
    def __init__(self, cursor, registro=None):
        self.cursor_falso = cursor
        self.registro = registro if registro is not None else {}

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def cursor(self):
        return self.cursor_falso


class _CursorBase:
    def __init__(self):
        self.uno = None
        self.muchos = []
        self.sql_vistos = []
        self.parametros_vistos = []

    def execute(self, sql, parametros=()):
        texto = " ".join(sql.split())
        self.sql_vistos.append(texto)
        self.parametros_vistos.append(parametros)
        self.uno = None
        self.muchos = []
        self._responder(texto, parametros)
        return self

    def fetchone(self):
        return self.uno

    def fetchall(self):
        return self.muchos

    def _responder(self, _texto, _parametros):
        pass


# ------------------------------------------------------------------ Reglas puras


def test_transiciones_de_entrega_y_estados_finales():
    repo.validar_transicion_entrega("PROGRAMADA", "EN_CAMINO")
    repo.validar_transicion_entrega("PROGRAMADA", "INCIDENCIA", "Falta el producto")
    repo.validar_transicion_entrega("EN_CAMINO", "ENTREGADA")
    repo.validar_transicion_entrega("INCIDENCIA", "EN_CAMINO")
    repo.validar_transicion_entrega("ENTREGADA", "INCIDENCIA", "Revisión", False)

    with pytest.raises(ErrorNegocio) as cancelada:
        repo.validar_transicion_entrega("CANCELADA", "EN_CAMINO")
    assert cancelada.value.estado == 409

    with pytest.raises(ErrorNegocio) as entregada:
        repo.validar_transicion_entrega("ENTREGADA", "INCIDENCIA", "Revisión", True)
    assert entregada.value.codigo == "TRANSICION_NO_PERMITIDA"

    with pytest.raises(ErrorNegocio) as motivo:
        repo.validar_transicion_entrega("PROGRAMADA", "CANCELADA")
    assert motivo.value.codigo == "MOTIVO_REQUERIDO"


def test_esquema_recepcion_valida_cantidades_y_observacion():
    with pytest.raises(ValidationError):
        ConfirmarRecepcionRequest(
            estado="CONFIRMADA",
            lineas=[
                {
                    "producto_id": 11,
                    "unidad_id": 2,
                    "cantidad_recibida": -1,
                }
            ],
        )

    with pytest.raises(ValidationError):
        ConfirmarRecepcionRequest(estado="OBSERVADA", lineas=[])

    valida = ConfirmarRecepcionRequest(
        estado="PARCIAL",
        observaciones="Falta una parte",
        lineas=[{"producto_id": 11, "unidad_id": 2, "cantidad_recibida": 0}],
    )
    assert valida.lineas[0].cantidad_recibida == 0


def test_esquema_detalle_expone_punto_acopio_y_coordenadas():
    base = {
        "id_compromiso": 12,
        "compromiso_id": 12,
        "id_necesidad": 16,
        "id_institucion": 16,
        "estado": "ACEPTADO",
    }
    campos = set(DetalleCompromisoResponse.model_fields)
    assert {
        "id_punto_acopio",
        "nombre_punto",
        "direccion_acopio",
        "referencias_entrega",
        "latitud",
        "longitud",
    } <= campos

    autorizado = DetalleCompromisoResponse.model_validate(
        {
            **base,
            "id_punto_acopio": 6,
            "nombre_punto": "Acopio real",
            "direccion_acopio": "Dirección real",
            "referencias_entrega": "Referencia real",
            "latitud": -12.0652,
            "longitud": -75.2031,
        }
    )
    assert autorizado.id_punto_acopio == 6
    assert autorizado.nombre_punto == "Acopio real"
    assert autorizado.direccion_acopio == "Dirección real"
    assert autorizado.referencias_entrega == "Referencia real"
    assert autorizado.latitud == -12.0652
    assert autorizado.longitud == -75.2031

    sin_punto = DetalleCompromisoResponse.model_validate(base)
    assert sin_punto.id_punto_acopio is None
    assert sin_punto.nombre_punto == ""
    assert sin_punto.direccion_acopio == ""
    assert sin_punto.referencias_entrega == ""
    assert sin_punto.latitud is None
    assert sin_punto.longitud is None


# -------------------------------------------------------- Confirmación de recepción


class _CursorRecepcion(_CursorBase):
    def __init__(self, recepciones=0, autorizado=True, cantidad=8, fallar_sp=False):
        super().__init__()
        self.recepciones = recepciones
        self.autorizado = autorizado
        self.cantidad = cantidad
        self.fallar_sp = fallar_sp

    def _responder(self, texto, _parametros):
        if "FROM dbo.entregas e" in texto and "n.institucion_id" in texto:
            self.uno = SimpleNamespace(
                entrega_id=88, institucion_id=210, recepciones=self.recepciones
            )
        elif "vw_representante_autorizado" in texto:
            self.uno = SimpleNamespace(autorizado=1) if self.autorizado else None
        elif "FROM dbo.entrega_productos" in texto:
            self.muchos = [
                SimpleNamespace(
                    producto_id=11, unidad_id=2, cantidad_entregada=self.cantidad
                )
            ]
        elif "usp_ConfirmarRecepcion" in texto:
            if self.fallar_sp:
                raise pyodbc.Error(
                    "42000",
                    "[Microsoft][ODBC Driver 18 for SQL Server][SQL Server]Error 52006 al confirmar",
                )
            self.uno = SimpleNamespace(recepcion_id=909, estado="CONFIRMADA")


def _recepcion(cantidad=5):
    return {
        "estado": "CONFIRMADA",
        "observaciones": None,
        "lineas": [
            {"producto_id": 11, "unidad_id": 2, "cantidad_recibida": cantidad}
        ],
    }


def test_confirmar_recepcion_invoca_sp_con_autocommit_y_json_real(monkeypatch):
    cursor = _CursorRecepcion()
    vistos = {}
    monkeypatch.setattr(repo, "get_connection", lambda **kwargs: (vistos.update(kwargs), _ConexionFalsa(cursor))[1])

    resultado = repo.confirmar_recepcion(501, 88, _recepcion())

    assert vistos == {"autocommit": True, "escritura": True}
    assert resultado == {"recepcion_id": 909, "entrega_id": 88, "estado": "CONFIRMADA"}
    sql_sp = [sql for sql in cursor.sql_vistos if "usp_ConfirmarRecepcion" in sql][0]
    parametros = cursor.parametros_vistos[cursor.sql_vistos.index(sql_sp)]
    assert parametros[0] == 88
    assert parametros[1] == 501
    assert json.loads(parametros[2]) == [
        {"productoId": 11, "unidadId": 2, "cantidad": 5.0}
    ]
    assert parametros[3] == "CONFIRMADA"


def test_recepcion_duplicada_se_rechaza_antes_del_sp(monkeypatch):
    cursor = _CursorRecepcion(recepciones=2)
    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    with pytest.raises(ErrorNegocio) as resultado:
        repo.confirmar_recepcion(501, 88, _recepcion())

    assert resultado.value.estado == 409
    assert resultado.value.codigo == "RECEPCION_DUPLICADA"
    assert not any("usp_ConfirmarRecepcion" in sql for sql in cursor.sql_vistos)


def test_recepcion_sin_representante_autorizado_es_403(monkeypatch):
    cursor = _CursorRecepcion(autorizado=False)
    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    with pytest.raises(ErrorNegocio) as resultado:
        repo.confirmar_recepcion(999, 88, _recepcion())

    assert resultado.value.estado == 403


def test_cantidad_recibida_superior_a_la_entregada_es_400(monkeypatch):
    cursor = _CursorRecepcion(cantidad=3)
    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    with pytest.raises(ErrorNegocio) as resultado:
        repo.confirmar_recepcion(501, 88, _recepcion(cantidad=4))

    assert resultado.value.estado == 400
    assert resultado.value.codigo == "CANTIDAD_RECIBIDA_INVALIDA"


def test_error_52006_del_sp_se_traduce_sin_exponer_sql(monkeypatch):
    cursor = _CursorRecepcion(fallar_sp=True)
    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    with pytest.raises(ErrorNegocio) as resultado:
        repo.confirmar_recepcion(501, 88, _recepcion())

    assert resultado.value.estado == 409
    assert resultado.value.codigo == "RECEPCION_DUPLICADA"
    assert "SQL Server" not in resultado.value.mensaje


# -------------------------------------------------------------------------- Entregas


class _CursorEntrega(_CursorBase):
    def _responder(self, texto, _parametros):
        if "FROM dbo.compromisos c" in texto:
            self.uno = SimpleNamespace(
                compromiso_id=77,
                estado="PENDIENTE",
                expira_en=datetime.now(timezone.utc) + timedelta(minutes=20),
                institucion_id=210,
            )
        elif "vw_representante_autorizado" in texto:
            self.uno = SimpleNamespace(autorizado=1)
        elif "FROM dbo.puntos_acopio" in texto:
            self.uno = SimpleNamespace(punto_id=321)
        elif "INSERT INTO dbo.entregas" in texto:
            self.uno = SimpleNamespace(entrega_id=88, estado="PROGRAMADA")
        elif "FROM dbo.entregas e" in texto and "pa.nombre" in texto:
            self.uno = SimpleNamespace(
                entrega_id=88,
                compromiso_id=77,
                punto_acopio_id=321,
                fecha_programada=datetime(2026, 12, 1, 9, 0),
                fecha_real_inicio=datetime(2026, 11, 26, 10, 0),
                fecha_real_fin=None,
                estado="PROGRAMADA",
                responsable_usuario_id=501,
                observaciones=None,
                nombre_punto="Acopio de prueba",
                direccion_acopio="Dirección sintética",
                referencias_entrega="Referencia sintética",
            )


def test_entrega_desde_pendiente_acepta_y_copia_lineas(monkeypatch):
    cursor = _CursorEntrega()
    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    resultado = repo.crear_entrega(
        501,
        {
            "id_compromiso": 77,
            "id_punto_acopio": 321,
            "fecha_programada": datetime(2026, 12, 1, 9, 0, tzinfo=timezone.utc),
            "observaciones": "Coordinación previa",
        },
    )

    assert resultado["entrega_id"] == 88
    assert resultado["estado"] == "PROGRAMADA"
    assert any(
        "UPDATE dbo.compromisos SET estado = N'ACEPTADO'" in sql
        for sql in cursor.sql_vistos
    )
    assert any("INSERT INTO dbo.compromiso_historial" in sql for sql in cursor.sql_vistos)
    insert_entrega = [
        sql for sql in cursor.sql_vistos if "INSERT INTO dbo.entregas" in sql
    ][0]
    # El contrato real de la BD exige escribir fecha_real_inicio en el INSERT.
    assert "fecha_real_inicio" in insert_entrega
    assert "SYSUTCDATETIME()" in insert_entrega
    assert any("INSERT INTO dbo.entrega_productos" in sql for sql in cursor.sql_vistos)


def test_detalle_compromiso_exige_dueno_o_representante(monkeypatch):
    class _CursorDetalle(_CursorBase):
        def _responder(self, texto, _parametros):
            self.uno = None

    cursor = _CursorDetalle()
    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    with pytest.raises(ErrorNegocio) as resultado:
        repo.obtener_detalle_compromiso(999, 77)

    assert resultado.value.estado == 404
    sql = cursor.sql_vistos[0]
    assert "c.donante_usuario_id = ?" in sql
    assert "vw_representante_autorizado" in sql
    assert cursor.parametros_vistos[0] == (77, 999, 999)


class _CursorDetallePunto(_CursorBase):
    """Cursor falso con necesidad, entregas y punto real parametrizados."""

    def __init__(self, punto_necesidad=None, latitud=None, longitud=None):
        super().__init__()
        self.punto_necesidad = punto_necesidad
        self.latitud = latitud
        self.longitud = longitud

    def _responder(self, texto, parametros):
        if "FROM dbo.compromisos c" in texto:
            self.uno = SimpleNamespace(
                compromiso_id=12,
                necesidad_id=16,
                estado="ACEPTADO",
                fecha_compromiso=None,
                observaciones=None,
                donante_usuario_id=700,
                titulo="Solicitud de prueba",
                institucion_id=16,
                institucion="Institución de prueba",
                punto_acopio_id=self.punto_necesidad,
            )
        elif "FROM dbo.compromiso_productos cp" in texto:
            self.muchos = []
        elif "FROM dbo.entregas e" in texto and "pa.nombre" in texto:
            self.muchos = [
                SimpleNamespace(
                    entrega_id=44,
                    compromiso_id=12,
                    punto_acopio_id=6,
                    fecha_programada=None,
                    fecha_real_inicio=None,
                    fecha_real_fin=None,
                    estado="PROGRAMADA",
                    responsable_usuario_id=501,
                    observaciones=None,
                    nombre_punto="Punto de la entrega",
                    direccion_acopio="Dirección de la entrega",
                    referencias_entrega="Referencia de la entrega",
                )
            ]
        elif "FROM dbo.puntos_acopio pa" in texto and "CASE WHEN" in texto:
            self.uno = SimpleNamespace(
                punto_id=int(parametros[0]),
                nombre="Punto real",
                direccion="Dirección real",
                referencias_entrega="Referencia real",
                latitud=self.latitud,
                longitud=self.longitud,
            )
        elif "FROM dbo.puntos_acopio_horarios" in texto:
            self.muchos = []
        elif "FROM dbo.recepciones r" in texto:
            self.muchos = []
        elif "FROM dbo.compromiso_historial" in texto:
            self.muchos = []
        elif "FROM dbo.entrega_historial h" in texto:
            self.muchos = []


def _sql_punto(cursor):
    return [sql for sql in cursor.sql_vistos if "FROM dbo.puntos_acopio pa" in sql][0]


def test_detalle_prefiere_punto_de_necesidad_y_publica_coordenadas(monkeypatch):
    cursor = _CursorDetallePunto(
        punto_necesidad=5, latitud=-12.0652, longitud=-75.2031
    )
    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    detalle = repo.obtener_detalle_compromiso(700, 12)

    assert detalle["id_punto_acopio"] == 5
    assert detalle["nombre_punto"] == "Punto real"
    assert detalle["direccion_acopio"] == "Dirección real"
    assert detalle["referencias_entrega"] == "Referencia real"
    assert detalle["latitud"] == -12.0652
    assert detalle["longitud"] == -75.2031
    indice = cursor.sql_vistos.index(_sql_punto(cursor))
    assert cursor.parametros_vistos[indice] == (5,)
    sql = _sql_punto(cursor)
    assert "ae.recurso_tipo = N'PUNTO_ACOPIO'" in sql
    assert "ae.recurso_id = CAST(pa.punto_id AS VARCHAR(50))" in sql
    assert "ae.tipo_evento IN (N'PUNTO_COORDENADAS_PUBLICADAS'" in sql
    assert "ORDER BY ae.evento_id DESC" in sql
    assert "ultima.tipo_evento = N'PUNTO_COORDENADAS_PUBLICADAS'" in sql


def test_detalle_usa_primera_entrega_y_oculta_coordenadas_privadas(monkeypatch):
    cursor = _CursorDetallePunto(punto_necesidad=None)
    monkeypatch.setattr(repo, "get_connection", lambda **_kwargs: _ConexionFalsa(cursor))

    detalle = repo.obtener_detalle_compromiso(700, 12)

    assert detalle["id_punto_acopio"] == 6
    assert detalle["nombre_punto"] == "Punto real"
    assert detalle["latitud"] is None
    assert detalle["longitud"] is None
    indice = cursor.sql_vistos.index(_sql_punto(cursor))
    assert cursor.parametros_vistos[indice] == (6,)


# ----------------------------------------------------------------------- API REST


def _detalle():
    return {
        "id_compromiso": 77,
        "compromiso_id": 77,
        "id_necesidad": 90,
        "titulo": "Solicitud de prueba",
        "id_institucion": 210,
        "institucion": "Institución de prueba",
        "estado": "ACEPTADO",
        "fecha_compromiso": "2026-11-20T10:00:00Z",
        "observaciones": None,
        "lineas": [
            {
                "producto_id": 11,
                "producto": "Arroz",
                "unidad_id": 2,
                "unidad_codigo": "UN",
                "cantidad_comprometida": 10,
                "cantidad_recibida": 4,
                "cantidad_pendiente": 6,
            }
        ],
        "entregas": [
            {
                "id_entrega": 88,
                "entrega_id": 88,
                "id_punto_acopio": 321,
                "nombre_punto": "Acopio de prueba",
                "direccion_acopio": "Dirección sintética",
                "referencias_entrega": "Referencia",
                "horarios": [
                    {
                        "dia_semana": 1,
                        "hora_apertura": "09:00:00",
                        "hora_cierre": "12:00:00",
                        "activo": True,
                    }
                ],
                "fecha_programada": "2026-12-01T09:00:00Z",
                "fecha_real_inicio": None,
                "fecha_real_fin": None,
                "estado": "PROGRAMADA",
                "observaciones": None,
            }
        ],
        "recepciones": [],
        "historial_entregas": [],
        "historial_compromiso": [],
    }


def test_detalle_http_muestra_cantidades_reales(cliente, monkeypatch):
    prueba, _ = cliente
    monkeypatch.setattr(repo, "obtener_detalle_compromiso", lambda _u, _c: _detalle())

    respuesta = prueba.get("/api/v1/compromisos/77")

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["lineas"][0]["cantidad_pendiente"] == 6
    assert datos["entregas"][0]["horarios"][0]["dia_semana"] == 1
    assert "porcentaje" not in datos
    assert datos["id_punto_acopio"] is None
    assert datos["nombre_punto"] == ""
    assert datos["latitud"] is None
    assert datos["longitud"] is None


def test_detalle_http_oculta_compromiso_no_autorizado(cliente, monkeypatch):
    prueba, _ = cliente

    def denegado(_usuario_id, _compromiso_id):
        raise ErrorNegocio(404, "COMPROMISO_NO_DISPONIBLE", "No disponible.")

    monkeypatch.setattr(repo, "obtener_detalle_compromiso", denegado)
    respuesta = prueba.get("/api/v1/compromisos/77")
    assert respuesta.status_code == 404
    assert respuesta.json()["error"]["codigo"] == "COMPROMISO_NO_DISPONIBLE"


def test_donante_no_puede_confirmar_recepcion(cliente, monkeypatch):
    prueba, _ = cliente
    llamados = []
    monkeypatch.setattr(
        repo,
        "confirmar_recepcion",
        lambda *args: (llamados.append(args), {})[1],
    )

    respuesta = prueba.post(
        "/api/v1/entregas/88/recepciones",
        json={
            "estado": "CONFIRMADA",
            "lineas": [
                {"producto_id": 11, "unidad_id": 2, "cantidad_recibida": 5}
            ],
        },
    )
    assert respuesta.status_code == 403
    assert llamados == []
