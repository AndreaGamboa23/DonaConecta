# Seguridad y privacidad desde el diseño

Documento de referencia de la Fase 04.2. Define la estrategia progresiva de DonaConecta. **No
afirma cumplimiento legal ni certificaciones**: la normativa peruana de protección de datos debe
evaluarse formalmente antes de cualquier declaración.

## 1. Principios

- Confidencialidad, integridad, disponibilidad, autenticación, autorización y trazabilidad.
- Privacidad desde el diseño, mínimo privilegio y defensa en profundidad.
- Referencia OWASP para aplicaciones web y APIs.
- El frontend oculta rutas por rol, pero el backend **siempre** verifica permisos.
- No se implementa criptografía propia.

## 2. Estado actual

Las páginas públicas incorporan formularios de registro y acceso que **validan localmente pero no
envían ni almacenan datos**: no hay cookies de sesión, tokens, `localStorage` como base de datos,
llamadas HTTP reales ni conexión a SQL Server. `BackendEstadoService.integracionHabilitada`
está en `false`, por lo que cada servicio devuelve un error controlado. En la Fase 05.1 se
documentó el modelo de datos y su estrategia de seguridad; los mecanismos de backend siguen
**sin implementar**. La información de privacidad mostrada al usuario es orientativa.

La matriz de protección aprobada en la Fase 05.1 está en la sección 11. Los detalles de
estructura están en `docs/modelo-logico.md`, `docs/modelo-fisico.md` y
`docs/diccionario-datos.md`.

## 3. Autenticación y autorización (Fase 09)

| Tema | Decisión |
|---|---|
| Contraseñas | Argon2id mediante librería mantenida. Prohibidos texto plano, cifrado reversible, MD5, SHA-1 y SHA-256 simple. |
| Recuperación | Tokens temporales de un solo uso, caducidad corta y límite de intentos. |
| Sesión | Estrategia segura de token/cookie definida e implementada en backend; secretos en variables de entorno. |
| Roles | Visitante, donante, representante institucional y administrador. El registro público nunca crea administradores. |
| Autorización | Verificar rol **y** propiedad del recurso en cada operación sensible, incluidas las conexiones en tiempo real. |
| DTO | Respuestas explícitas sin `PasswordHash`, tokens ni campos internos. |

## 4. API, datos y transporte (Fases 06–07)

- Consultas parametrizadas con `pyodbc`; está prohibida la concatenación de cadenas SQL.
- Validación de entradas y salidas con Pydantic.
- CORS restringido a orígenes autorizados.
- Cabeceras de seguridad y protección CSRF cuando el mecanismo de sesión lo requiera.
- Rate limiting en login, recuperación, registro y operaciones sensibles.
- Errores sin stack traces, rutas internas ni credenciales.
- HTTPS/WSS/TLS en producción. `TrustServerCertificate=yes` solo en el entorno local
  autorizado; en producción se valida un certificado confiable.
- SQL Server: 3FN, integridad referencial, transacciones y bloqueo/validación para impedir
  compromisos que superen lo disponible.

## 5. Secretos, auditoría y respaldos

- `.env` ignorado por Git; `.env.example` sin valores sensibles; ninguna credencial en el
  repositorio ni en el frontend.
- Auditoría de operaciones críticas sin registrar contraseñas, tokens, mensajes completos ni
  coordenadas innecesarias.
- Respaldos protegidos y pruebas de restauración planificadas antes de producción.

## 6. Cifrado

- Evaluar AES-256-GCM u otro cifrado autenticado **solo** para datos recuperables que lo
  justifiquen.
- Documentar qué datos se cifran, versión de claves y rotación. Las claves no se guardan en el
  repositorio ni se envían al navegador.
- No anunciar cifrado de extremo a extremo en el chat mientras solo exista TLS y cifrado en
  reposo.

## 7. Archivos y evidencias

- Validar extensión, MIME real, tamaño y nombre seguro; inspeccionar el contenido, no solo el
  nombre declarado.
- Documentos privados fuera de rutas públicas, con descarga autorizada.
- Evidencias: eliminar EXIF innecesario y proteger imágenes de menores o personas vulnerables.
- Fotografías: solo con licencia verificable o proporcionadas por el usuario; nunca presentarlas
  como evidencia real de actividades de DonaConecta.

