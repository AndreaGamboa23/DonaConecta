# Normalización hasta 3FN de DonaConecta

Versión validada en la Fase 05.1. La normalización se demuestra con datos de ejemplo
**etiquetados como ilustrativos**; no son registros reales ni se insertarán en la base.

## 1. Principio

Una clave primaria artificial (`IDENTITY`) **no garantiza por sí sola 3FN**. La forma normal se
logra eliminando grupos repetitivos, dependencias parciales y dependencias transitivas. Cada
tabla debe responder a un solo hecho y las claves candidatas deben declararse con `UNIQUE`.

## 2. Dependencias funcionales relevantes

```
roles(rol_id → codigo, nombre, descripcion, activo)
codigo → rol_id                                      (clave candidata)

usuarios(usuario_id → email, password_hash, nombres, apellidos, estado_cuenta, ...)
email → usuario_id                                   (clave candidata)

instituciones(institucion_id → tipo_id, distrito_id, nombre, slug, estado_verificacion, ...)
slug → institucion_id                                (clave candidata)

institucion_representantes((institucion_id, usuario_id) → cargo, es_contacto_principal,
                                                         estado, fecha_inicio, fecha_fin)

productos(producto_id → categoria_id, nombre, descripcion, activo)
producto_unidades((producto_id, unidad_id) → es_preferida)

necesidad_productos((necesidad_id, producto_id, unidad_id) → cantidad_requerida)
compromiso_productos((compromiso_id, producto_id, unidad_id) → cantidad_comprometida, necesidad_id)
entrega_productos((entrega_id, producto_id, unidad_id) → cantidad_entregada, compromiso_id)
recepcion_productos((recepcion_id, producto_id, unidad_id) → cantidad_recibida, entrega_id)

mensajes(mensaje_id → conversacion_id, remitente_usuario_id, contenido, client_message_id, creado_en)
(remitente_usuario_id, client_message_id) → mensaje_id   (clave candidata de idempotencia)
conversacion_participantes((conversacion_id, usuario_id) → tipo_participante, estado,
                                                          ultimo_mensaje_leido_id, fechas)
```

## 3. Ejemplo 1 — Necesidades con varios productos

### 3.1 Forma no normalizada (rechazada)

| necesidad_id | titulo | productos |
|---|---|---|
| 101 | Apoyo inicial | `Arroz 5 kg; Frazadas 10 unid; Jabón 20 unid` |

Incumple **1FN**: `productos` es un grupo repetitivo dentro de una celda. Además mezcla
producto, cantidad y unidad en un texto.

### 3.2 Primera forma normal

| necesidad_id | titulo | producto | unidad | cantidad |
|---|---|---|---|---|
| 101 | Apoyo inicial | Arroz | KILOGRAMO | 5 |
| 101 | Apoyo inicial | Frazada | UNIDAD | 10 |
| 101 | Apoyo inicial | Jabón | UNIDAD | 20 |

Ya no hay listas en columnas, pero aparece `titulo` repetido: hay dependencia parcial.

### 3.3 Segunda forma normal

Clave compuesta `(necesidad_id, producto_id, unidad_id)`:

- `titulo` depende solo de `necesidad_id`.
- `descripcion` del producto depende solo de `producto_id`.
- Solo `cantidad_requerida` depende de la clave completa.

Resultado:

```
necesidades(101, 'Apoyo inicial', ...)
productos(1, 'Arroz', ...), (2, 'Frazada', ...), (3, 'Jabón', ...)
producto_unidades(1, 4), (2, 5), (3, 5)
necesidad_productos(101, 1, 4, 5.000)
necesidad_productos(101, 2, 5, 10.000)
necesidad_productos(101, 3, 5, 20.000)
```

### 3.4 Tercera forma normal

Si `productos` contuviera `categoria_nombre`, tendríamos
`producto_id → categoria_id → categoria_nombre`, una dependencia transitiva. Se corrige:

```
productos(producto_id, categoria_id FK, nombre, descripcion, activo)
categorias_bienes(categoria_id, codigo, nombre, descripcion, orden, activo)
```

El nombre de la categoría se obtiene con `JOIN`, no se guarda en `productos`.

## 4. Ejemplo 2 — Compromisos con varios bienes

### 4.1 Forma no normalizada (rechazada)

| compromiso_id | donante | bienes |
|---|---|---|
| 501 | `11` | `Arroz 3 kg; Jabón 10 unid` |

Además de incumplir 1FN, guarda el nombre del donante dentro del compromiso.

### 4.2 1FN y 2FN

```
compromisos(501, necesidad_id=101, donante_usuario_id=11, estado='PENDIENTE', expira_en=...)
compromiso_productos(501, 101, 1, 4, 3.000)
compromiso_productos(501, 101, 3, 5, 10.000)
```

`necesidad_id` se repite en las líneas **a propósito** para poder declarar el FK compuesto
`(compromiso_id, necesidad_id)` y el FK `(necesidad_id, producto_id, unidad_id)`. Eso impide
comprometer un bien que la necesidad no solicitó. El nombre del donante no se copia: se resuelve
con `JOIN` a `usuarios`.

