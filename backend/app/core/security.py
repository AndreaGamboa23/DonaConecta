"""Hashing Argon2id, JWT con sesión registrada y autorización por estado real."""

import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.repositories.usuarios_repo import buscar_usuario_por_id, token_sesion_valido

# Argon2id 1.3 (0x13) es la versión del formato PHC generado por argon2-cffi.
HASH_VERSION_ARGON2ID = 19

ph = PasswordHasher()
bearer_scheme = HTTPBearer(auto_error=False)


def _clave_jwt() -> str:
    """La autenticación falla si el secreto no fue configurado en el entorno."""

    if not settings.JWT_SECRET_KEY:
        raise RuntimeError(
            "JWT_SECRET_KEY no está configurada. Copia backend/.env.example a backend/.env "
            "y reemplaza el valor de ejemplo antes de iniciar la API."
        )
    return settings.JWT_SECRET_KEY


def hashear_password(password_plano: str) -> str:
    return ph.hash(password_plano)


def verificar_password(password_plano: str, password_hash: str) -> bool:
    try:
        return ph.verify(password_hash, password_plano)
    except VerificationError:
        return False


def crear_token_acceso(id_usuario: int, correo: str, roles: list[str]) -> tuple[str, datetime]:
    """Devuelve el JWT y su expiración para registrar la sesión en SQL Server.

    ``jti`` evita que dos inicios de sesión idénticos dentro del mismo segundo
    produzcan el mismo token y, por tanto, el mismo hash UNIQUE.
    """

    emitido = datetime.now(timezone.utc)
    expira = emitido + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(id_usuario),
        "correo": correo,
        "roles": roles,
        "jti": secrets.token_urlsafe(18),
        "iat": emitido,
        "exp": expira,
    }
    return jwt.encode(payload, _clave_jwt(), algorithm=settings.JWT_ALGORITHM), expira


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Valida JWT, sesión no revocada y cuenta activa en SQL Server.

    Los roles del token son informativos: la autorización usa los roles activos
    leídos de ``usuario_roles``/``roles`` para evitar privilegios obsoletos.
    """

    if credenciales is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere un token de acceso",
        )

    token = credenciales.credentials
    try:
        payload = jwt.decode(
            token,
            _clave_jwt(),
            algorithms=[settings.JWT_ALGORITHM],
        )
        id_usuario = int(payload["sub"])
        if not payload.get("jti"):
            raise ValueError("Identificador de sesión ausente")
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de sesión ha expirado",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación inválido",
        )

    if not token_sesion_valido(token, id_usuario):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión fue cerrada o revocada",
        )

    usuario = buscar_usuario_por_id(id_usuario)
    if not usuario or not usuario["activo"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta no está activa",
        )

    return {
        "id_usuario": id_usuario,
        "correo": usuario["correo"],
        "roles": usuario["roles"],
        "activo": True,
    }


def requerir_roles(*roles_permitidos: str):
    def verificador(usuario: dict = Depends(obtener_usuario_actual)) -> dict:
        roles_usuario = set(usuario.get("roles", []))
        if not roles_usuario.intersection(roles_permitidos):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción",
            )
        return usuario

    return verificador