## 8. GPS y ubicación

- Consentimiento explícito e inicio manual; nunca rastreo automático o permanente.
- Indicador visible, botón de detención, caducidad de la sesión y mínimo privilegio.
- Alternativa manual por estados de la entrega.
- Coordenadas privadas: no se publican, no se comparten con terceros y **no** son prueba de
  recepción; la institución confirma la entrega.

## 9. Chat y notificaciones

- Mensajería persistida en SQL Server, con autorización de participantes también en WebSocket.
- Reconexión, control de lecturas, reportes y mecanismos antiabuso.
- `localStorage` nunca sustituye a la base de datos del chat.
- Notificaciones sin información sensible en pantallas bloqueadas.

## 10. Verificación pendiente

Antes de producción deben ejecutarse pruebas de seguridad y una evaluación formal de la
normativa aplicable. Esta fase solo deja la estrategia documentada y la interfaz libre de
datos personales; no declara conformidad legal.

## 11. Matriz de protección aprobada en Fase 05.1

| Dato | Sensibilidad | Almacenamiento | Recuperación | Protección | Autorizados | Conservación | Justificación |
|---|---|---|---|---|---|---|---|
| Contraseña | Crítica | `usuarios.password_hash` | No se recupera; se verifica | **Hash Argon2id** con parámetros incrustados y `hash_version` | Solo `security/` | Mientras la cuenta exista | Nunca debe poder revertirse. Prohibidos MD5/SHA-1/SHA-256 simple. |
| Correo | Alta | `usuarios.email` | Sí | Normalización, `UNIQUE`, DTO restringido | Propietario y admin | Mientras la cuenta exista | Identifica la cuenta y sirve para verificación. |
| Teléfono | Alta | `usuarios.telefono_cifrado` | Sí | **AES-256-GCM** evaluado; nonce de 12 bytes y `clave_version` | Propietario; contactos autorizados | Hasta baja de cuenta o solicitud de supresión | Dato personal recuperable y sensible. |
| Tokens de verificación/recuperación/renovación | Crítica | `tokens_seguridad.token_hash` | No: solo se guarda SHA-256 | Hash del token aleatorio, expiración, uso único, revocación y rotación (`sucede_a_token_id`) | Solo `security/` | Hasta expiración o revocación | Evita que una filtración de BD permita suplantar sesiones. |
| Documento de verificación institucional | Alta | `institucion_documentos.numero_documento_cifrado` + archivo privado | Sí | AES-256-GCM + almacenamiento protegido | Revisor administrativo autorizado | Según política de verificación | Se necesita validar la solicitud, no publicarlo. |
| Coordenadas GPS privadas | Alta | `gps_ultima_ubicacion.coordenadas_cifradas` | Sí, mientras la sesión esté activa | AES-256-GCM; lat/long canónicas `DECIMAL(9,6)` validadas antes de cifrar | Donante que comparte y representantes autorizados de la entrega | Hasta detener, cancelar, vencer o retirar consentimiento | Minimización: ni recorrido ni exposición pública. |
| Coordenadas de puntos de acopio | Pública | `instituciones.latitud/longitud`, `puntos_acopio.latitud/longitud` | Sí | Sin cifrar; son datos publicables | Cualquier visitante | Mientras el punto esté activo | No son ubicación de personas. |
| Contenido del chat | Alta | `mensajes.contenido` | Sí | Control de acceso en BD + **TLS en tránsito**; cifrado en reposo evaluado según infraestructura | Solo participantes activos | Hasta cierre o política de retención | **No se anuncia cifrado de extremo a extremo.** No hay clave en el navegador. |
| Adjuntos y evidencias | Alta | Metadatos en `archivos`; binario fuera de `frontend/public/` | Sí | Validación de MIME real, extensión, tamaño y nombre; EXIF saneado; descarga autorizada | Propietario, participantes de la entrega y admin | `EVIDENCIA_RETENCION_DIAS` configurable | Evita exponer documentos e imágenes de personas vulnerables. |
| Notificaciones | Media | `notificaciones` | Sí | Cuerpo <= 500, sin mensajes completos ni coordenadas | Destinatario | Hasta archivado o retención | Evita filtrar contenido en pantallas bloqueadas. |
| Auditoría | Media | `auditoria_eventos` | Sí | Inmutable; sin secretos, tokens ni coordenadas | Admin | Según política de conservación | Trazabilidad sin exponer datos sensibles. |
| Respaldos | Alta | Fuera del repositorio | Sí | Cifrado del archivo de respaldo y acceso restringido; prueba de restauración | Administrador de BD | Según política local | Disponibilidad sin crear una copia insegura. |

