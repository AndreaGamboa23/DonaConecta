from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.errores import ErrorNegocio
from app.routers import auth, catalogos, donaciones, instituciones, usuarios

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="API REST modular de DonaConecta conectada a SQL Server Express",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)


@app.exception_handler(ErrorNegocio)
async def manejar_error_negocio(_request: Request, error: ErrorNegocio) -> JSONResponse:
    """Errores homogéneos, sin texto de SQL Server ni trazas."""

    return JSONResponse(
        status_code=error.estado,
        content={
            "detail": error.mensaje,
            "error": {"codigo": error.codigo, "mensaje": error.mensaje},
        },
    )


app.include_router(catalogos.router)
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(instituciones.router)
app.include_router(donaciones.router)
