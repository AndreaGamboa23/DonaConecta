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
| 07 | Backend FastAPI, conexión y arquitectura de servicios. | Avance parcial integrado en Avance 01 (ver Fase 08.2); pendiente de cierre formal |
| 08 | Landing definitiva y navegación pública integrada. | Ejecutada en avances previos |
| 08.2 | CRUD real de usuarios, perfil personal, sesiones revocables y celular cifrado. | Ejecutada e integrada en Avance 01 |
| 09 | Paneles administrativo e institucional, verificación real, catálogo SQL y necesidades (Avance 02). | Ejecutada |
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

## 9. Resultado real de la Fase 07.B (rediseño visual, solo frontend)

La Fase 07.B mantiene las dieciséis rutas y los contratos de la Fase 07.A. La rama sigue siendo
`Andrea`; no se modificaron `backend/` ni `database/`, no se instalaron dependencias, no se crearon
tablas ni datos de negocio y no se ejecutaron commits ni push. `BackendEstadoService` continúa con
`integracionHabilitada = false`, por lo que ninguna pantalla afirma que exista backend, sesión,
chat, donaciones ni GPS.

1. Se integraron las ocho imágenes nuevas proporcionadas por el usuario: cinco fotografías de
   categoría y tres paneles verticales para registro donante, registro institucional y acceso.
   Todas se sirven desde `/assets/images/...`, declaran `width` y `height`, usan `alt` descriptivo
   y no se presentan como evidencia real. Las cuatro ilustraciones anteriores y sus derivados
   `-opt.webp` y `-movil.webp` se conservaron con sus `srcset` y `<picture>` originales.
2. `CATEGORIAS_INFORMATIVAS` incorpora `imagen` y `altImagen`. Los componentes `CategoriaDonacion`
   y `CategoriasDestacadas` centralizan la rejilla de cinco categorías en Inicio, Explorar y Cómo
   donar; se eliminaron las tarjetas blancas numeradas y las listas duplicadas. Cada categoría
   enlaza con `/como-donar#bienes` y usa `aspect-ratio`, `object-fit` y cuadrícula responsive.
3. El navbar separa la marca, cinco enlaces públicos, Mensajes como acceso personal, Iniciar sesión
   como acción secundaria y Regístrate como acción principal. Nosotros y FAQ pasaron al menú
   secundario. La barra inferior móvil conserva cinco destinos reales con icono y etiqueta
   visibles, indicador de selección y `env(safe-area-inset-bottom)`.
4. La portada es una entrada a servicios: buscador informativo de las cinco categorías locales,
   accesos reales a exploración, guía, instituciones, puntos de acopio, mensajes, donaciones y
   registro. El hero fotográfico conserva el concepto de marca sin ocupar casi toda la primera
   pantalla.
5. Se rediseñaron `/registro`, sus dos formularios y `/iniciar-sesion` sin alterar los 10, 12, 2 y
   1 controles, los validadores compartidos, el asistente por etapas ni `password_confirmation`
   como campo exclusivo del navegador. Mensajes, perfil, mis donaciones, puntos de acopio y
   seguimiento muestran estados vacíos claros, sin conversaciones, contadores, ubicaciones ni
   entregas de ejemplo. Se retiraron los controles deshabilitados sin función.
6. Se consolidaron los avisos pendientes en una nota breve por pantalla, se eliminaron los fondos
   rayados y el contrato muerto `operacion` de `ServicePage`, y se corrigió el fragmento
   `/nosotros#creditos-visuales` enlazado desde el pie.
7. Verificación de imágenes: las 20 imágenes del directorio devolvieron `200`,
   `Content-Type: image/webp`, decodificaron con `decode()` y tenían `naturalWidth` y
   `naturalHeight` reales. Ninguna era HTML ni estaba rota. Las ocho nuevas son WebP VP8 con las
   dimensiones exactas documentadas en `frontend/public/assets/images/README.md`.
8. Build de producción correcto: **547.00 kB** iniciales y **105.43 kB** transferidos, por debajo
   del presupuesto de 600 kB. Persisten únicamente las advertencias de deprecación de `@import` de
   Sass, anteriores a esta fase. Pruebas: **9 archivos y 14/14 pruebas** aprobadas.
9. Verificación con Edge headless y CDP: **47 combinaciones** de 16 rutas y siete anchos
   (360, 390, 576, 768, 1024, 1440 y 1920 px). Resultados: 0 desbordamientos horizontales, 0 títulos
   o metadescripciones ausentes, 0 imágenes rotas o sin `alt`/dimensiones, 0 anclas rotas, 0 errores
   de consola, 0 avisos `NG0913`, 0 lenguaje técnico detectado y `FormGroupDirective` presente en
   los formularios verificados. La barra inferior aparece solo por debajo de `lg`.
