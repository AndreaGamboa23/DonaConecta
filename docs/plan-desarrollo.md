# Plan de desarrollo por fases

Plan definitivo registrado en `AGENTS.md`. Los alcances se ejecutan solo con autorización
explícita; no se adelanta una fase sin esa autorización.

| Fase | Alcance | Estado |
|---|---|---|
| 01 | Diagnóstico técnico. | Ejecutada |
| 02 | Creación de `AGENTS.md`. | Ejecutada |
| 03 | Organización de arquitectura en `frontend/`, `backend/`, `database/` y `docs/`. | Ejecutada |
| 04 | Diseño visual profesional, Bootstrap e identidad original. | Ejecutada |
| 04.2 | Ampliación funcional documental, navegación pública independiente y plan de seguridad. | Ejecutada |
| 04.3 | Rediseño fotográfico con ilustraciones generadas, optimización WebP y verificación responsive. | Ejecutada |
| 04.4 | Contraste legible del hero, imagen principal confirmada y portada como acceso a servicios. | Ejecutada |
| 05 | Modelo entidad-relación y normalización 3FN. | Ejecutada (propuesta revisada en 05.1) |
| 05.1 | Revisión, corrección y documentación técnica del modelo. | Ejecutada |
| 06 | Implementación de Microsoft SQL Server. | Ejecutada |
| 07 | Backend FastAPI, conexión y arquitectura de servicios. | Pendiente |
| 08 | Landing definitiva y navegación pública integrada. | Pendiente |
| 09 | Autenticación segura, registro, sesiones y roles. | Pendiente |
| 10 | Registro, verificación y directorio de instituciones. | Pendiente |
| 11 | Catálogo y gestión de necesidades. | Pendiente |
| 12 | Compromisos, donaciones y entregas. | Pendiente |
| 13 | Mapas, ubicaciones y puntos de acopio. | Pendiente |
| 14 | Seguimiento GPS autorizado. | Pendiente |
| 15 | Chat y mensajería en tiempo real. | Pendiente |
| 16 | Notificaciones, evidencias y trazabilidad. | Pendiente |
| 17 | Dashboards y estadísticas reales. | Pendiente |
| 18 | Aplicación instalable PWA. | Pendiente |
| 19 | Pruebas integrales, seguridad y optimización. | Pendiente |
| 20 | Documentación, despliegue y sustentación final. | Pendiente |

## 1. Alcance ejecutado en la Fase 04.2

- Actualización de `AGENTS.md` con navegación SPA, seguridad/privacidad y planificación.
- Documentos nuevos: requisitos funcionales y no funcionales, mapa de navegación,
  seguridad/privacidad y este plan.
- Actualización de arquitectura, sistema de diseño, decisiones técnicas y READMEs.
- Revisión de la arquitectura de rutas: `PublicLayout`, lazy loading, `TitleStrategy` para
  título y metadescripción, `withInMemoryScrolling` y 404 personalizada.
- Implementación de `/como-donar`, `/nosotros` y `/preguntas-frecuentes` con información real
  y sin datos inventados.
- Conexión de navbar, footer, marca y CTA de la portada con rutas y fragmentos reales.
- Verificación de build, pruebas, enlaces, menú móvil, responsive y estado de Git.

**No ejecutado:** GPS real, mensajería, autenticación, cifrado de datos de negocio, APIs,
creación de base de datos, tablas ni pantallas simuladas de módulos futuros.

## 2. Dependencias entre fases

1. La Fase 05 (modelo 3FN) precede a la creación de tablas en la Fase 06.
2. La Fase 07 (backend) habilita la autenticación de la Fase 09 y los módulos de datos desde
   la Fase 10.
3. Los dashboards de la Fase 17 requieren los registros reales generados entre las fases 10 y 16.
4. La PWA de la Fase 18 se implementa después de definir autenticación y sincronización segura.
5. Las pruebas integrales de la Fase 19 se ejecutan sobre el sistema completo, no sobre simulaciones.

## 3. Criterio de cierre de cada fase

No se declara terminada una fase sin evidencia de compilación, pruebas, integración con las APIs
correspondientes, persistencia cuando aplique, revisión responsive, revisión de Bootstrap frente
a CSS propio, documentación y propuesta de commit. El commit se propone, nunca se ejecuta
automáticamente.

## 4. Resultado de la Fase 05.1

Se crearon y validaron documentalmente:

- `docs/modelo-conceptual.md`, `docs/modelo-entidad-relacion.md`, `docs/modelo-logico.md`,
  `docs/modelo-fisico.md`, `docs/diccionario-datos.md`, `docs/normalizacion.md`,
  `docs/reglas-negocio.md` y `docs/contrato-api.md`.
- Actualizaciones de `docs/seguridad-privacidad.md`, `docs/decisiones-tecnicas.md`,
  `docs/plan-desarrollo.md` y `AGENTS.md`.

