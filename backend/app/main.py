from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, catalogos, donaciones, instituciones

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="API REST modular de DonaConecta conectada a SQL Server Express"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(catalogos.router)
app.include_router(auth.router)
app.include_router(instituciones.router)
app.include_router(donaciones.router)
