# Contrato de integración final (implementación urgente)

Rama `Andrea`. Base de datos autorizada: `DonaConectaDB_Pruebas`. No ejecutar DDL.

## Puntos de acopio

- `GET /api/v1/puntos-de-acopio?institucionId=&distritoId=&publico=true|false`
- `POST /api/v1/puntos-de-acopio` — representante autorizado.
- `PUT /api/v1/puntos-de-acopio/{id}` — reemplaza datos y horarios.
- `PATCH /api/v1/puntos-de-acopio/{id}/estado` — `ACTIVO|INACTIVO`.
- `DELETE /api/v1/puntos-de-acopio/{id}` — sólo sin necesidad/entrega asociada; si hay relaciones, `409`.

Cuerpo de alta/reemplazo:

```json
{
  "id_institucion": 10,
  "nombre": "Acopio solidario de prueba",
  "direccion": "Dirección sintética de demostración",
  "referencias_entrega": "Referencia sintética",
  "distrito_id": 1,
  "latitud": -12.07,
  "longitud": -75.21,
  "coordenadas_publicas": true,
  "horarios": [
    {"dia_semana": 1, "hora_apertura": "09:00:00", "hora_cierre": "12:00:00", "activo": true}
  ]
}
```

Sin columna nueva: la autorización explícita de coordenadas se registra en `auditoria_eventos`
(`PUNTO_COORDENADAS_PUBLICADAS` / `PUNTO_COORDENADAS_PRIVADAS`) y el listado público sólo expone
`latitud`/`longitud` cuando la institución está verificada, el punto está `ACTIVO` y el último
evento de autorización es de publicación. La consulta privada la puede hacer el representante
autorizado o un participante de la entrega.

## Donaciones, entregas y recepción

- `GET /api/v1/compromisos/{id}` — detalle para donante dueño o representante autorizado:
  líneas con `cantidad_comprometida`, `cantidad_recibida`, `cantidad_pendiente`, entregas,
  recepciones e historial real.
- `POST /api/v1/entregas` — representante autorizado; cuerpo
  `{id_compromiso, id_punto_acopio, fecha_programada, observaciones}`. Copia las líneas del
  compromiso a `entrega_productos`, crea estado `PROGRAMADA` y, si el compromiso estaba
  `PENDIENTE`, lo transiciona a `ACEPTADO` en la misma transacción con `compromiso_historial`.
  La respuesta es `EntregaResumen` directo (no un sobre `{entrega: ...}`).
- `PATCH /api/v1/entregas/{id}` — donante dueño o representante; cuerpo
  `{estado: "EN_CAMINO"|"ENTREGADA"|"INCIDENCIA"|"CANCELADA", observaciones?}`; registra
  `entrega_historial` con identidad del usuario.
- `POST /api/v1/entregas/{id}/recepciones` — **sólo representante autorizado**; cuerpo
  `{estado: "PARCIAL"|"CONFIRMADA"|"OBSERVADA", observaciones?, lineas:[{producto_id, unidad_id, cantidad_recibida}]}`.
  Debe invocar `dbo.usp_ConfirmarRecepcion` con `autocommit=True`. El SP impide duplicados,
  valida cantidades, actualiza progreso/disponibilidad, notifica al donante y audita.
- El donante **nunca** confirma la recepción institucional.

## Mensajería persistente

- `POST /api/v1/conversaciones` — `{id_necesidad?|id_compromiso?, mensaje?}`; crea participantes
  donante + representante autorizado.
- `GET /api/v1/conversaciones` — sólo conversaciones del usuario autenticado; responde
  `{items, total, page, page_size}` y cada `items[]` incluye `no_leidos`.
- `GET /api/v1/conversaciones/{id}/mensajes?limit=&offset=` — historial para participante activo;
  responde `{items, total, page, page_size}`.
- `POST /api/v1/conversaciones/{id}/mensajes` — `{contenido, client_message_id}`; idempotente
  por `(remitente, client_message_id)`. Devuelve el `MensajeResponse` directo.
