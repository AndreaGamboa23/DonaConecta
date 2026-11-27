# Informe de integración real — registro, acceso y perfil (Fase 08)

**Rama:** `integracion-avance-02` · **Fecha:** 2026-11-26 · **Base de datos funcional:** `DonaConectaDB_Pruebas`

## 1. Causa exacta del error original

El mensaje «No se pudo completar el registro. Verifica tus datos o intenta con otro correo» **no era un correo duplicado**.

Diagnóstico previo a cualquier cambio:

| Comprobación | Resultado |
|---|---|
| `GET http://127.0.0.1:8000/docs`, `/openapi.json`, `/api/v1/health` | Sin respuesta: ningún proceso escuchaba el puerto 8000 |
| `GET http://127.0.0.1:4200/` | Sin respuesta: Angular tampoco estaba iniciado |
| Puertos 8000 y 4200 | Libres (`Get-NetTCPConnection -State Listen`) |
| Dependencias Python | No instaladas; la fase anterior no había podido arrancar la API |

Angular recibía un fallo de red (`HttpErrorResponse.status = 0`) y el componente lo convertía en un aviso genérico que culpaba al correo. **No existía backend en ejecución.**

## 2. Entorno levantado

- `uv 0.12.17` con Python **3.13.17** (`C:\Users\ANDREA\AppData\Local\Programs\Python\Python313\python.exe`), sin duplicar gestores.
- `uv sync` generó `.venv`, `uv.lock` e instaló 32 paquetes: FastAPI 0.165.0, Uvicorn 0.54.0, Pydantic 2.14.4, PyODBC 5.5.0, argon2-cffi 25.1.0, PyJWT 2.15.1, python-dotenv 1.2.4, pytest 9.2.0, httpx 0.29.0.
- `backend/.env` apunta a `DonaConectaDB_Pruebas`, usa Windows Auth y ODBC Driver 18, restringe CORS a `localhost/127.0.0.1:4200` y define `ALLOW_MAIN_DB_WRITES=no`. La clave JWT se generó con `secrets.token_urlsafe(48)` (64 caracteres). **El secreto no se muestra ni se versiona**; `git check-ignore -v backend\.env` confirma que está ignorado.
- API: `app.main:app`, montada en `127.0.0.1:8000`. Swagger, ReDoc y OpenAPI disponibles.

## 3. Correcciones implementadas

### Backend
- **Barrera de escritura** (`app/database/connection.py`): `get_connection(escritura=True)` bloquea escrituras en `DonaConectaDB` pero permite lecturas. Verificado: escritura rechazada, lectura `SELECT DB_NAME()` permitida.
- **`iat` en el JWT** (`app/core/security.py`): el token incluye emisión y expiración (120 min), verificable sin revelar el token.
- **`health` real** (`app/routers/catalogos.py` + `APP_ENV` en `config.py`): devuelve `estado`, `base_datos`, `entorno` y `modo_pruebas`. un false positivo por atributo inexistente causó un 503 transitorio que quedó corregido.
- **Errores honestos** (`app/services/registro_service.py`): solo `UQ_usuarios_email` se traduce como «correo ya registrado». El resto de violaciones UNIQUE ya no se atribuyen al usuario.
- **Directorio público** (`app/repositories/instituciones_repo.py`): alias SQL `id_institucion` en las dos consultas; antes fallaban con `AttributeError` y devolvían 500.
- **Registro atómico** (`app/services/registro_service.py`): donante o representante + institución se crean en **una sola transacción**; las instituciones quedan `PENDIENTE` y no se publican.

### Base de datos (DDL autorizado)
`UQ_instituciones_foto` era un `UNIQUE` sobre una columna `NULL`. SQL Server admite **un solo NULL** por restricción UNIQUE, por lo que una segunda institución sin foto fallaba con error 2601. Se sustituyó por un índice único filtrado:

```sql
CREATE UNIQUE INDEX UX_instituciones_foto_no_nula
    ON dbo.instituciones(foto_archivo_id)
    WHERE foto_archivo_id IS NOT NULL;
```

