# Sistema de diseño de DonaConecta

Documento técnico de la Fase 04 (rediseño visual consolidado). Concepto rector:
**Conexiones que transforman**. Concepto de comunidad: **Una comunidad, muchas manos, un mismo
propósito**.

## 1. Entrada única de estilos

`frontend/src/styles.scss` es la única entrada global configurada en `angular.json`. Importa,
en este orden:

1. Fuentes autoalojadas (`@fontsource/*`).
2. `styles/_tokens.scss` (variables de marca + variables Bootstrap).
3. `bootstrap/scss/bootstrap` (una sola vez).
4. `styles/_bootstrap-overrides.scss`.
5. `styles/_global.scss` (variables CSS, foco, anclas y movimiento reducido).
6. `styles/_components.scss` (detalles de identidad no cubiertos por Bootstrap).

No se usa CDN ni se duplica Bootstrap. Los estilos de componente consumen las variables CSS
definidas en `_global.scss` para no depender del orden de importación Sass.

## 2. Paleta institucional

| Uso | Color | Hex |
|---|---|---|
| Azul profundo | textos, navbar oscuro, sección de propósito, footer | `#12304A` |
| Azul conexión | acento principal, botones, enlaces, conectores | `#3679A8` |
| Azul suave | fondos de composiciones y paneles de iconos | `#DCEBF5` |
| Crema cálido | secciones alternas (`bg-light`) | `#F7F5EF` |
| Blanco | fondo principal y texto invertido | `#FFFFFF` |
| Verde esperanza | confirmaciones e iconos de éxito | `#80B69A` |
| Ámbar solidario | foco visible, indicador de sección activa y acentos | `#D5A451` |

El rojo (`#B3261E`) queda reservado a errores. Las variables Bootstrap `$primary`,
`$secondary`, `$success`, `$warning`, `$danger`, `$light` y `$dark` se derivan de esta paleta.

## 3. Tipografías y licencias

- **Manrope** para títulos; **Inter** para cuerpo y componentes.
- Paquetes: `@fontsource/manrope@5.3.0` y `@fontsource/inter@5.3.0`.
- Licencia verificada con `npm view <paquete> license`: **OFL-1.1** en ambos casos.
- Se autoalojan mediante import CSS desde `node_modules`; no se depende de Google Fonts en
  tiempo de ejecución.
- Pesos importados: Inter 400/500/600/700 y Manrope 600/700/800.

## 4. Bootstrap primero (regla 85/15)

La construcción usa clases nativas: `container`, `row`, `col-*`, `d-flex`, `gap-*`, `navbar`,
`btn`, `card`, `badge`, `ratio`, `progress`, `shadow-sm`, `rounded-*`, `bg-*` y utilidades
responsive `col-sm`, `col-md`, `col-lg`, `col-xl`.

El SCSS/CSS propio se limita a:

- Paleta y variables Bootstrap (`_tokens.scss`).
- Microtransiciones de `btn` y `card`, foco y estados de formulario (`_bootstrap-overrides.scss`).
- Variables CSS, `scroll-margin-top` para anclas, `:focus-visible` y `prefers-reduced-motion`
  (`_global.scss`).
- Formas orgánicas (`dc-blob`), conectores (`dc-timeline`), etiquetas de sección
  (`dc-eyebrow`), marcos de imagen (`dc-photo-slot`) y hosts de componentes
  (`_components.scss`).

La proporción 85/15 es una guía de criterio, no una medición de líneas de código. No se
reimplementan componentes ni utilidades de Bootstrap.

> Nota técnica: para espaciar filas verticalmente se usa `gy-5`, no `g-5`. `g-5` modifica el
> gutter horizontal a 3 rem y, dentro de un `.container` con 1.5 rem de padding, genera
> desbordamiento lateral en móvil. `gy-5` conserva el gutter horizontal Bootstrap.

## 5. Identidad visual

- **Símbolo:** un corazón formado por dos manos que se unen, con un punto ámbar central y dos
  nodos verdes. Representa muchas manos, un mismo propósito. No se reutiliza el par de
  círculos unidos por una línea.
- **Favicon:** versión simplificada del símbolo en `frontend/public/favicon.svg`.
- **Iconografía:** componente `Icon` con SVG `stroke` consistente; decoration aria-hidden.
- **Composición:** secciones con fondos alternos (blanco, crema, azul profundo y ámbar suave),
  jerarquía clara y asimetría controlada. Los tokens globales garantizan coherencia entre
  landing, formularios, tablas y dashboards futuros.

## 6. Componentes reutilizables