10. Comprobación interactiva adicional con CDP a 390 y 1440 px: menú móvil `false → true → false`
    con `aria-expanded` y clase `show` sincronizados; barra inferior con cinco etiquetas e iconos,
    un solo elemento `aria-current="page"` y oculta en escritorio; buscador informativo de cinco a
    una categoría al escribir «ropa» y de vuelta a cinco al limpiar; cinco tarjetas de categoría con
    imagen y enlace real, sin numeración `01–05`.
11. Las capturas se generaron en `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-07b-capturas`,
    fuera del repositorio. `git diff --check` no reportó errores de whitespace; solo avisos de
    normalización LF/CRLF. La valoración estética final continúa pendiente de revisión humana porque
    este modelo no puede inspeccionar imágenes ni capturas.

La Fase 07 de backend sigue pendiente y no se inicia sin autorización explícita.

## 10. Resultado de la Fase 07.B.1 (corrección de navegación y servicios)

1. Navbar definitivo con Inicio, Explorar, Instituciones, Mensajes, `Más`, Iniciar sesión y
   Regístrate en una sola fila de escritorio. `Más` contiene Puntos de acopio, Mis donaciones,
   Cómo donar, Nosotros y Preguntas frecuentes; se cierra con Escape, clic fuera y Selección.
   La barra inferior móvil conserva cinco destinos y el menú muestra acceso a sesión y registro.
2. `PageHero` pasó a un encabezado compacto con icono en la etiqueta, color explícito para el
   título en fondo azul y sin el círculo decorativo de 9 rem. Se elevaron las áreas táctiles y
   los textos secundarios, y se reforzó el contraste de los encabezados sobre fotografía.
3. `/necesidades` es ahora un catálogo con buscador informativo, categorías fotográficas al inicio,
   filtros por categoría, distrito y prioridad, y un panel de resultados con estados
   `servicio-no-disponible`, `cargando`, `error`, `vacio` y `datos`. Se eliminó la frase
   «No vamos a mostrar necesidades inventadas» y no se afirma ausencia de registros reales.
4. `/instituciones` dispone de buscador, filtros por tipo, distrito y verificación, tarjeta
   reutilizable `InstitucionCard` preparada para DTO reales y un panel de resultados con los
   mismos estados. No hay nombres, direcciones ni verificaciones inventadas.
5. `/mensajes` separa bandeja y conversación con vista móvil independiente, buscador real sobre
   cero registros, adjunto y envío deshabilitados con explicación y un solo aviso pendiente.
6. `/puntos-de-acopio` incorpora un mapa Leaflet real con centro verificado de Huancayo, zoom,
   desplazamiento, volver, consulta voluntaria de ubicación y estados de permiso/error. La
   atribución de OpenStreetMap es visible; no hay marcadores de negocio, rutas ni ETAs.
7. `/seguimiento/:id` prepara el estado de la sesión, el mapa, el contacto por mensajes y
   documenta las limitaciones de geolocalización en PWA y segundo plano.
8. Se consolidaron los avisos de registro, se corrigió el mensaje «El registro no está
   habilitado» y se advierte explícitamente que no se escriban datos reales.
9. Se redactó `docs/informe-backend-fase-07b1.md` con el flujo actual y definitivo, los JSON
   exactos, endpoints, diferencias de DTO, eventos WebSocket, inventario de paneles privados y
   estrategia de `DonaConectaDB_Pruebas`.
10. Verificación: build de producción con **562,41 kB** iniciales y **108,35 kB** transferidos,
    dentro del presupuesto de 600 kB; **9 archivos y 15/15 pruebas** aprobadas. Solo persisten
    las advertencias de deprecación de `@import` de Sass, anteriores a esta fase. `git diff --check`
    y `git status` se revisaron al cierre; las capturas quedan fuera del repositorio.

La Fase 07 de backend continúa pendiente y no se inicia sin autorización explícita.

## 11. Resultado de la Fase 07.B.2 (aplicación de servicios comunitarios)

1. Catálogo informativo local en `core/data/catalogo-informativo.ts`: **41 bienes** en cinco
   categorías, con condiciones, preparación, no recomendados, alternativas y tipos de
   institución. Es contenido editorial, no solicitudes reales ni inventario disponible.
