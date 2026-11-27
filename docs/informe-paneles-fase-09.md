# Informe de paneles administrativo e institucional — Fase 09 (Avance 02)

> Base autorizada para datos sintéticos: `DonaConectaDB_Pruebas`. `DonaConectaDB` no se modifica.
> Evidencias de API, SQL Server, build, pruebas y navegador registradas al cierre de la fase.

## 1. Alcance

La Fase 09 incorpora paneles reales para administrador y representante, verificación de
instituciones con auditoría transaccional, catálogo SQL de bienes materiales, CRUD de
necesidades y resultados reales en Explorar. La autenticación, el registro y las sesiones
revocables ya fueron cubiertos en Fase 08.2 y se reutilizan sin duplicarlos.

No se implementan GPS real, chat, notificaciones automáticas, pagos ni datos monetarios.
Todas las operaciones pasan por FastAPI y persisten en SQL Server; Angular no accede a la
base de datos ni usa `localStorage` como sustituto de ella.

## 2. Auditoría previa

- Rama verificada: `Andrea`. Avance 01 conservado en `1d5bc00`. Sin commits, pushes, merges ni
  cambios de rama.
- Backend integrado: 23 operaciones visibles en OpenAPI y 3 alias ocultos; autorización con roles
  activos leídos de SQL Server; registro público limitado a `DONANTE` y `REPRESENTANTE`.
- Frontend: 20 rutas públicas, servicios reales de registro/acceso/perfil/necesidades/directorio,
  catálogo informativo local de 41 bienes y buscador determinista.
- SQL: 42 tablas de aplicación, 79 FK, 9 vistas, 2 procedimientos transaccionales. Base principal
  con 0 filas de negocio; base de pruebas con datos sintéticos preexistentes.
- Hallazgo corregido en esta fase: existía una institución `VERIFICADA` sin fila en
  `verificaciones_institucion`; la verificación de Fase 09 escribe historial y auditoría en la
  misma transacción.
- El índice `UX_instituciones_foto_no_nula` ya está aplicado en `DonaConectaDB_Pruebas`; no se
  ejecuta DDL ni se toca la divergencia de `DonaConectaDB`.

## 3. Decisiones técnicas

| Decisión | Justificación |
|---|---|
| Reutilizar los endpoints reales de Jhon | Evita duplicar alta institucional, cola pendiente, verificación, publicación y compromisos. |
| Panel angular con guards de rol | La navegación oculta rutas ajenas; la autorización definitiva sigue en backend con roles activos y propiedad del recurso. |
| Verificación con transición + historial + auditoría | Impide saltos de estado y deja trazabilidad de quién verificó, cuándo y por qué. |
| Catálogo SQL con la unidad neutral `UN` | Los 41 bienes del catálogo informativo no declaran presentación comercial; `UN` es una unidad sembrada y no inventa formatos. La guía editorial se conserva separada. |
| Script DML restringido a `DonaConectaDB_Pruebas` | `ALLOW_MAIN_DB_WRITES=no`; idempotencia por claves naturales reales y sin DDL. |
| Cuenta administrativa sintética con secreto local | Contraseña generada fuera del repositorio, leída de archivo/variable o consola; rol asignado desde `dbo.roles`. |
| Baja lógica y revocación de sesiones | Conserva trazabilidad y evita que un token siga válido tras bloqueo o baja. |

## 4. Cambios implementados

### 4.1 Catálogo SQL y cuenta administrativa

- `database/scripts/010_catalogo_productos_fase09.sql`: DML transaccional e idempotente que deriva
  los 41 bienes del catálogo informativo, resuelve las categorías por código real y asocia la
  unidad neutral `UN`. No contiene DDL, `DELETE`, `UPDATE` sobre tablas permanentes ni datos
  personales. El guard de base se corrigió durante la ejecución: `RAISERROR` no admite
  `DB_NAME()` como argumento directo, por lo que ahora usa una variable `VARCHAR(128)`.
- `backend/scripts/provisionar_admin.py`: CLI que crea o reactiva `admin.sintetico@ejemplo.com`
  con rol `ADMINISTRADOR` real. Lee la contraseña de `--password-file`, variable de entorno o
  consola; no acepta contraseñas como argumento, no las imprime y exige
  `--confirmar-base-pruebas`. Verifica `DB_NAME()` dentro de la transacción antes de escribir.

