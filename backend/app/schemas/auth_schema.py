from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field

class RegistroUsuarioRequest(BaseModel):
    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    correo: EmailStr
    telefono: Optional[str] = Field(default=None, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)
    rol: Literal["DONANTE", "REPRESENTANTE"] = "DONANTE"

class LoginRequest(BaseModel):
    correo: EmailStr
    password: str = Field(..., min_length=1, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: dict
