# Propuesta funcional: experiencias, valoraciones, reportes, moderación y favoritos

> **Estado: propuesta, no implementación.** Este documento explora una funcionalidad futura y
> **no** declara tablas, endpoints, permisos ni pantallas ya creados. La Fase 07.B.2 es
> estrictamente frontend: `BackendEstadoService.integracionHabilitada = false`, sin peticiones
> HTTP, WebSocket, `localStorage` ni `sessionStorage` como base de datos. No se modifica
> `backend/`, `database/` ni el frontend en esta entrega; tampoco se ejecutan DDL, DML ni scripts
> SQL. Todo lo aquí descrito requiere una fase autorizada posterior y coordinación con el
> responsable de backend.

## 1. Contexto y límite actual

La página editorial prevista **«Historias que conectan»** usará `experiencias-solidarias.webp` y
`comunidad-solidaria.webp` como ilustraciones proporcionadas por el usuario. Se muestran como
composición visual, **nunca** como evidencia de entregas reales, testimonios de personas
identificables, organizaciones verificadas ni estadísticas. En consecuencia:

- No se publica ningún relato, comentario, puntuación ni favorito de ejemplo.
- No se habilitan botones que simulen guardar una experiencia, enviar una valoración ni marcar un
  favorito. Hasta que exista autenticación y API reales, esos controles no se presentan como
  funcionales.
- Las secciones de la página explican el propósito del proyecto y enlazan rutas existentes
  (`/como-donar`, `/nosotros`, `/registro`); no sustituyen a un módulo de experiencias.

La base de referencia sigue siendo el modelo de 42 tablas de Fase 05.1, desplegado según
`docs/modelo-fisico.md`, `docs/diccionario-datos.md`, `docs/reglas-negocio.md` y
`docs/contrato-api.md`.

## 2. Funcionalidad futura propuesta

### 2.1 Quién puede publicar

La publicación de una **experiencia** solo se propone después de una recepción confirmada:

| Condición | Regla propuesta |
|---|---|
| Recepción | `recepciones.estado = 'CONFIRMADA'`. No basta con `entregas.estado = 'ENTREGADA'`: la confirmación la firma un representante autorizado (BR-22). |
| Autor donante | `usuario_id` propietario de `compromisos.donante_usuario_id` asociado a la entrega. |
| Autor institución | Representante autorizado por `vw_representante_autorizado`: rol `ACTIVO`, vínculo `ACTIVO` e institución `VERIFICADA` (BR-08). Se propone limitar la autoría inicial a quien confirmó la recepción (`recepciones.recibido_por_usuario_id`) para reducir la superficie de autoría; ampliar a otros representantes requiere acuerdo previo. |
| Límite | Como máximo una experiencia por `recepcion_id` y `autor_tipo` (`DONANTE` / `INSTITUCION`). Así caben dos perspectivas sin duplicados. |
| Plazo | Ventana parametrizable después de `recepciones.fecha_confirmacion`. Se propone 30 días como valor inicial **a acordar**, mediante una clave nueva de `parametros_sistema`; fuera de la ventana se requeriría revisión administrativa. |

La condición se verifica siempre en backend. Los guards de Angular solo ayudan a la navegación
(AGENTS.md §9 y §16).

### 2.2 Comentarios y valoraciones

- **Comentario:** respuesta textual de la contraparte autorizada de la misma recepción. Si la
  experiencia la escribió el donante, comenta el representante autorizado; si la escribió la
  institución, comenta el donante. Se propone **un comentario por experiencia y autor**, editable,
  para no convertir este módulo en un segundo chat. La conversación privada existente
  (`mensajes`) no se reutiliza como comentario público.
- **Valoración:** puntuación entera `1..5` sobre la colaboración recibida. La parte evaluada se
  **deriva** de la parte evaluadora: donante evalúa a la institución; representante evalúa al
  donante. No se almacena un campo `evaluado_tipo` redundante, para no romper 3FN. Máximo una
  valoración vigente por recepción y evaluador.
- Los promedios se calculan en una vista sobre valoraciones vigentes; **nunca** se guarda un
  promedio ni un contador derivado. La interfaz mostraría el estado vacío correspondiente cuando
  no haya valoraciones reales.

