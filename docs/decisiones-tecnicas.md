# Decisiones técnicas

Registro de decisiones nuevas tomadas a partir de la Fase 04, según `AGENTS.md`.

## Fase 04 — Bootstrap, diseño y primer avance visual

| Decisión | Justificación |
|---|---|
| Instalar `bootstrap@5` localmente con npm en `frontend/` | Requisito obligatorio. Versión fijada en `package.json` y `package-lock.json`. No se usa CDN. |
| Instalar `@fontsource/manrope` y `@fontsource/inter` | Autoalojamiento de las tipografías de identidad. Licencia **OFL-1.1** verificada con `npm view ... license` antes de instalar. |
| Importar Bootstrap SCSS una sola vez desde `styles.scss` | Evita duplicación de estilos y mantiene una única entrada global en `angular.json`. |
| Declarar variables Bootstrap antes del import | Permite personalizar paleta, radios, sombras y tipografías sin hojas de overrides extensas. |
| No importar Bootstrap JS | El menú móvil se resuelve con un `signal` de Angular y `[class.show]`, evitando manipulación directa del DOM. |
| No instalar Tailwind, Angular Material ni librería de iconos | Bootstrap y los SVG propios cubren la necesidad; se respeta la regla de dependencias mínimas. |
| Componentes standalone | Configuración actual de Angular 22; mantiene el código simple y modular. |
| Anclas `href="#seccion"` en la Fase 04 | Todas apuntaban a secciones existentes. En la Fase 04.2 se sustituyeron por `RouterLink` con fragmentos o por rutas reales; solo permanece como ancla nativa el salto al contenido principal. |
| Aviso de deprecación de Sass `@import` | Bootstrap 5 usa `@import` internamente; el build termina correctamente. Se documenta y no se introduce una solución que complique la sustentación. |

## Fase 04 — rediseño visual consolidado

| Decisión | Justificación |
|---|---|
| Sustituir la portada básica por seis secciones standalone en `features/landing/sections/` | Cada bloque tiene composición propia (hero, confianza, categorías, proceso, propósito y participación) y comparte tokens globales. Facilita extender el sistema visual a futuros catálogos y dashboards. |
| Rediseñar el símbolo de marca como corazón formado por manos que se unen | Refuerza “Una comunidad, muchas manos, un mismo propósito” y evita el par de círculos prohibido. Se replica de forma simplificada en `favicon.svg`. |
| Añadir indicador de sección activa con `IntersectionObserver` y CTA en navbar (Fase 04) | Comunicaba la sección visible de la portada. En la Fase 04.2 se reemplaza por `RouterLinkActive` para indicar la ruta activa de la SPA. |
| Mantener el menú móvil con `signal`, `aria-expanded` y `aria-controls` | Conserva la integración Angular, la navegación por teclado y evita dependencia de Bootstrap JS. |
| Usar `gy-5` en lugar de `g-5` dentro de contenedores Bootstrap | `g-5` fija gutter horizontal de 3 rem y provocó 12–13 px de desbordamiento a 360/390 px. `gy-5` conserva el ritmo vertical sin tocar el gutter horizontal. Corregido y reverificado. |
| Exponer tokens de marca como variables CSS en `_global.scss` | Los SCSS de componentes son compilados por separado; usar variables CSS evita errores “Undefined variable” y mantiene un único origen de verdad. |
| No integrar fotografías externas en esta entrega | Aunque se identificaron fuentes con licencia verificable, las herramientas disponibles no permiten inspeccionar visualmente las imágenes. Integrarlas sin revisión podría mostrar contextos inadecuados. Se documentan siete archivos requeridos y puntos de integración. |
| Composiciones SVG originales con leyenda de no evidencia real | Cubren la necesidad visual sin inventar actividades, organizaciones ni testimonios; se retiran automáticamente al asignar una ruta de foto autorizada. |
| Verificación con Edge headless + Chrome DevTools Protocol fuera del repositorio | Permitió medir desbordamiento, enlaces, menú, foco de anclas, fuentes, color Bootstrap y errores de consola en siete anchos, además de generar capturas. No añade dependencias al proyecto. |
| Actualizar `AGENTS.md` con requisitos permanentes de calidad visual | La estética deja de ser opcional: se exige originalidad, riqueza equilibrada, fotografía verificada, enlaces reales y revisión antes de cerrar fases visuales. |

## Fase 04.2 — navegación SPA y documentación funcional

