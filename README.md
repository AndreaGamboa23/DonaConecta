# DonaConecta

Plataforma web de impacto social que conecta ciudadanos donantes con organizaciones
sociales, comedores comunitarios, albergues infantiles y refugios de animales de
Huancayo, Junín, Perú.

DonaConecta gestiona **exclusivamente donaciones de bienes materiales**. No procesa
pagos, transferencias bancarias ni donaciones monetarias. Proyecto universitario de
Ingeniería de Sistemas e Informática — Universidad Continental.

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | Angular 22, TypeScript, HTML5, Bootstrap 5, SCSS/CSS, Leaflet |
| Backend | Python 3.13, FastAPI, Uvicorn, Pydantic, PyODBC, Argon2id, JWT, AES-256-GCM |
| Base de datos | Microsoft SQL Server 2025 Express, T-SQL, ODBC Driver 18 |
| Entorno Python | `uv` (`uv.lock`), sin gestores duplicados |
| Herramientas | Git, GitHub, OpenCode, Visual Studio Code |

Bootstrap 5 es la herramienta principal de diseño; el SCSS propio se reserva para la
identidad visual, siguiendo `AGENTS.md`.

## Estructura

```text
DonaConecta/
├── AGENTS.md                 → reglas permanentes
├── README.md                 → este documento
├── frontend/                 → SPA Angular
├── backend/                  → API FastAPI (backend/app/)
├── database/scripts/         → T-SQL versionado (001–012)
└── docs/                     → arquitectura, modelo, seguridad, informes y plan por fases
```

No hay repositorios Git anidados; la raíz es el único repositorio.

## Requisitos previos

- Node.js y npm (el proyecto fija `npm@12.2.1` en `package.json`).
- Python 3.13 y `uv`.
- SQL Server Express local `.\SQLEXPRESS` con `ODBC Driver 18 for SQL Server`.
- `sqlcmd` disponible en el PATH.
- Autenticación Windows local; ninguna credencial se versiona.

## Base de datos local

La base principal `DonaConectaDB` contiene catálogos y permanece sin datos de
negocio. Los datos sintéticos se escriben **sólo** en `DonaConectaDB_Pruebas`.

```powershell
# Esquema y seguridad de la base principal (scripts 001–008)
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -i database/scripts/001_crear_base_datos.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -i database/scripts/002_crear_tablas.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -i database/scripts/003_restricciones_integridad.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -i database/scripts/004_crear_indices.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -i database/scripts/005_catalogos_iniciales.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -i database/scripts/006_crear_vistas.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -i database/scripts/007_procedimientos_almacenados.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -i database/scripts/008_seguridad_permisos.sql

# Entorno de pruebas: catálogo de bienes, corrección de codificación y datos demo
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -d DonaConectaDB_Pruebas -i database/scripts/009_corregir_indice_foto_institucion.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -d DonaConectaDB_Pruebas -i database/scripts/010_catalogo_productos_fase09.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -d DonaConectaDB_Pruebas -i database/scripts/011_correcion_codificacion_fase091.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -d DonaConectaDB_Pruebas -i database/scripts/012_datos_demo_final.sql
```

`011` y `012` verifican `DB_NAME()` y se niegan a escribir en otra base. La creación
y el historial del entorno de pruebas se documentan en
`docs/entorno-datos-pruebas.md`.

## Backend

```powershell
cd backend
copy .env.example .env        # completar secretos sólo en el archivo local
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
uv run pytest -q
```

- Swagger: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI: `http://127.0.0.1:8000/openapi.json`
- Salud: `http://127.0.0.1:8000/api/v1/health`

Variables de entorno declaradas en `backend/.env.example` (sin valores sensibles):
`APP_NAME`, `APP_ENV`, `DB_DRIVER`, `DB_SERVER`, `DB_NAME`, `DB_TRUSTED_CONNECTION`,
`DB_ENCRYPT`, `DB_TRUST_CERT`, `ALLOW_MAIN_DB_WRITES`, `CORS_ORIGINS`,
`JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`, `TELEFONO_CLAVE_BASE64` y
`TELEFONO_CLAVE_VERSION`. Los secretos (`JWT_SECRET_KEY` y
`TELEFONO_CLAVE_BASE64`) se generan localmente y nunca se versionan. La plantilla
usa `DB_NAME=DonaConectaDB_Pruebas` y `ALLOW_MAIN_DB_WRITES=no`.

