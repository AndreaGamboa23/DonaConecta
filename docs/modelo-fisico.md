# Modelo físico propuesto para SQL Server

Documento validado en la Fase 05.1 y **implementado físicamente en la Fase 06**. Especifica tipos,
restricciones, índices, vistas y procedimientos, ahora desplegados en `DonaConectaDB` mediante los
scripts versionados en `database/scripts/`. La sección 7.1 registra los ajustes reales respecto del
diseño documental.

## 1. Reglas físicas generales

- Esquema único `dbo`, para que la sustentación sea comprensible.
- Instancia: `.\SQLEXPRESS`, SQL Server 2025 Express, autenticación Windows en local,
  controlador `ODBC Driver 18 for SQL Server`.
- Zona horaria: todos los `_en` se generan con `SYSUTCDATETIME()` y se guardan en UTC. La
  presentación convierte a `America/Lima`. Los horarios semanales son `TIME` local recurrente.
- IDs operativos `INT IDENTITY(1,1)`; eventos, mensajes, tokens, archivos e historiales
  `BIGINT IDENTITY(1,1)`.
- Todas las FK: `ON DELETE NO ACTION`, `ON UPDATE NO ACTION`. Sin `RESTRICT` (no es sintaxis de
  SQL Server) y sin cascada.
- `ROWVERSION` en `usuarios`, `instituciones`, `necesidades`, `compromisos`, `entregas`,
  `recepciones` y `puntos_acopio`. Un `PATCH` con versión obsoleta responde `409`.
- `NVARCHAR` para texto; `DECIMAL` para cantidades y coordenadas; nunca `FLOAT` ni `MONEY`.
- Sin columnas de importe, precio ni pago.

## 2. Tipos por dominio

| Uso | Tipo | Regla |
|---|---|---|
| IDs operativos | `INT IDENTITY` | Volumen académico; legible en JSON. |
| IDs de eventos | `BIGINT IDENTITY` | Mensajes, notificaciones, auditoría, tokens, archivos e historiales. |
| Nombres/correos | `NVARCHAR(100..256)` | Unicode para nombres peruanos y acentos. |
| Descripciones | `NVARCHAR(MAX)` | Texto libre institucional y de necesidades. |
| Mensajes | `NVARCHAR(4000)` | Límite funcional; validado también en Pydantic. |
| Cantidades | `DECIMAL(12,3)` | Enteros y fracciones de bienes; `> 0`, salvo recibida `>= 0`. |
| Coordenadas públicas | `DECIMAL(9,6)` | Puntos de acopio e instituciones; WGS84/EPSG:4326. |
| Coordenadas GPS privadas | `VARBINARY(256)` | Payload cifrado AES-256-GCM con lat/long canónicas `DECIMAL(9,6)`. |
| Precisión GPS | `DECIMAL(8,2)` | Metros; `>= 0`. |
| Nonce cifrado | `VARBINARY(12)` | Único por operación de cifrado. |
| Hash de token / archivo | `VARBINARY(32)` | SHA-256. |
| Contraseña | `NVARCHAR(255)` | Cadena Argon2id con parámetros incrustados. |
| Idempotencia | `UNIQUEIDENTIFIER` | `client_message_id` generado por el cliente. |
| Días/horas | `TINYINT`, `TIME(0)` | Día ISO 1–7 y hora local recurrente. |
| Flags | `BIT` | Consentimiento, preferencias, baja lógica cuando aplica. |
| Concurrencia | `ROWVERSION` | `PATCH` con `409` si cambió la fila. |
| Fechas | `DATETIME2(0)` | UTC. |

## 3. Tipos por tabla

La lista usa `?` para opcional. Las longitudes y restricciones se detallan en las secciones 4
y 5 y en `docs/diccionario-datos.md`.

### Identidad y configuración