- Archivos: `database/scripts/002_crear_tablas.sql` (instalaciones nuevas), `database/scripts/004_crear_indices.sql` (índice filtrado) y `database/scripts/009_corregir_indice_foto_institucion.sql` (migración para bases ya creadas).
- Aplicado únicamente en `DonaConectaDB_Pruebas` con autorización explícita. **`DonaConectaDB` no fue modificado**: conserva 0 filas y su esquema anterior; el script 009 deberá aplicarse allí en una fase autorizada antes de registrar instituciones reales.

### Frontend
- `core/utils/errores-api.ts`: traduce red caída, 503, 409, 422, 401/403, 500 y `ServicioPendienteError`. En 422 **no muestra los valores rechazados** (podrían incluir contraseñas).
- `core/services/entorno.service.ts`: lee `/api/v1/health`; si la API no responde, mantiene el aviso de demostración (opción segura).
- Registro de donante, institución y acceso: mensajes de periodo actualizados, estados de envío con spinner, alertas `role="alert"`, títulos `text-white` sobre fotografía y aviso claro de que el celular no se guarda.
- `registro-api.service.ts`: `registrarRepresentante()` ahora envía `institucion` anidada en `POST /api/v1/auth/registro`; el `login` posterior solo crea la sesión del navegador. Ya no hay `POST /api/v1/instituciones` intermedia.

## 4. Evidencia funcional real

Todas las peticiones se ejecutaron contra la API en ejecución y los datos se comprobaron con `sqlcmd`/PyODBC sobre `DonaConectaDB_Pruebas`.

| Operación | HTTP | Evidencia en SQL / navegador |
|---|---|---|
| `GET /api/v1/health` | 200 | `{"estado":"ok","base_datos":"DonaConectaDB_Pruebas","entorno":"development","modo_pruebas":true}` |
| `POST /api/v1/auth/registro` (donante) | 201 | `id_usuario=15`, `estado=ACTIVO`, `hash=$argon2...`, `hash_version=19`, `distrito=13`, `notificacion=IMPORTANTES`, `consentimiento=True`, `terminos=True`, `rol=DONANTE`, `telefono_cifrado=NULL` |
| Registro repetido | 409 | `REGISTRO_DUPLICADO`, «El correo ya se encuentra registrado.» |
| `POST /api/v1/auth/login` correcto | 200 | JWT con `iat`/`exp`, 120 min; token no mostrado |
| Login con contraseña incorrecta | 401 | Credencial rechazada |
| Login con correo inexistente | 401 | Credencial rechazada |
| `GET /api/v1/usuarios/me` sin token | 401 | Sin acceso |
| `GET /api/v1/usuarios/me` con token | 200 | Perfil DTO sin hash ni datos sensibles |
| `POST /api/v1/auth/registro` (representante) | 201 | `id_usuario=17`, `institucionSolicitudId=8`; SQL: `rol=REPRESENTANTE`, `estado=PENDIENTE`, `vinculo=PENDIENTE`, `cargo`, `contacto_principal=1` |
| Institución pendiente en directorio público | — | `GET /api/v1/instituciones` → 200, la institución **no aparece** |
| Listado admin sin token | 401 | `GET /api/v1/admin/instituciones/pendientes` |
| Rollback con `tipoId=9999` | 422 | `CATALOGO_INVALIDO`; **0 cuentas huérfanas** |
| Persistencia tras reiniciar Uvicorn | 200 | Login de cuenta creada antes del reinicio |
| Escritura en base principal | bloqueada | `RuntimeError: Escritura bloqueada en DonaConectaDB`; lectura permitida |

### Verificación desde el navegador (CDP, Edge headless)

Flujo donante: `/registro/donante` → `/perfil`. Aviso de demostración visible, texto obsoleto ausente, título en `rgb(255,255,255)`, correo visible en el perfil, token en `sessionStorage`. Tras una contraseña errónea aparece «Correo o contraseña incorrectos».

