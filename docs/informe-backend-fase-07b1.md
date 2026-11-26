# Informe de integración para backend — Fase 07.B.1

Estado: preparación frontend. No se ha implementado FastAPI, no se activó `BackendEstadoService`
y no se escribió en SQL Server durante esta fase. `backend/` y `database/` permanecen intactos.

## 1. Estado real del registro

- `BackendEstadoService.integracionHabilitada = false` (`frontend/src/app/core/services/backend-estado.service.ts:40`).
- `RegistroApiService` devuelve `ServicioPendienteError` antes de resolver `HttpClient`.
- `app.config.ts` todavía no registra `provideHttpClient()`; debe hacerse al activar la integración.
- No hay `fetch`, `WebSocket`, `localStorage` ni `sessionStorage` en `frontend/src`.
- Los componentes `RegistroDonante` y `RegistroInstitucion` validan localmente, pero no procesan
  la respuesta (`subscribe` solo define `error`): tras un `201` real no habría confirmación ni
  navegación. Esto debe completarse en la fase de autenticación.

### 1.1 Flujo actual (frontend)

1. `/registro` elige tipo.
2. `/registro/donante` o `/registro/institucion` validan con Reactive Forms (10 y 12 controles).
3. `enviar()` construye el payload y llama al servicio.
4. El servicio lanza `SERVICIO_PENDIENTE`; el formulario muestra un aviso y no envía nada.

### 1.2 Flujo definitivo (una vez conectado)

1. `POST /api/v1/autenticacion/registro` con `tipo: DONANTE | REPRESENTANTE`.
2. Backend: `INSERT usuarios` con Argon2id, `INSERT usuario_roles`, y transacción según tipo.
3. Donante: `INSERT donantes` con ambos consentimientos en `1`.
4. Representante: `INSERT instituciones` en `PENDIENTE` + `INSERT institucion_representantes`
   (contacto principal, vínculo `PENDIENTE`) y devolver `institucionSolicitudId`.
5. Emitir token de verificación de correo (solo hash SHA-256 en `tokens_seguridad`).
6. Frontend: mostrar confirmación, persistir sesión solo mediante tokens seguros y navegar
   a `/iniciar-sesion` o al estado de solicitud correspondiente. El registro público nunca crea
   un administrador.

## 2. Contratos exactos que el frontend envía

### 2.1 Donante — `POST /api/v1/autenticacion/registro`

```json
{
  "tipo": "DONANTE",
  "email": "ana@ejemplo.com",
  "password": "ClaveSegura123",
  "nombres": "Ana",
  "apellidos": "Pérez",
  "telefono": "999000111",
  "distritoId": 13,
  "preferenciaNotificacion": "IMPORTANTES",
  "consentimientoDatos": true,
  "aceptaTerminos": true
}
```

- `email` se normaliza a minúsculas; nombres y apellidos se recortan.
- `telefono`: opcional; si está vacío se omite. Validación local `^9\d{8}$`.
- `confirmacion` y la fuerza de contraseña son solo de interfaz; no viajan.
- `distritoId`: catálogo sembrado, 1–28; `13 = Huancayo`.

### 2.2 Representante — `POST /api/v1/autenticacion/registro`

```json
{
  "tipo": "REPRESENTANTE",
  "email": "responsable@example.com",
  "password": "ClaveSegura123",
  "nombres": "Luis",
  "apellidos": "Pérez",
  "telefono": "999000222",
  "institucion": {
    "nombre": "Comedor Esperanza",
    "tipoId": 1,
    "distritoId": 13,
    "direccion": "Jr. Ejemplo 123",
    "descripcion": "Solicitud de incorporación pendiente de verificación",
    "cargoRepresentante": "Coordinadora del comedor"
  }
}
```

- `direccion` y `descripcion` se omiten si quedan vacías.
- `cargoRepresentante` es obligatorio en la interfaz, aunque el tipo TS lo marca opcional.
- `tipoId`: catálogo sembrado, 1–5.

### 2.3 Respuesta prevista

`201` con `{ usuarioId, estadoCuenta, roles: [{ codigo, estado }], institucionSolicitudId, mensaje }`.
Errores homogéneos `{ error: { codigo, mensaje, detalles? }, traceId? }`; sin trazas ni SQL.