2. Buscador determinista en `core/utils/busqueda-texto.ts` y
   `core/services/catalogo-informativo.service.ts`: normaliza tildes y mayúsculas, trata
   singular/plural y sinónimos, prioriza coincidencias exactas, ofrece relacionados y muestra
   estado sin coincidencias. Casos verificados: cuadernos/lápices/mochilas,
   chompas/casacas/cobijas, arroz/menestras/frejoles, jabón/champú/shampoo y
   croquetas/perros/mascotas.
3. Componentes compartidos `BuscadorCatalogo` y `ProductoCard`; rutas `/explorar`,
   `/explorar/:categoria`, `/explorar/:categoria/:producto` y `/historias`, con título y
   metadescripción propios. El buscador de portada envía a `/explorar?q=...` y el de Explorar
   reutiliza el mismo servicio sin acceso a red.
4. `CategoriaDonacion` enlaza a su guía por categoría; se eliminaron las etiquetas redundantes
   «BIEN MATERIAL» y «Ver guía» y se uniformó la fotografía con `object-fit: cover`. La primera
   tarjeta carga su imagen con `eager` para evitar `NG0913`.
5. `/instituciones` muestra cuatro **tipos** de institución con las nuevas ilustraciones, sin
   nombres, direcciones, distritos ni verificaciones inventados. `InstitucionCard` sigue
   preparada para DTO reales futuros con foto, descripción, necesidades, horarios, puntos y chat.
6. `/historias` usa `experiencias-solidarias.webp` y `comunidad-solidaria.webp` como contenido
   editorial sobre la preparación de dones; no incluye testimonios, puntuaciones ni favoritos
   activos. `docs/propuesta-experiencias-valoraciones-favoritos.md` deja esa funcionalidad como
   propuesta pendiente.
7. Hero: `.dc-hero-inner` reserva 7,75 rem en móvil y 8,25 rem en escritorio para la ola de
   5,5 rem; se corrigió el recorte inferior sin `overflow` adicional ni alturas fijas. La
   separación medida entre el último botón y la ola fue de 150–207 px en cinco anchos.
8. Mapa: se eliminó el marcador de referencia que contaba como `leaflet-interactive`, se añadieron
   `invalidateSize()`, `ResizeObserver`, contador moderado de fallos de teselas y limpieza en
   `ngOnDestroy`. Atribución OSM, zoom, desplazamiento, retorno y geolocalización voluntaria
   permanecen; no hay puntos de acopio, rutas ni ETAs inventados.
9. Documentos nuevos: `docs/propuesta-experiencias-valoraciones-favoritos.md` y
   `docs/entorno-datos-pruebas.md`; se actualizaron README de imágenes, mapa de navegación,
   decisiones técnicas, sistema de diseño, este plan y `AGENTS.md`.
10. Build de producción: **564,27 kB** iniciales y **108,82 kB** transferidos, dentro del
    presupuesto de 600 kB. Pruebas: **12 archivos y 28/28** aprobadas. Solo persisten las
    advertencias de deprecación de `@import` de Sass.
11. Verificación CDP: **105 combinaciones** de 27 rutas y siete anchos (360, 390, 576, 768,
    1024, 1440 y 1920 px). Resultados: 0 títulos o metadescripciones ausentes, 0 `h1`
    duplicados, 0 desbordes horizontales, 0 imágenes rotas, 0 anclas rotas, 0 errores de consola,
    0 fallos de red y 0 enlaces internos inválidos. El buscador de portada con «cobijas» llevó a
    Frazadas; «mochilas» devolvió dos resultados y seis sugerencias; el detalle de Arroz mostró
    condiciones, preparación y relacionados. Navbar con cinco enlaces principales, `Más` con
    «Historias que conectan», menú móvil `false → true → false`, barra inferior con cinco
    destinos, Leaflet con 18/18 mosaicos y `.leaflet-pane` en `absolute`, bandeja/panel de
    mensajes intactos y formulario de donante con 10 controles.
12. Las capturas se guardaron en `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-07b2-capturas`,
    fuera del repositorio. `git diff --check` y `git status` se revisan al cierre. La valoración
    estética final continúa pendiente de revisión humana porque este modelo no puede inspeccionar
    imágenes ni capturas.

La Fase 07 de backend sigue pendiente y no se inicia sin autorización explícita.

## 12. Resultado de la Fase 08.2 (CRUD real, perfil personal y seguridad)

1. Se implementaron once operaciones HTTP reales en FastAPI: registro, login, cierre de sesión,
   consulta del perfil, actividad, perfil por identificador, `PUT`, `PATCH`, cambio de contraseña,
   cambio de correo y baja lógica. `PUT` exige la representación editable completa; `PATCH` sólo
   modifica los campos presentes y distingue `telefono: null` de un campo omitido.
