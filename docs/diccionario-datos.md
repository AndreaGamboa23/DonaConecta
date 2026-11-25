# Diccionario de datos de DonaConecta

Versión validada en la Fase 05.1. Es la referencia de nombres y significado. Los tipos físicos
están en `docs/modelo-fisico.md` §3; aquí se documenta semántica, opcionalidad, claves y
dominios. `?` = opcional. **No hay tablas creadas.**

## 1. Convenciones

| Convención | Significado |
|---|---|
| `*_id` | Identificador sustituto. `INT` en operación; `BIGINT` en eventos, mensajes, tokens, archivos e historiales. |
| `*_en` | Fecha UTC generada por `SYSUTCDATETIME()`, salvo fecha declarada por el usuario. |
| `*_por_usuario_id` | Usuario que ejecuta la acción. Nunca se elimina físicamente. |
| `fila_version` | `ROWVERSION`; se envía en `PATCH` y se compara para responder `409`. |
| `cantidad_*` | `DECIMAL(12,3)`; positiva salvo `cantidad_recibida`, que admite cero. |
| `latitud` / `longitud` | WGS84/EPSG:4326. Las públicas son legibles; las del GPS son privadas y se cifran. |
| `estado` | Cadena controlada por `CHECK`; los valores se listan en cada fila. |
| `?` | Permite `NULL`; el resto es obligatorio. |

## 2. Identidad y acceso

| Tabla | Atributos | PK / UQ | FK y notas |
|---|---|---|---|
| `roles` | `rol_id`, `codigo`, `nombre`, `descripcion?`, `activo` | PK `rol_id`; UQ `codigo` | `codigo`: `DONANTE`, `REPRESENTANTE`, `ADMINISTRADOR`. Visitante = sin fila. |
| `permisos` | `permiso_id`, `codigo`, `modulo`, `descripcion?` | PK `permiso_id`; UQ `codigo` | Catálogo limitado; ver matriz en `docs/seguridad-privacidad.md`. |
| `rol_permisos` | `rol_id`, `permiso_id` | PK compuesta | FK a `roles`, `permisos`. |
| `usuarios` | `usuario_id`, `email`, `password_hash`, `hash_version`, `nombres`, `apellidos`, `telefono_cifrado?`, `telefono_nonce?`, `telefono_clave_version?`, `estado_cuenta`, `email_verificado_en?`, `intentos_fallidos`, `bloqueado_hasta?`, `ultimo_acceso_en?`, `fecha_registro`, `fecha_baja?`, `fila_version` | PK `usuario_id`; UQ `email` | `estado_cuenta`: `PENDIENTE_VERIFICACION`, `ACTIVO`, `BLOQUEADO`, `BAJA`. `email` normalizado a minúsculas. `password_hash` nunca se expone en DTO. |
| `usuario_roles` | `usuario_id`, `rol_id`, `estado`, `asignado_en`, `asignado_por_usuario_id?` | PK `(usuario_id, rol_id)` | FK a `usuarios` y `roles`; `asignado_por_usuario_id` a `usuarios`. `estado`: `PENDIENTE`, `ACTIVO`, `INACTIVO`. |
| `tokens_seguridad` | `token_id`, `usuario_id`, `tipo`, `token_hash`, `creado_en`, `expira_en`, `usado_en?`, `revocado_en?`, `intentos`, `sucede_a_token_id?` | PK `token_id`; UQ `token_hash` | `tipo`: `VERIFICAR_EMAIL`, `RECUPERAR_CLAVE`, `REFRESCAR_SESION`, `VERIFICAR_CAMBIO_EMAIL`. Solo se guarda SHA-256 del token. |
| `donantes` | `usuario_id`, `distrito_id`, `preferencia_notificacion`, `consentimiento_datos`, `acepta_terminos`, `fecha_registro` | PK/FK `usuario_id` | Perfil opcional, solo para quien eligió donar. No duplica identidad ni credenciales. |
| `distritos` | `distrito_id`, `nombre`, `provincia`, `departamento`, `activo` | PK `distrito_id`; UQ `nombre` | Catálogo real de Huancayo; sin coordenadas inventadas. |
| `parametros_sistema` | `parametro_id`, `clave`, `valor`, `descripcion?`, `actualizado_en`, `actualizado_por_usuario_id` | PK `parametro_id`; UQ `clave` | Claves: expiración de compromiso, duración GPS, tamaño máximo de archivo y retención de evidencias. |

## 3. Archivos e instituciones