Resultado: **42 tablas** organizadas en ocho módulos, ocho diagramas Mermaid validados,
normalización demostrada con cuatro ejemplos, matriz de estados, fórmula de disponibilidad sin
doble conteo, contrato REST con los cinco métodos y eventos WebSocket.

**No ejecutado:** DDL, DML, creación de `DonaConectaDB`, instalación de dependencias,
implementación de FastAPI, modificación del frontend, formularios simulados ni datos inventados.
La validación fue documental en ese momento; las pruebas reales se ejecutaron posteriormente en la
Fase 06 y se resumen en la sección 6 de este documento.

## 5. Prioridad funcional posterior a la base y la API

Con SQL Server (Fase 06) ya implementado y FastAPI (Fase 07) aún pendiente, se prioriza:

1. Registro voluntario con selección “Quiero donar” / “Represento una institución”.
2. Inicio de sesión y perfil.
3. Verificación institucional.
4. Catálogo de bienes y necesidades.
5. Compromisos de donación.
6. Chat privado de consultas sobre necesidades reales.
7. Mapas y seguimiento GPS.
8. Notificaciones.

El chat de consultas se implementa antes del GPS porque solo requiere usuarios, instituciones
verificadas y necesidades reales. La aplicación sigue siendo una plataforma de servicios: no se
sustituye por una página institucional ni se rellena con pantallas falsas.

## 6. Resultado real de la Fase 06

Entorno comprobado antes de escribir: rama `Andrea`, SQL Server 2025 Express
(`EngineEdition = 4`), colación `SQL_Latin1_General_CP1_CI_AS`, `ODBC Driver 18 for SQL Server`,
Python 3.13.17 y `uv` 0.12.17. No se instalaron dependencias.

1. `DonaConectaDB` creada con recuperación `SIMPLE` y compatibilidad 170, sin `DROP` ni
   sobrescritura. Script: `database/scripts/001_crear_base_datos.sql`.
2. Capacidades nativas verificadas: `EncryptionState = NULL`, 0 column master keys, 0 symmetric
   keys. No se afirma TDE ni Always Encrypted. Ver `docs/seguridad-privacidad.md` §11.3.
3. Creadas las **42 tablas** del modelo con PK, `UNIQUE`, `CHECK`, `DEFAULT` y `ROWVERSION`.
   Script: `002_crear_tablas.sql`. Salida real: `TablasCreadas 42`.
4. Creadas las **79 foreign keys**, todas `ON DELETE/UPDATE NO ACTION`, sin cascadas. Incluye las
   FK compuestas anti asociaciones cruzadas y la marca de lectura del chat. Script: `003`.
5. Creados los **11 índices** propios: 4 únicos filtrados y 7 de consulta. `sqlcmd` inicia con
   `QUOTED_IDENTIFIER OFF`, por lo que `004` fija `ON` para índices filtrados.
6. Sembrados solo catálogos autorizados: 3 roles, 37 permisos, 83 `rol_permisos`, 5 tipos de
   institución, 5 categorías, 6 unidades y 28 distritos de Huancayo. No se sembraron productos,
   parámetros, usuarios, instituciones, necesidades, donaciones ni ubicaciones. Script: `005`.
7. Creadas las **9 vistas** documentadas. La disponibilidad y el progreso se calculan desde
   registros reales; no se almacenan totales derivados. Script: `006`.
8. Creados los **2 procedimientos** transaccionales con `TRY/CATCH`, `XACT_ABORT ON`,
   `UPDLOCK/HOLDLOCK` y errores `52001`–`52011`. Script: `007`. Ajustes reales documentados: sin
   historial en la creación, `@observaciones`/`@evidenciasJson` opcionales y
   `fecha_real_inicio` junto con `fecha_real_fin` para cumplir `CK_entregas_fechas`.
9. Creados `dc_app` y `dc_admin`, más `dc_app_usuario` sin login para verificar permisos.
   `dc_app` lee catálogos, escribe operaciones, ejecuta los dos procedimientos y no puede borrar
   auditoría ni insertar catálogos. `dc_admin` no tiene DDL. Sin contraseñas en el repositorio.
   Script: `008`.
10. Pruebas reales en `DonaConectaDB_Pruebas`: **11/11** de estructura, vistas, `CHECK`, FK
    compuestas, vencimientos, `ROWVERSION` y borrado protegido; **15/15** de errores de negocio,
    reserva real, recepción parcial, recepción total, evidencia, notificación y auditoría; y
    concurrencia con **dos conexiones independientes**: un compromiso válido y otro rechazado con
    `52001`, una recepción válida y otra rechazada con `52006`, sin interbloqueos `1205`. Un
    observador consultó `sys.dm_tran_locks` y detectó bloqueos en la escena A; en la B la muestra
    fue 0 por la brevedad de la transacción, limitación documentada.
11. Respaldo fuera del repositorio con `CHECKSUM` y `RESTORE VERIFYONLY`. Restauración real en
    `DonaConectaDB_Pruebas` (42/79/9/2, 0 usuarios) y verificación final en
    `DonaConectaDB_Verificacion` (42/79/9/2, 0 filas de negocio, procedimiento corregido). No se
    usó `REPLACE` ni `DROP DATABASE`.
