# Reglas de negocio y transacciones de DonaConecta

Versión validada en la Fase 05.1. Las reglas están **diseñadas**, no implementadas. La capa que
las ejecutará se indica en cada fila. Ninguna transacción se declara verificada hasta que se
ejecuten pruebas reales en las Fases 06/07/19.

## 1. Catálogo de reglas

| ID | Regla | Capa responsable |
|---|---|---|
| BR-01 | Solo bienes materiales: no hay precio, pago, moneda ni transferencia. | Diseño + Pydantic |
| BR-02 | El visitante no se persiste; es una petición sin sesión. | Diseño |
| BR-03 | Registro único: `POST /api/v1/autenticacion/registro` con `tipo=DONANTE|REPRESENTANTE`. | `apis/` + `services/` |
| BR-04 | El registro público nunca crea `ADMINISTRADOR`. | `services/` + `security/` |
| BR-05 | Una cuenta tiene al menos un rol; los roles múltiples se permiten. | `services/` + índice filtrado |
| BR-06 | El registro de representante no exige perfil de donante. | `services/` |
| BR-07 | Solo institución `VERIFICADA` publica necesidades. | `services/` + `vw_representante_autorizado` |
| BR-08 | Permiso institucional = rol `ACTIVO` + vínculo `ACTIVO` + institución `VERIFICADA`. | `security/` |
| BR-09 | Un representante solo accede a sus instituciones vinculadas; pendiente ve solo su solicitud. | `security/` + `institucion_representantes` |
| BR-10 | Documentos de verificación son privados y cifrados cuando corresponda. | `security/` + `archivos` |
| BR-11 | No se publican datos de menores ni beneficiarios vulnerables. | Diseño + DTO |
| BR-12 | Toda necesidad publicada tiene al menos una línea con cantidad > 0. | `services/` + `CHECK` |
| BR-13 | Una línea usa solo combinación producto-unidad válida. | FK compuesto |
| BR-14 | No se suman cantidades de unidades distintas; progreso = promedio de razones por línea. | Vistas |
| BR-15 | `PENDIENTE` reserva desde el primer momento, con `expira_en` obligatoria. | `usp_RegistrarCompromiso` |
| BR-16 | La reserva se libera al cancelar, rechazar, vencer o expirar. | `services/` + vista |
| BR-17 | Las reservas vencidas no bloquean aunque falte la limpieza física. | `vw_disponibilidad_necesidad` |
| BR-18 | Un compromiso no puede superar la disponibilidad calculada. | `usp_RegistrarCompromiso` → `409` |
| BR-19 | Un donante solo ve/cancela sus compromisos. | `security/` por propiedad |
| BR-20 | Las entregas no pueden superar lo comprometido de la misma línea. | `services/` en transacción |
| BR-21 | Lo recibido no puede superar lo entregado de la misma línea. | `usp_ConfirmarRecepcion` |
| BR-22 | Llegar al punto no confirma recepción: la firma un representante autorizado. | `security/` + `recepciones` |
| BR-23 | Entregas parciales son filas nuevas; nunca se reescriben cantidades históricas. | Diseño |
| BR-24 | Si quedan bienes pendientes, se crea otra entrega o se documenta la incidencia. | `services/` |
| BR-25 | Solo las transiciones de la sección 3; cada cambio escribe historial. | `services/` |
| BR-26 | `PATCH` con `fila_version` obsoleto responde `409`. | `repositories/` + `ROWVERSION` |
| BR-27 | Borrado físico solo para borradores sin compromisos ni historial. | `repositories/` transaccional |
| BR-28 | GPS requiere consentimiento explícito, inicio manual y caducidad. | `websockets/` + `sesiones_gps` |
| BR-29 | Máximo una sesión GPS activa por entrega y por usuario. | Índices filtrados |
| BR-30 | Se conserva solo la última posición; se elimina al detener/cancelar/vencer. | `services/` |
| BR-31 | GPS se detiene si la entrega finaliza, se cancela o vence, o se retira consentimiento. | `services/` + `websockets/` |
| BR-32 | La ubicación nunca prueba recepción ni aparece en notificaciones o auditoría. | Diseño + DTO |
| BR-33 | Chat solo entre participantes activos, también en WebSocket. | `websockets/` + `security/` |
| BR-34 | Los representantes se agregan explícitamente; no se incorporan por defecto. | `services/` |
| BR-35 | Al suspender/retirar un vínculo, su participación pasa a `SUSPENDIDO`/`RETIRADO`. | `services/` |
| BR-36 | `client_message_id` es idempotente por remitente y conversación. | `UNIQUE` + `services/` |
| BR-37 | Notificaciones sin mensajes completos, coordenadas ni datos de menores. | `services/` + DTO |
| BR-38 | Notificaciones de seguridad/cuenta pueden no tener recurso asociado. | `CHECK` + `services/` |
| BR-39 | El destinatario debe estar autorizado sobre el recurso notificado. | `services/` |
| BR-40 | Archivos privados fuera de rutas públicas; validación de MIME, extensión, tamaño y nombre. | `security/` |
| BR-41 | Auditoría sin contraseñas, tokens, claves, nonces ni coordenadas. | `security/` |
| BR-42 | Baja lógica antes que borrado; FK con `NO ACTION`. | Modelo físico |