| Decisión | Justificación |
|---|---|
| Angular Router con un `PublicLayout` y rutas hijas | Permite compartir navbar, footer y skip link sin repetirlos en cada página. La portada deja de ser una landing de anclas. |
| `RouterLink` + `RouterLinkActive` con `aria-current="page"` | El enlace activo es real y accesible. Se usa una referencia de plantilla `#rla="routerLinkActive"` para aplicar `aria-current` solo cuando corresponde. |
| Coincidencia exacta en la ruta `/` | Evita que “Inicio” aparezca activo mientras el usuario está en `/como-donar`, `/nosotros` o `/preguntas-frecuentes`. |
| `loadComponent` en **todas** las páginas, incluida la portada y el 404 | Con navbar y footer con RouterLink, el bundle inicial subió a 517.24 kB y superó el presupuesto de 500 kB. Al diferir las páginas se redujo a 491.94 kB sin modificar `angular.json`. |
| `DonaTitleStrategy` personalizada | Angular permite fijar el título por ruta, pero no la metadescripción. Una `TitleStrategy` centraliza ambos sin librerías externas. |
| `withInMemoryScrolling({ anchorScrolling, scrollPositionRestoration })` | Los fragmentos (`#bienes`, `#pasos`) desplazan de verdad y el botón de retroceso recupera la posición previa. |
| Activación progresiva de rutas | Solo se enlazan `/`, `/como-donar`, `/nosotros` y `/preguntas-frecuentes`. Las rutas de autenticación, catálogo, mapas, GPS y chat quedan documentadas, sin enlaces falsos ni pantallas simuladas. |
| CTA de portada mixtos | Los CTA principales llevan a `/como-donar`; los secundarios usan fragmentos de la portada. Las secciones resumen módulos pero no sustituyen sus páginas futuras. |
| `<details>` nativos en preguntas frecuentes | Bootstrap no require JS para este patrón y evita un componente propio de acordeón; mantiene teclado y lectores de pantalla. |
| Contenido explícitamente “Planificado” en la guía y el FAQ | Cumple la regla de no simular donaciones, registros, seguimiento ni autenticación, y hace comprensible el estado real del proyecto. |
| Documentos nuevos de requisitos, navegación, seguridad y plan | Centraliza decisiones que antes estaban solo en `AGENTS.md` y facilita la sustentación sin inventar funcionalidad. |
| Pruebas actualizadas | `Navbar` y `Landing` recibieron `provideRouter([])` porque ahora usan `RouterLink`; la prueba del indicador de ancla se sustituyó por una comprobación de rutas reales. |

## Fase 04.3 — composiciones fotográficas y optimización sin dependencias

| Decisión | Justificación |
|---|---|
| Integrar las cuatro ilustraciones proporcionadas por el usuario | El usuario autorizó su uso para el proyecto. Se documenta que son generadas con IA y se muestra una aclaración visible; no se presentan como evidencia real. |
| Conservar los originales VP8L y crear `*-opt.webp` / `*-movil.webp` | Los originales pesan 1.6–1.9 MB y conservan C2PA. Los derivados VP8 reducen el peso a 150–225 KB (60–92 KB en móvil) con diferencia media ~2/255. Conservar los originales permite recuperar procedencia. |
| Usar el codificador WebP de Edge vía CDP en lugar de instalar ImageMagick, cwebp, ffmpeg o Pillow | Ninguna herramienta estaba disponible y la fase exige evitar dependencias innecesarias. El codificador nativo del navegador resolvió la optimización sin tocar `package.json`. |
| Eliminar C2PA solo en los derivados optimizados y conservar ICCP | Reduce peso y mantiene perfil de color. La procedencia queda documentada y disponible en los originales. |
| `<picture>` con `<source media="(max-width: 575.98px)">`, `srcset`, `sizes`, `width` y `height` | El navegador elige la versión móvil adecuada y se reserva el espacio antes de cargar, evitando desplazamiento de layout. |
| `loading="eager"` y `fetchpriority="high"` solo en el hero principal; `loading="lazy"` en el resto | Prioriza el primer viewport sin retrasar la interacción y evita descargas innecesarias en secciones posteriores. |
| No recortar `como-donar.webp` en cinco imágenes de categoría | Sería una representación falsa. Las categorías usan color, iconos y tipografía propios; la ilustración solo introduce la sección. |
| Reutilizar `dc-cta-panel`, `dc-eyebrow`, `dc-tile-icon` y `dc-step-number` con nuevos modificadores | Mantiene un sistema visual compartido entre portada, guía, nosotros, FAQ y 404 sin duplicar componentes ni reimplementar Bootstrap. |
| Clase `.dc-section-space` para el ritmo vertical | Bootstrap 5 no ofrece utilidades `py-6`/`py-7`; se centraliza un único valor responsive en lugar de estilos inline o clases repetidas. |
| Mantener `RouterLink`, fragmentos y `<details>` nativos | El rediseño es estrictamente visual; no se agrega estado falso ni JavaScript para acordeones. |