- `roles`: `rol_id INT`, `codigo VARCHAR(20)`, `nombre NVARCHAR(100)`, `descripcion? NVARCHAR(255)`, `activo BIT`.
- `permisos`: `permiso_id INT`, `codigo VARCHAR(60)`, `modulo VARCHAR(40)`, `descripcion? NVARCHAR(255)`.
- `rol_permisos`: `rol_id INT`, `permiso_id INT`.
- `usuarios`: `usuario_id INT`, `email NVARCHAR(256)`, `password_hash NVARCHAR(255)`, `hash_version SMALLINT`, `nombres NVARCHAR(100)`, `apellidos NVARCHAR(100)`, `telefono_cifrado? VARBINARY(256)`, `telefono_nonce? VARBINARY(12)`, `telefono_clave_version? SMALLINT`, `estado_cuenta VARCHAR(25)`, `email_verificado_en? DATETIME2(0)`, `intentos_fallidos INT`, `bloqueado_hasta? DATETIME2(0)`, `ultimo_acceso_en? DATETIME2(0)`, `fecha_registro DATETIME2(0)`, `fecha_baja? DATETIME2(0)`, `fila_version ROWVERSION`.
- `usuario_roles`: `usuario_id INT`, `rol_id INT`, `estado VARCHAR(15)`, `asignado_en DATETIME2(0)`, `asignado_por_usuario_id? INT`.
- `tokens_seguridad`: `token_id BIGINT`, `usuario_id INT`, `tipo VARCHAR(30)`, `token_hash VARBINARY(32)`, `creado_en DATETIME2(0)`, `expira_en DATETIME2(0)`, `usado_en? DATETIME2(0)`, `revocado_en? DATETIME2(0)`, `intentos INT`, `sucede_a_token_id? BIGINT`.
- `donantes`: `usuario_id INT`, `distrito_id INT`, `preferencia_notificacion VARCHAR(15)`, `consentimiento_datos BIT`, `acepta_terminos BIT`, `fecha_registro DATETIME2(0)`.
- `distritos`: `distrito_id INT`, `nombre NVARCHAR(100)`, `provincia NVARCHAR(100)`, `departamento NVARCHAR(100)`, `activo BIT`.
- `parametros_sistema`: `parametro_id INT`, `clave VARCHAR(60)`, `valor VARCHAR(255)`, `descripcion? NVARCHAR(255)`, `actualizado_en DATETIME2(0)`, `actualizado_por_usuario_id INT`.

### Archivos e instituciones

- `archivos`: `archivo_id BIGINT`, `propietario_usuario_id? INT`, `creado_por_usuario_id INT`, `nombre_original NVARCHAR(255)`, `nombre_almacenado VARCHAR(255)`, `extension VARCHAR(10)`, `content_type VARCHAR(100)`, `tamano_bytes BIGINT`, `hash_sha256 VARBINARY(32)`, `ruta_almacenamiento NVARCHAR(512)`, `visibilidad VARCHAR(10)`, `tipo VARCHAR(30)`, `creado_en DATETIME2(0)`, `eliminado_en? DATETIME2(0)`.
- `tipos_institucion`: `tipo_id INT`, `codigo VARCHAR(30)`, `nombre NVARCHAR(100)`, `descripcion? NVARCHAR(255)`.
- `instituciones`: `institucion_id INT`, `tipo_id INT`, `distrito_id INT`, `nombre NVARCHAR(200)`, `slug VARCHAR(220)`, `descripcion? NVARCHAR(MAX)`, `direccion? NVARCHAR(300)`, `telefono_publico? NVARCHAR(30)`, `email_publico? NVARCHAR(256)`, `latitud? DECIMAL(9,6)`, `longitud? DECIMAL(9,6)`, `foto_archivo_id? BIGINT`, `estado_verificacion VARCHAR(20)`, `fecha_registro DATETIME2(0)`, `fecha_verificacion? DATETIME2(0)`, `verificado_por_usuario_id? INT`, `fila_version ROWVERSION`.
- `institucion_representantes`: `institucion_id INT`, `usuario_id INT`, `cargo? NVARCHAR(100)`, `es_contacto_principal BIT`, `estado VARCHAR(15)`, `fecha_inicio DATETIME2(0)`, `fecha_fin? DATETIME2(0)`.
- `institucion_documentos`: `documento_id BIGINT`, `institucion_id INT`, `archivo_id BIGINT`, `tipo_documento VARCHAR(30)`, `numero_documento_cifrado? VARBINARY(256)`, `nonce? VARBINARY(12)`, `clave_version? SMALLINT`, `estado_revision VARCHAR(15)`, `revisado_por_usuario_id? INT`, `revisado_en? DATETIME2(0)`.
- `verificaciones_institucion`: `verificacion_id BIGINT`, `institucion_id INT`, `revisor_usuario_id INT`, `estado_anterior VARCHAR(20)`, `estado_nuevo VARCHAR(20)`, `motivo? NVARCHAR(500)`, `creado_en DATETIME2(0)`.

