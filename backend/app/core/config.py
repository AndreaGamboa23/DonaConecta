import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "DonaConecta API")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")
    DB_SERVER: str = os.getenv("DB_SERVER", r".\SQLEXPRESS")
    DB_NAME: str = os.getenv("DB_NAME", "DonaConectaDB")
    DB_TRUSTED_CONNECTION: str = os.getenv("DB_TRUSTED_CONNECTION", "yes")
    DB_ENCRYPT: str = os.getenv("DB_ENCRYPT", "yes")
    DB_TRUST_CERT: str = os.getenv("DB_TRUST_CERT", "yes")
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",") if o.strip()
    ]
    # Sin valor por defecto: una clave pública en el código permitiría falsificar tokens.
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "120"))
    # AES-256-GCM para el celular: clave de 32 bytes en Base64, nunca en el repositorio.
    # Sin clave, el teléfono no se almacena y la interfaz lo indica.
    TELEFONO_CLAVE_BASE64: str = os.getenv("TELEFONO_CLAVE_BASE64", "")
    TELEFONO_CLAVE_VERSION: int = int(os.getenv("TELEFONO_CLAVE_VERSION", "1"))
    # Barrera explícita: las pruebas locales nunca escriben en la base principal.
    ALLOW_MAIN_DB_WRITES: bool = os.getenv("ALLOW_MAIN_DB_WRITES", "no").strip().lower() == "yes"

settings = Settings()