### 4.2 Paneles, verificación y necesidades

**Backend** (`backend/app`): 14 operaciones nuevas documentadas en OpenAPI. Los routers
`productos_panel`, `admin_panel` e `institucional_panel` separan la presentación de la lógica;
`services/paneles_service.py` valida reglas y traduce errores; `repositories/paneles_repo.py`
ejecuta consultas parametrizadas; `core/reglas_paneles.py` contiene las transiciones puras y
`schemas/paneles_schema.py` define los DTO explícitos. `main.py` solo registra los routers.
El panel institucional deriva la institución del representante autenticado; el administrador
verifica roles activos en SQL Server y aplica `limit`/`offset`, filtros y búsqueda parametrizados.

**Frontend** (`frontend/src/app`): rutas `/admin` e `/institucional` con `rolGuard`,
`PanelLayout` y carga diferida; servicios `PanelApiService` y `BackendEstadoService` con
`HttpClient` real; ocho páginas de panel; navbar con acceso «Panel» según el rol de la sesión;
redirección de acceso por rol; Explorar/Necesidades con catálogo SQL, filtros y estados
honestos de carga, vacío y error. No se agregaron datos simulados ni almacenamiento local de
negocio.

## 5. Evidencias de ejecución

### 5.1 SQL Server

| Comprobación | Resultado real |
|---|---|
| Destino verificado antes del DML | `DB_NAME() = DonaConectaDB_Pruebas`; 5 códigos de categoría y unidad `UN` presentes. |
| Primera ejecución del catálogo | 41 productos del catálogo, 41 unidades `UN` asociadas, 41 marcadas como preferidas; totales 42/42 porque ya existía 1 producto previo. |
| Segunda ejecución (idempotencia) | Los mismos recuentos 41/41/41 y totales 42/42; ninguna fila duplicada. |
| Base principal intacta | `DonaConectaDB`: 0 productos, 0 producto_unidades, 0 usuarios y 0 instituciones. |
| Cuenta administrativa | `usuario_id=30`, `estado_cuenta=ACTIVO`, `hash_version=19`, hash PHC `argon2id`, rol `ADMINISTRADOR` activo. |
| Auditoría de aprovisionamiento | 1 evento `CUENTA_ADMIN_PROVISIONADA`, módulo `USUARIOS`, resultado `OK`. |

La contraseña se generó con `secrets.token_urlsafe(32)` y se guardó solo en
`C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-admin-password.txt`, fuera del repositorio.
No se muestra ni se versiona.

### 5.2 API REST y reglas de negocio

| Comprobación | Resultado real |
|---|---|
| Flujo donante → representante → administrador | **21/21** comprobaciones: health, tres logins, registro sintético, cola pendiente, `PENDIENTE → EN_REVISION → VERIFICADA`, resumen institucional, catálogo (42 productos), creación de necesidad, visibilidad en `/necesidades`, compromiso del donante, tres paneles de administrador, `403` a donante y `409` en transición inválida. |
| Edición, concurrencia y estados | **21/21** comprobaciones: perfil institucional persistido, `fila_version` expuesto, `409` por versión obsoleta, `PUBLICADA → PAUSADA → PUBLICADA`, edición de líneas bloqueada con compromiso, borrado de `PUBLICADA` rechazado, bloqueo/reactivación con revocación y recuperación de sesión, autocontrol del administrador (`403`) y auditoría. |
| Persistencia SQL de la verificación | Institución `DEMO-INST-FASE09` en `VERIFICADA`, con 2 filas de historial y 2 eventos de auditoría; vínculo principal y rol `REPRESENTANTE` activos. |
| Persistencia SQL de la operación | Necesidad `DEMO-NEC-FASE09-Arroz` en `PUBLICADA` con 1 producto; compromiso `PENDIENTE` con 1 producto; eventos `INSTITUCION_ESTADO` y `COMPROMISO_CREADO` en auditoría. |
| Pruebas Python | **24/24** (`uv run pytest -q`), con 17 pruebas nuevas de paneles y una advertencia de deprecación de `starlette.testclient`. |