### Catálogo y necesidades

- `categorias_bienes`: `categoria_id INT`, `codigo VARCHAR(30)`, `nombre NVARCHAR(100)`, `descripcion? NVARCHAR(255)`, `orden TINYINT`, `activo BIT`.
- `unidades_medida`: `unidad_id INT`, `codigo VARCHAR(20)`, `nombre NVARCHAR(60)`, `simbolo VARCHAR(10)`, `permite_fracciones BIT`, `decimales TINYINT`.
- `productos`: `producto_id INT`, `categoria_id INT`, `nombre NVARCHAR(120)`, `descripcion? NVARCHAR(255)`, `activo BIT`.
- `producto_unidades`: `producto_id INT`, `unidad_id INT`, `es_preferida BIT`.
- `necesidades`: `necesidad_id INT`, `institucion_id INT`, `titulo NVARCHAR(200)`, `descripcion NVARCHAR(MAX)`, `prioridad VARCHAR(10)`, `estado VARCHAR(15)`, `fecha_publicacion? DATETIME2(0)`, `fecha_limite? DATETIME2(0)`, `punto_acopio_id? INT`, `creado_por_usuario_id INT`, `creado_en DATETIME2(0)`, `actualizado_en DATETIME2(0)`, `motivo_cancelacion? NVARCHAR(500)`, `fila_version ROWVERSION`.
- `necesidad_productos`: `necesidad_id INT`, `producto_id INT`, `unidad_id INT`, `cantidad_requerida DECIMAL(12,3)`.
- `necesidad_fotos`: `necesidad_id INT`, `archivo_id BIGINT`.

### Compromisos, entregas y recepciones

- `compromisos`: `compromiso_id INT`, `necesidad_id INT`, `donante_usuario_id INT`, `estado VARCHAR(15)`, `fecha_compromiso DATETIME2(0)`, `expira_en? DATETIME2(0)`, `observaciones? NVARCHAR(500)`, `creado_en DATETIME2(0)`, `fila_version ROWVERSION`.
- `compromiso_productos`: `compromiso_id INT`, `necesidad_id INT`, `producto_id INT`, `unidad_id INT`, `cantidad_comprometida DECIMAL(12,3)`.
- `compromiso_historial`: `historial_id BIGINT`, `compromiso_id INT`, `estado_anterior VARCHAR(15)`, `estado_nuevo VARCHAR(15)`, `cambiado_en DATETIME2(0)`, `usuario_id INT`, `motivo? NVARCHAR(500)`.
- `entregas`: `entrega_id INT`, `compromiso_id INT`, `punto_acopio_id? INT`, `fecha_programada DATETIME2(0)`, `fecha_real_inicio? DATETIME2(0)`, `fecha_real_fin? DATETIME2(0)`, `estado VARCHAR(15)`, `responsable_usuario_id INT`, `observaciones? NVARCHAR(500)`, `fila_version ROWVERSION`.
- `entrega_productos`: `entrega_id INT`, `compromiso_id INT`, `producto_id INT`, `unidad_id INT`, `cantidad_entregada DECIMAL(12,3)`.
- `entrega_historial`: `historial_id BIGINT`, `entrega_id INT`, `estado_anterior VARCHAR(15)`, `estado_nuevo VARCHAR(15)`, `cambiado_en DATETIME2(0)`, `usuario_id INT`, `motivo? NVARCHAR(500)`.
- `recepciones`: `recepcion_id INT`, `entrega_id INT`, `recibido_por_usuario_id INT`, `fecha_confirmacion DATETIME2(0)`, `estado VARCHAR(15)`, `observaciones? NVARCHAR(500)`, `fila_version ROWVERSION`.
- `recepcion_productos`: `recepcion_id INT`, `entrega_id INT`, `producto_id INT`, `unidad_id INT`, `cantidad_recibida DECIMAL(12,3)`.
- `recepcion_evidencias`: `recepcion_id INT`, `archivo_id BIGINT`.