| Tabla | Atributos | PK / UQ | FK y notas |
|---|---|---|---|
| `archivos` | `archivo_id`, `propietario_usuario_id?`, `creado_por_usuario_id`, `nombre_original`, `nombre_almacenado`, `extension`, `content_type`, `tamano_bytes`, `hash_sha256`, `ruta_almacenamiento`, `visibilidad`, `tipo`, `creado_en`, `eliminado_en?` | PK `archivo_id`; UQ `nombre_almacenado` | `visibilidad`: `PUBLICO`/`PRIVADO`. `tipo`: `DOCUMENTO_INSTITUCION`, `FOTO_INSTITUCION`, `FOTO_NECESIDAD`, `EVIDENCIA_RECEPCION`, `ADJUNTO_CHAT`. Binario fuera de SQL Server y de `frontend/public/`. |
| `tipos_institucion` | `tipo_id`, `codigo`, `nombre`, `descripcion?` | PK `tipo_id`; UQ `codigo` | `COMEDOR`, `ALBERGUE`, `REFUGIO_ANIMAL`, `ORGANIZACION_SOCIAL`, `OTRO`. |
| `instituciones` | `institucion_id`, `tipo_id`, `distrito_id`, `nombre`, `slug`, `descripcion?`, `direccion?`, `telefono_publico?`, `email_publico?`, `latitud?`, `longitud?`, `foto_archivo_id?`, `estado_verificacion`, `fecha_registro`, `fecha_verificacion?`, `verificado_por_usuario_id?`, `fila_version` | PK `institucion_id`; UQ `slug`, `foto_archivo_id` | `estado_verificacion`: `PENDIENTE`, `EN_REVISION`, `VERIFICADA`, `RECHAZADA`, `SUSPENDIDA`, `BAJA`. Lat/long son públicas. No hay columna `activo` derivada. |
| `institucion_representantes` | `institucion_id`, `usuario_id`, `cargo?`, `es_contacto_principal`, `estado`, `fecha_inicio`, `fecha_fin?` | PK `(institucion_id, usuario_id)` | `estado`: `PENDIENTE`, `ACTIVO`, `INACTIVO`, `RETIRADO`. Define a qué instituciones accede cada representante. |
| `institucion_documentos` | `documento_id`, `institucion_id`, `archivo_id`, `tipo_documento`, `numero_documento_cifrado?`, `nonce?`, `clave_version?`, `estado_revision`, `revisado_por_usuario_id?`, `revisado_en?` | PK `documento_id` | `tipo_documento`: `RAZON_SOCIAL`, `AUTORIZACION_MUNICIPAL`, `OTRO`. `estado_revision`: `PENDIENTE`, `APROBADO`, `OBSERVADO`, `RECHAZADO`. Cifrado GCM con versión de clave. |
| `verificaciones_institucion` | `verificacion_id`, `institucion_id`, `revisor_usuario_id`, `estado_anterior`, `estado_nuevo`, `motivo?`, `creado_en` | PK `verificacion_id` | Historial de cada decisión administrativa. |

## 4. Catálogo de bienes y necesidades

| Tabla | Atributos | PK / UQ | FK y notas |
|---|---|---|---|
| `categorias_bienes` | `categoria_id`, `codigo`, `nombre`, `descripcion?`, `orden`, `activo` | PK `categoria_id`; UQ `codigo` | Categorías de bienes materiales, sin precios. |
| `unidades_medida` | `unidad_id`, `codigo`, `nombre`, `simbolo`, `permite_fracciones`, `decimales` | PK `unidad_id`; UQ `codigo` | `decimales` entre 0 y 3. |
| `productos` | `producto_id`, `categoria_id`, `nombre`, `descripcion?`, `activo` | PK `producto_id`; UQ `(categoria_id, nombre)` | Sin producto “dinero”. |
| `producto_unidades` | `producto_id`, `unidad_id`, `es_preferida` | PK `(producto_id, unidad_id)` | Complementa la FK de las líneas de cantidad. |
| `necesidades` | `necesidad_id`, `institucion_id`, `titulo`, `descripcion`, `prioridad`, `estado`, `fecha_publicacion?`, `fecha_limite?`, `punto_acopio_id?`, `creado_por_usuario_id`, `creado_en`, `actualizado_en`, `motivo_cancelacion?`, `fila_version` | PK `necesidad_id` | `prioridad`: `ALTA`, `MEDIA`, `BAJA`. `estado`: `BORRADOR`, `PUBLICADA`, `PAUSADA`, `COMPLETADA`, `VENCIDA`, `CANCELADA`. |
| `necesidad_productos` | `necesidad_id`, `producto_id`, `unidad_id`, `cantidad_requerida` | PK `(necesidad_id, producto_id, unidad_id)` | `cantidad_requerida > 0`. No almacena compromisos ni progreso. |
| `necesidad_fotos` | `necesidad_id`, `archivo_id` | PK compuesta | El archivo debe ser `FOTO_NECESIDAD`. |