12. La base real quedó con 0 filas en todas las tablas de negocio. El cambio preexistente del
    usuario en `frontend/src/app/features/nosotros/nosotros.html` se conservó sin modificar.
    No se implementó FastAPI, no se instalaron dependencias Python y no se hicieron commits.

La ejecución completa está en `database/README.md`; los scripts de prueba están en
`database/tests/` y los de respaldo en `database/mantenimiento/`.

## 7. Reparto de trabajo

- **Frontend:** contratos DTO e interfaces derivadas del modelo, servicios `HttpClient`,
  interceptor, guards y formularios reactivos sin datos simulados. No se activan rutas privadas
  hasta que exista autenticación real.
- **Backend/base de datos:** Fase 06 (DDL, catálogos, vistas, procedimientos, cuenta y respaldo)
  y Fase 07 (`pyproject.toml`/`uv.lock`, `backend/src/backend/`, PyODBC, Pydantic, OpenAPI).
- **Coordinación previa:** nombres de tablas y columnas, códigos de estado, rutas, métodos HTTP,
  JSON de respuesta, formato de error y eventos WebSocket. Se usa un único modelo: el de esta
  fase. `backend/README.md` se corrige de forma coordinada en Fase 07.

## 8. Resultado real de la Fase 07.A (solo frontend)

La Fase 07.A prepara la SPA de servicios sin adelantar el backend de la Fase 07. La rama sigue
siendo `Andrea`; no se crearon dependencias Python, archivos `.env`, tablas, datos de negocio,
commits ni push. `DonaConectaDB` no fue modificada.

1. Dieciséis rutas cargadas con `loadComponent`, título y metadescripción propios: `/`,
   `/necesidades`, `/instituciones`, `/puntos-de-acopio`, `/registro`, `/registro/donante`,
   `/registro/institucion`, `/iniciar-sesion`, `/mensajes`, `/mis-donaciones`,
   `/seguimiento/:id`, `/perfil`, `/como-donar`, `/nosotros`, `/preguntas-frecuentes` y 404.
   `/seguimiento/:id` no se enlaza todavía porque no existe un identificador real.
2. Layout público compartido con navbar, pie de escritorio y barra inferior móvil de cinco
   destinos reales; `env(safe-area-inset-bottom)` y `RouterLinkActive` con `aria-current`.
3. Formularios Reactivos: donante (10 controles), registro institucional por pasos (12 controles)
   y acceso más recuperación (2 y 1 controles). Validadores compartidos, coincide contraseñas,
   mostrar/ocultar clave e indicador de fuerza orientativo. `password_confirmation` no se envía.
4. `BackendEstadoService.integracionHabilitada = false`. Los servicios de registro, acceso,
   exploración, donaciones, mensajería, seguimiento y perfil devuelven `ServicioPendienteError`.
   `HttpClient` se resuelve desde `Injector` solo al activar el flag; no se registra un proveedor
   global ni se fingen respuestas, sesiones, tokens o datos.
5. Catálogos locales exclusivamente informativos (categorías, tipos de institución, unidades y
   distritos ya sembrados). El buscador filtra solo esas categorías y no simula necesidades.
6. Build de producción correcto: 545.17 kB iniciales y 105.02 kB transferidos, con páginas
   diferidas. El aviso de presupuesto inicial se ajustó de 500 a 600 kB; el error sigue en 1 MB.
   Persisten solo advertencias de deprecación de `@import` de Sass, ya presentes antes de la fase.
7. Pruebas: **14/14** aprobadas (`npm test -- --watch=false`). Verificación con Edge headless y
   CDP: 16 rutas × 7 anchos (360 a 1920 px) y 52 combinaciones, sin desbordamiento horizontal,
   imágenes rotas, anclas rotas, errores de consola ni lenguaje técnico en la interfaz. Un solo
   `h1` y metadescripción en cada ruta; títulos únicos; barra móvil visible solo bajo `lg`. La
   imagen LCP de `/registro/donante` se marcó como `eager` con prioridad alta para eliminar el aviso
   `NG0913`; la del catálogo permanece diferida por estar fuera del primer viewport.
8. Comprobación del estado de Angular en tiempo de ejecución: `FormGroupDirective` presente en
   los tres formularios y menú móvil `false → true → false` con `aria-expanded` sincronizado.
   `prefers-reduced-motion` se respeta en estilos globales y de componentes.
9. La valoración estética final queda pendiente de revisión humana: el modelo no puede inspeccionar
   capturas. No se implementó autenticación, GPS, chat, notificaciones ni cifrado de negocio.

La Fase 07 (FastAPI, PyODBC, Pydantic, OpenAPI y `uv`) continúa pendiente y es requisito para
activar los servicios y las rutas privadas de las fases 09 a 17.