## 2. Cálculo exacto de disponibilidad

Para una línea `L = (necesidad_id, producto_id, unidad_id)`:

- `R` = `cantidad_requerida`.
- Para cada compromiso `c` con línea en `L`:
  - `C(c)` = `cantidad_comprometida`.
  - `Rec(c)` = suma de `recepcion_productos.cantidad_recibida` de las entregas de `c` en `L`.
  - `ReservaRestante(c) = GREATEST(C(c) - Rec(c), 0)`.
- `ReservaVigente = SUM(ReservaRestante(c))` para compromisos `PENDIENTE` o `ACEPTADO` con
  `expira_en >= SYSUTCDATETIME()` (o sin expiración aplicable).
- `RecibidoTotal = SUM(Rec(c))` de **todos** los compromisos, incluidos `COMPLETADO`.
- `Disponible = R - (ReservaVigente + RecibidoTotal)`, limitado inferiormente a cero.

Consecuencias:

- Un compromiso `COMPLETADO` **no** cuenta como reserva; cuenta solo lo recibido. No hay doble
  descuento.
- Lo recibido no vuelve a estar disponible: permanece en `RecibidoTotal`.
- Una reserva `PENDIENTE` vencida se excluye de inmediato por la vista, aunque un proceso de
  limpieza tardía todavía no haya marcado el estado `VENCIDO`.
- Si el cálculo diera negativo por inconsistencia, se reporta 0 y se escribe una alerta; no se
  corrige silenciosamente.

### Cantidades derivadas por compromiso

| Concepto | Fórmula |
|---|---|
| Pendiente de entrega | `GREATEST(C(c) - SUM(cantidad_entregada), 0)` |
| Pendiente de confirmación | `GREATEST(SUM(cantidad_entregada) - Rec(c), 0)` |
| Diferencia recibida | `Rec(c) - SUM(cantidad_entregada)` (puede ser negativa) |

Estos valores se calculan en vistas/servicios; **no** se almacenan.

## 3. Matrices de transiciones

### Necesidad

| Desde → Hacia | BORRADOR | PUBLICADA | PAUSADA | COMPLETADA | VENCIDA | CANCELADA |
|---|---|---|---|---|---|---|
| BORRADOR | — | Sí | — | — | — | Sí |
| PUBLICADA | — | — | Sí | Sí (al cubrirse) | Sí (fecha límite) | Sí |
| PAUSADA | — | Sí | — | — | — | Sí |
| COMPLETADA / VENCIDA / CANCELADA | — | — | — | — | — | Terminal |

### Compromiso

| Desde → Hacia | PENDIENTE | ACEPTADO | RECHAZADO | CANCELADO | VENCIDO | COMPLETADO |
|---|---|---|---|---|---|---|
| PENDIENTE | — | Sí | Sí | Sí | Sí | — |
| ACEPTADO | — | — | — | Sí | — | Sí |
| Resto | — | — | — | — | — | Terminal |

### Entrega

| Desde → Hacia | PROGRAMADA | EN_CAMINO | ENTREGADA | INCIDENCIA | CANCELADA |
|---|---|---|---|---|---|
| PROGRAMADA | — | Sí | Sí | Sí | Sí |
| EN_CAMINO | — | — | Sí | Sí | — |
| INCIDENCIA | Sí (reprograma) | — | — | — | Sí |
| ENTREGADA / CANCELADA | — | — | — | — | Terminal |

### Recepción

| Estado | Significado | Transición |
|---|---|---|
| `PARCIAL` | Se recibió menos de lo entregado; queda incidencia. | → `CONFIRMADA` con conformidad documentada, o → `OBSERVADA`. |
| `CONFIRMADA` | Coincide con lo entregado. | Terminal. |
| `OBSERVADA` | Diferencia o daño documentado. | Terminal; se abre incidencia en `entrega_historial`. |

