# Informe de CRUD real, perfil personal y seguridad — Fase 08.2

**Rama:** `integracion-avance-02` · **Fecha:** 2026-11-26 · **Base funcional:** `DonaConectaDB_Pruebas`

Este documento continua el `docs/informe-integracion-registro-fase-08.md`. Las limitaciones que allí se
declararon sobre el celular y la revocación de sesiones quedaron resueltas en esta fase; el informe
anterior se conserva como evidencia histórica del diagnóstico inicial.

## 1. Alcance implementado

### Backend (`backend/src/backend/` visto como `backend/app/` desde la carpeta del proyecto)

| Capa | Archivo | Responsabilidad |
|---|---|---|
| API | `app/routers/usuarios.py` | Rutas del perfil propio y credenciales. Documenta resumen, parámetros, respuestas y errores. |
| API | `app/routers/auth.py` | Registro, login y revocación de la sesión actual. Respuestas `409/401/403/422/503` documentadas. |
| Negocio | `app/services/perfil_service.py` | Diferencia `PUT` de `PATCH`, valida campos permitidos, reautentica, revoca sesiones y aplica baja lógica. |
| Negocio | `app/services/registro_service.py` | Persiste el celular cifrado durante el registro atómico. |
| Repositorio | `app/repositories/usuarios_repo.py` | Consultas parametrizadas, sesiones, auditoría, actividad y SELECT de verificación. |
| Seguridad | `app/core/security.py` | Argon2id, JWT con `jti`, comprobación de sesión activa y roles reales de SQL Server. |
| Seguridad | `app/core/cifrado.py` | AES-256-GCM del celular, nonce aleatorio y versión de clave. |
| Esquemas | `app/schemas/usuarios_schema.py` | Pydantic con `extra='forbid'`, alias `camelCase`, validación de confirmaciones y DTO sin secretos. |
| Pruebas | `backend/tests/test_perfil_seguridad.py` | Pruebas unitarias de cifrado, enmascaramiento, hashes y validación de contraseñas. |

### Frontend (`frontend/src/app/`)

- `features/perfil/pages/perfil/`: perfil con cuatro pestañas —Información personal, Actividad,
  Preferencias y Seguridad y privacidad—, formularios reactivos, estados vacíos honestos y sin
  identificadores protagonistas ni botones duplicados.
- `features/perfil/services/perfil-api.service.ts`: `GET`, `PUT` y `PATCH` reales contra
  `/api/v1/usuarios/me`, además de credenciales y baja.
- `core/services/sesion-api.service.ts`: `DELETE /api/v1/auth/sesion` antes de borrar el JWT local;
  si falla la revocación remota, la pestaña igualmente deja de usar el token.
- `shared/components/navbar/navbar.ts`: usa el mismo servicio, por lo que el nombre y el estado de
  sesión se actualizan en cuanto termina la operación.
- `features/autenticacion/pages/iniciar-sesion/`: mensajes diferenciados para credenciales
  incorrectas y cuenta dada de baja.
- Los avisos obsoletos «Todavía no se guarda: falta cifrado autorizado para este dato» se
  sustituyeron por «Se guarda cifrado para proteger tu privacidad» en ambos formularios de registro.

## 2. Contrato HTTP verificado