## Fase 04.4 — Legibilidad y portada como acceso a servicios

| Decisión | Justificación |
|---|---|
| Declarar `color: var(--dc-white)` en `.dc-hero-title`, `.dc-community-title`, `.dc-page-title` y encabezados de secciones oscuras | Bootstrap aplica `$headings-color: $dc-navy` a los `h1`/`h2`; `text-white` en el contenedor no alcanza al encabezado. La clase de componente corrige el color sin `!important`. |
| Reducir la altura del hero y usar `nosotros-comunidad` como imagen principal | El usuario confirmó que esa ilustración tiene personas colaborando y espacio a la izquierda; el encabezado ocupa menos viewport y queda sobre la zona degradada. |
| Reasignar `hero-comunidad` al hero de `/como-donar` | El usuario confirmó que muestra cajas, manos y bienes materiales, coherente con la guía de donación. |
| Crear `QuickAccess` con cuatro destinos reales | Da experiencia de aplicación de servicios sin buscadores, selectores de ubicación ni pestañas simuladas. Cada acceso usa rutas o fragmentos existentes. |
| Convertir las tarjetas de categorías en enlaces a `/como-donar#bienes` | La portada deja de ser solo information: cada categoría abre la guía real donde se explica qué donar. |
| Centralizar el crédito visual en `/nosotros#creditos-visuales` | Evita ocho repeticiones de texto técnico sobre las imágenes y mantiene la procedencia documentada en un solo lugar accesible desde el pie. |
| Eliminar la tabla de fases y el lenguaje de implementación de FAQ/Nosotros | La interfaz debe hablar al visitante, no al equipo de desarrollo; las fases siguen documentadas en `AGENTS.md` y `docs/`. |
| Documentar la futura navegación pública y la barra inferior autenticada sin implementarla | Evita enlaces falsos y deja una integración clara para la PWA y las rutas privadas con backend. |

## Fase 07.A — SPA de servicios con contratos pendientes

| Decisión | Justificación |
|---|---|
| Preparar el frontend antes del backend sin adelantar la Fase 07 | El usuario autorizó una fase de interfaz y contratos. FastAPI, dependencias Python, DDL y DML siguen pendientes y no se han ejecutado. |
| `BackendEstadoService.integracionHabilitada = false` como única fuente de verdad | Todas las operaciones devuelven `ServicioPendienteError` con el endpoint previsto. Ningún formulario finge registro, sesión, envío de mensaje ni confirmación. |
| Servicios `HttpClient` ya tipados pero bloqueados | Los servicios usan los DTO de `docs/contrato-api.md` y resuelven `HttpClient` desde `Injector` solo cuando el flag esté activo. Así no se registra un proveedor global innecesario ni se eleva el bundle inicial; la Fase 07 deberá añadir `provideHttpClient()` al activar el backend. |
| Interfaces TypeScript derivadas del modelo de Fase 05.1 | Evita inventar contratos paralelos. Los catálogos locales replican únicamente roles, tipos, unidades, categorías y distritos ya sembrados en SQL Server; no son datos de negocio. |
| Reactive Forms con validadores compartidos en `core/utils/formularios.ts` | Centraliza correo, celular peruano, coincidencia de contraseñas e indicador de fuerza. `password_confirmation` solo existe en el navegador y nunca se envía. |
| Asistente de tres pasos para el registro institucional | Separa acceso, representante e institución sin perder contexto. La solicitud queda pendiente de verificación y no crea cuentas de administrador. |
| No solicitar documentos privados en este registro | No existe aún almacenamiento seguro ni validación de contenido real. El formulario declara que se indicará qué archivos harán falta cuando el servicio esté disponible. |
| Componentes compartidos `PageHero`, `ServiceCard`, `EmptyState`, `PendingNotice`, `ServicePage` y `MobileTabbar` | Dan un sistema visual coherente a todas las rutas nuevas sin reimplementar Bootstrap ni duplicar estados vacíos o pendientes. |
| Omitir endpoints y nombres de tecnología en los avisos visibles | La interfaz habla al visitante: «sin conexión» y «servicio oficial». Los endpoints quedan en `docs/contrato-api.md` y en el error controlado, no en la pantalla. |
| Buscador local solo sobre cinco categorías informativas | La base de datos no se consulta desde el navegador. La búsqueda no simula necesidades: invita a `/como-donar#bienes` y al catálogo real futuro. |
| Navbar con accesos públicos y menú «Más»; barra inferior con cinco destinos reales | Mantiene la sensación de aplicación sin pestañas inactivas ni contadores falsos. La barra usa `env(safe-area-inset-bottom)` y se oculta desde `lg`. |
| Sin guards ni interceptor todavía | No hay autenticación real. Crearlos ahora daría una falsa sensación de sesión; se introducirán con el backend en la Fase 09. |
| Indicador de fuerza sin dependencias | Las cuatro reglas son comprensibles en sustentación y se presentan como orientativas. El color bajo usa `bg-secondary`, no rojo, reservado para errores críticos. |
| Pruebas de rutas, estado pendiente, barra móvil y formularios | Verifican que las rutas existan con título/meta, que el envío no se simule y que los consents y contraseñas se validen antes de habilitar el botón. |
| Ajustar la advertencia de presupuesto inicial de 500 a 600 kB | La SPA incorpora el layout compartido, el navbar con iconos y el enrutador con dieciséis rutas; el build real queda en ~545 kB sin comprimir y ~105 kB transferidos. El límite de error se mantiene en 1 MB y todas las páginas siguen siendo `loadComponent`. |
| Imagen LCP de `/registro/donante` con `loading="eager"` y `fetchpriority="high"` | Angular 22 emitió `NG0913` porque esa imagen visible era el elemento LCP y estaba diferida. La imagen del catálogo, que queda fuera del primer viewport, conserva `loading="lazy"`. Verificado sin avisos `NG0913` a 390 y 1440 px. |
| Sin dependencias npm nuevas | Bootstrap 5 y los SVG propios cubren la interfaz; el SCSS propio se limita a conectores, identidad y foco visible. |

