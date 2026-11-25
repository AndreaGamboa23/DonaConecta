# Modelo lógico de DonaConecta

Versión validada en la Fase 05.1. Describe atributos, claves, relaciones y dependencias. La
implementación física y sus tipos exactos están en `docs/modelo-fisico.md` y
`docs/diccionario-datos.md`. **No se ha ejecutado DDL.**

## 1. Convenciones

- `?` = columna opcional (`NULL`); el resto es `NOT NULL`.
- `_id` = clave sustituta; `_en` = `DATETIME2` en UTC; `_por_usuario_id` = auditoría.
- `fila_version` = `ROWVERSION` para concurrencia optimista en `PATCH`.
- Los estados son cadenas controladas por `CHECK`, no tablas polimórficas.
- Las claves foráneas usan `NO ACTION`: no hay borrado en cascada.
- Las claves candidatas se declaran con `UNIQUE` aunque no sean la PK.

## 2. Identidad y acceso

**`roles`**
`rol_id` PK; `codigo` UQ (`DONANTE`, `REPRESENTANTE`, `ADMINISTRADOR`); `nombre`; `descripcion?`;
`activo`.

**`permisos`**
`permiso_id` PK; `codigo` UQ; `modulo`; `descripcion?`. Catálogo limitado a permisos
realmente usados por el sistema; no se crea un permiso “por completar”.

**`rol_permisos`**
PK `(rol_id, permiso_id)`; FK a `roles` y `permisos`.

**`usuarios`**
`usuario_id` PK; `email` UQ; `password_hash`; `hash_version`; `nombres`; `apellidos`;
`telefono_cifrado?`; `telefono_nonce?`; `telefono_clave_version?`; `estado_cuenta`
(`PENDIENTE_VERIFICACION`, `ACTIVO`, `BLOQUEADO`, `BAJA`); `email_verificado_en?`;
`intentos_fallidos`; `bloqueado_hasta?`; `ultimo_acceso_en?`; `fecha_registro`; `fecha_baja?`;
`fila_version`.

**`usuario_roles`**
PK `(usuario_id, rol_id)`; `estado` (`PENDIENTE`, `ACTIVO`, `INACTIVO`); `asignado_en`;
`asignado_por_usuario_id?` FK a `usuarios`. Índice filtrado único para `ACTIVO`.

**`tokens_seguridad`**
`token_id` PK; `usuario_id` FK; `tipo` (`VERIFICAR_EMAIL`, `RECUPERAR_CLAVE`,
`REFRESCAR_SESION`, `VERIFICAR_CAMBIO_EMAIL`); `token_hash` UQ; `creado_en`; `expira_en`;
`usado_en?`; `revocado_en?`; `intentos`; `sucede_a_token_id?` FK a la misma tabla para rotación.

**`donantes`**
`usuario_id` PK/FK; `distrito_id` FK; `preferencia_notificacion` (`TODAS`, `IMPORTANTES`,
`NINGUNA`); `consentimiento_datos`; `acepta_terminos`; `fecha_registro`.
No contiene nombre, correo ni contraseña: esos datos viven solo en `usuarios`.

**`distritos`**
`distrito_id` PK; `nombre` UQ; `provincia`; `departamento`; `activo`. Catálogo administrativo
real; se cargará en Fase 06 sin coordenadas inventadas.

**`parametros_sistema`**
`parametro_id` PK; `clave` UQ; `valor`; `descripcion?`; `actualizado_en`;
`actualizado_por_usuario_id` FK a `usuarios`. Claves previstas:
`COMPROMISO_EXPIRACION_MINUTOS`, `GPS_DURACION_MAX_MINUTOS`, `ARCHIVO_TAMANO_MAX_MB`,
`EVIDENCIA_RETENCION_DIAS`.

## 3. Archivos e instituciones

