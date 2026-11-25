import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "DonaConecta API")
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")
    DB_SERVER: str = os.getenv("DB_SERVER", r".\SQLEXPRESS")
    DB_NAME: str = os.getenv("DB_NAME", "DonaConectaDB")
    DB_TRUSTED_CONNECTION: str = os.getenv("DB_TRUSTED_CONNECTION", "yes")
    DB_ENCRYPT: str = os.getenv("DB_ENCRYPT", "yes")
    DB_TRUST_CERT: str = os.getenv("DB_TRUST_CERT", "yes")
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",") if o.strip()
    ]
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "clave_temporal_cambiar")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "120"))

settings = Settings()