### Ubicación, chat y soporte

- `puntos_acopio`: `punto_id INT`, `institucion_id INT`, `distrito_id INT`, `nombre NVARCHAR(150)`, `direccion? NVARCHAR(300)`, `referencias_entrega? NVARCHAR(500)`, `latitud? DECIMAL(9,6)`, `longitud? DECIMAL(9,6)`, `estado VARCHAR(10)`, `creado_en DATETIME2(0)`, `fila_version ROWVERSION`.
- `puntos_acopio_horarios`: `punto_id INT`, `dia_semana TINYINT`, `hora_apertura TIME(0)`, `hora_cierre TIME(0)`, `activo BIT`.
- `sesiones_gps`: `sesion_id BIGINT`, `entrega_id INT`, `usuario_id INT`, `consentimiento_dado BIT`, `consentimiento_en DATETIME2(0)`, `fecha_inicio DATETIME2(0)`, `fecha_fin? DATETIME2(0)`, `expira_en DATETIME2(0)`, `estado VARCHAR(12)`.
- `gps_ultima_ubicacion`: `sesion_id BIGINT`, `coordenadas_cifradas VARBINARY(256)`, `nonce VARBINARY(12)`, `clave_version SMALLINT`, `precision_metros DECIMAL(8,2)`, `actualizado_en DATETIME2(0)`.
- `conversaciones`: `conversacion_id BIGINT`, `necesidad_id? INT`, `compromiso_id? INT`, `estado VARCHAR(10)`, `creada_por_usuario_id INT`, `creada_en DATETIME2(0)`, `cerrada_en? DATETIME2(0)`.
- `conversacion_participantes`: `conversacion_id BIGINT`, `usuario_id INT`, `tipo_participante VARCHAR(20)`, `estado VARCHAR(15)`, `fecha_union DATETIME2(0)`, `fecha_salida? DATETIME2(0)`, `ultimo_mensaje_leido_id? BIGINT`.
- `mensajes`: `mensaje_id BIGINT`, `conversacion_id BIGINT`, `remitente_usuario_id INT`, `contenido NVARCHAR(4000)`, `tipo VARCHAR(10)`, `client_message_id UNIQUEIDENTIFIER`, `creado_en DATETIME2(0)`, `eliminado_en? DATETIME2(0)`.
- `mensaje_adjuntos`: `mensaje_id BIGINT`, `archivo_id BIGINT`.
- `reportes_mensaje`: `reporte_id BIGINT`, `mensaje_id BIGINT`, `reportado_por_usuario_id INT`, `motivo VARCHAR(25)`, `descripcion? NVARCHAR(500)`, `estado VARCHAR(15)`, `creado_en DATETIME2(0)`, `resuelto_por_usuario_id? INT`, `resuelto_en? DATETIME2(0)`.
- `notificaciones`: `notificacion_id BIGINT`, `destinatario_usuario_id INT`, `tipo VARCHAR(35)`, `titulo NVARCHAR(150)`, `cuerpo NVARCHAR(500)`, `creado_en DATETIME2(0)`, `leido_en? DATETIME2(0)`, `archivado_en? DATETIME2(0)`, `mensaje_id? BIGINT`, `compromiso_id? INT`, `entrega_id? INT`, `recepcion_id? INT`, `institucion_id? INT`, `verificacion_id? BIGINT`.
- `auditoria_eventos`: `evento_id BIGINT`, `usuario_id? INT`, `tipo_evento VARCHAR(60)`, `modulo VARCHAR(40)`, `recurso_tipo VARCHAR(40)`, `recurso_id? VARCHAR(50)`, `origen VARCHAR(10)`, `resultado VARCHAR(10)`, `descripcion NVARCHAR(500)`, `creado_en DATETIME2(0)`.

## 4. Claves y restricciones

### Claves primarias

Simples en las tablas operativas, incluidas `institucion_documentos` (`documento_id`),
`verificaciones_institucion`, `compromiso_historial`, `entrega_historial` y
`reportes_mensaje`. Compuestas en `rol_permisos`, `usuario_roles`, `producto_unidades`,
`necesidad_productos`, `necesidad_fotos`, `compromiso_productos`, `entrega_productos`,
`recepcion_productos`, `recepcion_evidencias`, `puntos_acopio_horarios`,
`conversacion_participantes` y `mensaje_adjuntos`.