- `PATCH /api/v1/conversaciones/{id}/leido` — actualiza `ultimo_mensaje_leido_id`.
- `GET /api/v1/notificaciones` — responde `{items, total, no_leidas, page, page_size}`.
  `PATCH /api/v1/notificaciones/{id}/leido` — sólo el destinatario.

El contenido se cifra en aplicación con el mismo esquema AES-256-GCM ya usado por el proyecto;
la clave sigue fuera del repositorio. No se exponen mensajes cifrados al cliente. Primera versión
con polling HTTP mientras la conversación está activa; WebSocket queda documentado como pendiente
si no se implementa.

## GPS autorizado

- `POST /api/v1/entregas/{id}/gps/sesiones` — donante participante; cuerpo
  `{consentimiento_dado: true, duracion_minutos: 30}` (1–120); devuelve `sesion_id` y `expira_en`.
- `POST /api/v1/gps/sesiones/{id}/ubicacion` — donante participante; cuerpo
  `{latitud, longitud, precision_metros?}`. Actualiza una sola fila `gps_ultima_ubicacion`
  con AES-256-GCM (`nonce` y versión de clave en columnas propias).
- `GET /api/v1/entregas/{id}/gps/ultima` — donante o representante participante; sin coordenadas
  públicas.
- `POST /api/v1/gps/sesiones/{id}/detener` — finaliza la sesión.

Sin rutas, ETAs ni tiempos de llegada inventados. La coordinación manual sigue disponible.

## Verificación integrada del agente principal

Flujo ejecutado contra `DonaConectaDB_Pruebas` con el backend integrado: **12/12**
comprobaciones correctas (registro y verificación de institución, punto y horario,
necesidad, directorio, compromiso, chat bidireccional persistente, detalle con punto
y estado, GPS consentido, recepción parcial, cantidades reales y notificaciones).
Evidencia: `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-final-flow.log`.
Verificación SQL complementaria: `dc-final-sql-verificar.log` en la misma ruta, con
`0` restos de mojibake y disponibilidad calculada desde
`dbo.vw_disponibilidad_necesidad`. Comprobaciones negativas de autorización: **4/4**
(donante no puede confirmar recepción `403`, usuario ajeno no lee el chat `403`,
consulta privada de puntos sin token `401`, coordenadas públicas sólo con
autorización `200`). Evidencia: `dc-final-seguridad.log`.

Durante la integración se corrigieron tres defectos reales detectados en ejecución:

- `backend/app/main.py` registra los cuatro routers nuevos, manteniendo `donaciones`
  antes que `entregas` para no capturar `/compromisos/mis-compromisos` con
  `/compromisos/{id}`.
- `backend/app/repositories/donaciones_repo.py` lee las columnas físicas
  `compromiso_id`/`necesidad_id` en `_fila_compromiso`; antes devolvía `500`.
- `mensajeria_repo.py` y `gps_repo.py` usan `OUTPUT INSERTED.*` en lugar de
  `SCOPE_IDENTITY()` en sentencias `execute` separadas, que devolvía `NULL` y
  provocaba violaciones de FK.

## Propiedad de archivos para subagentes

- Agente A: `backend/app/repositories/puntos_acopio_repo.py`, `backend/app/repositories/entregas_repo.py`,
  `backend/app/routers/puntos_acopio.py`, `backend/app/routers/entregas.py`,
  `backend/app/schemas/puntos_acopio_schema.py`, `backend/app/schemas/entregas_schema.py`,
  `backend/app/repositories/directorio_repo.py`, pruebas nuevas en `backend/tests/`.
- Agente B: `backend/app/repositories/mensajeria_repo.py`, `backend/app/routers/mensajeria.py`,
  `backend/app/schemas/mensajeria_schema.py`, `backend/app/repositories/gps_repo.py`,
  `backend/app/routers/gps.py`, `backend/app/schemas/gps_schema.py`,
  `backend/app/core/cifrado.py`, pruebas nuevas distintas a las de A.
- Agente C: todo `frontend/src/app/**`, sin tocar backend.
- Agente D: `database/scripts/**`, `README.md`, `docs/**` distintos de este contrato.
- El agente principal integra `backend/app/main.py` y resuelve incompatibilidades.