2. El perfil de Angular quedó organizado en cuatro pestañas —Información personal, Actividad,
   Preferencias y Seguridad y privacidad— con formularios reactivos, contadores reales y estados
   vacíos útiles. No hay identificadores protagonistas ni botones duplicados.
3. El navbar y el cierre de sesión usan servicios reales: los datos se reflejan al guardar y el
   token se revoca en SQL Server antes de limpiar `sessionStorage`. El aviso obsoleto sobre el
   celular no guardado se sustituyó en ambos formularios de registro.
4. Seguridad: Argon2id, JWT con `jti` e `iat`, hash SHA-256 del token en `tokens_seguridad`,
   validación de sesión activa y roles reales en cada petición, DTO sin secretos, autorización por
   propiedad con `404` para perfiles ajenos, baja transaccional con reautenticación y auditoría.
5. El celular se guarda con AES-256-GCM, nonce aleatorio de 12 bytes y versión de clave `1`. La
   clave vive sólo en `backend/.env`; `.env.example` no contiene valores sensibles. La dependencia
   justificada `cryptography==46.0.7` se documentó en `pyproject.toml`.
6. Evidencia real: **34/34** comprobaciones de API y persistencia con cuentas sintéticas,
   **20/20** comprobaciones de flujo en navegador CDP y **42/42** comprobaciones de documentación
   OpenAPI/Swagger. Se verificaron SELECT de persistencia, cifrado, revocación, baja lógica,
   auditoría y los códigos `200`, `201`, `204`, `401`, `403`, `404`, `409` y `422`.
   `DonaConectaDB` conserva 0 usuarios y las cuentas previas no fueron modificadas.
7. Build de producción: **569,46 kB** iniciales y **110,23 kB** transferidos, dentro del
   presupuesto de 600 kB. Pruebas: **20 archivos y 50/50** en Angular y **7/7** en Python.
   Persisten únicamente las advertencias de deprecación de `@import` de Sass.
8. Se creó `docs/informe-crud-perfil-fase-08.2.md`; el informe de Fase 08 conserva su diagnóstico
   histórico con una nota que señala las limitaciones ya resueltas. No se ejecutaron commit, push,
   merge ni cambio de rama. La valoración estética final sigue pendiente de revisión humana.

## 13. Resultado de la Fase 09 (Avance 02)

1. Backend: 14 operaciones nuevas de panel y catálogo con DTO explícitos, reglas puras de
   transición, repositorios parametrizados, auditoría transaccional y autorización por rol y
   propiedad. OpenAPI expone 28 rutas, 36 operaciones y 45 esquemas; las 14 operaciones de panel
   tienen resumen, respuestas y seguridad declarada.
2. Frontend: rutas `/admin` e `/institucional` con `rolGuard`, layout de panel, carga diferida,
   ocho páginas, acceso por rol desde el navbar y catálogo SQL real en Explorar/Necesidades.
   Se conservan el buscador determinista, las guías editoriales y los estados honestos.
3. SQL: DML idempotente de 41 bienes en `DonaConectaDB_Pruebas` (42 productos totales), sin DDL;
   `DonaConectaDB` sigue con 0 filas de negocio y `ALLOW_MAIN_DB_WRITES=no`.
4. Integración real: institución `DEMO-INST-FASE09` verificada con historial y auditoría;
   necesidad `DEMO-NEC-FASE09-Arroz` publicada y compromiso del donante persistidos. Dos defectos
   detectados en ejecución se corrigieron: correo `.invalid` rechazado por `EmailStr` y
   reactivación sin roles de una cuenta bloqueada.
5. Evidencias: **21/21 + 21/21** comprobaciones de API, **1789/1789** comprobaciones de navegador
   en 28 rutas y 404 × siete anchos (360–1920 px), **69/69** pruebas Angular en 25 archivos y
   **24/24** pruebas Python. Build: **583,23 kB** iniciales y **112,73 kB** transferidos.
6. Seguridad: cuenta administrativa sintética aprovisionada con contraseña fuera del repositorio,
   Argon2id y rol `ADMINISTRADOR` real; DTO sin secretos; bloqueo y baja revocan sesiones; la
   reactivación restaura solo roles vigentes en el modelo.
7. Detalle completo en `docs/informe-paneles-fase-09.md`, `docs/contrato-api.md` §9,
   `docs/seguridad-privacidad.md` §11.7 y `docs/decisiones-tecnicas.md`. No se ejecutaron commit,
   push, merge ni cambio de rama; la valoración estética final sigue pendiente de revisión humana.