## Frontend

```powershell
cd frontend
npm ci
npm start       # http://localhost:4200/, proxy /api -> 127.0.0.1:8000
npm run build
npm test
```

El proxy de desarrollo está en `frontend/proxy.conf.json`. La SPA consume rutas
`/api/v1/...` reales; nunca se conecta a SQL Server directamente.

## Funcionalidades verificadas en esta entrega

- **Flujo real completo:** **12/12** comprobaciones contra `DonaConectaDB_Pruebas`:
  verificación administrativa de una institución sintética, punto de acopio con
  horario y coordenadas autorizadas, necesidad publicada, directorio, compromiso y
  Mis donaciones, chat persistente bidireccional, detalle con punto/estado, sesión
  GPS consentida, recepción parcial, cantidades recibidas/pendientes y
  notificaciones. Evidencia: `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-final-flow.log`.
- **Autorización:** **4/4** comprobaciones negativas (donante no confirma recepciones,
  usuario ajeno no lee chats, consultas privadas de puntos sin token `401`, y
  coordenadas públicas sólo cuando hay autorización). Evidencia:
  `dc-final-seguridad.log` en la misma ruta.
- **Backend:** routers de donaciones, puntos, entregas/recepciones, mensajería,
  notificaciones y GPS integrados en `backend/app/main.py`. OpenAPI expone
  **47 rutas, 59 operaciones y 89 esquemas**. `uv run pytest -q`: **75/75**.
- **Frontend:** Mis donaciones y detalle de compromiso, bandeja de conversaciones con
  persistencia e idempotencia, panel institucional de compromisos/puntos, mapa con
  coordenadas autorizadas y seguimiento GPS voluntario. Los cinco destinos móviles y
  las rutas privadas con guard de rol siguen activos. `npm test -- --watch=false`:
  **88/88** en 33 archivos; `npm run build`: **590,83 kB** iniciales y
  **114,74 kB** transferidos, dentro del presupuesto de 600 kB.
- **Codificación:** script `011` ejecutado en `DonaConectaDB_Pruebas`; 83 filas en
  16 columnas corregidas con 7 pares exactos de UTF-8 mal interpretado. Recuento
  final de restos: `0`. Reejecución idempotente; no se crearon tablas permanentes.
- **Datos sintéticos:** script `012` ejecutado dos veces con recuentos idénticos.
  Las seis instituciones `DEMO-FINAL-` (iniciales y del flujo) están verificadas y
  visibles en el directorio; no se inventaron contactos, testimonios ni
  estadísticas. Los dos mensajes persistidos están cifrados con AES-256-GCM.
- **Aislamiento:** `DonaConectaDB` sigue intacta y sin datos de negocio;
  `ALLOW_MAIN_DB_WRITES=no`. No se ejecutó DDL, commit, push, merge ni cambio de
  rama. `git diff --check` sólo muestra avisos de normalización LF/CRLF.

**Pendientes declarados:** el transporte WebSocket de chat/GPS no se implementó; la
versión actual usa polling HTTP. La regla de compromiso duplicado sigue siendo
secuencial porque la corrección concurrente del procedimiento no fue autorizada. No
se repitieron las comprobaciones CDP de fases anteriores ni se hizo inspección
visual; la valoración estética final queda pendiente de revisión humana. Detalle en
`docs/informe-implementacion-final.md` y `docs/contrato-integracion-final.md`.

## Documentación

`AGENTS.md`, `docs/arquitectura.md`, `docs/sistema-diseno.md`,
`docs/decisiones-tecnicas.md`, `docs/requisitos-funcionales.md`,
`docs/requisitos-no-funcionales.md`, `docs/mapa-navegacion.md`,
`docs/seguridad-privacidad.md`, `docs/plan-desarrollo.md`, `docs/modelo-*.md`,
`docs/diccionario-datos.md`, `docs/normalizacion.md`, `docs/reglas-negocio.md`,
`docs/contrato-api.md`, los informes de fases y `backend/README.md`.

Consultar `AGENTS.md` antes de cualquier modificación.