| Componente | Ubicación | Responsabilidad |
|---|---|---|
| `Brand` | `shared/components/brand` | Logotipo tipográfico + símbolo SVG propio; variante invertida. |
| `Icon` | `shared/components/icon` | Iconografía SVG parametrizada por nombre. |
| `Navbar` | `shared/components/navbar` | Navegación sticky por rutas, menú móvil con `signal`, enlace activo con `RouterLinkActive` y CTA. |
| `Footer` | `shared/components/footer` | Pie responsive con marca, exploración, categorías y contexto académico. |
| `PublicLayout` | `layouts/public-layout` | Skip link, navbar, `<main>` y footer. |
| `Landing` | `features/landing` | Orquesta las siete secciones públicas. |
| `QuickAccess` | `features/landing/sections/quick-access` | Panel de accesos reales a categorías, guía, proyecto y ayuda; pensado como entrada a una futura app de servicios. |
| Secciones | `features/landing/sections/*` | Hero, accesos rápidos, franja de confianza, categorías, proceso, propósito y participación. |

## 7. Composición de la portada

- **Hero (`#inicio`):** composición fotográfica a ancho completo con
  `nosotros-comunidad-opt.webp`, capa degradada azul profundo, título blanco/crema legible sobre la
  imagen, CTAs a rutas reales y recordatorio de que DonaConecta gestiona solo bienes materiales.
- **Accesos rápidos:** panel blanco con borde ámbar sobre la transición del hero; cuatro destinos
  reales (categorías, guía, proyecto y ayuda) en grid Bootstrap, con iconografía propia y targets
  táctiles amplios. No incluye buscador ni selector de ubicación simulados.
- **Franja de valores:** rail ámbar conectado con el hero, cuatro valores en grid Bootstrap y
  tipografía de secuencia; ya no usa separadores genéricos.
- **Categorías (`#donar`):** introducción editorial con `como-donar-opt.webp` como recurso de
  contexto y mosaico `7/5` + `4/4/4` con bloques de color, índice numérico y jerarquía propia. Cada
  tarjeta es un enlace real a `#bienes` de la guía. No recorta la ilustración en cinco falsas
  fotografías.
- **Cómo funciona (`#como-funciona`):** cuatro etapas en tarjetas conectadas, numeración grande,
  iconos y línea de tiempo implícita, sin texto de fases ni explicaciones de construcción.
- **Nosotros (`#nosotros`):** bloque institucional sobre azul profundo con manifiesto tipográfico
  y compromisos; sin testimonios ni organizaciones inventadas.
- **Participación (`#participa`):** cierre fotográfico a ancho completo con
  `juntos-transformamos-opt.webp`, mensaje “El cambio comienza cuando decidimos ayudar juntos.”
  y CTA funcional a `/como-donar`.
- **Footer:** enlaces internos, categorías y contexto Huancayo/Universidad Continental; sin
  contactos, alianzas ni certificaciones inventadas.

En la Fase 04 los enlaces apuntaban a secciones existentes; desde la Fase 04.2 los CTA principales
llevan a rutas reales (`/como-donar`) y los secundarios usan fragmentos de la portada.

## 8. Recursos visuales: política y estado actual

En Fase 04/04.2 no se incorporaron fotografías externas: las herramientas disponibles no
permitían inspeccionarlas visualmente y se dejaron ranuras explícitas. En Fase 04.3 el usuario
proporcionó cuatro imágenes generadas con IA para el proyecto, por lo que se integran como
**ilustraciones**, nunca como evidencia de actividades reales.

Regla permanente: solo incorporar imágenes con licencia verificable o proporcionadas por el
usuario, guardarlas en `frontend/public/assets/images/` y documentar autor, fuente y licencia en
este archivo. La aclaración de procedencia se concentra en `/nosotros#creditos-visuales` y se
enlaza desde el pie de página; **nunca** se presenta una ilustración como evidencia de donaciones,
personas identificables, organizaciones verificadas ni estadísticas.

| Archivo usado | Procedencia | Sección |
|---|---|---|
| `hero-comunidad-opt.webp` / `-movil.webp` | IA, proporcionada por el usuario | Hero de `/como-donar` |
| `como-donar-opt.webp` / `-movil.webp` | IA, proporcionada por el usuario | Introducción de categorías de la portada |
| `nosotros-comunidad-opt.webp` / `-movil.webp` | IA, proporcionada por el usuario | Hero principal de la portada |
| `juntos-transformamos-opt.webp` / `-movil.webp` | IA, proporcionada por el usuario | Participación final de la portada |