**`archivos`**
`archivo_id` PK; `propietario_usuario_id?` FK; `creado_por_usuario_id` FK; `nombre_original`;
`nombre_almacenado` UQ; `extension`; `content_type`; `tamano_bytes`; `hash_sha256`;
`ruta_almacenamiento`; `visibilidad` (`PUBLICO`, `PRIVADO`); `tipo`
(`DOCUMENTO_INSTITUCION`, `FOTO_INSTITUCION`, `FOTO_NECESIDAD`, `EVIDENCIA_RECEPCION`,
`ADJUNTO_CHAT`); `creado_en`; `eliminado_en?`.
No existe `institucion_id` genérico: la asociación se hace solo mediante tablas explícitas.

**`tipos_institucion`**
`tipo_id` PK; `codigo` UQ (`COMEDOR`, `ALBERGUE`, `REFUGIO_ANIMAL`, `ORGANIZACION_SOCIAL`,
`OTRO`); `nombre`; `descripcion?`.

**`instituciones`**
`institucion_id` PK; `tipo_id` FK; `distrito_id` FK; `nombre`; `slug` UQ; `descripcion?`;
`direccion?`; `telefono_publico?`; `email_publico?`; `latitud?`, `longitud?` (públicas);
`foto_archivo_id?` FK UQ; `estado_verificacion` (`PENDIENTE`, `EN_REVISION`, `VERIFICADA`,
`RECHAZADA`, `SUSPENDIDA`, `BAJA`); `fecha_registro`; `fecha_verificacion?`;
`verificado_por_usuario_id?` FK; `fila_version`. No hay columna `activo`: `BAJA` es la baja
lógica y evita estado derivado.

**`institucion_representantes`**
PK `(institucion_id, usuario_id)`; `cargo?`; `es_contacto_principal`; `estado` (`PENDIENTE`,
`ACTIVO`, `INACTIVO`, `RETIRADO`); `fecha_inicio`; `fecha_fin?`.
Índice filtrado único de contacto principal activo por institución.

**`institucion_documentos`**
`documento_id` PK; `institucion_id` FK; `archivo_id` FK; `tipo_documento`
(`RAZON_SOCIAL`, `AUTORIZACION_MUNICIPAL`, `OTRO`); `numero_documento_cifrado?`; `nonce?`;
`clave_version?`; `estado_revision` (`PENDIENTE`, `APROBADO`, `OBSERVADO`, `RECHAZADO`);
`revisado_por_usuario_id?`; `revisado_en?`. Las tres columnas de cifrado son todas nulas o
todas no nulas.

**`verificaciones_institucion`**
`verificacion_id` PK; `institucion_id` FK; `revisor_usuario_id` FK; `estado_anterior`;
`estado_nuevo`; `motivo?`; `creado_en`. Historial inmutable de decisiones administrativas.

## 4. Catálogo de bienes y necesidades

**`categorias_bienes`**
`categoria_id` PK; `codigo` UQ; `nombre`; `descripcion?`; `orden`; `activo`.

**`unidades_medida`**
`unidad_id` PK; `codigo` UQ; `nombre`; `simbolo`; `permite_fracciones`; `decimales` (0–3).

**`productos`**
`producto_id` PK; `categoria_id` FK; `nombre`; `descripcion?`; `activo`; UQ `(categoria_id,
nombre)`.

**`producto_unidades`**
PK `(producto_id, unidad_id)`; `es_preferida`. Toda línea de cantidad referencia esta
combinación.

**`necesidades`**
`necesidad_id` PK; `institucion_id` FK; `titulo`; `descripcion`; `prioridad` (`ALTA`, `MEDIA`,
`BAJA`); `estado` (`BORRADOR`, `PUBLICADA`, `PAUSADA`, `COMPLETADA`, `VENCIDA`, `CANCELADA`);
`fecha_publicacion?`; `fecha_limite?`; `punto_acopio_id?` FK; `creado_por_usuario_id` FK;
`creado_en`; `actualizado_en`; `motivo_cancelacion?`; `fila_version`.

**`necesidad_productos`**
PK `(necesidad_id, producto_id, unidad_id)`; `cantidad_requerida` > 0; FK a `necesidades`; FK
compuesto `(producto_id, unidad_id)` a `producto_unidades`. No guarda cantidades comprometidas.

