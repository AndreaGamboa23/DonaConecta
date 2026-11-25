# Modelo Entidad-Relación y Normalización 3FN — DonaConecta (Fase 05)

## 1. Estándar de Base de Datos
- **Motor:** Microsoft SQL Server 2022/2025 Express (`.\SQLEXPRESS`)
- **Base de datos:** `DonaConectaDB`
- **Acceso:** Consultas T-SQL parametrizadas mediante `pyodbc` (sin ORM)
- **Normalización:** Tercera Forma Normal (3FN)

## 2. Reglas de Normalización Aplicadas
1. **Primera Forma Normal (1FN):** Eliminación de grupos repetitivos y atributos multivaluados. Los horarios de los puntos de acopio se modelan en la entidad `horarios_acopio` (una fila por día) y los roles en `usuario_roles`.
2. **Segunda Forma Normal (2FN):** Todas las entidades utilizan claves primarias simples (`INT IDENTITY`) o compuestas donde cada atributo no clave depende funcionalmente de la totalidad de la clave primaria.
3. **Tercera Forma Normal (3FN):** Eliminación de dependencias transitivas y columnas calculadas. El total comprometido y el total recibido de cada necesidad se calculan dinámicamente mediante vistas SQL sobre `compromisos_donacion` y `entregas`.

## 3. Catálogo de Entidades (18 Tablas)

### 3.1 Seguridad y Control de Acceso
- `roles (id_rol PK, nombre_rol UNIQUE, descripcion)`
- `usuarios (id_usuario PK, nombres, apellidos, correo UNIQUE, telefono, dni_cifrado, password_hash, activo, creado_en, actualizado_en)`
- `usuario_roles (id_usuario PK/FK, id_rol PK/FK, asignado_en)`
- `tokens_recuperacion (id_token PK, id_usuario FK, token_hash UNIQUE, expira_en, intentos, usado, creado_en)`

### 3.2 Instituciones y Puntos de Acopio
- `instituciones (id_institucion PK, id_representante FK, ruc UNIQUE, razon_social, nombre_comercial, tipo_institucion, descripcion, distrito, direccion, estado_verificacion, verificada_por FK, verificada_en, activo, creado_en)`
- `documentos_institucion (id_documento PK, id_institucion FK, tipo_documento, nombre_archivo, ruta_privada, mime_type, tamano_bytes, subido_en)`
- `puntos_acopio (id_punto_acopio PK, id_institucion FK, nombre_punto, distrito, direccion, referencia, latitud, longitud, activo)`
- `horarios_acopio (id_horario PK, id_punto_acopio FK, dia_semana, hora_apertura, hora_cierre)`

### 3.3 Necesidades de Bienes Materiales
- `categorias_bien (id_categoria PK, nombre UNIQUE, descripcion, unidad_medida_base, activo)`
- `necesidades (id_necesidad PK, id_institucion FK, id_categoria FK, id_punto_acopio FK, titulo, descripcion, cantidad_requerida, prioridad, estado, fecha_limite, activo, creado_en)`

### 3.4 Compromisos, Entregas y Evidencias
- `compromisos_donacion (id_compromiso PK, id_necesidad FK, id_donante FK, cantidad_comprometida, comentario, estado, creado_en, actualizado_en)`
- `entregas (id_entrega PK, id_compromiso FK, cantidad_entregada, fecha_programada, fecha_recepcion, confirmada_por FK, observaciones, estado)`
- `evidencias_entrega (id_evidencia PK, id_entrega FK, subida_por FK, ruta_archivo, mime_type, tamano_bytes, sin_exif, proteccion_privacidad, subido_en)`

### 3.5 Comunicación y Seguimiento GPS Autorizado
- `sesiones_gps (id_sesion_gps PK, id_compromiso FK, id_donante FK, consentimiento_otorgado, latitud_actual, longitud_actual, iniciada_en, expira_en, detenida_en, activa)`
- `conversaciones (id_conversacion PK, id_compromiso FK UNIQUE, id_donante FK, id_representante FK, creada_en)`
- `mensajes (id_mensaje PK, id_conversacion FK, id_remitente FK, contenido, leido, enviado_en)`

### 3.6 Notificaciones y Auditoría
- `notificaciones (id_notificacion PK, id_usuario FK, titulo_generico, tipo, referencia_id, leida, creada_en)`
- `auditoria_eventos (id_auditoria PK, id_usuario FK, entidad, id_registro, accion, detalle_resumido, fecha_evento)`

## 4. Contrato Base de Endpoints (`/api/v1`)
- `/api/v1/auth` — Registro de donante/representante, inicio/cierre de sesión y recuperación con token temporal.
- `/api/v1/usuarios` — Perfil autenticado y gestión de roles.
- `/api/v1/instituciones` — Directorio público, detalle, registro y verificación administrativa.
- `/api/v1/puntos-de-acopio` — Puntos autorizados y horarios de atención.
- `/api/v1/necesidades` — Catálogo público, filtros y gestión por representante.
- `/api/v1/donaciones` — Compromisos con validación transaccional de disponibilidad.
- `/api/v1/entregas` — Programación, confirmación de recepción y carga de evidencias.
- `/api/v1/conversaciones` y `/ws/chat/{id}` — Mensajería privada persistida en SQL Server.
- `/api/v1/seguimientos` y `/ws/gps/{id}` — Seguimiento GPS temporal bajo consentimiento explícito.
- `/api/v1/notificaciones` — Alertas sin exposición de datos sensibles.