### 11.1 Distinciones obligatorias

- **Hashing:** contraseñas (Argon2id) y tokens (SHA-256). No es reversible y no se usa para
  cifrar datos que deban recuperarse.
- **Cifrado en tránsito:** HTTPS/TLS y WSS en producción. `TrustServerCertificate=yes` solo en
  desarrollo local.
- **Cifrado en reposo:** AES-256-GCM a nivel aplicación para los datos marcados arriba. Las
  claves viven en variables de entorno o gestor seguro, nunca en código ni en el repositorio.
- **No implementado:** cifrado de extremo a extremo del chat, criptografía propia y funciones
  nativas de SQL Server no verificadas en la edición instalada.

### 11.2 Sesiones (estado real en Fase 08.2)

El backend emite un JWT de acceso con `sub`, `correo`, `roles`, `jti`, `iat` y `exp`. En
`tokens_seguridad` se guarda el **SHA-256 del token**, nunca el token. La fila usa el valor de
catálogo `tipo = REFRESCAR_SESION` exigido por el `CHECK` del modelo, pero **no es un refresh
token**: no hay renovación ni rotación implementadas. Cada petición protegida valida firma,
expiración, sesión no revocada y cuenta activa en SQL Server. `logout` revoca la sesión actual;
el cambio de contraseña, el cambio de correo y la baja revocan todas las sesiones. El token se
guarda en `sessionStorage` del navegador, no en una cookie `HttpOnly`. El rate limiting sigue
pendiente y no se afirma implementado.

### 11.3 Verificación en Fase 06

La comprobación prevista se ejecutó en la instancia real `.\SQLEXPRESS`:

| Comprobación | Resultado real |
|---|---|
| `SERVERPROPERTY('EngineEdition')` | `4` (Express) |
| `SERVERPROPERTY('Edition')` | `Express Edition (64-bit)` |
| `DATABASEPROPERTYEX('DonaConectaDB','EncryptionState')` | `NULL` |
| `sys.column_master_keys` | 0 filas |
| `sys.symmetric_keys` | 0 filas |
| `IsIntegratedSecurityOnly` | `1` (autenticación Windows) |

**No se afirma** TDE, Always Encrypted, cifrado nativo de columnas, cifrado de respaldo ni
cifrado de extremo a extremo. Ninguno fue activado. La estrategia de aplicación iniciada en Fase
08.2 cubre Argon2id para contraseñas y AES-256-GCM para el celular; el correo y la coordenada GPS
autorizada siguen pendientes.

### 11.4 Aislamiento de privilegios verificado en Fase 06

`008_seguridad_permisos.sql` creó `dc_app` y `dc_admin` sin contraseñas versionadas, además del
usuario `dc_app_usuario WITHOUT LOGIN` exclusivamente para comprobar permisos con `EXECUTE AS`.
Resultado real con `HAS_PERMS_BY_NAME`:

| Permiso | Resultado |
|---|---|
| `SELECT` en `dbo.roles` | 1 |
| `INSERT` en `dbo.roles` | 0 |
| `INSERT` en `dbo.compromisos` | 1 |
| `DELETE` en `dbo.auditoria_eventos` | 0 |
| `EXECUTE` en `dbo.usp_RegistrarCompromiso` | 1 |

`dc_admin` puede mantener catálogos, pero no tiene permisos DDL. La cuenta Windows de aplicación
debe crearse manualmente fuera del repositorio; la plantilla está documentada en el encabezado del
script. Los secretos no se versionaron y los errores de negocio de los procedimientos no exponen
SQL, trazas ni credenciales: FastAPI deberá traducirlos a un cuerpo homogéneo en fases posteriores.