### 2.3 Validaciones propuestas

| Campo | Regla propuesta |
|---|---|
| `relato` | Obligatorio, `1..2000` caracteres después de recortar espacios; texto plano, sin HTML ni Markdown renderizado. |
| `titulo` | Opcional, `1..150` caracteres. |
| `texto` de comentario | `1..1000` caracteres, texto plano. |
| `puntuacion` | Entero `1..5`; se rechaza `0`, valores negativos y decimales. |
| `consentimiento_publicacion` | Debe ser `true` para pasar a `PUBLICADA`; se puede retirar después. |
| Contenido | Sin nombres completos de beneficiarios, menores ni personas vulnerables; sin correos, teléfonos, direcciones privadas, coordenadas, enlaces externos ni datos de documentos. Se valida en Pydantic y en el servicio antes de persistir. |
| Concurrencia | Los `PATCH` incluyen `fila_version` (`ROWVERSION` serializado como cadena); una versión obsoleta responde `409`. |
| Idempotencia | Las `UNIQUE` naturales impiden duplicados ante reintentos; una segunda petición equivalente devuelve el recurso existente o `409` según la operación. |

Las longitudes y umbrales son propuestas: deben acordarse antes de convertirse en `CHECK`,
validadores Pydantic y claves de `parametros_sistema`.

### 2.4 Edición, baja lógica y retirada

- El autor puede editar su experiencia, comentario o valoración mientras estén en estado
  editable y no exista una sanción de moderación firme.
- **No se propone borrado físico** para estos recursos: se usan estados `RETIRADA`, `OCULTO` /
  `RETIRADO` y `VIGENTE` / `OCULTA` / `RETIRADA`, coherentes con BR-42. La auditoría conserva el
  hecho, nunca el texto completo.
- El retiro de consentimiento de publicación convierte la experiencia en `RETIRADA` y oculta sus
  comentarios y valoraciones asociados en el DTO público, sin borrar la trazabilidad.

### 2.5 Reportes y moderación administrativa

- Cualquier usuario autenticado con acceso al recurso puede reportarlo una sola vez. Motivos
  propuestos: `ABUSO`, `SPAM`, `CONTENIDO_INAPROPIADO`, `OTRO`, alineados con
  `reportes_mensaje`.
- Un administrador consulta la cola de reportes pendientes y resuelve: `APROBAR`, `OCULTAR`,
  `RETIRAR` o `DESESTIMAR`. La decisión escribe el historial de moderación, cambia el estado del
  recurso y registra un evento en `auditoria_eventos` con `modulo='EXPERIENCIAS'`.
- Se propone ocultamiento preventivo automático solo a partir de un número de reportes
  **distintos** configurado en `parametros_sistema`; la sanción definitiva siempre requiere
  revisión humana. Nunca se publica el nombre de quien reporta en el DTO de otros usuarios.
- La moderación se propone como tabla de historial inmutable; el estado vigente permanecería en
  la tabla del recurso para no duplicar datos derivados.

### 2.6 Antiabuso y privacidad

| Medida | Propuesta |
|---|---|
| Límites | Cuota diaria por usuario para publicar, comentar, valorar y marcar favoritos, definida en `parametros_sistema` y aplicada con `rate limiting` en FastAPI. |
| Unicidad | Una experiencia por recepción y autor, un comentario por autor y experiencia, una valoración por evaluador y recepción, un favorito activo por usuario y experiencia, un reporte por recurso y usuario. |
| Detección | Rechazo de texto duplicado o con patrones de enlace/promoción; auditoría de intentos denegados sin registrar el contenido completo. |
| Identidad pública | El DTO público muestra una etiqueta de rol («Donante», «Institución verificada»), el distrito catalogado y, cuando corresponda, el **nombre público** de la institución que ya aparece en el directorio. Nunca expone `nombres`, `apellidos`, `email`, teléfono, `usuario_id` ajeno ni `slug` privado. |
| Notificaciones | Texto genérico de hasta 500 caracteres, sin fragmentos del relato, nombres completos ni coordenadas; sin información sensible en pantallas bloqueadas. |
| Evidencias | No se reutilizan imágenes de `EVIDENCIA_RECEPCION` en el módulo público sin autorización explícita; se mantendría el saneamiento de EXIF y la protección de imágenes de menores (AGENTS.md §16). |
| GPS | Ninguna coordenada privada interviene en experiencias, valoraciones ni favoritos; la recepción la confirma una persona, no una ubicación. |