Dos defectos reales detectados durante la verificación fueron corregidos: el dominio `.invalid`
era rechazado por `EmailStr` en el inicio de sesión, y la reactivación de una cuenta bloqueada no
restauraba sus roles. La reactivación ahora solo habilita roles vigentes en el modelo: donante y
administrador siempre, representante únicamente con vínculo activo e institución verificada.

### 5.3 Build, OpenAPI, pruebas Angular y navegador

| Comprobación | Resultado real |
|---|---|
| Build de producción | Correcto: **583,23 kB** iniciales y **112,73 kB** transferidos, dentro del presupuesto de 600 kB; 32 chunks diferidos. Solo avisos de deprecación de `@import` de Sass. |
| Pruebas Angular | **25 archivos y 69/69 pruebas** (`npm test -- --watch=false`). |
| OpenAPI/Swagger | **28 rutas, 36 operaciones, 45 esquemas**; 14 operaciones de panel, todas con resumen, respuestas y seguridad declarada. Sin descripciones ausentes en las operaciones de panel. |
| Navegador real (CDP) | **1789/1789** comprobaciones: 28 rutas implementadas más 404 en siete anchos (360–1920 px), título y metadescripción propios, un solo `h1`, sin desbordamiento horizontal, imágenes y anclas válidas, 0 errores de consola y 0 respuestas `5xx`. |
| Guardas y sesión | Sin sesión, `/admin` redirige a `/iniciar-sesion`; donante en `/institucional` y representante en `/admin` redirigen a `/perfil`. Menú móvil verificado `false → true → false`. |
| Datos reales en SPA | Los paneles muestran registros de `DonaConectaDB_Pruebas` consumidos desde API: institución sintética, usuarios, auditoría, perfil y necesidad. No se usaron datos falsos. |

La valoración estética sigue pendiente de revisión humana: la verificación anterior es
programática y no sustituye la inspección visual de composición, contraste y jerarquía.

## 6. Seguridad y privacidad

- Contraseñas Argon2id; JWT con `jti`; sesiones registradas por hash SHA-256 y revocables.
- DTO de panel sin `password_hash`, `token_hash`, nonces, claves ni coordenadas privadas.
- Consultas parametrizadas con PyODBC; errores homogéneos sin SQL, trazas ni credenciales.
- El registro público nunca crea `ADMINISTRADOR`; la cuenta sintética se aprovisiona por script local.
- La verificación y el cambio de estado administrativo escriben auditoría; no se registran contraseñas ni mensajes privados.

## 7. Limitaciones

- La valoración estética final requiere revisión humana; el modelo no puede inspeccionar capturas.
- No se afirma cifrado de extremo a extremo, TDE, HTTPS en producción, rate limiting ni cumplimiento legal formal.
- La convención histórica `DEMO-` no está aplicada a todos los datos preexistentes de la base de pruebas; los registros nuevos creados en esta fase usan el dominio válido de prueba `ejemplo.com`. El dominio `.invalid` documentado inicialmente se sustituyó porque `EmailStr` de Pydantic lo rechaza en el inicio de sesión.

## 8. Verificación final

- Rama activa: `Andrea` (sincronizada con `origin/Andrea`). No se modificaron `main`, `Jhon` ni
  `respaldo-avance-01`. No se ejecutaron commit, push, merge, rebase, `reset --hard`, `git clean`
  ni cambio de rama.
- `git diff --check`: sin errores de whitespace; solo avisos de normalización LF/CRLF en tres
  archivos TypeScript del frontend.
- `git status -sb`: cambios sin confirmar en backend, frontend, base de datos y documentación;
  ningún archivo `.env`, credencial, captura ni secreto versionado.
- Escrituras SQL limitadas a `DonaConectaDB_Pruebas` con `ALLOW_MAIN_DB_WRITES=no`;
  `DonaConectaDB` sigue sin datos de negocio nuevos.
- Comprobaciones ejecutadas: **21/21 + 21/21** de flujo de API en dos scripts independientes,
  **1789/1789** en navegador, **69/69** pruebas Angular, **24/24** pruebas Python y build correcto.
- Mensaje de commit propuesto (no ejecutado):
  `feat(paneles): integrar paneles reales, verificación y catálogo SQL del avance 02`.