## 3. Endpoints que debe exponer FastAPI

Prefijo `/api/v1`. Paginación `{ items, total, page, pageSize }`. Filtros estándar: `estado`,
`distritoId`, `categoriaId`, `institucionId`, `fechaDesde`, `fechaHasta`, `soloVerificadas`.

| Método | Ruta | Autorización | Códigos |
|---|---|---|---|
| POST | `/autenticacion/registro` | público; nunca crea admin | 201, 409, 422 |
| POST | `/autenticacion/login` | público; rate limit | 200, 401, 422, 429 |
| POST | `/autenticacion/verificar-email` | token temporal | 200, 400, 410 |
| POST | `/autenticacion/reenviar-verificacion` | público; rate limit | 202, 429 |
| GET | `/categorias`, `/unidades-medida`, `/productos` | público | 200 |
| GET | `/instituciones` | público, solo verificadas | 200 |
| GET | `/instituciones/mi-solicitud` | representante propietario | 200, 403, 404 |
| GET | `/instituciones/{id}` | verificada o representante autorizado | 200, 403, 404 |
| POST | `/instituciones` | representante `PENDIENTE` | 201, 403, 422 |
| PUT | `/instituciones/{id}` | representante autorizado | 200, 403, 409 |
| PATCH | `/instituciones/{id}/verificacion` | administrador | 200, 403, 409 |
| GET | `/instituciones/{id}/representantes` | representante autorizado o admin | 200, 403 |
| POST | `/instituciones/{id}/representantes` | representante autorizado o admin | 201, 403, 409 |
| GET | `/instituciones/{id}/documentos` | admin o representante autorizado | 200, 403 |
| GET | `/necesidades` | público; filtros reales | 200 |
| GET | `/necesidades/{id}` | público si publicada | 200, 404 |
| GET | `/necesidades/{id}/disponibilidad` | público | 200 |
| POST | `/necesidades` | representante autorizado | 201, 403, 422 |
| PUT | `/necesidades/{id}` | representante de la institución | 200, 403, 409 |
| PATCH | `/necesidades/{id}/estado` | representante o admin | 200, 403, 409 |
| DELETE | `/necesidades/{id}/borrador` | creador; solo borrador | 204, 403, 409 |
| GET | `/puntos-de-acopio`, `/puntos-de-acopio/{id}` | público | 200, 404 |
| POST / PUT / PATCH | `/puntos-de-acopio...` | representante autorizado de la institución | 201/200, 403, 409 |
| GET | `/donaciones/mias` | donante autenticado | 200, 401 |
| POST | `/compromisos` | donante autenticado; transacción | 201, 403, 409 |
| POST | `/entregas`, `/recepciones` | participantes autorizados | 201, 403, 409 |
| GET | `/conversaciones` | participante | 200, 401 |
| POST | `/conversaciones` | donante o representante según regla | 201, 403, 409 |
| GET / POST | `/conversaciones/{id}/mensajes` | participante activo | 200/201, 403, 409 |
| PATCH | `/conversaciones/{id}/lectura`, `/estado` | participante o admin | 200, 403, 409 |
| POST / PATCH | `/conversaciones/{id}/participantes...` | creador o admin | 201/200, 403, 409 |
| POST | `/conversaciones/{id}/reportes` | participante activo | 201, 403, 409 |
| POST / GET | `/seguimientos...` | donante propietario / participantes | 201/200, 403, 409 |
| GET / POST | `/notificaciones...` | destinatario | 200/201, 403 |
| POST | `/archivos` | participante autorizado | 201, 403, 422 |
| GET | `/dashboard/...` | según rol | 200, 403 |

La tabla completa, con esquemas y reglas, está en `docs/contrato-api.md`. No se propone cambiar
ningún contrato compartido; solo completar los DTO del frontend.

## 4. Diferencias verificadas (no se modificaron contratos)

1. `RegistroResponse` TS usa `string` para `estadoCuenta`, `roles[].codigo` y `roles[].estado`;
   el contrato exige valores controlados (`PENDIENTE_VERIFICACION`, `DONANTE`, `ACTIVO`).
2. `institucionSolicitudId` es opcional en TS, pero el contrato lo exige para representante;
   además el frontend lo ignora.