## 3. Revisión de las 42 tablas existentes

### 3.1 Lo que ya puede aprovecharse

| Tabla / campos actuales | Aporte para la funcionalidad futura |
|---|---|
| `recepciones(recepcion_id, entrega_id, estado, fecha_confirmacion, recibido_por_usuario_id)` | Define la condición de elegibilidad y al firmante de la recepción. |
| `entregas`, `entrega_productos`, `compromisos`, `compromiso_productos`, `necesidades`, `necesidad_productos` | Permiten reconstruir por `JOIN` el donante, la institución, los bienes y las cantidades confirmadas. |
| `usuarios`, `donantes`, `usuario_roles`, `institucion_representantes`, `vw_representante_autorizado`, `vw_participantes_entrega` | Soportan la autorización por rol **y** propiedad. |
| `instituciones(slug, nombre, distrito_id, estado_verificacion, foto_archivo_id)` | Fuente del único nombre institucional que podría mostrarse públicamente. |
| `notificaciones` | Canal de avisos; su `CHECK` de una sola FK no nula tendría que ampliarse si se quiere referenciar una experiencia. |
| `auditoria_eventos` | Trazabilidad polimórfica ya existente; no requiere tabla nueva de auditoría. |
| `archivos` | Modelo de metadatos y validación; su `CHECK` de `tipo` no contempla hoy una foto de experiencia. |
| `parametros_sistema` | Lugar natural para plazos, cuotas y umbrales de moderación. |
| `reportes_mensaje` | Patrón de reporte y resolución, pero con FK rígida a `mensajes`; no es reutilizable sin una tabla propia. |

### 3.2 Lo que no cubren

- No hay texto de experiencia, comentario público ni puntuación en ninguna tabla.
- No hay consentimiento de publicación ni plazo de publicación.
- No hay estado de publicación, ocultamiento o retirada para contenido generado por usuarios.
- No hay reportes sobre experiencias, comentarios ni valoraciones: `reportes_mensaje` apunta solo
  a `mensajes`.
- No hay historial de decisiones moderadoras.
- No hay relación usuario–experiencia para favoritos.
- `mensajes` es privado y no debe convertirse en comentario público; `notificaciones.cuerpo` está
  limitado a 500 caracteres y no debe contener el relato completo.
- Las vistas existentes calculan disponibilidad, progreso y resúmenes, pero ninguna expone
  valoraciones agregadas ni un feed público filtrado.

### 3.3 Entidades nuevas propuestas en 3FN

Se respetan las convenciones de `docs/modelo-fisico.md`: `INT IDENTITY` para recursos
operativos, `BIGINT IDENTITY` para historiales y eventos, `DATETIME2(0)` en UTC, `ROWVERSION`
donde haya `PATCH` concurrente y FK `NO ACTION`. No se crean columnas derivadas ni importes.

