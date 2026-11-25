from datetime import datetime, timedelta, timezone
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings

ph = PasswordHasher()
bearer_scheme = HTTPBearer()

def hashear_password(password_plano: str) -> str:
    return ph.hash(password_plano)

def verificar_password(password_plano: str, password_hash: str) -> bool:
    try:
        return ph.verify(password_hash, password_plano)
    except VerifyMismatchError:
        return False

def crear_token_acceso(id_usuario: int, correo: str, roles: list[str]) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(id_usuario),
        "correo": correo,
        "roles": roles,
        "exp": expira,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credenciales.credentials
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return {
            "id_usuario": int(payload["sub"]),
            "correo": payload["correo"],
            "roles": payload.get("roles", []),
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de sesion ha expirado",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacion invalido",
        )