Los originales `*.webp` se conservan con su chunk C2PA. Los derivados `*-opt.webp` y
`*-movil.webp` se generaron con el codificador WebP nativo de Edge, sin nuevas dependencias, y
contienen codificación VP8 con pérdida, perfil ICCP y sin C2PA. Detalle completo de dimensiones,
pesos, diferencia media por canal y uso de `srcset` en `frontend/public/assets/images/README.md`.

La valoración estética final de estas composiciones requiere revisión humana: el modelo declara
que no puede inspeccionar visualmente las imágenes ni las capturas generadas.

## 9. Accesibilidad y responsive

- HTML semántico (`nav`, `main`, `section`, `article`, `figure`, `footer`) y un solo `h1`.
- `aria-label` en navegación y botón de menú; `aria-expanded`/`aria-controls` dinámicos;
  `aria-current="page"` en la ruta activa mediante `RouterLinkActive`.
- Enlace `visually-hidden-focusable` para saltar al contenido.
- Contraste verificado en navegador: secundario sobre blanco 4.69:1, ámbar sobre azul
  profundo 5.98:1, blanco al 50% sobre azul profundo 4.59:1, blanco puro 13.57:1.
- Contraste muestreado bajo el título del hero: 12.03:1 medio, 9.06:1 P90 y 3.87:1 en el peor
  0.1% a 1440 px; 9.70:1 / 6.20:1 / 4.57:1 a 390 px. El título es negrita de 66.24 px y
  37.05 px, por lo que cumple AA para texto grande (≥3:1); el destacado es crema `#F4E6CD`.
- `:focus-visible` con contorno ámbar de 3 px y `prefers-reduced-motion` respetado.
- Sin desbordamiento horizontal en 360, 390, 576, 768, 1024, 1440 y 1920 px.

## 10. Evidencia de verificación

- Fase 04: `npm run build` completado con bundle inicial 488.40 kB (91.06 kB comprimido).
- Fase 04.2: `npm run build` completado con bundle inicial **491.94 kB (91.84 kB comprimido)**,
  cinco chunks diferidos (landing, como-donar, nosotros, preguntas-frecuentes y not-found) y sin
  advertencia de presupuesto. Persisten solo las advertencias de deprecación de Sass `@import`.
- Fase 04.4: `npm run build` completado con bundle inicial **494.03 kB (92.51 kB comprimido)** y
  seis chunks diferidos; `npm test -- --watch=false`: 3 archivos y 5 pruebas aprobadas.
- Verificación Fase 04 con Edge headless + CDP: 5 secciones presentes, 0 enlaces internos rotos,
  0 imágenes rotas, 0 controles sin nombre accesible, 0 errores de consola, menú móvil
  `false → true → false`, ancla `#donar` activa, scroll real y color primario Bootstrap
  `rgb(54, 121, 168)`.
- Verificación Fase 04.2 con Edge 158 headless + CDP: las cinco rutas (`/`, `/como-donar`,
  `/nosotros`, `/preguntas-frecuentes` y una 404) cargan con título y metadescripción propios,
  un solo `h1`, enlace activo correcto, 0 px de desbordamiento, 0 errores de consola, 0 enlaces
  a rutas planificadas y menú móvil `false → true → false` sin desbordamiento. El fragmento
  `#donar` desplaza a `scrollY=899`, `#bienes` a `scrollY=1038` y el retroceso vuelve a `0`.
- Verificación Fase 04.4 con Edge headless + CDP: cinco rutas con título y metadescripción propios,
  un solo `h1` por ruta, 35 combinaciones (7 anchos × 5 rutas) sin desbordamiento horizontal ni
  imágenes rotas, 0 errores de consola y 0 fallos de red, menú móvil `false → true → false`,
  enlaces de menú de 44–52 px, FAQ de `<details>` abierta y fragmentos `#donar`, `#como-funciona`,
  `#bienes` y `#creditos-visuales` con desplazamiento real. No hay buscadores, selects, enlaces
  vacíos ni rutas planificadas en el DOM.