| Entidad | Claves y restricciones propuestas | Notas de normalización |
|---|---|---|
| `experiencias` | PK `experiencia_id INT`. FK `recepcion_id` → `recepciones`; FK compuesto `(recepcion_id, entrega_id)` → `recepciones(recepcion_id, entrega_id)` para impedir asociaciones cruzadas. `autor_usuario_id` FK → `usuarios`. `autor_tipo VARCHAR(12)` con `CHECK IN ('DONANTE','INSTITUCION')`. UQ `(recepcion_id, autor_tipo)`. `relato NVARCHAR(2000)`, `titulo? NVARCHAR(150)`, `consentimiento_publicacion BIT`, `estado VARCHAR(20)` con `CHECK IN ('BORRADOR','PENDIENTE_MODERACION','PUBLICADA','OCULTA','RETIRADA')`, `creado_en`, `publicado_en?`, `actualizado_en?`, `fila_version`. `CHECK`: si `estado='PUBLICADA'` entonces `consentimiento_publicacion=1` y `publicado_en IS NOT NULL`. | Ni `institucion_id` ni nombre de autor se almacenan: se derivan por `JOIN` desde la recepción. `autor_tipo` forma parte de la clave candidata, por lo que no es una dependencia transitiva. |
| `comentarios_experiencia` | PK `comentario_id BIGINT`. FK `experiencia_id` → `experiencias`; FK compuesto `(experiencia_id, recepcion_id)` → `experiencias(experiencia_id, recepcion_id)` (requiere UQ adicional en `experiencias`). `autor_usuario_id` FK → `usuarios`. `texto NVARCHAR(1000)`, `estado VARCHAR(10)` con `CHECK IN ('VISIBLE','OCULTO','RETIRADO')`, `creado_en`, `actualizado_en?`, `fila_version`. UQ `(experiencia_id, autor_usuario_id)`. | Un solo comentario por autor y experiencia. La condición de contraparte se valida en el servicio: SQL Server no puede declarar FK contra `vw_participantes_entrega`. |
| `valoraciones` | PK `valoracion_id BIGINT`. FK `recepcion_id` → `recepciones`; FK compuesto `(recepcion_id, entrega_id)` → `recepciones(recepcion_id, entrega_id)`. `evaluador_usuario_id` FK → `usuarios`. `puntuacion TINYINT` con `CHECK BETWEEN 1 AND 5`. `estado VARCHAR(10)` con `CHECK IN ('VIGENTE','OCULTA','RETIRADA')`, `creado_en`, `actualizado_en?`, `fila_version`. UQ `(recepcion_id, evaluador_usuario_id)`. | La parte evaluada se deriva del evaluador; no se guardan `evaluado_tipo`, promedio ni contador. |
| `reportes_contenido` | PK `reporte_id BIGINT`. FKs nulas tipadas `experiencia_id?`, `comentario_id?`, `valoracion_id?`; `reportado_por_usuario_id` FK → `usuarios`. `motivo VARCHAR(25)` con `CHECK IN ('ABUSO','SPAM','CONTENIDO_INAPROPIADO','OTRO')`, `descripcion? NVARCHAR(500)`, `estado VARCHAR(15)` con `CHECK IN ('PENDIENTE','RESUELTO','DESESTIMADO')`, `creado_en`, `resuelto_por_usuario_id?`, `resuelto_en?`. `CHECK`: exactamente una de las tres FKs de recurso es no nula. Índices Únicos filtrados por recurso y reportante. | Patrón ya usado por `notificaciones`: integridad referencial real sin tablas polimórficas genéricas. |
| `moderacion_contenido` | PK `moderacion_id BIGINT`. `reporte_id? BIGINT` FK → `reportes_contenido` (nulo en revisión preventiva). FKs nulas tipadas a los tres recursos, con el mismo `CHECK` de una sola no nula. `moderador_usuario_id` FK → `usuarios`, `accion VARCHAR(15)` con `CHECK IN ('APROBAR','OCULTAR','RETIRAR','DESESTIMAR')`, `motivo NVARCHAR(500)`, `creado_en`. | Historial inmutable. El estado vigente se actualiza en la tabla del recurso; aquí no se duplica. |
| `favoritos` | PK `favorito_id BIGINT`. `usuario_id` FK → `usuarios`; `experiencia_id` FK → `experiencias`. `estado VARCHAR(10)` con `CHECK IN ('ACTIVO','RETIRADO')`, `creado_en`, `retirado_en?`. UQ `(usuario_id, experiencia_id)`. `CHECK`: `retirado_en` es nulo si y solo si `estado='ACTIVO'`. | Relación de propiedad; no guarda el relato ni el nombre de la experiencia, que se obtienen por `JOIN`. |

**Vistas propuestas**, sin cantidades almacenadas:

| Vista | Función |
|---|---|
| `vw_experiencias_publicas` | Filtra `experiencias.estado='PUBLICADA'`, excluye recursos retirados, y une etiqueta de autor, distrito y nombre público de institución cuando corresponda. |
| `vw_valoracion_institucion` | Calcula `AVG(puntuacion)` y `COUNT(*)` sobre `valoraciones.estado='VIGENTE'` agrupando por institución derivada de la recepción. Devuelve `0` filas si no hay valoraciones; la interfaz muestra estado vacío. |
| `vw_favoritos_usuario` | Lista favoritos `ACTIVO` con `experiencia_id` y `creado_en`, para la respuesta paginada del usuario. |

