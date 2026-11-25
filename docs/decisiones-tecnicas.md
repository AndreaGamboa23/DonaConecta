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

### Decisiones pendientes o condicionadas

1. **Cifrado nativo de SQL Server Express:** verificar en Fase 06 si TDE/Always Encrypted están
   disponibles antes de seleccionarlos. La estrategia de aplicación es la afirmable hoy.
2. **`sp_getapplock`:** solo si las pruebas de concurrencia reales muestran interbloqueos con
   `UPDLOCK/HOLDLOCK`.
3. **Cifrado de coordenadas GPS:** diseño previsto con AES-256-GCM; si se decide diferir, la
   alternativa es `DECIMAL(9,6)` con control de acceso estricto. Requiere aprobación antes de
   implementar.
4. **Correcciones documentales coordinadas:** `backend/README.md` (estructura anterior),
   `README.md` (afirmación desactualizada sobre fotografías) y RF-12 en requisitos funcionales.
   No se modificaron en esta fase por no pertenecer al alcance del modelo.

### Contradicciones detectadas y resueltas en el modelo

- Contaje de tablas 41 vs. 40 → corregido a 42 con inventario explícito.
- Disponibilidad con doble descuento → fórmula corregida.
- Notificación “exactamente un recurso” → permitido cero recurso para avisos de cuenta.
- Representante obligado a ser donante → eliminado.
- Registro duplicado entre `/usuarios` y `/autenticacion/registro` → unificado.
- Archivos con `institucion_id` genérico → sustituido por tablas de asociación explícitas.
- Marca de lectura sin validación de conversación → FK compuesto añadido.
