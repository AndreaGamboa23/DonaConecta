from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security import (
    bearer_scheme,
    crear_token_acceso,
    obtener_usuario_actual,
    verificar_password,
)
from app.repositories.usuarios_repo import buscar_usuario_por_correo, revocar_token, registrar_sesion
from app.schemas.auth_schema import (
    LoginRequest,
    RegistroRequest,
    RegistroResponse,
    TokenResponse,
)
from app.services import registro_service

router = APIRouter(prefix="/api/v1", tags=["Autenticación y usuarios"])

_REGISTRO_RESPUESTAS = {
    409: {"description": "El correo ya está registrado o la institución ya existe."},
    422: {"description": "El cuerpo no cumple el contrato o falta un consentimiento obligatorio."},
    503: {"description": "El servicio no pudo completar la operación en SQL Server."},
}
_LOGIN_RESPUESTAS = {
    401: {"description": "Correo o contraseña incorrectos, cuenta inactiva o sesión revocada."},
    403: {"description": "La cuenta no tiene roles activos."},
    422: {"description": "El correo o la contraseña no son válidos."},
}
_SESION_RESPUESTAS = {
    204: {"description": "Sesión revocada en el servidor."},
    401: {"description": "Token ausente, expirado o revocado."},
}

@router.post(
    "/auth/registro",
    response_model=RegistroResponse,
    status_code=status.HTTP_201_CREATED,
    responses=_REGISTRO_RESPUESTAS,
    summary="Registrar donante o representante con transacción atómica",
)
@router.post(
    "/autenticacion/registro",
    response_model=RegistroResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def registrar_usuario(datos: RegistroRequest):
    return registro_service.registrar(datos)


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    responses=_LOGIN_RESPUESTAS,
    summary="Iniciar sesión y registrar la sesión en SQL Server",
)
@router.post("/autenticacion/login", response_model=TokenResponse, include_in_schema=False)
def iniciar_sesion(datos: LoginRequest):
    correo = str(datos.correo).strip().lower()
    usuario = buscar_usuario_por_correo(correo)
    if (
        not usuario
        or not usuario["activo"]
        or not verificar_password(datos.password, usuario["password_hash"])
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    if not usuario["roles"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta no tiene roles activos",
        )

    token, expira_en = crear_token_acceso(
        id_usuario=usuario["id_usuario"],
        correo=usuario["correo"],
        roles=usuario["roles"],
    )
    registrar_sesion(token, usuario["id_usuario"], expira_en)
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id_usuario": usuario["id_usuario"],
            "nombres": usuario["nombres"],
            "apellidos": usuario["apellidos"],
            "correo": usuario["correo"],
            "roles": usuario["roles"],
        },
    }


@router.delete(
    "/auth/sesion",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=_SESION_RESPUESTAS,
    summary="Revocar la sesión actual en el servidor",
)
def cerrar_sesion(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    usuario: dict = Depends(obtener_usuario_actual),
):
    if credenciales:
        revocar_token(credenciales.credentials, usuario["id_usuario"])
