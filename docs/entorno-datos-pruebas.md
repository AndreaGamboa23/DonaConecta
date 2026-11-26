# Propuesta de entorno de datos de pruebas sintéticos

> **Estado: propuesta, no ejecución.** Este documento propone una base separada para datos
> sintéticos. **No afirma que `DonaConectaDB_Pruebas` exista en este momento ni que contenga datos
> cargados.** Tampoco crea bases, tablas ni registros, no ejecuta scripts SQL, no instala
> dependencias, no modifica `backend/`, `database/` ni `frontend/`, y no inicia un segundo
> backend. La Fase 07.B.2 es frontend-only: `BackendEstadoService.integracionHabilitada = false`
> y no hay HTTP, WebSocket ni `localStorage` como base de datos.

## 1. Objetivo

Disponer, en una fase futura autorizada y coordinada con el responsable de backend, de un entorno
donde probar reglas de negocio, DTO, transacciones, concurrencia y vistas con datos **ficticios y
explícitamente identificados**, sin mezclarlos con la base principal `DonaConectaDB`.

Principios:

1. **Aislamiento:** los datos sintéticos nunca se escriben en `DonaConectaDB`.
2. **Un solo backend:** la misma aplicación FastAPI atiende el entorno de pruebas; la selección
   de base se hace por configuración de entorno, no con un segundo servicio ni con lógica en el
   navegador.
3. **Trazabilidad:** todo dato sembrado lleva prefijo `DEMO-` y correos reservados
   `example.invalid`; se documenta autor, fecha, versión y verificaciones.
4. **Sin secretos versionados:** contraseñas y claves se generan fuera del repositorio;
   `.env.example` solo contiene nombres de variables sin valores sensibles.
5. **Verificación antes de actuar:** cualquier creación, siembra o restauración se ejecuta solo
   después de comprobar el estado real con consultas de solo lectura.

## 2. Estado documental y comprobación previa

Los documentos de Fase 06 registran pruebas realizadas en una base de pruebas y una restauración
de verificación (`docs/modelo-fisico.md` §9, `docs/reglas-negocio.md` §4 y
`docs/informe-backend-fase-07b1.md` §7). Esos registros son **históricos**: esta propuesta no
hereda su estado ni asume que las bases o los datos siguen presentes.

Antes de cualquier operación futura, el responsable autorizado debe verificar en solo lectura:

| Comprobación | Consulta de referencia (no ejecutada en esta fase) |
|---|---|
| Bases existentes en la instancia local | `SELECT name FROM sys.databases ORDER BY name;` |
| Versión de la instancia | `SELECT @@VERSION AS VersionSQL;` |
| Tablas de la base objetivo | `SELECT name FROM sys.tables ORDER BY name;` (tras conectar a la base verificada) |
| Catálogos sembrados | Recuentos de `roles`, `permisos`, `categorias_bienes`, `unidades_medida`, `distritos`, etc. |
| Registros de negocio | Recuentos por tabla operativa; nunca se asume que están vacíos ni llenos. |

El resultado de esas consultas se anotaría en el registro descrito en §7. Mientras no se ejecuten,
se desconoce el estado actual.

## 3. Topología propuesta

| Base | Rol propuesto | Regla |
|---|---|---|
| `DonaConectaDB` | Base principal del proyecto. | Según Fase 06 solo tendría catálogos y 0 filas de negocio, pero eso debe verificarse. **Nunca** se siembra aquí demostración ni se copian datos de pruebas. |
| `DonaConectaDB_Pruebas` | Destino propuesto para datos sintéticos. | Misma instancia `.\SQLEXPRESS`, mismos scripts numerados `001`–`008` y catálogos verificables. Su creación o reutilización requiere autorización y aprobación del compañero. |
| `DonaConectaDB_Verificacion` | Base de verificación de respaldos, si se conserva. | Se usa solo para `RESTORE VERIFYONLY` y restauraciones de control; no recibe datos de demostración que deban mostrarse como reales. |

