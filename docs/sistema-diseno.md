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
| `Landing` | `features/landing` | Orquesta las seis secciones públicas. |
| Secciones | `features/landing/sections/*` | Hero, franja de confianza, categorías, proceso, propósito y participación. |

## 7. Composición de la portada

- **Hero (`#inicio`):** titular editorial, copy de impacto, dos CTA funcionales y composición
  SVG original con leyenda explícita. Preparada para recibir una fotografía autorizada.
- **Franja de confianza:** cuatro valores con iconos en fondo azul profundo; separadores
  Bootstrap `border-lg-start`.
- **Categorías (`#donar`):** mosaico `7/5` y `4/4/4` en pantallas grandes, con paneles de
  icono en las dos tarjetas principales. Aclara que son ejemplos informativos, no solicitudes
  reales.
- **Cómo funciona (`#como-funciona`):** línea de tiempo narrativa de cuatro pasos con
  `dc-timeline` y numeración propia.
- **Nosotros (`#nosotros`):** sección emocional sobre propósito social, lista de compromisos y
  composición institucional sin testimonios ni organizaciones inventadas.
- **Participación (`#participa`):** panel ámbar con CTA a secciones existentes y forma orgánica
  de fondo.
- **Footer:** enlaces internos, categorías y contexto Huancayo/Universidad Continental; sin
  contactos, alianzas ni certificaciones inventadas.

En la Fase 04 los enlaces apuntaban a secciones existentes; desde la Fase 04.2 los CTA principales
llevan a rutas reales (`/como-donar`) y los secundarios usan fragmentos de la portada.

## 8. Fotografía: política y estado actual

No se incorporaron fotografías externas. Se consultaron fuentes con licencia verificable, pero
las herramientas disponibles no permiten **inspeccionar visualmente** los archivos; integrar una
foto sin revisarla podría presentar un contexto inadecuado o explotar vulnerabilidad. Por eso
la interfaz usa composiciones SVG originales y deja ranuras explícitas.

Regla permanente: solo incorporar fotografías con licencia verificable o proporcionadas por el
usuario, guardarlas en `frontend/public/assets/images/` y documentar autor, fuente y licencia en
este archivo. Toda foto es ilustrativa y lleva aclaración visible; **nunca** se presenta como
evidencia de actividades reales de DonaConecta.

Imágenes solicitadas (detalle e integración en `frontend/public/assets/images/README.md`):

| Archivo | Tema | Orientación | Mínimo | Sección |
|---|---|---|---|---|
| `hero-comunidad.webp` | Comunidad organizando cajas de alimentos o frazadas | 4:3 | 1600 × 1200 | Hero |
| `categoria-alimentos.webp` | Alimentos no perecibles | 16:9 | 1200 × 675 | Categorías |
| `categoria-abrigo.webp` | Ropa de abrigo y frazadas | 16:9 | 1200 × 675 | Categorías |
| `categoria-higiene.webp` | Higiene y limpieza | 16:9 | 1200 × 675 | Categorías |
| `categoria-animales.webp` | Alimento y cuidados para animales | 16:9 | 1200 × 675 | Categorías |
| `categoria-escolares.webp` | Útiles escolares | 16:9 | 1200 × 675 | Categorías |
| `proposito-huancayo.webp` | Contexto andino de Huancayo, sin explotar vulnerabilidad | 4:3 | 1600 × 1200 | Nosotros |

Las rutas se asignan en `photoSrc` de `HeroSection`/`PurposeSection` y en el campo `image` de
cada categoría. Mientras estén vacías no se solicitan archivos rotos.

## 9. Accesibilidad y responsive

- HTML semántico (`nav`, `main`, `section`, `article`, `figure`, `footer`) y un solo `h1`.
- `aria-label` en navegación y botón de menú; `aria-expanded`/`aria-controls` dinámicos;
  `aria-current="page"` en la ruta activa mediante `RouterLinkActive`.
- Enlace `visually-hidden-focusable` para saltar al contenido.
- Contraste verificado en navegador: secundario sobre blanco 4.69:1, ámbar sobre azul
  profundo 5.98:1, blanco al 50% sobre azul profundo 4.59:1, blanco puro 13.57:1.
- `:focus-visible` con contorno ámbar de 3 px y `prefers-reduced-motion` respetado.
- Sin desbordamiento horizontal en 360, 390, 576, 768, 1024, 1440 y 1920 px.

## 10. Evidencia de verificación

- Fase 04: `npm run build` completado con bundle inicial 488.40 kB (91.06 kB comprimido).
- Fase 04.2: `npm run build` completado con bundle inicial **491.94 kB (91.84 kB comprimido)**,
  cinco chunks diferidos (landing, como-donar, nosotros, preguntas-frecuentes y not-found) y sin
  advertencia de presupuesto. Persisten solo las advertencias de deprecación de Sass `@import`.
- `npm test -- --watch=false`: 3 archivos y 5 pruebas aprobadas.
- Verificación Fase 04 con Edge headless + CDP: 5 secciones presentes, 0 enlaces internos rotos,
  0 imágenes rotas, 0 controles sin nombre accesible, 0 errores de consola, menú móvil
  `false → true → false`, ancla `#donar` activa, scroll real y color primario Bootstrap
  `rgb(54, 121, 168)`.
- Verificación Fase 04.2 con Edge 158 headless + CDP: las cinco rutas (`/`, `/como-donar`,
  `/nosotros`, `/preguntas-frecuentes` y una 404) cargan con título y metadescripción propios,
  un solo `h1`, enlace activo correcto, 0 px de desbordamiento, 0 errores de consola, 0 enlaces
  a rutas planificadas y menú móvil `false → true → false` sin desbordamiento. El fragmento
  `#donar` desplaza a `scrollY=899`, `#bienes` a `scrollY=1038` y el retroceso vuelve a `0`.
- Capturas generadas fuera del repositorio en
  `C:\Users\ANDREA\AppData\Local\Temp\opencode\capturas\` (Fase 04) y
  `C:\Users\ANDREA\AppData\Local\Temp\opencode\capturas-fase-04.2\` (Fase 04.2). Informes JSON:
  `verificacion-navegador.json`, `verificacion-fase-04.2.json` y
  `verificacion-scroll-fase-04.2.json` en la misma carpeta temporal.
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
  mosaico de cinco categorías, lista de recomendaciones, sección oscura con los nueve pasos
  previstos (diferenciando “Orientación disponible” de “Planificado”) y lista de estados de
  seguimiento. Cierra con un panel CTA compartido.
- **`/nosotros`:** propósito académico, tres principios con iconos propios, compromisos sobre
  fondo azul profundo y un bloque de transparencia que distingue lo implementado de lo futuro.
- **`/preguntas-frecuentes`:** dos columnas con elementos `<details>` nativos en lugar de un
  componente propio, tabla responsive de estado de módulos y CTA final. Se evita JavaScript
  adicional y se mantiene navegación por teclado.
- **404:** composición partida con fondo azul profundo y tres salidas reales.

La navegación usa `RouterLink` y `RouterLinkActive`; el estado activo comunica la ruta con
`aria-current="page"`. La coherencia visual se conserva con `dc-eyebrow`, `dc-tile-icon`,
`dc-step-number`, `dc-cta-panel` y las utilidades Bootstrap, sin reimplementar componentes.