### 4.3 3FN y cantidades derivadas

No se guarda `cantidad_disponible` en `compromisos` ni en `necesidad_productos`. La
disponibilidad se calcula en `vw_disponibilidad_necesidad` desde:

```
requerida - (reserva vigente restante + recibido)
```

Donde `reserva vigente restante` descuenta lo ya recibido del mismo compromiso. Así se evita
el error de contar `COMPLETADO` como reserva y como recepción al mismo tiempo. Si un donante
ofrece 3 kg, entrega 2 kg y se confirman 2 kg, queda 1 kg reservado y 2 kg recibidos: total
ocupado 3 kg, no 4 kg.

## 5. Ejemplo 3 — Instituciones con varios representantes

### 5.1 Forma no normalizada (rechazada)

| institucion_id | nombre | representantes |
|---|---|---|
| 7 | Comedor Esperanza | `Ana; Luis; Marta` |

Grupo repetitivo en una celda: incumple 1FN.

### 5.2 1FN y 2FN

```
institucion_representantes(7, 11, 'Presidenta', 1, 'ACTIVO', ...)
institucion_representantes(7, 12, NULL, 0, 'ACTIVO', ...)
institucion_representantes(7, 13, NULL, 0, 'RETIRADO', ...)
```

La clave es `(institucion_id, usuario_id)`. `cargo`, `es_contacto_principal`, `estado` y fechas
dependen de la clave completa. El nombre de la institución y el del usuario se eliminan: son
dependencias parciales.

### 5.3 3FN

`instituciones` guarda `tipo_id` y `distrito_id`, no `tipo_nombre` ni `distrito_nombre`:

```
instituciones(7, tipo_id=1, distrito_id=3, 'Comedor Esperanza', ...)
tipos_institucion(1, 'COMEDOR', 'Comedor comunitario')
distritos(3, 'Huancayo', 'Huancayo', 'Junín', 1)
```

## 6. Ejemplo 4 — Conversaciones con varios participantes

### 6.1 Forma no normalizada (rechazada)

| conversacion_id | participantes | mensajes |
|---|---|---|
| 900 | `Ana; Luis; Marta` | `Hola; ¿Qué necesitan?; Gracias` |

Dos grupos repetitivos en la misma fila: incumple 1FN y mezcla dos hechos distintos.

### 6.2 1FN y 2FN

```
conversacion_participantes(900, 11, 'DONANTE', 'ACTIVO', ...)
conversacion_participantes(900, 12, 'REPRESENTANTE', 'ACTIVO', ...)
conversacion_participantes(900, 13, 'REPRESENTANTE', 'RETIRADO', ...)

mensajes(7001, 900, 11, 'Hola', 'TEXTO', uuid-1, ...)
mensajes(7002, 900, 12, '¿Qué necesitan?', 'TEXTO', uuid-2, ...)
mensajes(7003, 900, 11, 'Gracias', 'TEXTO', uuid-3, ...)
```

En `conversacion_participantes`, el `estado` del participante depende de la clave compuesta, no
del mensaje. En `mensajes`, `contenido`, `tipo` y `client_message_id` dependen de `mensaje_id`.

### 6.3 3FN y desnormalización controlada

`remitente_nombre` no se guarda en `mensajes`: depende transitivamente de
`remitente_usuario_id`. Se obtiene con `JOIN`.

La única desnormalización aceptada es
`conversacion_participantes.ultimo_mensaje_leido_id`. Es una marca de agua para contar no
leídos sin recorrer todos los mensajes. Se mantiene con tres controles:

1. FK compuesto `(conversacion_id, ultimo_mensaje_leido_id)` a
   `mensajes(conversacion_id, mensaje_id)`: no puede apuntar a otra conversación.
2. El servicio solo la avanza con mensajes de esa conversación y del participante activo.
3. Se actualiza en la misma transacción que registra la lectura.

No se guarda `mensajes_no_leidos`: se calcula en `vw_conversaciones_usuario`.

## 7. Comprobación de dependencias indebidas

| Situación revisada | Resultado |
|---|---|
| Listas de productos o representantes en una celda | Eliminadas en 1FN. |
| `titulo_necesidad` dentro de `necesidad_productos` | Eliminado en 2FN. |
| `nombre_usuario` dentro de `compromisos` o `mensajes` | Eliminado; se usa FK. |
| `nombre_categoria` dentro de `productos` | Eliminado en 3FN. |
| `distrito_nombre` dentro de `usuarios` o `instituciones` | Eliminado; vive en `distritos`. |
| `cantidad_disponible`, `progreso`, `no leídos` | No se almacenan; se calculan en vistas. |
| `ultimo_mensaje_leido_id` | Única desnormalización, justificada y protegida. |

## 8. Criterio para futuras tablas

Toda tabla nueva deberá poder responder: ¿qué hecho único describe?, ¿cuál es su clave
candidata natural?, ¿depende algún atributo de solo parte de una clave compuesta?, ¿depende algún
atributo de otro atributo no clave? Si la respuesta no es clara, la tabla no se agrega.