| Método y ruta | Uso | Respuestas documentadas |
|---|---|---|
| `POST /api/v1/auth/registro` | Crear donante o representante en una transacción. | `201`, `409`, `422`, `503` |
| `POST /api/v1/auth/login` | Autenticar y registrar sesión en SQL Server. | `200`, `401`, `403`, `422` |
| `DELETE /api/v1/auth/sesion` | Revocar el token de la sesión actual. | `204`, `401` |
| `GET /api/v1/usuarios/me` | Perfil completo del usuario autenticado. | `200`, `401`, `404`, `422` |
| `GET /api/v1/usuarios/me/actividad` | Contadores calculados desde tablas reales. | `200`, `401` |
| `GET /api/v1/usuarios/{usuario_id}/perfil` | Perfil por identificador, sólo el propio. | `200`, `401`, `404` |
| `PUT /api/v1/usuarios/me` | Reemplazar la representación editable completa. | `200`, `401`, `409`, `422` |
| `PATCH /api/v1/usuarios/me` | Modificar sólo los campos presentes. | `200`, `401`, `409`, `422` |
| `PATCH /api/v1/usuarios/me/contrasena` | Cambiar contraseña con reautenticación. | `204`, `401`, `422` |
| `PATCH /api/v1/usuarios/me/correo` | Cambiar correo con reautenticación. | `204`, `401`, `409`, `422` |
| `DELETE /api/v1/usuarios/me` | Baja lógica con confirmación y reautenticación. | `204`, `401`, `409`, `422` |

Todas las operaciones del perfil exigen `Authorization: Bearer <JWT>`. La documentación OpenAPI
incluye `security`, cuerpo de petición cuando corresponde y respuestas de error. Swagger UI y ReDoc
responden `200`.

### Ejemplos de cuerpo (sin valores sensibles)

`PUT /api/v1/usuarios/me`:

```json
{
  "nombres": "InterfazActualizada",
  "apellidos": "GuardadaEjemplo",
  "telefono": "998877665",
  "distritoId": 14,
  "preferenciaNotificacion": "TODAS"
}
```

`PATCH /api/v1/usuarios/me`:

```json
{ "preferenciaNotificacion": "NINGUNA" }
```

`PATCH /api/v1/usuarios/me/contrasena`:

```json
{
  "passwordActual": "<clave sintética>",
  "passwordNueva": "<clave sintética nueva>",
  "confirmacion": "<clave sintética nueva>"
}
```

`PATCH /api/v1/usuarios/me/correo`:

```json
{
  "nuevoCorreo": "f082.ejemplo.nuevo@ejemplo.com",
  "confirmacionCorreo": "f082.ejemplo.nuevo@ejemplo.com",
  "password": "<clave sintética>"
}
```

`DELETE /api/v1/usuarios/me`:

```json
{ "password": "<clave sintética>", "confirmacion": "BAJA" }
```

La respuesta de perfil contiene `telefono_enmascarado` con el formato `•••• 7665` y
`telefono_guardado: true`. No contiene `password_hash`, `token_hash`, nonce, clave ni JWT.

## 3. Decisiones técnicas y seguridad

- **Argon2id:** los hashes conservan la versión `19` del formato PHC de `argon2-cffi`. Nunca se
  registran contraseñas en texto plano ni en respuestas.
- **Sesiones:** el JWT incluye `jti`, `iat` y `exp`. La fila en `tokens_seguridad` guarda el
  **SHA-256 del token**, no el token. La fila usa el valor de catálogo
  `tipo = REFRESCAR_SESION` permitido por el `CHECK` existente; **no afirma que sea un refresh
  token ni implementa rotación**. Toda petición protegida valida firma, expiración, sesión no
  revocada y cuenta activa en SQL Server. Los roles del token son informativos: la autorización
  usa los roles activos leídos de la base.
- **Cifrado del celular:** AES-256-GCM con nonce aleatorio de 12 bytes por operación, versión de
  clave `1` y clave de 32 bytes leída sólo desde `backend/.env`. La clave no se versiona, no se
  muestra en logs y `.env.example` no contiene valores sensibles. Si la clave falta o no es válida,
  la operación falla con `503 CIFRADO_NO_CONFIGURADO` en lugar de guardar texto plano. Dependencia
  justificada: `cryptography==46.0.7`.
- **PUT frente a PATCH:** `PUT` exige la representación editable completa —nombres, apellidos y,
  para donantes, distrito y preferencia—. `PATCH` distingue un campo omitido de `telefono: null`,
  que elimina el valor cifrado. Roles, identificadores, estados y credenciales no son editables
  desde el perfil general: `extra='forbid'` devuelve `422 CAMPO_NO_PERMITIDO`.