**Claves de `parametros_sistema` propuestas** (no existen hoy): `EXPERIENCIA_PUBLICACION_DIAS_MAX`,
`CONTENIDO_CUOTA_DIARIA`, `CONTENIDO_LONGITUD_RELATO`, `CONTENIDO_LONGITUD_COMENTARIO`,
`REPORTE_UMBRAL_OCULTAMIENTO` y `FAVORITOS_MAX_ACTIVOS`. Su alta requiere script autorizado; no se
añaden en esta propuesta.

**Índices justificados:**

| Índice | Justificación |
|---|---|
| UQ `(recepcion_id, autor_tipo)` en `experiencias` | Una perspectiva por receptor y autor; además de unicidad, apoya la búsqueda por recepción. |
| UQ `(experiencia_id, recepcion_id)` en `experiencias` | Habilita el FK compuesto de comentarios y valoraciones sin asociaciones cruzadas. |
| `IX_experiencias_publicadas(estado, publicado_en DESC) WHERE estado='PUBLICADA'` | Feed público ordenado por fecha real de publicación. |
| UQ `(experiencia_id, autor_usuario_id)` en `comentarios_experiencia` | Evita duplicados del mismo autor y acelera la carga de comentarios. |
| UQ `(recepcion_id, evaluador_usuario_id)` en `valoraciones` | Impedir valoraciones repetidas y servir de acceso por recepción. |
| `IX_valoraciones_vigentes(institucion_id, puntuacion) WHERE estado='VIGENTE'` | Solo si se decide materializar la institución derivada en una vista indexada; de lo contrario el cálculo se hace desde los `JOIN` y este índice no se crea. |
| Tres índices únicos filtrados en `reportes_contenido(experiencia_id / comentario_id / valoracion_id, reportado_por_usuario_id)` | Un reporte por persona y recurso, sin permitir que un `NULL` colisione con otro. |
| `IX_reportes_pendientes(estado, creado_en)` | Cola de moderación ordenada por antigüedad. |
| UQ `(usuario_id, experiencia_id)` en `favoritos` y `IX_favoritos_activos(usuario_id, creado_en DESC) WHERE estado='ACTIVO'` | Idempotencia del alta y lectura paginada de la lista propia. |

No se propone `DELETE` para ninguna de estas tablas: el borrado físico sigue limitado a
borradores de necesidad sin relaciones (AGENTS.md §7 y `docs/modelo-fisico.md` §8). Las
operaciones multsentencia (publicar + notificar + auditar; resolver reporte + cambiar estado +
auditar) usarían una transacción administrada por `database/` con `autocommit=False`, sin anidar
transacciones dentro de los dos procedimientos existentes.

## 4. Endpoints REST propuestos

**Todos son propuestas para una futura fase autorizada.** No existe ninguno de ellos en el
backend actual. Prefijo `/api/v1`, paginación `{ items, total, page, pageSize }`, errores
homogéneos `{ error: { codigo, mensaje, detalles? }, traceId? }` y fechas ISO 8601 UTC.

### 4.1 Matriz

