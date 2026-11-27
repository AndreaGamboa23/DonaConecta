"""Pruebas herméticas del directorio público y del detalle de necesidades (Fase 09.1).

Los repositorios se sustituyen con datos de prueba en memoria. Así la suite verifica
los contratos HTTP sin depender de IDs, nombres ni estados de una base mutable.
"""

import inspect

from fastapi.testclient import TestClient

from app.main import app
from app.repositories import directorio_repo, donaciones_repo

cliente = TestClient(app)


def necesidad(**cambios):
    datos = {
        "id_necesidad": 9,
        "necesidad_id": 9,
        "titulo": "Solicitud de bienes",
        "descripcion": "Descripción de prueba",
        "cantidad_requerida": 10,
        "cantidad_comprometida": 2,
        "cantidad_recibida": 3,
        "cantidad_disponible": 5,
        "avance_porcentaje": 50,
        "lineas_totales": 2,
        "lineas_cubiertas": 1,
        "unidad_medida_base": "UN",
        "prioridad": "ALTA",
        "estado": "PUBLICADA",
        "fecha_publicacion": "2026-11-26T12:00:00Z",
        "fecha_limite": None,
        "id_institucion": 10,
        "institucion": "Institución verificada",
        "distrito": "Huancayo",
        "id_categoria": 1,
        "categoria": "Alimentos",
    }
    datos.update(cambios)
    return datos


def necesidades():
    return [
        necesidad(),
        necesidad(
            id_necesidad=10,
            necesidad_id=10,
            titulo="Otra solicitud",
            prioridad="MEDIA",
        ),
    ]


def detalle_necesidad():
    datos = necesidad()
    datos["referencias_entrega"] = "Referencia pública"
    datos["lineas"] = [
        {
            "producto_id": 3,
            "producto": "Arroz",
            "categoria": "Alimentos",
            "unidad_id": 1,
            "unidad_codigo": "UN",
            "unidad": "Unidad",
            "simbolo": "UN",
            "cantidad_requerida": 10,
            "cantidad_reservada_vigente": 2,
            "cantidad_recibida": 3,
            "cantidad_disponible": 5,
        }
    ]
    return datos


def tipos():
    return [
        {
            "tipo_id": 1,
            "codigo": "COMEDOR",
            "nombre": "Comedor",
            "descripcion": "Comedores comunitarios",
            "total_verificadas": 1,
        },
        {
            "tipo_id": 2,
            "codigo": "ALBERGUE",
            "nombre": "Albergue",
            "descripcion": None,
            "total_verificadas": 0,
        },
    ]


def instituciones():
    return [
        {
            "id_institucion": 10,
            "nombre": "Institución verificada",
            "tipo": "Comedor",
            "tipo_codigo": "COMEDOR",
            "descripcion": "Descripción pública",
            "distrito": "Huancayo",
            "direccion": None,
            "estado_verificacion": "VERIFICADA",
            "id_punto_acopio": None,
            "necesidades_activas": 1,
            "nombre_comercial": None,
            "tipo_institucion": None,
        }
    ]


def detalle_institucion():
    datos = instituciones()[0]
    datos.update(
        slug="institucion-verificada-10",
        telefono_publico=None,
        email_publico=None,
        fecha_verificacion="2026-11-20T10:00:00Z",
        tiene_foto=False,
        puntos_acopio=[],
        horarios=[],
        necesidades=necesidades(),
        bienes_solicitados=[
            {
                "producto_id": 3,
                "producto": "Arroz",
                "categoria": "Alimentos",
                "unidad_id": 1,
                "unidad_codigo": "UN",
                "simbolo": "UN",
            }
        ],
    )
    return datos


def test_listado_necesidades_incluye_disponibilidad_y_avance_reales(monkeypatch):
    vistos = {}

    def falso(**parametros):
        vistos.update(parametros)
        return necesidades()

    monkeypatch.setattr("app.routers.donaciones.listar_necesidades_publicas", falso)
    respuesta = cliente.get("/api/v1/necesidades", params={"limit": 10})

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert all(item["estado"] == "PUBLICADA" for item in datos)
    assert all("cantidad_disponible" in item for item in datos)
    assert all(0 <= item["avance_porcentaje"] <= 100 for item in datos)
    assert vistos["limite"] == 10
    assert vistos["desplazamiento"] == 0