- **Autorización por propiedad:** `GET /api/v1/usuarios/{id}/perfil` devuelve `404` tanto para un
  identificador ajeno como para uno inexistente, evitando enumeración de cuentas.
- **Baja lógica:** requiere contraseña actual y confirmación literal `BAJA`. Si existen
  compromisos `PENDIENTE` o `ACEPTADO`, devuelve `409`. En una sola transacción marca
  `estado_cuenta = 'BAJA'` y `fecha_baja`, pasa los roles a `INACTIVO`, los vínculos institucionales
  a `RETIRADO`, revoca las sesiones y escribe auditoría. La fila y sus relaciones se conservan.
- **Auditoría:** se registran `PERFIL_ACTUALIZADO`, `CONTRASENA_CAMBIADA`, `CORREO_CAMBIADO`,
  `SESION_CERRADA` y `CUENTA_BAJA`, sin contraseñas, tokens ni mensajes completos.
- **Actividad:** los cinco contadores se calculan con `COUNT` y `JOIN` sobre compromisos, entregas,
  recepciones, conversaciones y auditoría. No hay cifras estimadas.
- **Base de datos:** todas las consultas son parametrizadas con `pyodbc`. Las escrituras usan
  transacción y la barrera `ALLOW_MAIN_DB_WRITES=no` sigue bloqueando escrituras en
  `DonaConectaDB`. No se ejecutó DDL ni DML estructural en esta fase.

## 4. Evidencia funcional real

### 4.1 API y persistencia (`dc-f082-crud.py`, 34/34 comprobaciones)

El script creó cuentas sintéticas nuevas con patrón `f082.crud.<sello>@ejemplo.com`, ejerció la API en
ejecución y verificó los resultados con `sqlcmd`/PyODBC sobre `DonaConectaDB_Pruebas`.

| Grupo | Comprobaciones representativas | Resultado |
|---|---|---|
| Creación | `POST` registro `201`; SELECT con cuenta `ACTIVO`, hash Argon2id, distrito, consentimiento, rol y celular cifrado con nonce y versión. | OK |
| Lectura | `GET /me` `200`; DTO sin secretos. | OK |
| Reemplazo | `PUT` `200`; SELECT con nombres, apellidos, distrito y preferencia persistidos; la respuesta coincide con la base. | OK |
| Parche | `PATCH` `200` sin sobrescribir otros campos; `409` por correo duplicado; `422` por campo prohibido. | OK |
| Autorización | `404` perfil ajeno, `403` rol insuficiente, `401` sin token, `404` recurso inexistente. | OK |
| Credenciales | Cambio de correo y contraseña `204`; tokens anteriores revocados; login con credenciales nuevas `200`; login con la contraseña anterior falla. | OK |
| Sesión | `DELETE /auth/sesion` `204`; token inutilizable después del logout. | OK |
| Actividad | `GET /me/actividad` `200` con contadores reales (`historial: 4` en la cuenta de prueba). | OK |
| Baja | `DELETE /me` `204`; token inutilizable; login bloqueado; SELECT con `BAJA`, roles inactivos, cero sesiones activas, fila, perfil de donante y auditoría conservados. | OK |
| Aislamiento | `DonaConectaDB`: **0 usuarios**, sin cambios. | OK |

Resultado final: **34/34 comprobaciones**.

### 4.2 Navegador real (CDP/Edge headless, 20/20 comprobaciones)

Flujo completo desde Angular, sin datos ni sesiones simuladas:

1. `/registro/donante` → `POST /auth/registro` `201` → `/perfil` → `GET /me` `200`. El navbar
   muestra el nombre actualizado y el perfil muestra el correo, el distrito y `•••• 4321`.