3. `cargoRepresentante` es obligatorio en la UI y opcional en el tipo TS; conviene alinear el DTO.
4. No hay consentimiento de tratamiento de datos para representantes: no aparece en el payload,
   en el contrato ni en el modelo físico. Requiere decisión del equipo antes de Fase 09.
5. No se piden documentos de verificación en el registro; el contrato prevé `POST /archivos`.
6. El frontend no registra `provideHttpClient()`; los siete servicios API lo resuelven de forma
   diferida solo si se activa el flag.
7. `LoginResponse` TS no incluye access/refresh token; el contrato sí los describe.
8. Los servicios de exploración, donaciones, perfil, mensajería y seguimiento están declarados
   pero no son invocados por los componentes; la Fase 07.B.1 introdujo los estados de interfaz
   preparados, sin datos simulados.
9. Las firmas `GET` no incluyen `page/pageSize` ni filtros; `DonacionesApiService` devuelve un
   arreglo en lugar de `PagedResult`.

## 5. Eventos WebSocket previstos

`mensaje.nuevo`, `mensaje.leido`, `conversacion.cerrada`, `compromiso.estado_cambiado`,
`entrega.estado_cambiado`, `recepcion.confirmada`, `notificacion.nueva`,
`gps.ubicacion_actualizada` y `gps.sesion_detenida` (`docs/contrato-api.md:205-220`). REST persiste
primero; WebSocket solo notifica. Cada evento lleva `eventoId`, `recursoId`, `creadoEn` y
`clientMessageId` cuando aplica. Autorización de participantes en cada mensaje; WSS en producción.

## 6. Paneles privados y de administración

Hoy **no existe** ningún panel privado ni de administración en `frontend/src`, y no hay enlaces
públicos hacia uno. No se simuló autorización. Orden propuesto, supeditado a Fase 09:

1. Sesión real, guardas de ruta e interceptor de errores/token (Fase 09).
2. Perfil del donante y Mis donaciones con datos propios (Fase 09/12).
3. Panel del representante: solicitud, verificación, necesidades y puntos de acopio (Fases 10–13).
4. Conversación privada y notificaciones (Fases 15–16).
5. Panel de administración: verificación de instituciones, reportes y auditoría (Fase 17).
6. Dashboards con estadísticas reales y exportación allegada (Fase 17).

## 7. Estrategia propuesta para `DonaConectaDB_Pruebas`

- Base separada en la misma instancia `.\SQLEXPRESS`; nunca sembrar demostración en
  `DonaConectaDB`. El responsable de backend debe crearla y aprobar los scripts.
- Aplicar los mismos scripts numerados `001`–`008` y verificar catálogos con recuentos.
- Datos ficticios claramente marcados (correos `example.com`, nombres `DEMO-`, fechas recientes),
  con un único script de sembrado versionado y reversible; jamás datos personales reales.
- Cuentas de prueba con contraseñas generadas y fuera del repositorio; `.env.example` sin valores.
- Probar concurrencia de compromisos con dos conexiones, verificación de instituciones,
  idempotencia de mensajes y caducidad de tokens.
- Respaldos y restauración en la base de verificación, sin copiar datos de prueba a producción.
- `localStorage` no se usa como base de datos; la sesión se definirá con el backend.

## 8. Mapa y geolocalización

- Leaflet 1.9.4 (BSD-2-Clause) y `@types/leaflet` 1.9.23 (MIT), cargados de forma diferida.
- Centro verificado: Wikidata Q468782, `-12.066666666667, -75.216666666667` (referencia de
  Huancayo, no un punto de acopio).
- Teselas `https://tile.openstreetmap.org/{z}/{x}/{y}.png` con atribución visible; sin
  prefetch, sin modo offline, sin `no-cache` y con Referer válido, según la política OSM.
- «Consultar mi ubicación» es manual; no se guarda ni se envía. Se manejan denegación,
  sin señal, error y fallo de teselas. No hay rutas, ETAs ni rastreo.
- En PWA no se garantiza geolocalización en segundo plano; requiere HTTPS y permiso, y el
  navegador puede suspenderla. La recepción se confirma entre personas, no por coordenadas.