| Método | Ruta propuesta | Autorización propuesta | Códigos |
|---|---|---|---|
| `GET` | `/experiencias` | Público; solo `PUBLICADA`. Filtros `distritoId`, `institucionId`, `fechaDesde`, `fechaHasta`, paginación. | 200 |
| `GET` | `/experiencias/{id}` | Público si está publicada; autor o admin en caso contrario. | 200, 403, 404 |
| `POST` | `/experiencias` | Donante propietario o representante autorizado con recepción `CONFIRMADA`. | 201, 400, 403, 409, 422, 429 |
| `PATCH` | `/experiencias/{id}` | Autor; solo campos editables; requiere `filaVersion`. | 200, 403, 409, 422 |
| `PATCH` | `/experiencias/{id}/publicacion` | Autor con `consentimientoPublicacion=true`; valida ventana y moderación. | 200, 403, 409 |
| `PATCH` | `/experiencias/{id}/retirada` | Autor o administrador por moderación. | 200, 403, 409 |
| `GET` | `/experiencias/{id}/comentarios` | Público si comentario `VISIBLE` y experiencia publicada; autor/admin ve los propios. | 200, 404 |
| `POST` | `/experiencias/{id}/comentarios` | Contraparte autorizada de la misma recepción. | 201, 403, 409, 422, 429 |
| `PATCH` | `/comentarios/{id}` / `/comentarios/{id}/retirada` | Autor del comentario. | 200, 403, 409, 422 |
| `POST` | `/valoraciones` | Contraparte autorizada de una recepción confirmada; una por evaluador. | 201, 403, 409, 422, 429 |
| `GET` | `/instituciones/{id}/valoraciones` | Público; **solo agregados reales**, nunca nombres de evaluadores. | 200, 404 |
| `PATCH` | `/valoraciones/{id}/retirada` | Autor de la valoración. | 200, 403, 409 |
| `POST` | `/reportes-contenido` | Usuario autenticado con acceso al recurso; un reporte por recurso. | 201, 403, 409, 422, 429 |
| `GET` | `/moderacion/reportes` | Administrador; filtros `estado`, `recursoTipo`, paginación. | 200, 403 |
| `PATCH` | `/moderacion/reportes/{id}/resolver` | Administrador; decisión con motivo obligatorio. | 200, 403, 409, 422 |
| `GET` | `/favoritos` | Usuario autenticado; solo los propios, paginados. | 200, 401 |
| `POST` | `/favoritos` | Usuario autenticado; experiencia `PUBLICADA`. Devuelve `200` si ya existe activo. | 200, 201, 403, 404, 409, 429 |
| `PATCH` | `/favoritos/{id}/estado` | Propietario; `ACTIVO` o `RETIRADO`, sin borrado físico. | 200, 403, 409 |

Se reutilizan `GET /notificaciones`, `PATCH /notificaciones/{id}/leida` y `GET /auditoria` con el
nuevo módulo `EXPERIENCIAS`; **no** se propone un segundo servicio de notificaciones ni de
auditoría. Tampoco se añaden eventos WebSocket nuevos en esta propuesta: si se decide avisar de
una publicación, el evento se persiste primero por REST y se revalida la autorización de los
participantes, según `docs/contrato-api.md` §5.

### 4.2 Contratos Pydantic / DTO resumidos

| Esquema | Campos principales | Exclusiones obligatorias |
|---|---|---|
| `ExperienciaCrearRequest` | `recepcionId`, `titulo?`, `relato`, `consentimientoPublicacion` | `autorUsuarioId` se toma de la sesión; no se acepta en el cuerpo. |
| `ExperienciaResponse` | `experienciaId`, `recepcionId`, `autorEtiqueta`, `distrito?`, `institucionPublica?`, `titulo?`, `relato`, `estado`, `publicadoEn?`, `filaVersion`, `esAutor` | `nombres`, `apellidos`, `email`, teléfono, IDs ajenos, coordenadas. |
| `ComentarioCrearRequest` / `ComentarioResponse` | `texto` / `comentarioId`, `experienciaId`, `autorEtiqueta`, `texto`, `estado`, `creadoEn` | Identidad completa del autor y del reportante. |
| `ValoracionCrearRequest` | `recepcionId`, `puntuacion` | `evaluadoTipo` y `evaluadoUsuarioId` se derivan en backend; no se aceptan del cliente. |
| `ValoracionResponse` / `ValoracionAgregadoResponse` | `valoracionId`, `puntuacion`, `estado`, `creadoEn` / `institucionId`, `promedio`, `total` | Nombres de evaluadores; el agregado nunca expone filas individuales. |
| `ReporteCrearRequest` / `ReporteResponse` | `recursoTipo`, `recursoId`, `motivo`, `descripcion?` / `reporteId`, `recursoTipo`, `estado`, `creadoEn` | `reportadoPorUsuarioId` solo en DTO de administración. |
| `ResolucionModeracionRequest` | `decision`, `motivo` | No acepta cambios directos de estado del recurso. |
| `FavoritoResponse` | `experienciaId`, `estado`, `creadoEn` | Texto de la experiencia; se consulta por su propio endpoint. |

Las respuestas paginadas usan el formato de `docs/contrato-api.md` §1. La validación de Pydantic
repite las longitudes y rangos de los `CHECK`; el servicio verifica la recepción confirmada, el rol,
la propiedad y la cuota antes de escribir.