- Capturas generadas fuera del repositorio en
  `C:\Users\ANDREA\AppData\Local\Temp\opencode\capturas\` (Fase 04),
  `capturas-fase-04.2\` y `capturas-fase-04.3\` (fases anteriores) y
  `capturas-fase-04.4\` (Fase 04.4). Informe JSON: `verificacion-fase-04.4.json` en la misma
  carpeta temporal.
- **Limitación declarada:** el modelo no puede visualizar imágenes ni capturas. Se ejecutaron
  comprobaciones objetivas de DOM y layout, pero la valoración estética final requiere que el
  usuario revise las capturas o proporcione fotografías autorizadas.

## 11. Estado real

No se agregan estadísticas, testimonios, organizaciones verificadas, necesidades activas,
donaciones simuladas ni autenticación. El backend y SQL Server siguen sin implementarse en esta
fase; las páginas públicas son informativas y sus acciones navegan a rutas o fragmentos reales.

## 12. Extensión visual a la SPA (Fase 04.2)

Las nuevas páginas reutilizan los mismos tokens y componentes, sin hojas de estilo extensas:

- **`/como-donar`:** hero editorial con tarjeta de identidad, bloque de límites claros,
  mosaico de cinco categorías, lista de recomendaciones, sección oscura con los nueve pasos del
  recorrido y lista de estados de entrega. Cierra con un panel CTA compartido.
- **`/nosotros`:** propósito académico, tres principios con iconos propios, compromisos sobre
  fondo azul profundo, transparencia y créditos visuales centralizados.
- **`/preguntas-frecuentes`:** dos columnas con elementos `<details>` nativos en lugar de un
  componente propio y CTA final. Se evita JavaScript adicional y se mantiene navegación por teclado.
- **404:** composición partida con fondo azul profundo y tres salidas reales.

La navegación usa `RouterLink` y `RouterLinkActive`; el estado activo comunica la ruta con
`aria-current="page"`. La coherencia visual se conserva con `dc-eyebrow`, `dc-tile-icon`,
`dc-step-number`, `dc-cta-panel` y las utilidades Bootstrap, sin reimplementar componentes.

## 13. Rediseño fotográfico editorial (Fase 04.3)

La portada se reconstruye como una secuencia narrativa: hero inmersivo → rail de valores →
introducción de categorías con documento fotográfico → mosaico editorial → proceso conectado →
propósito institucional → cierre fotográfico. Las cuatro ilustraciones se usan una sola vez como
recurso de composición, sin recortes que sugieran categorías reales. Desde la Fase 04.4 la
aclaración de procedencia no se repite sobre cada imagen.

- El hero conserva literalmente “Juntos podemos hacer que la solidaridad llegue más lejos.” y
  “Porque cuando una comunidad se une, cada pequeño aporte puede transformar una vida.” Sus CTAs
  llevan a `/como-donar` y `/nosotros`.
- La franja posterior incluye solidaridad comunitaria, donaciones materiales, coordinación
  organizada y transparencia, sin cifras ni logros inventados.
- `/como-donar` mantiene las cinco categorías, recomendaciones, nueve pasos y estados de entrega,
  con numeración, iconos y conectores.
- `/nosotros` mantiene el carácter académico y los compromisos; en Fase 04.4 sustituye la entrada
  fotográfica por un bloque abstracto con la paleta institucional.
- FAQ y 404 conservan `<details>` y salidas reales; comparten el mismo vocabulario visual.
- Navbar y footer refuerzan la identidad con una línea de gradiente institucional y un borde ámbar,
  sin modificar rutas, `aria-current` ni el menú móvil.

El SCSS propio se limita a degradados sobre imagen, transiciones orgánicas, conectores, números
editoriales, marcos de crédito y estados de foco. Grid, tipografía, espaciado, botones, tarjetas,
tablas, badges y responsive continúan resueltos con Bootstrap 5.

## 14. Portada como acceso a servicios (Fase 04.4)

La secuencia de portada pasa a: hero legible → panel de accesos → valores → categorías enlazadas →
proceso → propósito → participación. El hero usa `nosotros-comunidad-opt.webp` y reduce su altura
para que el título quede sobre la zona degradada; las clases de componente fijan el título en
blanco y el destacado en crema sin `!important`. `hero-comunidad-opt.webp` se reasigna al hero de
`/como-donar`, donde ilustra bienes materiales.

El panel `QuickAccess` muestra cuatro acciones reales en grid Bootstrap: explorar categorías
(`/#donar`), guía (`/como-donar`), proyecto (`/nosotros`) y ayuda (`/preguntas-frecuentes`). Cada
categoría del mosaico abre `/como-donar#bienes`. No hay buscadores, selectores de ubicación ni
botones decorativos. El navbar prioriza “Ver categorías” como CTA y el footer enlaza los créditos
visuales centralizados en `/nosotros#creditos-visuales`.

La futura navegación de aplicación y la barra inferior autenticada quedan descritas en `AGENTS.md`;
no se implementan pestañas inactivas ni funciones privadas sin autenticación y backend reales.
