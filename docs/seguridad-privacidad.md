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

Las páginas públicas **no solicitan ni almacenan datos personales**. No hay formularios,
cookies de sesión, `localStorage` como base de datos, API ni conexión a SQL Server. En la
Fase 05.1 se documentó el modelo de datos y su estrategia de seguridad; **no se implementó**
ningún mecanismo. La información de privacidad mostrada al usuario sigue siendo orientativa.

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

### 11.2 Sesiones

Access token de corta duración firmado; refresh token opaco cuyo hash se guarda en
`tokens_seguridad`. La renovación rota el token y revoca el anterior. `logout` revoca la
sesión. Rate limiting en login, recuperación, registro, envío de mensajes e inicio de GPS.

### 11.3 Verificación en Fase 06/07

Antes de elegir TDE, Always Encrypted u otra función nativa se debe comprobar qué ofrece
realmente SQL Server 2025 Express en la instancia `.\SQLEXPRESS`. Mientras tanto, la única
estrategia afirmable es la de aplicación descrita arriba. Toda afirmación de funcionamiento
queda sujeta a pruebas reales.