### Unicidad

- `usuarios.email`, `roles.codigo`, `permisos.codigo`, `distritos.nombre`,
  `tipos_institucion.codigo`, `categorias_bienes.codigo`, `unidades_medida.codigo`,
  `parametros_sistema.clave`, `instituciones.slug`, `instituciones.foto_archivo_id`.
- `productos(categoria_id, nombre)`.
- `tokens_seguridad.token_hash`, `archivos.nombre_almacenado`.
- `compromisos(compromiso_id, necesidad_id)`, `entregas(entrega_id, compromiso_id)`,
  `recepciones.entrega_id`, `recepciones(recepcion_id, entrega_id)`.
- `mensajes(conversacion_id, mensaje_id)`,
  `mensajes(remitente_usuario_id, client_message_id)`.
- `reportes_mensaje(mensaje_id, reportado_por_usuario_id)`.

### Foreign keys compuestos anti asociaciones cruzadas

- `compromiso_productos(compromiso_id, necesidad_id)` → `compromisos(compromiso_id, necesidad_id)`.
- `compromiso_productos(necesidad_id, producto_id, unidad_id)` → `necesidad_productos(...)`.
- `entrega_productos(entrega_id, compromiso_id)` → `entregas(entrega_id, compromiso_id)`.
- `entrega_productos(compromiso_id, producto_id, unidad_id)` → `compromiso_productos(...)`.
- `recepcion_productos(recepcion_id, entrega_id)` → `recepciones(recepcion_id, entrega_id)`.
- `recepcion_productos(entrega_id, producto_id, unidad_id)` → `entrega_productos(...)`.
- `conversacion_participantes(conversacion_id, ultimo_mensaje_leido_id)` →
  `mensajes(conversacion_id, mensaje_id)`.

### CHECK representativos

- Latitud entre `-90` y `90`, longitud entre `-180` y `180`, en instituciones y puntos.
- `precision_metros >= 0`; `cantidad_requerida > 0`; `cantidad_comprometida > 0`;
  `cantidad_entregada > 0`; `cantidad_recibida >= 0`.
- `tamano_bytes > 0`; `intentos_fallidos >= 0`; `decimales BETWEEN 0 AND 3`.
- `dia_semana BETWEEN 1 AND 7`; `hora_cierre > hora_apertura`.
- `consentimiento_dado = 1` en toda sesión GPS.
- `compromisos`: `estado <> 'PENDIENTE' OR expira_en IS NOT NULL`.
- `conversaciones`: exactamente uno de `necesidad_id` / `compromiso_id` no nulo.
- `notificaciones`: `N` FKs no nulas con `N <= 1`; además, por `tipo`, se exige cero o la FK
  correspondiente.
- Cifrado: las tres columnas (`valor_cifrado`, `nonce`, `clave_version`) son todas nulas o todas
  no nulas en `usuarios.telefono_*` e `institucion_documentos.numero_documento_*`.
- `DATALENGTH(nonce) = 12` cuando el nonce existe.

## 5. Índices propuestos

| Índice | Definición | Justificación |
|---|---|---|
| `UX_usuario_roles_activo` | `usuario_roles(usuario_id, rol_id) WHERE estado='ACTIVO'` | Un rol activo no se repite por cuenta. |
| `UX_institucion_contacto_principal` | `institucion_representantes(institucion_id) WHERE estado='ACTIVO' AND es_contacto_principal=1` | Un solo contacto principal activo. |
| `UX_sesiones_gps_activas_entrega` | `sesiones_gps(entrega_id) WHERE estado='ACTIVA'` | Máximo una sesión activa por entrega. |
| `UX_sesiones_gps_activas_usuario` | `sesiones_gps(usuario_id) WHERE estado='ACTIVA'` | Máximo una sesión activa por usuario. |
| `IX_necesidades_institucion_estado` | `necesidades(institucion_id, estado)` | Catálogo por institución y filtro público. |
| `IX_compromisos_necesidad_estado` | `compromisos(necesidad_id, estado)` | Cálculo de reservas vigentes. |
| `IX_compromisos_donante_fecha` | `compromisos(donante_usuario_id, fecha_compromiso DESC)` | “Mis donaciones”. |
| `IX_entregas_compromiso_estado` | `entregas(compromiso_id, estado)` | Seguimiento de entregas parciales. |
| `IX_notificaciones_destinatario` | `notificaciones(destinatario_usuario_id, leido_en, creado_en DESC)` | Bandeja de notificaciones. |
| `IX_auditoria_creado_en` | `auditoria_eventos(creado_en DESC)` | Consulta administrativa por fecha. |
| `IX_archivos_propietario` | `archivos(propietario_usuario_id, creado_en DESC)` | Archivos del usuario. |

