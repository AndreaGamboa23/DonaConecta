"""API REST de entregas, confirmación de recepción y detalle de compromisos."""

from fastapi import APIRouter, Depends, status

from app.core.security import obtener_usuario_actual, requerir_roles
from app.repositories import entregas_repo
from app.schemas.entregas_schema import (
    CambiarEstadoEntregaRequest,
    ConfirmarRecepcionRequest,
    CrearEntregaRequest,
    DetalleCompromisoResponse,
    EntregaResumen,
    RecepcionResponse,
)

router = APIRouter(prefix="/api/v1", tags=["Entregas y recepciones"])


@router.get(
    "/compromisos/{id_compromiso}",
    response_model=DetalleCompromisoResponse,
    summary="Detalle real de un compromiso de donación",
    description=(
        "Sólo el donante dueño o un representante autorizado. Muestra líneas con "
        "cantidades comprometidas, recibidas y pendientes, entregas con punto y "
        "horario, recepciones e historial real. No incluye porcentajes inventados."
    ),
    responses={404: {"description": "El compromiso no existe o no es accesible."}},
)
def detalle_compromiso(
    id_compromiso: int,
    usuario: dict = Depends(obtener_usuario_actual),
):
    return entregas_repo.obtener_detalle_compromiso(
        usuario["id_usuario"], id_compromiso
    )


@router.post(
    "/entregas",
    response_model=EntregaResumen,
    status_code=status.HTTP_201_CREATED,
    summary="Programar entrega de un compromiso",
    description=(
        "Sólo un representante autorizado. Copia todas las líneas del compromiso a "
        "entrega_productos. Si el compromiso está PENDIENTE pasa a ACEPTADO en la "
        "misma transacción y se registra en compromiso_historial."
    ),
    responses={
        403: {"description": "El representante no está autorizado."},
        409: {"description": "El compromiso ya no admite entregas."},
    },
)
def crear_entrega(
    datos: CrearEntregaRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    return entregas_repo.crear_entrega(usuario["id_usuario"], datos.model_dump())


@router.patch(
    "/entregas/{id_entrega}",
    response_model=EntregaResumen,
    summary="Cambiar el estado de una entrega",
    description=(
        "Donante dueño o representante autorizado. Valida la transición y registra "
        "entrega_historial con la identidad del usuario. No confirma recepción."
    ),
)
def cambiar_estado_entrega(
    id_entrega: int,
    datos: CambiarEstadoEntregaRequest,
    usuario: dict = Depends(requerir_roles("DONANTE", "REPRESENTANTE")),
):
    return entregas_repo.cambiar_estado_entrega(
        usuario["id_usuario"], id_entrega, datos.model_dump()
    )


@router.post(
    "/entregas/{id_entrega}/recepciones",
    response_model=RecepcionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Confirmar recepción institucional",
    description=(
        "Sólo un representante autorizado. Delega la transacción a "
        "dbo.usp_ConfirmarRecepcion, que impide duplicados, valida cantidades, "
        "actualiza disponibilidad, notifica al donante y audita."
    ),
    responses={
        400: {"description": "Las cantidades recibidas no son válidas."},
        403: {"description": "El representante no está autorizado."},
        409: {"description": "La entrega ya tiene recepción o no admite el estado."},
    },
)
def confirmar_recepcion(
    id_entrega: int,
    datos: ConfirmarRecepcionRequest,
    usuario: dict = Depends(requerir_roles("REPRESENTANTE")),
):
    return entregas_repo.confirmar_recepcion(
        usuario["id_usuario"], id_entrega, datos.model_dump()
    )
