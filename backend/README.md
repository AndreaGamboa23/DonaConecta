# Backend — DonaConecta

API REST de DonaConecta. Es el único componente que accede a SQL Server: el frontend
nunca ejecuta T-SQL ni usa la base de datos como sustituto de HTTP.

## Arquitectura real

El código está en `backend/app/` (paquete Python importado como `app`):

- `main.py`: configura FastAPI, CORS, errores y registra los routers.
- `core/`: `config.py`, `security.py` (Argon2id, JWT y sesiones), `cifrado.py`
  (AES-256-GCM del celular) y `errores.py`.
- `routers/`: `auth.py` (registro, login y logout), `usuarios.py` (perfil propio),
  `instituciones.py`, `catalogos.py` y `donaciones.py`.
- `schemas/`: validación Pydantic de entrada y salida. Los DTO de perfil no exponen
  hashes, tokens, nonces ni claves.
- `services/`: reglas de negocio, incluidas `registro_service.py` y `perfil_service.py`.
- `repositories/`: consultas parametrizadas con `pyodbc`.
- `database/`: conexión transaccional y barrera de escritura en la base principal.
- `tests/`: pruebas unitarias ejecutadas con `uv run pytest -q`.

## Tecnologías

Python 3.13, FastAPI, Uvicorn, Pydantic, PyODBC, Argon2id, PyJWT, `cryptography`
(AES-256-GCM), pytest y httpx. El entorno se gestiona con `uv`; `uv.lock` fija las
versiones. `.venv/` no se versiona.

## Configuración

1. Copiar `.env.example` a `.env` y reemplazar los valores de ejemplo por secretos
   locales. **No versionar `.env` ni compartir sus valores.**
2. La configuración actual apunta a `DonaConectaDB_Pruebas` con autenticación Windows
   y `ODBC Driver 18 for SQL Server`. `ALLOW_MAIN_DB_WRITES=no` bloquea escrituras en
   `DonaConectaDB`, aunque permite lecturas.
3. La clave AES del celular debe tener 32 bytes en Base64 y declarar su versión. Si
   falta, las operaciones que guarden celular devuelven `503 CIFRADO_NO_CONFIGURADO`.

## Ejecución

```powershell
cd C:\DonaConecta\DonaConecta\backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- Documentación interactiva: `http://127.0.0.1:8000/docs` y `/redoc`.
- Esquema OpenAPI: `http://127.0.0.1:8000/openapi.json`.
- Salud del servicio: `http://127.0.0.1:8000/api/v1/health`.
- Pruebas: `uv run pytest -q`.

## Operaciones del perfil

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/api/v1/auth/registro` | Crear donante o representante en una transacción. |
| `POST` | `/api/v1/auth/login` | Autenticar y registrar la sesión en SQL Server. |
| `DELETE` | `/api/v1/auth/sesion` | Revocar la sesión actual. |
| `GET` | `/api/v1/usuarios/me` | Perfil completo sin secretos. |
| `GET` | `/api/v1/usuarios/me/actividad` | Contadores calculados desde tablas reales. |
| `GET` | `/api/v1/usuarios/{id}/perfil` | Sólo el propio perfil; `404` para cualquier otro id. |
| `PUT` | `/api/v1/usuarios/me` | Reemplazar la representación editable completa. |
| `PATCH` | `/api/v1/usuarios/me` | Modificar parcialmente el perfil. |
| `PATCH` | `/api/v1/usuarios/me/contrasena` | Cambiar contraseña y revocar sesiones. |
| `PATCH` | `/api/v1/usuarios/me/correo` | Cambiar correo y revocar sesiones. |
| `DELETE` | `/api/v1/usuarios/me` | Baja lógica con reautenticación y confirmación. |

El celular se almacena cifrado con AES-256-GCM, nonce único y versión de clave. La
respuesta sólo muestra una máscara (`•••• 4321`). La fila en `tokens_seguridad` guarda
el SHA-256 del JWT, no el token; el valor de catálogo `REFRESCAR_SESION` no implica
que exista un refresh token ni renovación automática.

## Evidencia y alcance

El detalle de comprobaciones HTTP, SELECT, Swagger, navegador y pruebas está en
`docs/informe-crud-perfil-fase-08.2.md`. `DonaConectaDB` permanece sin datos de negocio;
sólo `DonaConectaDB_Pruebas` recibió cuentas sintéticas identificadas como tales.