### Otras

- **GPS:** `ACTIVA → DETENIDA | EXPIRADA | CANCELADA`. No hay reactivación: se crea una nueva
  sesión con nuevo consentimiento.
- **Conversación:** `ABIERTA → CERRADA`. `CERRADA` es terminal para mensajería y se conserva.
- **Institución:** `PENDIENTE → EN_REVISION → VERIFICADA | RECHAZADA`;
  `VERIFICADA → SUSPENDIDA → VERIFICADA | BAJA`; `RECHAZADA → EN_REVISION` con nuevo historial.
- **Participante de chat:** `ACTIVO → SUSPENDIDO | SALIO | RETIRADO`. `SUSPENDIDO` puede volver
  a `ACTIVO` solo si el vínculo institucional se reactiva.

## 4. Transacciones y concurrencia

### Propiedad y límites

| Operación | Dueño de la transacción | Modo de conexión |
|---|---|---|
| Registrar compromiso | `usp_RegistrarCompromiso` | Dedicada, `autocommit=True` |
| Confirmar recepción | `usp_ConfirmarRecepcion` | Dedicada, `autocommit=True` |
| Borrar borrador de necesidad | `repositories/` con `database/` | `autocommit=False` |
| Resto de operaciones multsentencia | `database/` | `autocommit=False` |

No se anida una transacción de PyODBC dentro de los procedimientos. Los procedimientos usan
`SET XACT_ABORT ON`, `TRY/CATCH`, `XACT_STATE()` y `THROW`; FastAPI traduce el error a un cuerpo
homogéneo sin mensajes de SQL Server.

### Bloqueos y orden

Orden fijo de adquisición: `necesidades` → `necesidad_productos` → `compromisos` →
`compromiso_productos` → `entregas` → `entrega_productos` → `recepciones` →
`recepcion_productos` → notificaciones/auditoría.

Se usa `UPDLOCK, HOLDLOCK` sobre el padre y las líneas leídas. El segundo donante espera a que
el primero haga `COMMIT` y luego recalcula la disponibilidad. Si las pruebas reales muestran
interbloqueos, se evaluará `sp_getapplock` con clave `compromiso:{necesidad_id}`; hoy solo es una
alternativa documentada.

### Commit y rollback

- `COMMIT` solo después de insertar cabecera, líneas, historial, notificación y auditoría.
- Ante falta de disponibilidad, validación de permiso, error de FK o cualquier excepción:
  `ROLLBACK` completo. Nunca queda una reserva sin líneas ni una recepción sin productos.
- Los DTO de error usan `409` para conflicto de disponibilidad, versión o estado; `403` para
  autorización; `422` para validación de esquema; `500` sin detalles internos.

### Pruebas obligatorias antes de afirmar funcionamiento

1. Dos peticiones concurrentes de compromiso sobre la misma línea; verificar que la suma no
   exceda `R`.
2. Compromiso `PENDIENTE` vencido sin limpieza: verificar que la vista lo excluye de inmediato.
3. Entrega parcial + confirmación: verificar que no se cuente dos veces lo recibido.
4. Confirmaciones concurrentes de la misma entrega: solo la primera debe persistir; la segunda
   `409`.
5. `PATCH` con `fila_version` obsoleto: `409`.
6. Revisión de `sys.dm_tran_locks` y de interbloqueos durante las pruebas.
7. Intento de borrar una necesidad con compromisos: `409` y sin cambios.

## 5. Validación por capa

| Validación | SQL Server | FastAPI |
|---|---|---|
| Existencia de claves y FK | Sí | Sí, antes de llamar |
| Unicidad de correo, slug, token y `client_message_id` | Sí | Sí, con mensaje amigable |
| Rangos de cantidad, latitud/longitud, días y horas | Sí (`CHECK`) | Sí (Pydantic) |
| Estado de institución y vínculo del representante | Parcial (vista) | Sí, siempre |
| Disponibilidad y reservas | Sí, en procedimiento | Sí, para responder `409` |
| Permiso por rol **y** propiedad | No | Sí, en REST y WebSocket |
| Cifrado y saneamiento de archivos | No | Sí, en `security/` |
| Formato de errores | No | Sí, centralizado |

Toda consulta es parametrizada. Está prohibida la concatenación de SQL.
