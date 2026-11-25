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

## Advertencias de npm

`npm install` bloqueó scripts de instalación de `@parcel/watcher`, `esbuild`, `lmdb` y
`msgpackr-extract` por la política `allowScripts` de npm. **No se desactivaron las
protecciones.** La compilación y las pruebas se ejecutaron correctamente con los paquetes
precompilados disponibles.