## Fase 07.B — Rediseño visual premium sin backend

| Decisión | Justificación |
|---|---|
| Usar las ocho imágenes nuevas proporcionadas por el usuario | El usuario las incorporó para esta fase. Se guardan en `public/assets/images/`, se sirven desde `/assets/images/...` y se declaran ilustrativas; no se presentan como evidencia real. |
| Crear `CategoriaDonacion` y `CategoriasDestacadas` como sistema compartido | Antes había listas duplicadas en Inicio y Cómo donar. Ahora `CATEGORIAS_INFORMATIVAS` contiene imagen y texto alternativo, y una sola rejilla se reutiliza en Inicio, Explorar y Cómo donar. |
| Sustituir las tarjetas numeradas por acceso fotográfico | Las tarjetas blancas `01–05` no comunicaban prioridad. La foto protagonista, el nombre, la descripción breve y el enlace a la guía hacen de cada categoría una entrada real al servicio. |
| Mantener `aspect-ratio`, `object-fit`, `width` y `height` en las imágenes | Evita deformación y desplazamiento de layout; las imágenes posteriores al primer viewport conservan `loading="lazy"` y las fotografías LCP usan carga prioritaria. |
| Reorganizar la navegación sin eliminar rutas | El navbar agrupa cinco enlaces públicos, Mensajes como acceso personal, acciones de cuenta y un menú «Más» para Nosotros y FAQ. La barra inferior conserva cinco destinos reales con icono y etiqueta visibles, indicador de selección y área segura del dispositivo. |
| Rediseñar registro y acceso como pantallas de dos zonas | Las tres fotografías verticales acompañan al formulario sin sustituir la validación. Se mantienen los 10, 12, 2 y 1 controles, los validadores compartidos, el asistente institucional y `password_confirmation` solo en el navegador. |
| Consolidar los avisos pendientes en una nota breve por pantalla | Se eliminaron repeticiones en necesidades, mensajes e instituciones. `BackendEstadoService.integracionHabilitada` sigue en `false`; la interfaz no afirma que exista backend, sesión, chat ni GPS. |
| Mejorar las pantallas personales sin datos inventados | Mensajes, perfil, donaciones, puntos de acopio y seguimiento conservan estados vacíos y acciones reales; no se muestran conversaciones, contadores, ubicaciones ni entregas de ejemplo. |
| No aumentar el presupuesto de Angular | El build real de la fase se mantiene por debajo de 600 kB iniciales. Las únicas advertencias persistentes son las de deprecación de `@import` de Sass, anteriores a esta fase. |
| Sin dependencias npm ni cambios de contrato | Bootstrap 5 y el SCSS complementario bastan para el rediseño; no se modifica el modelo de 42 tablas, `docs/contrato-api.md`, Reactive Forms ni la planeación de FastAPI/SQL Server. |