Los `UNIQUE` de la sección 4 ya sirven como índices de búsqueda para mensajes, recepciones y
tokens; no se duplican.

## 6. Vistas

Las nueve vistas están enumeradas en `docs/modelo-logico.md` §8. Reglas físicas comunes:

- `vw_disponibilidad_necesidad` calcula `cantidad_reservada_vigente` con
  `GREATEST(cantidad_comprometida - recibido_del_compromiso, 0)` solo para compromisos
  `PENDIENTE`/`ACEPTADO` no vencidos, y suma `cantidad_recibida` por separado. Así no se cuenta
  dos veces lo entregado y lo confirmado.
- `vw_progreso_necesidad` promedia razones por línea; nunca suma kg con unidades.
- `vw_directorio_instituciones` filtra `estado_verificacion='VERIFICADA'`.
- `vw_representante_autorizado` exige rol `ACTIVO`, vínculo `ACTIVO` e institución
  `VERIFICADA`.
- `vw_conversaciones_usuario` usa `ultimo_mensaje_leido_id` y `mensajes.creado_en`.

## 7. Procedimientos almacenados

Solo dos, por ser los únicos que modifican disponibilidad:

### `usp_RegistrarCompromiso`

Parámetros: `@necesidadId INT`, `@donanteUsuarioId INT`, `@lineasJson NVARCHAR(MAX)`,
`@expiracionMinutos INT`.

Secuencia:

1. `SET XACT_ABORT ON`; `BEGIN TRANSACTION`.
2. `SELECT ... FROM necesidades WITH (UPDLOCK, HOLDLOCK)` donde `necesidad_id` y
   `estado='PUBLICADA'`.
3. `SELECT ... FROM necesidad_productos WITH (UPDLOCK, HOLDLOCK)`.
4. Leer `vw_disponibilidad_necesidad` dentro de la misma transacción; validar cada línea.
5. Si falta disponibilidad: `ROLLBACK` y devolver código de conflicto.
6. `INSERT` en `compromisos` (con `expira_en = SYSUTCDATETIME() + @expiracionMinutos`),
   `compromiso_productos` y `compromiso_historial`.
7. `INSERT` notificación al representante autorizado y evento de auditoría.
8. `COMMIT`.

### `usp_ConfirmarRecepcion`

Parámetros: `@entregaId INT`, `@recibidoPorUsuarioId INT`, `@lineasJson NVARCHAR(MAX)`,
`@estadoRecepcion VARCHAR(20)`.

Secuencia:

1. `SET XACT_ABORT ON`; `BEGIN TRANSACTION`.
2. Bloquear `entregas` y `entrega_productos` con `UPDLOCK, HOLDLOCK`.
3. Validar que `@recibidoPorUsuarioId` sea representante autorizado de la institución.
4. Validar `cantidad_recibida <= cantidad_entregada` por línea.
5. `INSERT` en `recepciones`, `recepcion_productos` y `recepcion_evidencias` cuando aplique.
6. Cambiar estado de `entregas` y `compromisos` según corresponda; escribir historiales,
   notificación y auditoría.
7. `COMMIT`.

### Regla de propiedad de transacción

- Estos dos procedimientos **son dueños** de su transacción. Se invocan con una conexión
  dedicada en `autocommit=True`; el procedimiento hace `BEGIN/COMMIT/ROLLBACK`.
- El resto de operaciones multsentencia (por ejemplo, borrar un borrador) usa `pyodbc` con
  `autocommit=False` y una sola transacción administrada por `database/`.
- **No se anida** una transacción de PyODBC dentro de estos procedimientos.
- `TRY/CATCH`, `XACT_STATE()` y `THROW` para rollback seguro. FastAPI traduce cualquier error a
  un cuerpo homogéneo sin mensajes de SQL Server.