## 5. Compromisos, entregas y recepciones

| Tabla | Atributos | PK / UQ | FK y notas |
|---|---|---|---|
| `compromisos` | `compromiso_id`, `necesidad_id`, `donante_usuario_id`, `estado`, `fecha_compromiso`, `expira_en?`, `observaciones?`, `creado_en`, `fila_version` | PK `compromiso_id`; UQ `(compromiso_id, necesidad_id)` | `estado`: `PENDIENTE`, `ACEPTADO`, `RECHAZADO`, `CANCELADO`, `VENCIDO`, `COMPLETADO`. `PENDIENTE` exige `expira_en`. |
| `compromiso_productos` | `compromiso_id`, `necesidad_id`, `producto_id`, `unidad_id`, `cantidad_comprometida` | PK `(compromiso_id, producto_id, unidad_id)` | FK compuestos a `compromisos` y `necesidad_productos`. Evita bienes no solicitados. |
| `compromiso_historial` | `historial_id`, `compromiso_id`, `estado_anterior`, `estado_nuevo`, `cambiado_en`, `usuario_id`, `motivo?` | PK `historial_id` | Toda transición de estado escribe una fila. |
| `entregas` | `entrega_id`, `compromiso_id`, `punto_acopio_id?`, `fecha_programada`, `fecha_real_inicio?`, `fecha_real_fin?`, `estado`, `responsable_usuario_id`, `observaciones?`, `fila_version` | PK `entrega_id`; UQ `(entrega_id, compromiso_id)` | `estado`: `PROGRAMADA`, `EN_CAMINO`, `ENTREGADA`, `INCIDENCIA`, `CANCELADA`. `ENTREGADA` ≠ recibida. |
| `entrega_productos` | `entrega_id`, `compromiso_id`, `producto_id`, `unidad_id`, `cantidad_entregada` | PK `(entrega_id, producto_id, unidad_id)` | FK compuestos a `entregas` y `compromiso_productos`. |
| `entrega_historial` | `historial_id`, `entrega_id`, `estado_anterior`, `estado_nuevo`, `cambiado_en`, `usuario_id`, `motivo?` | PK `historial_id` | `motivo` obligatorio en reprogramación/incidencia. |
| `recepciones` | `recepcion_id`, `entrega_id`, `recibido_por_usuario_id`, `fecha_confirmacion`, `estado`, `observaciones?`, `fila_version` | PK `recepcion_id`; UQ `entrega_id`, UQ `(recepcion_id, entrega_id)` | `estado`: `PARCIAL`, `CONFIRMADA`, `OBSERVADA`. Una recepción final por entrega. |
| `recepcion_productos` | `recepcion_id`, `entrega_id`, `producto_id`, `unidad_id`, `cantidad_recibida` | PK `(recepcion_id, producto_id, unidad_id)` | `cantidad_recibida >= 0`. FKs compuestos a `recepciones` y `entrega_productos`. |
| `recepcion_evidencias` | `recepcion_id`, `archivo_id` | PK compuesta | Archivo `EVIDENCIA_RECEPCION`, privado y protegido. |

## 6. Ubicación y GPS

| Tabla | Atributos | PK / UQ | FK y notas |
|---|---|---|---|
| `puntos_acopio` | `punto_id`, `institucion_id`, `distrito_id`, `nombre`, `direccion?`, `referencias_entrega?`, `latitud?`, `longitud?`, `estado`, `creado_en`, `fila_version` | PK `punto_id` | `estado`: `ACTIVO`, `INACTIVO`. Coordenadas públicas verificables. |
| `puntos_acopio_horarios` | `punto_id`, `dia_semana`, `hora_apertura`, `hora_cierre`, `activo` | PK `(punto_id, dia_semana, hora_apertura)` | Hora local recurrente; `dia_semana` 1–7 ISO. |
| `sesiones_gps` | `sesion_id`, `entrega_id`, `usuario_id`, `consentimiento_dado`, `consentimiento_en`, `fecha_inicio`, `fecha_fin?`, `expira_en`, `estado` | PK `sesion_id` | `estado`: `ACTIVA`, `DETENIDA`, `EXPIRADA`, `CANCELADA`. Consentimiento obligatorio. Máximo una activa por entrega y por usuario. |
| `gps_ultima_ubicacion` | `sesion_id`, `coordenadas_cifradas`, `nonce`, `clave_version`, `precision_metros`, `actualizado_en` | PK/FK `sesion_id` | Lat/long lógicas `DECIMAL(9,6)` validadas antes de cifrar. Sin historial de recorrido. |