## Requisitos permanentes de arquitectura, API REST y base de datos (registro)

| Decisión | Justificación |
|---|---|
| Registrar la norma en `AGENTS.md` sección 18 y en `docs/arquitectura.md` | Son reglas compartidas para todas las fases posteriores; centralizarlas evita contradicciones entre frontend, backend y base de datos. |
| Backend de referencia `backend/src/backend/` con `apis/`, `repositories/`, `schemas/`, `services/`, `database/`, `security/`, `core/`, `websockets/`, `__init__.py` y `main.py` | Organización vista en clases y explicable en sustentación. `main.py` solo configura y registra enrutamiento. |
| Evaluar `uv` en la Fase 07, sin instalarlo ahora | Se respeta el procedimiento de clases y se evita duplicar gestores. `.venv/`, `__pycache__/` y `.env` no se versionan; `.env.example` queda sin secretos. |
| Contrato REST con `GET`/`POST`/`PUT`/`PATCH`/`DELETE` y códigos `200`–`500` | Diferencia crear, reemplazar y modificar parcialmente; `GET` nunca modifica datos. Errores homogéneos sin trazas ni mensajes de SQL Server. |
| Convención `/api/v1/...` propuesta y sujeta a validación en Fase 05/07 | No se fija unilateralmente: debe acordarse con el modelo de datos y el contrato de integración del equipo. |
| OpenAPI, Swagger UI y ReDoc en desarrollo | Aprovecha la documentación generada por FastAPI; en producción se evalúa restringir el acceso. |
| Baja lógica o cambio de estado antes que borrado físico | Protege la trazabilidad de donaciones, entregas y recepciones cuando existen relaciones. |
| WebSockets solo como complemento de REST | REST persiste la operación; el canal en tiempo real valida identidad y autorización y no sustituye la confirmación de recepción ni expone coordenadas públicas. |
| No crear backend, dependencias, tablas ni scripts SQL en este registro | El alcance autorizado es documental; la Fase 04.4 no se interrumpe y la Fase 05 requiere autorización explícita. |

## Advertencias de npm

`npm install` bloqueó scripts de instalación de `@parcel/watcher`, `esbuild`, `lmdb` y
`msgpackr-extract` por la política `allowScripts` de npm. **No se desactivaron las
protecciones.** La compilación y las pruebas se ejecutaron correctamente con los paquetes
precompilados disponibles.

## Fase 05.1 — Modelo de base de datos revisado y documentado

| Decisión | Justificación |
|---|---|
| Inventario corregido a **42 tablas** | La propuesta anterior declaró 41 pero enumeraba 40. Se añaden `parametros_sistema` y `recepcion_evidencias`, con finalidad documentada. |
| Registro diferenciado con una sola estrategia de endpoint | `POST /api/v1/autenticacion/registro` con `tipo=DONANTE|REPRESENTANTE`. No hay `POST /usuarios` público ni operaciones duplicadas. |
| Representante no obligado a registrarse como donante | Crea `usuarios` + rol `REPRESENTANTE` pendiente + solicitud de institución; no crea `donantes`. |
| Activación institucional triple | Rol `ACTIVO` + vínculo `ACTIVO` + institución `VERIFICADA`, centralizados en `vw_representante_autorizado`. |
| `usuario_roles.estado` en vez de solo `BIT activo` | Permite representantes pendientes que pueden iniciar sesión y completar su solicitud sin permisos de negocio. |
| Fórmula de disponibilidad corregida | `requerida − (reserva vigente restante + recibido)`. Evita contar `COMPLETADO` dos veces y evita que lo recibido vuelva a estar disponible. |
| Reserva desde `PENDIENTE` con expiración configurable | `parametros_sistema.COMPROMISO_EXPIRACION_MINUTOS`. La vista excluye vencidos aunque la limpieza se retrase. |
| FK compuestos anti asociaciones cruzadas | Compromiso→líneas de necesidad, entrega→líneas de compromiso y recepción→líneas entregadas. No se basa solo en validación de aplicación. |
| Marca de lectura protegida por FK compuesto | `conversacion_participantes(conversacion_id, ultimo_mensaje_leido_id)` → `mensajes(conversacion_id, mensaje_id)`. Única desnormalización permitida. |
| Idempotencia por remitente y contexto | `UNIQUE (remitente_usuario_id, client_message_id)` y validación de conversación; si cambia el contexto se responde `409`. |
| Participantes de chat explícitos | No se incorpora automáticamente a representantes. Al suspender/retirar el vínculo se bloquea su participación y el WebSocket. |
| GPS con una sola posición cifrada | Lat/long canónicas `DECIMAL(9,6)` validadas en backend y guardadas como payload AES-256-GCM; sin recorrido histórico. Puntos de acopio permanecen públicos. |
| Notificaciones con FKs tipadas opcionales | Máximo una FK; cero para alertas de seguridad, recuperación o cambio de cuenta. Corrige la restricción de “exactamente una” de la propuesta inicial. |
| Cifrado evaluado por dato, no indiscriminado | Matriz en `docs/seguridad-privacidad.md` §11. Argon2id para contraseñas, SHA-256 para tokens, AES-256-GCM para datos recuperables justificados. Sin E2E. |
| Dos procedimientos dueños de su transacción | `usp_RegistrarCompromiso` y `usp_ConfirmarRecepcion` usan `SET XACT_ABORT ON` y conexión dedicada `autocommit=True`. No se anida transacción de PyODBC. |
| `DELETE` limitado a borradores | Borrado físico solo de necesidad `BORRADOR` sin compromisos ni historial, en transacción de PyODBC. Nunca para donaciones, recepciones ni auditoría. |
| `DECIMAL(9,6)` frente a `geography` | Suficiente para el alcance actual; más simple de serializar y explicar. `geography` no se usa sin consultas espaciales reales. |
| Backend sin cambios en esta fase | Se documenta `backend/src/backend/` y se registra la contradicción de `backend/README.md` para corregirla coordinadamente en Fase 07. |