- Orden de bloqueo siempre: `necesidades` → `necesidad_productos` → `compromisos` →
  `compromiso_productos` → `entregas` → `entrega_productos` → `recepciones` →
  `recepcion_productos` → notificaciones/auditoría.
- En las pruebas reales de la Fase 06 **no aparecieron interbloqueos `1205`** con dos conexiones,
  por lo que no se implementó `sp_getapplock`. La alternativa sigue documentada para carga futura.

### 7.1 Ajustes de la implementación Fase 06

| Ajuste | Motivo |
|---|---|
| `usp_RegistrarCompromiso` y `usp_ConfirmarRecepcion` devuelven el id creado con `OUTPUT`. | El backend necesita el id para responder `201` sin una consulta adicional. |
| `usp_RegistrarCompromiso` no inserta `compromiso_historial` en la creación. | `estado_anterior` es `NOT NULL` y distinto de `estado_nuevo`; no existe estado previo válido. El historial comienza con la primera transición real. |
| `usp_ConfirmarRecepcion` añade `@observaciones NVARCHAR(500)` y `@evidenciasJson NVARCHAR(MAX)` opcionales. | Cumple `CK_recepciones_observacion` para `OBSERVADA` y permite persistir evidencias reales. |
| `usp_ConfirmarRecepcion` escribe `fecha_real_inicio = COALESCE(fecha_real_inicio, @ahora)` junto con `fecha_real_fin`. | `CK_entregas_fechas` exige inicio cuando existe fin. Detectado al preparar las pruebas y corregido antes de ejecutarlas. |
| Los conteos usados para adquirir bloqueos se asignan a `@bloqueo` en vez de devolverse con `SELECT`. | Evita resultsets innecesarios hacia PyODBC sin perder `UPDLOCK, HOLDLOCK`. |
| `parametros_sistema.actualizado_por_usuario_id` admite `NULL` en la FK. | La configuración puede existir antes de que se cree el primer usuario administrador. |

Los códigos `THROW` reales son `52001` disponibilidad, `52002` necesidad no publicada, `52003`
donante no autorizado, `52004` líneas inválidas, `52005` expiración inválida, `52006` recepción
duplicada, `52007` representante no autorizado, `52008` cantidad recibida inválida, `52009` entrega
no válida, `52010` estado de recepción inválido y `52011` evidencia inválida. FastAPI debe
traducirlos a un cuerpo de error homogéneo sin mensajes de SQL Server en Fase 07/09.

## 8. Borrado físico permitido

Únicamente borradores de necesidad sin compromisos, conversaciones, entregas ni historial.
Se ejecuta en una transacción de PyODBC (`autocommit=False`) con este orden:
`necesidad_fotos` → `necesidad_productos` → `necesidades` → `auditoria_eventos`. Si existe
cualquier hijo protegido, se revierte y se responde `409`. No se usa este mecanismo para
donaciones, entregas confirmadas, recepciones, mensajes ni auditoría.

## 9. Respaldo y verificación ejecutados en Fase 06

- Respaldo FULL local fuera del repositorio con `CHECKSUM`; `RESTORE VERIFYONLY` devolvió
  “The backup set on file 1 is valid.”
- Restauración real en `DonaConectaDB_Pruebas` para ejecutar pruebas sintéticas: 42 tablas,
  79 FK, 9 vistas, 2 procedimientos y 0 usuarios reales.
- Verificación final del respaldo regenerado en `DonaConectaDB_Verificacion`: 42 tablas, 79 FK,
  9 vistas, 2 procedimientos, 0 filas de negocio y procedimiento corregido presente. No se usó
  `DROP DATABASE` ni `RESTORE ... REPLACE`.
- Capacidades nativas verificadas: `EngineEdition = 4`, `EncryptionState = NULL`, 0 column master
  keys y 0 symmetric keys. No se activó TDE ni Always Encrypted; ver
  `docs/seguridad-privacidad.md` §11.3.
- Driver ODBC 18 y Python 3.13.17 ya verificados en modo lectura; `uv` 0.12.17 disponible para
  evaluar en Fase 07. El cifrado del archivo de respaldo sigue pendiente de evaluación.