La cadena de conexión local autorizada quedará en variables de entorno; la plantilla sin valores
sensibles es `.env.example`. En desarrollo local se mantiene `Encrypt=yes` y
`TrustServerCertificate=yes` según AGENTS.md §7; en producción se exige certificado confiable
(`TrustServerCertificate=no`). No se escribe una contraseña en este documento ni en el
repositorio.

## 4. Entidades a sembrar en la fase futura

Los catálogos base (3 roles, 37 permisos, 5 tipos de institución, 5 categorías, 6 unidades y 28
distritos) provienen de los scripts `001`–`008` y **no se inventan valores nuevos**. Si hiciera
falta un catálogo adicional, se propone al dueño del modelo antes de crear cualquier script.

| Entidad | Convención de sembrado sintético | Relaciones y privacidad |
|---|---|---|
| Donantes | Registros `DEMO-DONANTE-01`, `DEMO-DONANTE-02`… en `usuarios` + `donantes`; correos `...example.invalid`; contraseña Argon2id generada fuera del repositorio; `consentimiento_datos=1` y `acepta_terminos=1` **de prueba**. | Rol `DONANTE` `ACTIVO`, distrito del catálogo. Sin nombres, teléfonos ni direcciones reales; el teléfono se omite o usa un valor evidentemente ficticio cifrado con clave de prueba fuera del repositorio. |
| Representantes | `DEMO-REP-01`… en `usuarios` con rol `REPRESENTANTE` y vínculo en `institucion_representantes` con `estado='ACTIVO'` y `es_contacto_principal=1`. | Solo operan sobre su institución sintética; la autorización se comprueba con `vw_representante_autorizado`. Sin datos personales reales. |
| Instituciones | `DEMO-INST-01`…, `slug='demo-inst-01'`, nombres con prefijo `DEMO-`, `estado_verificacion='VERIFICADA'` **solo** si el script coordinado registra la verificación en `verificaciones_institucion` y la auditoría. | Dirección y teléfono públicos ficticios o nulos; `latitud`/`longitud` nulas salvo una referencia explícitamente etiquetada como DEMO. Ninguna se presenta como organización real ni aparece en la base principal. |
| Necesidades | `DEMO-NEC-01`… en estado `PUBLICADA`, con `titulo` y `descripcion` marcados como `DEMO-`, fechas relativas al día de ejecución y cantidades de prueba. | Líneas en `necesidad_productos` con productos y unidades del catálogo sembrado; sin beneficiarios identificables ni testimonios. |
| Productos | Reutilizar los productos, categorías y unidades del script `005`. | No se agregan productos nuevos sin aprobación; cada línea usa `(producto_id, unidad_id)` válido de `producto_unidades`. |
| Compromisos | `DEMO-COMP-01`… con estados de prueba (`PENDIENTE`, `ACEPTADO`, `COMPLETADO`) sobre necesidades sintéticas. | `donante_usuario_id` apunta solo a donantes `DEMO-`; se registran historial y transición coherente, sin cantidades que sugieran donaciones reales. |
| Puntos de acopio | `DEMO-PUNTO-01`… vinculados a instituciones `DEMO-`, con `estado='ACTIVO'` o `INACTIVO` según escenario. | Coordenadas nulas por defecto; si se requieren para probar el mapa, se documenta que son valores de prueba y no un punto real de Huancayo. Horarios ficticios y coherentes (`hora_cierre > hora_apertura`). |
| Entregas | `DEMO-ENT-01`… con `estado` en `PROGRAMADA`, `ENTREGADA` o `INCIDENCIA`, y recepciones `CONFIRMADA` cuando el escenario lo requiera. | Sin evidencias fotográficas reales; las cantidades entregadas y recibidas respetan `cantidad_recibida <= cantidad_entregada`. Ninguna coordenada GPS privada se siembra como prueba de recepción. |
| Conversaciones | `DEMO-CONV-01`… sobre un compromiso sintético, con participantes donante y representante de la institución. | Mensajes con contenido `DEMO-`, `client_message_id` generado por el cliente de prueba y control de lectura coherente. No se anuncia cifrado de extremo a extremo; no se copian mensajes reales. |
| Experiencias | `DEMO-EXP-01`… sobre recepciones sintéticas `CONFIRMADA`, con relato ficticio y `consentimiento_publicacion=1` de prueba. | **Depende de que se aprueben primero las tablas propuestas en `docs/propuesta-experiencias-valoraciones-favoritos.md`.** Sin esa autorización no se crean tablas ni se siembran filas. Nunca se presenta como testimonio real ni usa imágenes de personas identificables. |
| Valoraciones | Puntuaciones `1..5` de prueba sobre recepciones sintéticas, una por evaluador. | Misma dependencia que experiencias. Solo para verificar agregados; jamás se muestran como opiniones reales en la interfaz pública. |