## Fase 06 — Implementación física de SQL Server

| Decisión | Justificación |
|---|---|
| Scripts numerados del `001` al `008` con `sqlcmd -b` | Orden determinista, ejecución reproducible y detención ante el primer error. No se usó `DROP DATABASE`, `DROP TABLE` ni `REPLACE`. |
| `SET QUOTED_IDENTIFIER ON` en índices filtrados y en inserciones sobre esas tablas | `sqlcmd` inicia con `OFF` y SQL Server exige `ON`; el primer intento falló con el error 1934 y se corrigió sin cambiar el modelo. |
| Catálogos sembrados con `WHERE NOT EXISTS` y `CREATE OR ALTER` | Permite repetir los scripts sin duplicar catálogos ni perder permisos de procedimientos. |
| 37 permisos derivados del contrato API, no un CRUD genérico | Cada código corresponde a una operación documentada; evita permisos decorativos y facilita la autorización en Fase 09. |
| Categorías e unidades tomadas de la interfaz y del dominio de bienes | Las cinco categorías coinciden con `/como-donar`; las seis unidades son suficientes para bienes materiales. No se inventaron productos. |
| 28 distritos de Huancayo con fuente verificable | `005_catalogos_iniciales.sql` documenta la fuente con referencia INEI. No se sembraron coordenadas porque la fuente no las contiene. |
| No sembrar `parametros_sistema` ni `productos` | No estaban en la lista autorizada; hacerlo habría introducido datos de negocio inventados. |
| Alias antes de la pista de bloqueo | SQL Server rechaza `FROM tabla WITH (...) alias`; se corrigió a `FROM tabla AS alias WITH (...)`. |
| Procedimientos dueños de su transacción y `OUTPUT` del id creado | Coincide con Fase 05.1 y evita transacciones anidadas desde PyODBC. Los códigos `52001`–`52011` son estables para traducirlos a `409`/`403`/`422`. |
| Sin `compromiso_historial` en la creación | `estado_anterior` es `NOT NULL` y debe diferir de `estado_nuevo`; no existe estado previo válido. El historial inicia con la primera transición. |
| `@observaciones` y `@evidenciasJson` opcionales en `usp_ConfirmarRecepcion` | Necesarios para cumplir `CK_recepciones_observacion` y para persistir evidencias sin inventar archivos. |
| `fecha_real_inicio` se escribe con `fecha_real_fin` | `CK_entregas_fechas` exige inicio cuando existe fin. El fallo se detectó al preparar las pruebas y se corrigió antes de ejecutarlas. |
| Conteos de bloqueo por asignación, sin `SELECT` al cliente | Los `SELECT COUNT(*)` usados para adquirir bloqueos devolvían resultsets innecesarios al backend; se sustituyeron por asignaciones que conservan `UPDLOCK/HOLDLOCK`. |
| Roles `dc_app`/`dc_admin` y usuario `WITHOUT LOGIN` | Permite verificar mínimo privilegio sin versionar contraseñas ni crear un login SQL con credenciales en Git. La cuenta Windows real se crea manualmente fuera del repositorio. |
| Pruebas sintéticas solo en base separada | `DonaConectaDB_Pruebas` se restauró desde el respaldo; la base real quedó sin usuarios, instituciones, donaciones ni mensajes. |
| Concurrencia con dos conexiones reales y observador de `sys.dm_tran_locks` | Confirma serialización por `UPDLOCK/HOLDLOCK`: una operación persiste y la otra recibe `52001`/`52006`, sin `1205`. No se necesitó `sp_getapplock`. |
| Respaldo y restauración verificados con `CHECKSUM` | Evita afirmar disponibilidad sin evidencia. La restauración final se hizo en `DonaConectaDB_Verificacion`, sin sobrescribir la base de trabajo. |