### 11.5 Pendiente de Fase 07 en adelante

- Implementar hashing Argon2id y cifrado autenticado AES-256-GCM en `security/`, con gestión de
  claves fuera del repositorio y rotación documentada antes de usar datos personales reales.
- Evaluar cifrado del archivo de respaldo y, en producción, `TrustServerCertificate=no`, HTTPS/WSS
  y certificados válidos. Nada de esto se declara realizado en Fase 06.
- Repetir la revisión de OWASP y la evaluación formal de la normativa peruana antes de afirmar
  conformidad legal.

### 11.6 Implementación verificada en Fase 08.2

| Medida | Estado real | Evidencia |
|---|---|---|
| Contraseñas | Argon2id (`argon2-cffi`, versión PHC `19`). | Hash verificado en SELECT tras registro y cambio de contraseña. |
| Celular | AES-256-GCM, nonce aleatorio de 12 bytes por escritura, versión de clave `1`, clave de 32 bytes en `backend/.env`. | SELECT de `telefono_cifrado`, `telefono_nonce` y `telefono_clave_version`; la API devuelve `•••• 4321` / `•••• 7665`. |
| Gestión de clave | Fuera del repositorio; `.env.example` sin valor sensible; `git check-ignore` confirma `.env` ignorado. | Sin secretos en código, logs, respuestas ni documentación. |
| Sesiones | JWT con `jti`; SHA-256 del token en SQL Server; revocación individual y total. | `401` tras logout, cambio de credenciales y baja; `DELETE /auth/sesion` `204`. |
| Perfil | DTO sin `password_hash`, `token_hash`, nonce ni clave; celular enmascarado. | `PerfilResponse` verificado en OpenAPI y en respuestas reales. |
| Autorización | Token válido + sesión activa + cuenta activa + roles reales; propiedad verificada en `/{id}/perfil`. | `401`, `403` y `404` obtenidos en pruebas reales. |
| Baja lógica | Reautenticación, confirmación `BAJA`, bloqueo por compromisos activos, transacción y auditoría. | `204` y SELECT con `estado_cuenta='BAJA'`, roles `INACTIVO`, 0 sesiones activas y fila conservada. |

Sigue pendiente: rate limiting, verificación de correo con envío real, HTTPS/TLS en producción,
rotación automática de claves, cifrado de documentos privados y coordenadas GPS. Detalle completo
en `docs/informe-crud-perfil-fase-08.2.md`.

### 11.7 Paneles y verificación en Fase 09

- **Cuenta administrativa sintética:** se aprovisiona solo en `DonaConectaDB_Pruebas` mediante
  `backend/scripts/provisionar_admin.py`. Exige `--confirmar-base-pruebas`, comprueba `DB_NAME()`
  dentro de la transacción y lee la contraseña de archivo local, variable de entorno o consola.
  No hay contraseña en el código, en argumentos visibles ni en el repositorio.
- **Dominio de correo:** la cuenta usa `admin.sintetico@ejemplo.com`. El dominio reservado
  `.invalid` fue rechazado por `EmailStr` de Pydantic en el inicio de sesión; se conserva la
  convención de datos sintéticos con un dominio válido y claramente de prueba.
- **Autorización de paneles:** cada endpoint verifica roles activos en SQL Server. Los DTO de
  administración excluyen `password_hash`, hashes de token, nonces, claves y teléfonos cifrados.
  El panel institucional deriva la institución del representante autenticado; no acepta un
  `id_institucion` proporcionado por el cliente.
- **Verificación:** las transiciones de estado están restringidas; `RECHAZADA` y `SUSPENDIDA`
  requieren motivo; el historial y la auditoría se escriben en la misma transacción y solo se
  activa el vínculo principal del representante.
- **Necesidades:** la edición de líneas se bloquea cuando existen compromisos; `fila_version`
  produce `409` ante actualizaciones concurrentes; la baja solo aplica a borradores sin historial.
- **Sin cambios de cifrado:** no se agregó cifrado nuevo en esta fase. Siguen sin afirmarse TDE,
  extremo a extremo, HTTPS en producción ni rate limiting.