**`necesidad_fotos`**
PK `(necesidad_id, archivo_id)`; FK a `necesidades` y `archivos`. El servicio valida que el
archivo sea `FOTO_NECESIDAD`.

## 5. Compromisos, entregas y recepciones

Para impedir asociaciones cruzadas, las tablas de línea repiten el identificador del padre
necesario y lo protegen con FK compuestos.

**`compromisos`**
`compromiso_id` PK; `necesidad_id` FK; `donante_usuario_id` FK; `estado` (`PENDIENTE`,
`ACEPTADO`, `RECHAZADO`, `CANCELADO`, `VENCIDO`, `COMPLETADO`); `fecha_compromiso`;
`expira_en?`; `observaciones?`; `creado_en`; `fila_version`; UQ `(compromiso_id, necesidad_id)`.
`CHECK`: si `estado='PENDIENTE'`, `expira_en` es obligatoria.

**`compromiso_productos`**
PK `(compromiso_id, producto_id, unidad_id)`; `necesidad_id`; `cantidad_comprometida` > 0;
FK `(compromiso_id, necesidad_id)` a `compromisos`; FK `(necesidad_id, producto_id, unidad_id)`
a `necesidad_productos`. Así un donante no puede comprometer un bien que la necesidad no pide.

**`compromiso_historial`**
`historial_id` PK; `compromiso_id` FK; `estado_anterior`; `estado_nuevo`; `cambiado_en`;
`usuario_id` FK; `motivo?`.

**`entregas`**
`entrega_id` PK; `compromiso_id` FK; `punto_acopio_id?` FK; `fecha_programada`;
`fecha_real_inicio?`; `fecha_real_fin?`; `estado` (`PROGRAMADA`, `EN_CAMINO`, `ENTREGADA`,
`INCIDENCIA`, `CANCELADA`); `responsable_usuario_id` FK; `observaciones?`; `fila_version`;
UQ `(entrega_id, compromiso_id)`.

**`entrega_productos`**
PK `(entrega_id, producto_id, unidad_id)`; `compromiso_id`; `cantidad_entregada` > 0;
FK `(entrega_id, compromiso_id)` a `entregas`; FK `(compromiso_id, producto_id, unidad_id)` a
`compromiso_productos`.

**`entrega_historial`**
`historial_id` PK; `entrega_id` FK; `estado_anterior`; `estado_nuevo`; `cambiado_en`;
`usuario_id` FK; `motivo?`. `motivo` obligatorio para reprogramación o incidencia.

**`recepciones`**
`recepcion_id` PK; `entrega_id` FK UQ; `recibido_por_usuario_id` FK; `fecha_confirmacion`;
`estado` (`PARCIAL`, `CONFIRMADA`, `OBSERVADA`); `observaciones?`; `fila_version`; UQ
`(recepcion_id, entrega_id)`. Una sola recepción final por entrega.

**`recepcion_productos`**
PK `(recepcion_id, producto_id, unidad_id)`; `entrega_id`; `cantidad_recibida` >= 0;
FK `(recepcion_id, entrega_id)` a `recepciones`; FK `(entrega_id, producto_id, unidad_id)` a
`entrega_productos`. Esto impide confirmar bienes que no fueron entregados.

**`recepcion_evidencias`**
PK `(recepcion_id, archivo_id)`; FK a `recepciones` y `archivos`. El servicio exige
`archivos.tipo='EVIDENCIA_RECEPCION'` y `visibilidad='PRIVADO'`.

## 6. Ubicación y GPS

**`puntos_acopio`**
`punto_id` PK; `institucion_id` FK; `distrito_id` FK; `nombre`; `direccion?`;
`referencias_entrega?`; `latitud?`, `longitud?` decimales públicos; `estado` (`ACTIVO`,
`INACTIVO`); `creado_en`; `fila_version`.

**`puntos_acopio_horarios`**
PK `(punto_id, dia_semana, hora_apertura)`; `hora_cierre` > apertura; `activo`. `dia_semana`
1–7 ISO, hora local recurrente (`America/Lima`).

