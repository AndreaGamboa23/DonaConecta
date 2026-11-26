# Contrato API REST y WebSocket de DonaConecta

Versión validada en la Fase 05.1. Define los contratos que compartirán frontend y backend.
**No hay endpoints implementados todavía.** FastAPI se implementará en la Fase 07 y la
autenticación en la Fase 09.

## 1. Convención general

- Prefijo: `/api/v1`. Nombres de recursos en español.
- `GET` consulta y **nunca modifica** datos; `POST` crea; `PUT` reemplaza una representación
editable completa; `PATCH` modifica parcialmente o cambia estado; `DELETE` solo en el caso
  autorizado de borradores sin historial.
- Cuerpos y respuestas JSON validados con Pydantic. Errores homogéneos.
- Paginación: `?page=1&pageSize=20`. Respuesta: `{ "items": [], "total": 0, "page": 1, "pageSize": 20 }`.
- Filtros habituales: `estado`, `distritoId`, `categoriaId`, `institucionId`, `fechaDesde`,
  `fechaHasta`, `soloVerificadas`.
- Fechas ISO 8601 UTC (`2026-11-25T17:00:00Z`). Angular convierte a `America/Lima`.
- `fila_version` se serializa como cadena base64 y se envía en el cuerpo de los `PATCH`
  que compiten por actualización.
- OpenAPI, Swagger UI (`/docs`) y ReDoc (`/redoc`) en desarrollo; en producción se evalúa
  restringirlos.

## 2. Registro diferenciado (estrategia única)

**Un solo endpoint público de registro.** No existe `POST /api/v1/usuarios` público.

```http
POST /api/v1/autenticacion/registro
Content-Type: application/json
```

```json
{
  "tipo": "DONANTE",
  "email": "persona@example.com",
  "password": "Argon2id se calcula en backend",
  "nombres": "Ana",
  "apellidos": "Gamboa",
  "telefono": "999000111",
  "distritoId": 3,
  "preferenciaNotificacion": "IMPORTANTES",
  "consentimientoDatos": true,
  "aceptaTerminos": true
}
```

```json
{
  "tipo": "REPRESENTANTE",
  "email": "responsable@example.com",
  "password": "Argon2id se calcula en backend",
  "nombres": "Luis",
  "apellidos": "Pérez",
  "telefono": "999000222",
  "institucion": {
    "nombre": "Comedor Esperanza",
    "tipoId": 1,
    "distritoId": 3,
    "direccion": "Jr. Ejemplo 123",
    "descripcion": "Solicitud de incorporación pendiente de verificación",
    "cargoRepresentante": "Responsable"
  }
}
```

Respuesta `201`:

```json
{
  "usuarioId": 11,
  "estadoCuenta": "PENDIENTE_VERIFICACION",
  "roles": [{ "codigo": "DONANTE", "estado": "ACTIVO" }],
  "institucionSolicitudId": null,
  "mensaje": "Revise su correo para verificar la cuenta."
}
```

Para el representante, `institucionSolicitudId` contiene el ID de la institución en estado
`PENDIENTE`. Después de verificar el correo puede `POST /autenticacion/login`, consultar
`GET /instituciones/mi-solicitud` y completarla con `PUT /instituciones/{id}`. No puede crear
necesidades hasta que un administrador verifique la institución y se activen vínculo y rol.

Otros endpoints de autenticación:

| Método | Ruta | Propósito | Códigos |
|---|---|---|---|
| `POST` | `/autenticacion/login` | Iniciar sesión; devuelve access token y refresh token opaco. | 200, 401, 422, 429 |
| `POST` | `/autenticacion/refresh` | Rotar refresh token; el anterior queda revocado. | 200, 401 |
| `POST` | `/autenticacion/logout` | Revocar refresh token de la sesión. | 204 |
| `POST` | `/autenticacion/verificar-email` | Confirmar token de verificación. | 200, 400, 410 |
| `POST` | `/autenticacion/reenviar-verificacion` | Emitir nuevo token de verificación. | 202, 429 |
| `POST` | `/autenticacion/recuperar-clave` | Enviar token temporal de recuperación. | 202, 429 |
| `POST` | `/autenticacion/restablecer-clave` | Cambiar contraseña con token de un solo uso. | 200, 400, 410 |