### Decisiones pendientes o condicionadas

1. **Cifrado nativo de SQL Server Express:** verificado en Fase 06. La instancia es Express
   (`EngineEdition = 4`), `EncryptionState = NULL` y no hay column master keys ni symmetric keys.
   No se activó TDE ni Always Encrypted. La estrategia de aplicación sigue pendiente de Fase 07.
2. **`sp_getapplock`:** no se implementó. Las pruebas con dos conexiones no mostraron interbloqueos
   `1205`; `UPDLOCK/HOLDLOCK` serializó correctamente. Se reevaluaría solo si apareciera evidencia
   contraria con carga real.
3. **Cifrado de coordenadas GPS:** diseño previsto con AES-256-GCM; si se decide diferir, la
   alternativa es `DECIMAL(9,6)` con control de acceso estricto. Requiere aprobación antes de
   implementar.
4. **Correcciones documentales coordinadas:** `docs/arquitectura.md` §15 (sigue diciendo que la
   Fase 05 está pendiente), `backend/README.md` (estructura anterior y afirma que no existe la
   base de datos), `README.md` (afirma que no hay fotografías integradas y que no se creó
   `DonaConectaDB`) y RF-12 en requisitos funcionales. No se modificaron en esta fase por no
   pertenecer al alcance de la implementación de la base de datos; se proponen para una fase de
   documentación coordinada.

### Contradicciones detectadas y resueltas en el modelo

- Contaje de tablas 41 vs. 40 → corregido a 42 con inventario explícito.
- Disponibilidad con doble descuento → fórmula corregida.
- Notificación “exactamente un recurso” → permitido cero recurso para avisos de cuenta.
- Representante obligado a ser donante → eliminado.
- Registro duplicado entre `/usuarios` y `/autenticacion/registro` → unificado.
- Archivos con `institucion_id` genérico → sustituido por tablas de asociación explícitas.
- Marca de lectura sin validación de conversación → FK compuesto añadido.

## Fase 07.B.1 — Navegación, servicios preparados y mapa base