Peticiones observadas: `GET /api/v1/health` 200, `POST /api/v1/auth/registro` 201, `POST /api/v1/auth/login` 200, `GET /api/v1/usuarios/me` 200, segundo login 401.

Flujo institucional: `/registro/institucion` (4 pasos) → `/perfil`. Peticiones observadas: `GET /api/v1/health`, `POST /api/v1/auth/registro`, `POST /api/v1/auth/login`, `GET /api/v1/usuarios/me`. **Una sola petición de registro, ninguna `POST /api/v1/instituciones`.** SQL posterior: `usuario_id=19`, institución `Institucion sintetica UI`, `estado=PENDIENTE`, `0` publicadas.

Totales finales en `DonaConectaDB_Pruebas`: 13 usuarios, 3 instituciones (2 `PENDIENTE`, 1 `VERIFICADA` preexistente), 0 representantes huérfanos. `DonaConectaDB`: 0 usuarios.

## 5. Compilación y pruebas

- `npm run build`: correcto, **567,11 kB** iniciales / **109,54 kB** transferidos (presupuesto 600 kB).
- `npm test -- --watch=false`: **17 archivos, 44/44 pruebas** aprobadas (antes: 34/34).
- `uv run python -m compileall -q app`: correcto.
- `git diff --check`: sin errores de whitespace; solo avisos de normalización LF/CRLF.
- Capturas y volcados temporales se guardaron en `C:\Users\ANDREA\AppData\Local\Temp\opencode`, fuera del repositorio.

## 6. Limitaciones declaradas

**Actualización (Fase 08.2):** el celular sí se persiste cifrado con AES-256-GCM y el cierre de
sesión revoca el JWT en el servidor. Las dos limitaciones siguientes quedaron resueltas; el detalle
y las evidencias están en `docs/informe-crud-perfil-fase-08.2.md`. El resto de esta sección se
conserva como estado histórico de la Fase 08.

- El celular **no se persiste**: no hay AES-256-GCM autorizado para `telefono_cifrado`; se informa en el formulario.
- No hay verificación de correo: la cuenta se crea `ACTIVO` y `email_verificado_en` queda `NULL`.
- Cerrar sesión borra el token de `sessionStorage`; **no revoca el JWT en el servidor** (no hay tabla de sesiones activas usada por este flujo).
- `POST /api/v1/necesidades` seguirá con 422 hasta que se siembren productos reales en una fase autorizada.
- No se activaron chat, WebSockets ni GPS. No se usó `localStorage` como base de datos.
- La valoración estética final sigue pendiente de revisión humana.

## 7. Comandos exactos para PowerShell 5.1

**Terminal 1 — API**
```powershell
cd C:\DonaConecta\DonaConecta\backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Angular**
```powershell
cd C:\DonaConecta\DonaConecta\frontend
npm start -- --host 127.0.0.1 --port 4200
```

**Terminal 3 — comprobaciones**
```powershell
cd C:\DonaConecta\DonaConecta\backend
uv run python -c "import httpx; r=httpx.get('http://127.0.0.1:8000/api/v1/health'); print(r.status_code, r.text)"
sqlcmd -S ".\SQLEXPRESS" -E -C -d DonaConectaDB_Pruebas -W -Q "SELECT COUNT(*) FROM dbo.usuarios"
cd ..\frontend
npm run build
npm test -- --watch=false
```

URLs: `http://127.0.0.1:4200/registro/donante`, `http://127.0.0.1:4200/registro/institucion`, `http://127.0.0.1:4200/iniciar-sesion`, `http://127.0.0.1:8000/docs`.

## 8. Estado de Git

Rama `integracion-avance-02`. El merge previo (`MERGE_HEAD=6034291`) permanece resuelto y **no se ejecutó ningún commit, push, merge, rebase, reset ni cambio de rama**. No se modificaron `Andrea`, `Jhon`, `main` ni `respaldo-avance-01`.

Mensaje de commit propuesto (sin ejecutar):

```
feat(integracion): conectar registro, acceso y perfil con FastAPI y SQL Server
```