## 3. Matriz de endpoints

| Módulo | Método y ruta | Permiso / propiedad | Códigos clave |
|---|---|---|---|
| Usuarios | `GET /usuarios/me` | any | 200, 401 |
| Usuarios | `PUT /usuarios/me` | any; reemplaza perfil editable | 200, 422, 409 |
| Usuarios | `PATCH /usuarios/me/preferencias` | any | 200, 422 |
| Usuarios | `GET /usuarios/{id}` | admin | 200, 403, 404 |
| Usuarios | `PATCH /usuarios/{id}/roles` | admin; nunca crea admin por registro | 200, 403, 409 |
| Usuarios | `PATCH /usuarios/{id}/estado` | admin | 200, 403, 409 |
| Instituciones | `GET /instituciones` | público; solo `VERIFICADA` | 200 |
| Instituciones | `GET /instituciones/mi-solicitud` | representante propietario | 200, 403, 404 |
| Instituciones | `GET /instituciones/{id}` | público si verificada; si no, representante autorizado | 200, 403, 404 |
| Instituciones | `POST /instituciones` | representante `PENDIENTE`; usa el flujo de registro | 201, 403, 422 |
| Instituciones | `PUT /instituciones/{id}` | representante autorizado de esa institución | 200, 403, 409 |
| Instituciones | `PATCH /instituciones/{id}/verificacion` | admin | 200, 403, 409 |
| Instituciones | `GET /instituciones/{id}/representantes` | representante autorizado o admin | 200, 403 |
| Instituciones | `POST /instituciones/{id}/representantes` | representante autorizado o admin | 201, 403, 409 |
| Instituciones | `PATCH /instituciones/{id}/representantes/{usuarioId}` | admin o contacto principal | 200, 403, 409 |
| Instituciones | `GET /instituciones/{id}/documentos` | admin o representante autorizado | 200, 403 |
| Catálogos | `GET /categorias`, `GET /unidades-medida`, `GET /productos` | público | 200 |
| Catálogos | `PATCH /productos/{id}/estado` | admin | 200, 403, 409 |
| Necesidades | `GET /necesidades` | público; filtros reales | 200 |
| Necesidades | `GET /necesidades/{id}` | público si publicada | 200, 404 |
| Necesidades | `GET /necesidades/{id}/disponibilidad` | público | 200 |
| Necesidades | `POST /necesidades` | representante autorizado | 201, 403, 422 |
| Necesidades | `PUT /necesidades/{id}` | representante autorizado de la institución | 200, 403, 409 |
| Necesidades | `PATCH /necesidades/{id}/estado` | representante autorizado o admin | 200, 403, 409 |
| Necesidades | `DELETE /necesidades/{id}/borrador` | creador; solo borrador sin compromisos ni historial | 204, 403, 409 |
| Compromisos | `GET /compromisos/mios` | donante propietario | 200 |
| Compromisos | `GET /compromisos/{id}` | donante o institución involucrada | 200, 403, 404 |
| Compromisos | `POST /compromisos` | donante con perfil; usa `usp_RegistrarCompromiso` | 201, 403, 409, 422 |
| Compromisos | `PATCH /compromisos/{id}/estado` | donante propietario o institución, según transición | 200, 403, 409 |
| Compromisos | `PATCH /compromisos/{id}/cancelacion` | donante propietario | 200, 403, 409 |
| Donaciones | `GET /donaciones/mias` | donante propietario; **solo lectura agregada** | 200 |
| Entregas | `GET /entregas/mias` | donante o institución involucrada | 200 |
| Entregas | `POST /entregas` | donante o representante autorizado, según responsable | 201, 403, 409 |
| Entregas | `PATCH /entregas/{id}/estado` | participante autorizado | 200, 403, 409 |
| Entregas | `PATCH /entregas/{id}/reprogramar` | participante autorizado; `motivo` obligatorio | 200, 403, 409 |
| Recepciones | `POST /recepciones` | representante autorizado; usa `usp_ConfirmarRecepcion` | 201, 403, 409, 422 |
| Recepciones | `GET /recepciones/{id}` | participantes de la entrega | 200, 403 |
| Puntos de acopio | `GET /puntos-de-acopio` | público | 200 |
| Puntos de acopio | `GET /puntos-de-acopio/{id}` | público | 200, 404 |
| Puntos de acopio | `POST /puntos-de-acopio` | representante autorizado | 201, 403 |
| Puntos de acopio | `PUT /puntos-de-acopio/{id}` | representante autorizado de la institución | 200, 403, 409 |
| Puntos de acopio | `PATCH /puntos-de-acopio/{id}/estado` | representante autorizado o admin | 200, 403, 409 |
| GPS | `POST /seguimientos` | donante propietario de la entrega; consentimiento explícito | 201, 403, 409 |
| GPS | `GET /seguimientos/{id}` | participantes autorizados de la sesión | 200, 403 |
| GPS | `PATCH /seguimientos/{id}/detener` | donante que comparte o admin | 200, 403, 409 |
| Conversaciones | `GET /conversaciones` | participante | 200 |
| Conversaciones | `POST /conversaciones` | donante sobre necesidad publicada o representante sobre compromiso aceptado | 201, 403, 409 |
| Conversaciones | `GET /conversaciones/{id}/mensajes` | participante activo | 200, 403 |
| Conversaciones | `POST /conversaciones/{id}/mensajes` | participante activo | 201, 403, 409 |
| Conversaciones | `PATCH /conversaciones/{id}/lectura` | participante activo | 200, 403, 409 |
| Conversaciones | `PATCH /conversaciones/{id}/estado` | participante o admin por abuso | 200, 403, 409 |
| Conversaciones | `POST /conversaciones/{id}/participantes` | creador o admin | 201, 403, 409 |
| Conversaciones | `PATCH /conversaciones/{id}/participantes/{usuarioId}` | creador o admin | 200, 403, 409 |
| Conversaciones | `POST /conversaciones/{id}/reportes` | participante activo | 201, 403, 409 |
| Notificaciones | `GET /notificaciones` | destinatario | 200 |
| Notificaciones | `PATCH /notificaciones/{id}/leida` | destinatario | 200, 403, 409 |
| Notificaciones | `PATCH /notificaciones/leer-todas` | destinatario | 200 |
| Archivos | `POST /archivos` | usuario autenticado; validación real del archivo | 201, 413, 422 |
| Archivos | `GET /archivos/{id}/descarga` | propietario, participante o admin según tipo | 200, 403, 404 |
| Dashboards | `GET /dashboards/donante` | donante | 200, 403 |
| Dashboards | `GET /dashboards/institucion/{id}` | representante autorizado o admin | 200, 403 |
| Dashboards | `GET /dashboards/admin` | admin | 200, 403 |
| Auditoría | `GET /auditoria` | admin; filtros por fecha y módulo | 200, 403 |