`notificaciones` y `auditoria_eventos` se generan como efecto de las operaciones de prueba, no se
escriben a mano: así se conserva la trazabilidad y se evita rellenar registros con texto inventado. Los
favoritos, si se aprueban, se siembran solo sobre experiencias sintéticas publicadas.

## 5. Reglas de privacidad y seguridad

- Prohibido sembrar nombres, correos, teléfonos, direcciones, documentos, fotos de menores ni
  cualquier dato de una persona real. Prefijo `DEMO-` y dominio reservado `example.invalid` en
  todos los identificadores visibles.
- Contraseñas generadas con Argon2id mediante librería mantenida, fuera del repositorio; nunca
  texto plano, cifrado reversible, MD5, SHA-1 ni SHA-256 simple.
- Claves de cifrado y tokens en variables de entorno; rotación y versión documentadas si se
  implementa AES-256-GCM. Nada de eso se versiona ni se envía al navegador.
- CORS restringido, cabeceras de seguridad y `rate limiting` en operaciones sensibles; errores
  sin trazas, SQL, credenciales ni mensajes de otros usuarios.
- Consultas parametrizadas con `pyodbc`; está prohibida la concatenación de cadenas SQL.
- DTO explícitos sin `password_hash`, `token_hash`, teléfonos, documentos ni coordenadas privadas.
- `dc_app` y `dc_admin` con mínimo privilegio, según `008_seguridad_permisos.sql`; la cuenta
  Windows de aplicación se crea manualmente fuera del repositorio.
- Frontend sin acceso directo a SQL Server y sin `localStorage` como sustituto de la base de
  datos; la sesión se define en backend cuando corresponda.
- Evidencias y adjuntos con validación real de MIME, extensión, tamaño y nombre; EXIF saneado y
  documentos privados fuera de rutas públicas.
- No se declara cumplimiento legal, TDE, Always Encrypted, cifrado de respaldo ni cifrado de
  extremo a extremo sin evaluación formal; ver `docs/seguridad-privacidad.md` §11.

## 6. Checklist de seguridad, respaldo y restauración

Todos los elementos están **pendientes** en esta fase; son criterios para la fase autorizada.