**`sesiones_gps`**
`sesion_id` PK; `entrega_id` FK; `usuario_id` FK; `consentimiento_dado` (debe ser 1);
`consentimiento_en`; `fecha_inicio`; `fecha_fin?`; `expira_en`; `estado` (`ACTIVA`,
`DETENIDA`, `EXPIRADA`, `CANCELADA`). Índice filtrado único de sesión `ACTIVA` por entrega y
por usuario.

**`gps_ultima_ubicacion`**
`sesion_id` PK/FK; `coordenadas_cifradas`; `nonce`; `clave_version`; `precision_metros` >= 0;
`actualizado_en`. Las coordenadas son lógicamente latitud/longitud en WGS84 (EPSG:4326),
validadas en backend antes de cifrar. No hay historial de posiciones; se elimina al detener,
cancelar, vencer o retirar consentimiento.

## 7. Chat, notificaciones y auditoría

**`conversaciones`**
`conversacion_id` PK; `necesidad_id?` FK; `compromiso_id?` FK; `estado` (`ABIERTA`,
`CERRADA`); `creada_por_usuario_id` FK; `creada_en`; `cerrada_en?`.
`CHECK`: exactamente uno de `necesidad_id` / `compromiso_id` no nulo.

**`conversacion_participantes`**
PK `(conversacion_id, usuario_id)`; `tipo_participante` (`DONANTE`, `REPRESENTANTE`,
`ADMINISTRADOR`); `estado` (`ACTIVO`, `SUSPENDIDO`, `SALIO`, `RETIRADO`); `fecha_union`;
`fecha_salida?`; `ultimo_mensaje_leido_id?`.
FK `(conversacion_id, ultimo_mensaje_leido_id)` a `mensajes(conversacion_id, mensaje_id)`: la
marca de lectura no puede apuntar a otra conversación.

**`mensajes`**
`mensaje_id` PK; `conversacion_id` FK; `remitente_usuario_id` FK; `contenido`
`NVARCHAR(4000)`; `tipo` (`TEXTO`, `ARCHIVO`, `SISTEMA`); `client_message_id` `UNIQUEIDENTIFIER`;
`creado_en`; `eliminado_en?`; UQ `(conversacion_id, mensaje_id)` y UQ
`(remitente_usuario_id, client_message_id)`. Un reintento con el mismo `client_message_id`
devuelve el mensaje existente solo si coincides remitente y conversación; si el contexto cambia,
se responde `409`.

**`mensaje_adjuntos`**
PK `(mensaje_id, archivo_id)`; FK a `mensajes` y `archivos`.

**`reportes_mensaje`**
`reporte_id` PK; `mensaje_id` FK; `reportado_por_usuario_id` FK; `motivo` (`ABUSO`, `SPAM`,
`CONTENIDO_INAPROPIADO`, `OTRO`); `descripcion?`; `estado` (`PENDIENTE`, `RESUELTO`,
`DESESTIMADO`); `creado_en`; `resuelto_por_usuario_id?`; `resuelto_en?`; UQ
`(mensaje_id, reportado_por_usuario_id)`.

**`notificaciones`**
`notificacion_id` PK; `destinatario_usuario_id` FK; `tipo`; `titulo`; `cuerpo` <= 500;
`creado_en`; `leido_en?`; `archivado_en?`; FKs opcionales tipadas: `mensaje_id`,
`compromiso_id`, `entrega_id`, `recepcion_id`, `institucion_id`, `verificacion_id`.
`CHECK`: como máximo una FK no nula. Los tipos `ALERTA_SEGURIDAD`, `RECUPERACION_ACCESO`,
`CAMBIO_CUENTA` y `VERIFICACION_EMAIL` exigen todas nulas; los tipos de negocio exigen la FK
correspondiente.

**`auditoria_eventos`**
`evento_id` PK; `usuario_id?` FK; `tipo_evento`; `modulo`; `recurso_tipo`; `recurso_id?`;
`origen` (`WEB`, `WS`, `SISTEMA`); `resultado` (`OK`, `DENEGADO`, `ERROR`); `descripcion`;
`creado_en`. `recurso_id` no lleva FK a propósito: el log es polimórfico e inmutable y debe
sobrevivir al recurso. Los historiales específicos sí tienen FK real.