| Decisión | Justificación |
|---|---|
| Navbar de una sola fila en escritorio con `Más` desplegable | Inicio, Explorar, Instituciones, Mensajes, Iniciar sesión y Regístrate permanecen visibles. Puntos de acopio, Mis donaciones, Cómo donar, Nosotros y FAQ se agrupan en `Más`, con chevron propio, `aria-expanded`, Escape y cierre por clic fuera. |
| Mantener la barra inferior de cinco destinos y accesos de cuenta en el menú móvil | No se eliminan rutas reales y la sesión/registro siguen visibles sin desplazamientos extra. Las áreas táctiles se elevaron a un mínimo de 4 rem para la barra y 2,75 rem para enlaces y botones del navbar. |
| Reducir el encabezado compartido y eliminar el círculo decorativo de 9 rem | `PageHero` conserva el icono dentro de la etiqueta, usa código de color explícito para el título y disminuye el espacio vertical; corrige el título oscuro sobre azul y evita grandes círculos con iconos diminutos. |
| Instalar Leaflet 1.9.4 y `@types/leaflet` 1.9.23 | Única dependencia cartográfica añadida, con licencias BSD-2-Clause y MIT y 0 vulnerabilidades. Se importa de forma diferida y su CSS se carga globalmente; `allowedCommonJsDependencies` documenta el paquete UMD sin aumentar presupuestos. |
| Usar teselas públicas de OpenStreetMap con centro verificado de Huancayo | Coordenada Q468782 de Wikidata. El marcador es una referencia geográfica, nunca un punto de acopio. Se respeta la política de teselas: URL canónica, atribución visible, Referer válido, sin prefetch ni modo offline. |
| Geollocalización solo manual y local | «Consultar mi ubicación» no se ejecuta automáticamente, no se guarda ni se envía; se manejan denegación, sin señal, error y fallo de teselas. No hay rutas, ETAs ni rastreo. |
| Catálogo y directorio con filtros y estados honestos | Los filtros son reales sobre catálogos sembrados, pero los resultados permanecen en `servicio-no-disponible` mientras `integracionHabilitada` sea `false`. No se afirma que no existan solicitudes ni instituciones. |
| `InstitucionCard` reutilizable sin datos de ejemplo | Acepta un DTO real opcional, muestra foto solo si existe y enlaces a necesidades, puntos y mensajes. El enlace a perfil solo se renderiza si la ruta pública llega a implementarse. |
| Bandeja y conversación preparadas sin chats simulados | La bandeja tiene buscador real sobre cero registros; el panel conserva estado de selección, adjunto y envío deshabilitados con explicación. En móvil la vista cambia solo cuando llega un identificador real desde la API. |
| Corregir los textos de registro sin activar el envío | Un solo aviso por pantalla, mensaje de error claro y explícita advertencia de no usar datos reales. `confirmacion` sigue siendo exclusiva del navegador y no se envía ninguna petición HTTP. |
| Informe de contratos en `docs/informe-backend-fase-07b1.md` | Centraliza endpoints, JSON, DTO, eventos WebSocket, paneles pendientes y estrategia de `DonaConectaDB_Pruebas` sin modificar `docs/contrato-api.md` ni la base desplegada. |

## Fase 07.B.2 — Catálogo informativo, búsqueda local y experiencias

| Decisión | Justificación |
|---|---|
| Catálogo editorial de 41 bienes en `core/data/catalogo-informativo.ts` | Es información de orientación para el donante, no solicitudes ni stock real. Se mantiene separado de los servicios REST y se activará solo cuando el backend entregue datos reales. |
| Búsqueda determinista con normalización, sinónimos y distancia de edición moderada | Responde a los ejemplos pedidos sin depender de IA externa, red ni persistencia. Prioriza coincidencias exactas y ofrece relacionados antes que una lista plana. |
| Un solo `BuscadorCatalogo` compartido entre portada, Explorar y guía por categoría | Evita duplicar validación y lógica; el valor se propaga con `model()` y el envío con `output()`, sin lógica de negocio en la plantilla. |
| Rutas `/explorar`, `/explorar/:categoria`, `/explorar/:categoria/:producto` | Permiten una guía navegable por niveles con breadcrumb real, sin conectarse a rutas de necesidades pendientes del backend. |
| Categorías con enlace directo a su guía en `/explorar/:slug` | Sustituye el antiguo destino genérico `/como-donar#bienes` y elimina las etiquetas redundantes «BIEN MATERIAL» y «Ver guía». |
| `InstitucionCard` y `/instituciones` muestran tipos, no organizaciones | Cumple la regla de no inventar instituciones verificadas. El componente ya acepta un DTO real para cuando exista el directorio. |
| `/historias` editorial y propuesta documental de comentarios, valoraciones y favoritos | La página comunica la preparación de dones con ilustraciones declaradas; las interacciones se dejan como propuesta, sin contadores falsos ni sesión. |
| Reservar espacio inferior del hero para la ola crema | Corrige el borde recortado sin `overflow` adicional ni alturas fijas; `object-fit: cover` y las utilidades Bootstrap mantienen el responsive. |
| Eliminar el marcador de referencia del mapa y añadir `invalidateSize()`/`ResizeObserver` | El punto azul parecía un punto de acopio y contaba como elemento interactivo. El mapa ahora solo muestra teselas OSM, zoom, retorno y geolocalización voluntaria. |
| Importar `leaflet.css` globalmente en la compilación de desarrollo | La ausencia de ese CSS en una compilación anterior causó huecos azules; la verificación CDP confirmó `.leaflet-pane` en `absolute` y 18/18 mosaicos cargados. |
| `loading="eager"` solo en la primera tarjeta y en la imagen principal de Historias | Evita `NG0913` sin marcar como prioritarias todas las fotografías; el resto mantiene `loading="lazy"`. |
| Sin dependencias nuevas, sin HTTP, sin WebSocket y sin localStorage | La fase es frontend-only con `BackendEstadoService.integracionHabilitada = false`; no se activó autenticación, GPS, chat ni persistencia. |