def test_listado_necesidades_filtra_por_prioridad_y_paginacion(monkeypatch):
    vistos = {}

    def falso(**parametros):
        vistos.update(parametros)
        return [necesidad()]

    monkeypatch.setattr("app.routers.donaciones.listar_necesidades_publicas", falso)
    respuesta = cliente.get(
        "/api/v1/necesidades", params={"prioridad": "ALTA", "limit": 2, "offset": 3}
    )

    assert respuesta.status_code == 200
    assert len(respuesta.json()) == 1
    assert vistos["prioridad"] == "ALTA"
    assert vistos["limite"] == 2
    assert vistos["desplazamiento"] == 3


def test_detalle_necesidad_muestra_todas_sus_lineas(monkeypatch):
    monkeypatch.setattr(
        "app.routers.directorio.obtener_necesidad_publica", lambda _id: detalle_necesidad()
    )
    respuesta = cliente.get("/api/v1/necesidades/9")

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["id_necesidad"] == 9
    assert len(datos["lineas"]) == 1
    linea = datos["lineas"][0]
    assert {"producto", "unidad", "simbolo", "cantidad_requerida"} <= linea.keys()
    assert linea["cantidad_disponible"] == datos["cantidad_disponible"]


def test_detalle_oculto_para_necesidad_inexistente(monkeypatch):
    monkeypatch.setattr("app.routers.directorio.obtener_necesidad_publica", lambda _id: None)
    respuesta = cliente.get("/api/v1/necesidades/999999")

    assert respuesta.status_code == 404
    assert respuesta.json()["error"]["codigo"] == "RECURSO_NO_PUBLICO"


def test_tipos_institucion_son_un_dto_explicito(monkeypatch):
    monkeypatch.setattr("app.routers.directorio.listar_tipos_institucion", tipos)
    respuesta = cliente.get("/api/v1/instituciones/tipos")

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert {tipo["codigo"] for tipo in datos} == {"COMEDOR", "ALBERGUE"}
    assert all("total_verificadas" in tipo for tipo in datos)


def test_directorio_solo_instituciones_verificadas_y_filtro_por_tipo(monkeypatch):
    vistos = {}

    def falso(**parametros):
        vistos.update(parametros)
        return instituciones()

    monkeypatch.setattr("app.routers.instituciones.listar_instituciones_publicas", falso)
    respuesta = cliente.get(
        "/api/v1/instituciones", params={"tipoCodigo": "COMEDOR", "q": "institución"}
    )

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert all(item["estado_verificacion"] == "VERIFICADA" for item in datos)
    assert all("necesidades_activas" in item for item in datos)
    assert vistos["tipo_codigo"] == "COMEDOR"
    assert vistos["termino"] == "institución"


def test_perfil_publico_muestra_datos_autorizados_y_necesidades(monkeypatch):
    monkeypatch.setattr(
        "app.routers.directorio.obtener_institucion_publica", lambda _id: detalle_institucion()
    )
    respuesta = cliente.get("/api/v1/instituciones/10")

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["estado_verificacion"] == "VERIFICADA"
    assert datos["necesidades"]
    assert datos["bienes_solicitados"][0]["unidad_codigo"] == "UN"
    assert "puntos_acopio" in datos
    assert "representante" not in datos
    assert "correo_representante" not in datos


def test_perfil_oculta_institucion_pendiente(monkeypatch):
    monkeypatch.setattr("app.routers.directorio.obtener_institucion_publica", lambda _id: None)
    respuesta = cliente.get("/api/v1/instituciones/8")

    assert respuesta.status_code == 404
    assert respuesta.json()["error"]["codigo"] == "RECURSO_NO_PUBLICO"


def test_las_reglas_de_publicacion_se_aplican_en_sql():
    codigo_directorio = inspect.getsource(directorio_repo)
    codigo_donaciones = inspect.getsource(donaciones_repo)

    assert "i.estado_verificacion = N'VERIFICADA'" in codigo_directorio
    assert "n.estado = N'PUBLICADA'" in codigo_donaciones
    assert "vw_disponibilidad_necesidad" in codigo_donaciones
    assert "vw_progreso_necesidad" in codigo_donaciones
