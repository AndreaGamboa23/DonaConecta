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

## 2. Estado actual de esta fase

Las páginas públicas **no solicitan ni almacenan datos personales**. No hay formularios,
cookies de sesión, `localStorage` como base de datos, API ni conexión a SQL Server. La
información de privacidad mostrada al usuario es orientativa y describe el diseño previsto.

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