2. Pestaña Información personal: `PUT /me` `200`; la máscara pasa a `•••• 7665` y persiste tras
   recargar la página.
3. Composición responsive de `/perfil` en 360, 390, 576, 768, 1024, 1440 y 1920 px: 0
   desbordamientos horizontales, un solo `h1` y 0 imágenes rotas.
4. Pestaña Preferencias: `PATCH /me` `200`; el valor `NINGUNA` persiste tras recargar.
5. Pestaña Actividad: `GET /me/actividad` `200`; estado vacío útil con acceso a
   «Explorar necesidades», sin cifras inventadas.
6. Pestaña Seguridad: `PATCH /me/contrasena` `204`, cierre de sesión y login con la clave nueva;
   `PATCH /me/correo` `204`, cierre y login con el correo nuevo.
7. Cerrar sesión: `DELETE /auth/sesion` `204`; al volver a `/perfil` aparece el estado sin sesión.
8. Baja: `DELETE /me` `204` y login posterior `401` con el mensaje de cuenta dada de baja.

Se observaron **26 eventos de red `/api`** y **0 errores de consola inesperados**. El único error
de consola registrado fue el `401` provocado deliberadamente al final de la prueba. Las capturas
quedaron en `C:\Users\ANDREA\AppData\Local\Temp\opencode`, fuera del repositorio.

### 4.3 Documentación de la API (OpenAPI/Swagger, 42/42 comprobaciones)

Para las once operaciones anteriores se verificó que existen en `/openapi.json`, que declaran sus
códigos de respuesta, que incluyen cuerpo cuando corresponde y que las operaciones protegidas
declaran autenticación. `PerfilResponse` no expone secretos y sí expone el celular enmascarado.
`/docs` y `/redoc` devuelven `200`.

## 5. Compilación, pruebas y estado de Git

| Comando | Resultado |
|---|---|
| `npm run build` | Correcto: **569,46 kB** iniciales y **110,23 kB** transferidos, dentro del presupuesto de 600 kB. Persisten las advertencias de deprecación de `@import` de Sass, anteriores a esta fase. |
| `npm test -- --watch=false` | **20 archivos, 50/50 pruebas** aprobadas. Las 44 pruebas previas se conservaron; se añadieron 6 pruebas de perfil, servicios y sesión. |
| `uv run pytest -q` | **7/7** aprobadas. |
| `uv run python -m compileall -q app` | Correcto. |
| `git diff --check` y `git diff --cached --check` | Sin errores de whitespace; sólo avisos de normalización LF/CRLF. |
| `git status -sb` | Rama `integracion-avance-02`, cambios sin commitear; merge anterior conservado. |

No se ejecutaron commit, push, merge, rebase, `reset --hard` ni `git clean`. No se cambió de rama
ni se modificaron `Andrea`, `Jhon`, `main` ni `respaldo-avance-01`. Las cuatro cuentas previas
señaladas en el informe de Fase 08 permanecen `ACTIVO` y no fueron modificadas.

## 6. Limitaciones declaradas

- No hay proveedor de correo configurado: el cambio de correo se persiste y se registra en auditoría,
  pero **no envía mensaje ni marca el correo como verificado**.
- El JWT se guarda en `sessionStorage` del navegador; no es una cookie `HttpOnly`. La revocación
  server-side existe, pero el token sigue siendo legible por scripts de la propia pestaña.
- La clave AES está en el entorno local de la máquina de desarrollo. No se implementó rotación
  automática; el campo de versión permite hacerla manualmente en el futuro.
- No se activaron chat, WebSockets, GPS real ni fotografías simuladas. No se usó `localStorage`
  como sustituto de la base de datos.
- La compilación y las pruebas automáticas no sustituyen la valoración estética humana; ésta sigue
  pendiente.

## 7. Mensaje de commit propuesto (sin ejecutar)

```
feat(perfil): completar CRUD real, sesiones revocables y celular cifrado
```