`GET /api/v1/donaciones/mias` es el único uso del nombre “donaciones”: es una vista agregada de
lectura. Las operaciones de donación viven en `/compromisos`, `/entregas` y `/recepciones`, sin
endpoints duplicados.

## 4. Ejemplos justificados de los cinco métodos

| Método | Ejemplo | Justificación |
|---|---|---|
| `GET` | `GET /api/v1/necesidades?estado=PUBLICADA&categoriaId=1&page=1&pageSize=20` | Consulta pública; no modifica datos. |
| `POST` | `POST /api/v1/compromisos` | Crea una reserva real con transacción. |
| `PUT` | `PUT /api/v1/instituciones/{id}` | Reemplaza la representación editable completa de la solicitud. |
| `PATCH` | `PATCH /api/v1/entregas/{id}/estado` | Cambia solo un campo de estado validado por matriz. |
| `DELETE` | `DELETE /api/v1/necesidades/{id}/borrador` | Elimina físicamente un borrador sin compromisos ni historial. Nunca se usa para donaciones recibidas ni auditoría. |

Ejemplo de `POST /compromisos`:

```json
{
  "necesidadId": 101,
  "lineas": [
    { "productoId": 1, "unidadId": 4, "cantidad": 3 },
    { "productoId": 3, "unidadId": 5, "cantidad": 10 }
  ],
  "observaciones": "Entrega prevista el viernes"
}
```