### 4.3 Permisos que habría que acordar

Los 37 códigos sembrados en `database/scripts/005_catalogos_iniciales.sql` **no** incluyen
permisos para este módulo. Si la funcionalidad se autoriza, el equipo deberá definir e insertar,
en un script numerado nuevo y coordinado, códigos como `EXPERIENCIA_PUBLICAR_PROPIA`,
`COMENTARIO_CREAR_PROPIO`, `VALORACION_CREAR_PROPIA`, `REPORTE_CONTENIDO_CREAR`,
`MODERACION_CONTENIDO` y `FAVORITO_GESTIONAR_PROPIO`, con sus asignaciones a roles. No se crean
ni se asignan en este documento.

## 5. Favoritos

- **Modelo:** tabla `favoritos` descrita en §3.3. La unicidad `(usuario_id, experiencia_id)` da
  idempotencia al `POST`; la baja lógica evita perder la fecha de creación al retirar.
- **Endpoints:** `GET /favoritos`, `POST /favoritos` y `PATCH /favoritos/{id}/estado` (§4.1). No
  se propone `DELETE`.
- **Interfaz futura:** el control de favorito solo aparecería con una sesión válida y sobre una
  experiencia devuelta por la API. Antes de que exista autenticación, el enlace llevaría a
  `/iniciar-sesion`, que ya existe, sin alternar un estado local.
- **Sin simulación:** no se guarda nada en `localStorage`, `sessionStorage` ni variables globales
  persistidas. Los contadores, si se muestran, provendrían del DTO real; si no hay datos, se
  muestra el estado vacío y no un número inventado.
- **Privacidad:** la lista de favoritos es privada del usuario; no se publica quién marcó qué.

## 6. Reglas de negocio propuestas

Continúan la numeración de `docs/reglas-negocio.md` (BR-01 a BR-42) y **no están vigentes**:

| ID | Regla propuesta |
|---|---|
| BR-43 | Solo se puede publicar una experiencia sobre una recepción `CONFIRMADA`, por el donante propietario o el representante autorizado firmante. |
| BR-44 | Máximo una experiencia por recepción y tipo de autor; máximo un comentario por autor y experiencia. |
| BR-45 | `PUBLICADA` exige consentimiento de publicación vigente; retirarlo implica baja lógica y ocultamiento de recursos asociados. |
| BR-46 | Toda valoración es entera `1..5`, única por recepción y evaluador; el evaluado se deriva del evaluador. |
| BR-47 | Los promedios se calculan desde valoraciones vigentes; nunca se almacena un dato derivado. |
| BR-48 | Un reporte es único por recurso y usuario; el umbral de ocultamiento es configurado, no fijo en código. |
| BR-49 | La moderación definitiva la ejecuta un administrador y escribe historial y auditoría, sin texto completo. |
| BR-50 | Los DTO públicos no contienen nombres completos, mensajes completos, coordenadas ni IDs ajenos. |
| BR-51 | Los favoritos son privados, requieren sesión y experiencia publicada, y usan baja lógica. |

## 7. Coordinación pendiente

Antes de cualquier implementación se debe acordar con el responsable de backend y con el equipo:

1. Si la valoración se dirige solo a la institución o también al donante (esta propuesta deriva
   al evaluado del evaluador).
2. Etiqueta pública del donante y plazo de publicación.
3. Longitudes, cuotas y umbrales definitivos.
4. Si se admite más de un representante por institución como autor.
5. Alta de permisos, claves de parámetros, vistas, índices y scripts numerados posteriores al
   `008`. No se modificarían los scripts existentes sin autorización.
6. Si los DTO agregados se calculan en vista o en servicio, según el volumen real.
7. La incorporación de estas tablas a `docs/modelo-logico.md`, `docs/modelo-fisico.md`,
   `docs/diccionario-datos.md`, `docs/normalizacion.md`, `docs/reglas-negocio.md`,
   `docs/contrato-api.md`, `docs/seguridad-privacidad.md` y `docs/mapa-navegacion.md` solo cuando
   la fase lo autorice.

**Este documento no modifica ninguno de esos archivos, no crea scripts SQL y no ejecuta cambios
en SQL Server ni en el frontend.**