## 7. Chat, notificaciones y auditoría

| Tabla | Atributos | PK / UQ | FK y notas |
|---|---|---|---|
| `conversaciones` | `conversacion_id`, `necesidad_id?`, `compromiso_id?`, `estado`, `creada_por_usuario_id`, `creada_en`, `cerrada_en?` | PK `conversacion_id` | Exactamente uno de `necesidad_id`/`compromiso_id`. `estado`: `ABIERTA`, `CERRADA`. |
| `conversacion_participantes` | `conversacion_id`, `usuario_id`, `tipo_participante`, `estado`, `fecha_union`, `fecha_salida?`, `ultimo_mensaje_leido_id?` | PK `(conversacion_id, usuario_id)` | `estado`: `ACTIVO`, `SUSPENDIDO`, `SALIO`, `RETIRADO`. La marca de lectura pertenece a la misma conversación. |
| `mensajes` | `mensaje_id`, `conversacion_id`, `remitente_usuario_id`, `contenido`, `tipo`, `client_message_id`, `creado_en`, `eliminado_en?` | PK `mensaje_id`; UQ `(conversacion_id, mensaje_id)`, UQ `(remitente_usuario_id, client_message_id)` | `tipo`: `TEXTO`, `ARCHIVO`, `SISTEMA`. Persistencia en SQL Server; no se anuncia cifrado extremo a extremo. |
| `mensaje_adjuntos` | `mensaje_id`, `archivo_id` | PK compuesta | Archivos privados con descarga autorizada. |
| `reportes_mensaje` | `reporte_id`, `mensaje_id`, `reportado_por_usuario_id`, `motivo`, `descripcion?`, `estado`, `creado_en`, `resuelto_por_usuario_id?`, `resuelto_en?` | PK `reporte_id`; UQ `(mensaje_id, reportado_por_usuario_id)` | `motivo`: `ABUSO`, `SPAM`, `CONTENIDO_INAPROPIADO`, `OTRO`. |
| `notificaciones` | `notificacion_id`, `destinatario_usuario_id`, `tipo`, `titulo`, `cuerpo`, `creado_en`, `leido_en?`, `archivado_en?`, `mensaje_id?`, `compromiso_id?`, `entrega_id?`, `recepcion_id?`, `institucion_id?`, `verificacion_id?` | PK `notificacion_id` | Máximo una FK de recurso no nula. Avisos de cuenta pueden tener cero. `cuerpo` <= 500, sin mensajes completos ni coordenadas. |
| `auditoria_eventos` | `evento_id`, `usuario_id?`, `tipo_evento`, `modulo`, `recurso_tipo`, `recurso_id?`, `origen`, `resultado`, `descripcion`, `creado_en` | PK `evento_id` | `origen`: `WEB`, `WS`, `SISTEMA`. `resultado`: `OK`, `DENEGADO`, `ERROR`. Sin secretos ni coordenadas. |

## 8. Campos sensibles y regla de protección

| Dato | Tabla.columna | Protección | Autorización |
|---|---|---|---|
| Contraseña | `usuarios.password_hash` | Argon2id, nunca reversible | Solo `security/`; jamás en DTO. |
| Correo | `usuarios.email` | Único, normalizado; DTO público restringido | Propietario y administrador. |
| Teléfono | `usuarios.telefono_cifrado` | AES-256-GCM evaluado, con nonce y versión | Propietario; representantes solo si es contacto autorizado. |
| Tokens | `tokens_seguridad.token_hash` | SHA-256 del token aleatorio | Solo `security/`; expiración, revocación y rotación. |
| Documento institucional | `institucion_documentos.numero_documento_cifrado` | AES-256-GCM | Revisor administrativo autorizado. |
| Coordenadas GPS | `gps_ultima_ubicacion.coordenadas_cifradas` | AES-256-GCM; borrado al finalizar | Donante que comparte y representantes autorizados de la entrega. |
| Coordenadas públicas | `instituciones.latitud/longitud`, `puntos_acopio.latitud/longitud` | Sin cifrar; son datos publicables | Cualquier visitante. |
| Mensajes | `mensajes.contenido` | Control de acceso y TLS; **no** cifrado extremo a extremo | Solo participantes activos. |
| Evidencias | `archivos` + `recepcion_evidencias` | Almacenamiento privado, validación real, EXIF saneado | Representantes de la entrega y administrador. |
| Auditoría | `auditoria_eventos` | Inmutable, sin secretos | Administrador. |

La matriz completa de sensibilidad, recuperación, conservación y justificación está en
`docs/seguridad-privacidad.md`.