## 8. Vistas previstas (sin datos calculados almacenados)

| Vista | Columnas clave | Uso |
|---|---|---|
| `vw_disponibilidad_necesidad` | `necesidad_id`, `producto_id`, `unidad_id`, `cantidad_requerida`, `cantidad_reservada_vigente`, `cantidad_recibida`, `cantidad_disponible` | Catálogo y validación de compromisos. |
| `vw_progreso_necesidad` | `necesidad_id`, `lineas_totales`, `lineas_cubiertas`, `avance_porcentaje` | Tarjetas de progreso real. El avance es promedio de razones por línea, nunca suma de unidades distintas. |
| `vw_directorio_instituciones` | `institucion_id`, `nombre`, `slug`, `tipo`, `distrito`, `estado_verificacion`, `foto_archivo_id` | Directorio público; filtra `VERIFICADA`. |
| `vw_representante_autorizado` | `usuario_id`, `institucion_id`, `rol_estado`, `vinculo_estado`, `institucion_estado`, `autorizado` | Autorización institucional: exige los tres estados válidos. |
| `vw_participantes_entrega` | `entrega_id`, `usuario_id`, `rol`, `institucion_id`, `activo` | Participantes válidos de entrega y GPS. |
| `vw_conversaciones_usuario` | `usuario_id`, `conversacion_id`, `total_mensajes`, `mensajes_no_leidos`, `ultimo_mensaje_en` | Bandeja de chat. |
| `vw_donante_resumen` | `usuario_id`, `compromisos_activos`, `entregas_pendientes`, `donaciones_confirmadas` | Dashboard de donante. |
| `vw_institucion_resumen` | `institucion_id`, `necesidades_publicadas`, `compromisos_recibidos`, `recepciones_confirmadas` | Dashboard institucional. |
| `vw_admin_resumen` | `instituciones_pendientes`, `usuarios_activos`, `incidencias_abiertas` | Dashboard administrativo. |

## 9. Dependencias funcionales relevantes

```
roles(rol_id → codigo, nombre, descripcion, activo)
permisos(permiso_id → codigo, modulo, descripcion)
usuarios(usuario_id → email, password_hash, nombres, apellidos, estado_cuenta, ...)
email → usuario_id                         (clave candidata)
usuario_roles((usuario_id, rol_id) → estado, asignado_en, asignado_por)
donantes(usuario_id → distrito_id, preferencia_notificacion, consentimiento_datos, acepta_terminos)
instituciones(institucion_id → tipo_id, distrito_id, nombre, slug, estado_verificacion, ...)
slug → institucion_id                      (clave candidata)
institucion_representantes((institucion_id, usuario_id) → cargo, es_contacto_principal, estado, fechas)
productos(producto_id → categoria_id, nombre, descripcion, activo)
producto_unidades((producto_id, unidad_id) → es_preferida)
necesidad_productos((necesidad_id, producto_id, unidad_id) → cantidad_requerida)
compromisos(compromiso_id → necesidad_id, donante_usuario_id, estado, fecha_compromiso, expira_en)
compromiso_productos((compromiso_id, producto_id, unidad_id) → cantidad_comprometida, necesidad_id)
entregas(entrega_id → compromiso_id, fecha_programada, estado, responsable_usuario_id)
entrega_productos((entrega_id, producto_id, unidad_id) → cantidad_entregada, compromiso_id)
recepciones(entrega_id → recepcion_id, recibido_por_usuario_id, fecha_confirmacion, estado)
recepcion_productos((recepcion_id, producto_id, unidad_id) → cantidad_recibida, entrega_id)
mensajes(mensaje_id → conversacion_id, remitente_usuario_id, contenido, client_message_id, creado_en)
(remitente_usuario_id, client_message_id) → mensaje_id   (clave candidata de idempotencia)
```

La demostración completa de 1FN, 2FN y 3FN está en `docs/normalizacion.md`.
