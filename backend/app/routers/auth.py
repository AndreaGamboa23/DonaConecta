from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import (
    crear_token_acceso,
    hashear_password,
    obtener_usuario_actual,
    verificar_password,
)
from app.repositories.usuarios_repo import (
    buscar_usuario_por_correo,
    buscar_usuario_por_id,
    crear_usuario_con_rol,
)
from app.schemas.auth_schema import LoginRequest, RegistroUsuarioRequest, TokenResponse

router = APIRouter(prefix="/api/v1", tags=["Autenticacion y Usuarios"])

@router.post("/auth/registro", status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: RegistroUsuarioRequest):
    existente = buscar_usuario_por_correo(datos.correo.lower())
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya se encuentra registrado",
        )
    password_hash = hashear_password(datos.password)
    nuevo = crear_usuario_con_rol(
        nombres=datos.nombres.strip(),
        apellidos=datos.apellidos.strip(),
        correo=datos.correo.lower().strip(),
        telefono=datos.telefono.strip() if datos.telefono else None,
        password_hash=password_hash,
        nombre_rol=datos.rol,
    )
    return {"mensaje": "Usuario registrado correctamente", "usuario": nuevo}

@router.post("/auth/login", response_model=TokenResponse)
def iniciar_sesion(datos: LoginRequest):
    usuario = buscar_usuario_por_correo(datos.correo.lower().strip())
    if not usuario or not verificar_password(datos.password, usuario["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos",
        )
    if not usuario["activo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta se encuentra desactivada",
        )
    token = crear_token_acceso(
        id_usuario=usuario["id_usuario"],
        correo=usuario["correo"],
        roles=usuario["roles"],
    )
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

@router.get("/usuarios/me")
def obtener_mi_perfil(usuario_token: dict = Depends(obtener_usuario_actual)):
    perfil = buscar_usuario_por_id(usuario_token["id_usuario"])
    if not perfil:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return perfil