| # | Comprobación | Criterio de aceptación | Estado |
|---|---|---|---|
| 1 | Confirmar instancia y base destino | Consultas de solo lectura ejecutadas y registradas; destino es `DonaConectaDB_Pruebas`, nunca `DonaConectaDB`. | Pendiente |
| 2 | Aplicar esquema | Mismos scripts `001`–`008`, sin editar los existentes; recuento de 42 tablas, 79 FK, 9 vistas y 2 procedimientos verificado. | Pendiente |
| 3 | Catálogos | Recuentos documentados; ningún valor de catálogo inventado. | Pendiente |
| 4 | Sembrado aislado | Todas las filas nuevas llevan prefijo `DEMO-` o dominio `example.invalid`; consulta de control que confirme 0 filas `DEMO-` en `DonaConectaDB`. | Pendiente |
| 5 | Secretos | Contraseñas y claves fuera del repositorio; `.env` ignorado; `.env.example` sin valores. | Pendiente |
| 6 | Permisos | `dc_app` lee catálogos y escribe operaciones; no inserta catálogos ni borra auditoría; verificación con `HAS_PERMS_BY_NAME` o equivalente. | Pendiente |
| 7 | Respaldos | Respaldo FULL del entorno de pruebas fuera del repositorio, con `CHECKSUM`; ruta y hash anotados. | Pendiente |
| 8 | Verificación | `RESTORE VERIFYONLY` con resultado válido registrado. | Pendiente |
| 9 | Restauración | Restauración real solo en una base separada de verificación; sin `DROP DATABASE` ni `RESTORE ... REPLACE`. | Pendiente |
| 10 | Integridad posterior | Recuentos, FK, vistas y procedimientos verificados tras restaurar; pruebas de concurrencia e idempotencia repetidas si aplica. | Pendiente |
| 11 | No propagación | Ningún dato de pruebas copiado a `DonaConectaDB` ni a un entorno público. | Pendiente |
| 12 | Cifrado del respaldo | Evaluado y documentado; no se afirma activado sin evidencia. | Pendiente |
| 13 | Limpieza y cierre | Archivos temporales fuera del repositorio; estado final de bases registrado. | Pendiente |

## 7. Registro documental al ejecutar

Si una fase futura autoriza la siembra, se completará el siguiente registro. En esta entrega todas
las celdas quedan **pendientes**: no hay ejecución que documentar.

| Dato a registrar | Valor |
|---|---|
| Autor de la ejecución | Pendiente |
| Responsable que aprobó la coordinación | Pendiente (compañero de backend) |
| Fecha y hora UTC | Pendiente |
| Instancia y base destino verificadas | Pendiente |
| Versión del script de esquema y del script de sembrado | Pendiente |
| Hash SHA-256 de cada script ejecutado | Pendiente |
| Hash SHA-256 del respaldo generado | Pendiente |
| Recuentos por entidad sembrada | Pendiente |
| Resultado de `CHECKSUM` / `RESTORE VERIFYONLY` | Pendiente |
| Resultado de restauración en base separada | Pendiente |
| Pruebas funcionales y de concurrencia ejecutadas | Pendiente |
| Observaciones, incidencias y decisiones tomadas | Pendiente |

Si se usa un archivo de sembrado versionado, su nombre y versión se anotan aquí; el contenido no
debe incluir contraseñas, tokens ni claves. Los respaldos se guardan fuera del repositorio y su
ruta se documenta en un registro local, no en un archivo versionado con credenciales.

## 8. Coordinación con el compañero

| Responsable | Acción futura |
|---|---|
| Responsable de backend | Verificar estado de la instancia, crear o reutilizar `DonaConectaDB_Pruebas` solo con autorización, aprobar scripts nuevos, generar secretos fuera del repositorio y ejecutar siembras y restauraciones. |
| Responsable de frontend | Consumir DTO reales solo cuando `BackendEstadoService.integracionHabilitada` se active y la API exista; no guardar datos de prueba en el navegador. |
| Ambos | Acordar nombres de entidades, campos, rutas, estados, códigos de error y reglas de privacidad antes de escribir código; revisar `docs/informe-backend-fase-07b1.md` §7 y `docs/contrato-api.md`. |

No se cambia de rama, no se fusiona ni se ejecuta commit o push desde esta propuesta.

## 9. Cierre del alcance actual

Este archivo y `docs/propuesta-experiencias-valoraciones-favoritos.md` son los únicos cambios de
la entrega. No se creó la base propuesta, no se cargaron datos sintéticos, no se ejecutó SQL, no
se modificó el backend ni el frontend y no se simuló autenticación, mensajería, GPS ni
persistencia local. Cualquier actividad descrita aquí queda sujeta a una fase autorizada
posterior.