Ejemplo de error `409`:

```json
{
  "error": {
    "codigo": "COMPROMISO_EXCEDE_DISPONIBILIDAD",
    "mensaje": "La cantidad solicitada supera la disponibilidad actual.",
    "detalles": [{ "productoId": 1, "unidadId": 4, "disponible": "2.000" }]
  },
  "traceId": "01J9X2..."
}
```

El mensaje nunca incluye SQL, trazas, credenciales ni datos de otros usuarios.

## 5. Eventos WebSocket

| Evento | Dirección | Persistencia previa | Autorización |
|---|---|---|---|
| `mensaje.nuevo` | Servidor → participantes | `mensajes` | Participante activo |
| `mensaje.leido` | Servidor → participantes | Marca de agua | Participante activo |
| `conversacion.cerrada` | Servidor → participantes | `conversaciones.estado` | Participante o admin |
| `compromiso.estado_cambiado` | Servidor → donante e institución | `compromisos` + historial | Propietarios |
| `entrega.estado_cambiado` | Servidor → participantes | `entregas` + historial | `vw_participantes_entrega` |
| `recepcion.confirmada` | Servidor → participantes | `recepciones` | Propietarios |
| `notificacion.nueva` | Servidor → destinatario | `notificaciones` | Destinatario |
| `gps.ubicacion_actualizada` | Donante → servidor → participantes | `gps_ultima_ubicacion` | Participantes autorizados; se revalida en cada mensaje |
| `gps.sesion_detenida` | Servidor → participantes | `sesiones_gps.estado` | Participantes de la sesión |

Cada evento lleva `eventoId`, `recursoId`, `creadoEn` y `clientMessageId` cuando aplica. REST
persiste primero; WebSocket solo avisa. Se usa WSS en producción.

## 6. Integración Angular ↔ FastAPI

- `HttpClient` y `Observable` en servicios por dominio; interfaces TypeScript en
  `features/<modulo>/interfaces/`.
- Interceptor central para agregar el token, traducir errores y renovar sesión.
- Guards de ruta como ayuda de navegación; la autorización definitiva está en backend.
- Formularios reactivos con validación en cliente y la misma regla repetida en Pydantic.
- DTO explícitos: nunca se envía `passwordHash`, `tokenHash`, `password_hash` ni coordenadas
  privadas al navegador.
- Los IDs `BIGINT` se monitorizan; si se acercan al límite seguro de JavaScript se serializan
  como cadena. En el volumen académico previsto no se espera ese caso.
- Estados TypeScript como uniones literales con los mismos valores de los `CHECK`.
- Sin `localStorage` como base de datos ni llamadas directas a SQL Server.

## 7. Arquitectura del backend documentada

```
backend/
├── src/
│   └── backend/
│       ├── apis/
│       ├── repositories/
│       ├── schemas/
│       ├── services/
│       ├── database/
│       ├── security/
│       ├── core/
│       ├── websockets/
│       ├── __init__.py
│       └── main.py
├── tests/
├── pyproject.toml
├── uv.lock
└── .env.example
```

Responsabilidades: `apis/` recibe y autoriza; `schemas/` valida; `services/` aplica reglas;
`repositories/` ejecuta SQL parametrizado; `database/` gestiona conexiones; `security/` hace
hashing/cifrado/autorización; `websockets/` valida identidad en cada evento; `main.py` solo
configura y registra routers. Python 3.13 y `uv` se evaluarán en Fase 07.

## 8. Contradicción registrada

`backend/README.md` aún describe `routers/`, `models/` y `main.py` en la raíz. Pertenece al
módulo del compañero: **no se modifica unilateralmente**. Debe corregirse de forma coordinada
al preparar el backend en Fase 07, adoptando la estructura de esta sección.
