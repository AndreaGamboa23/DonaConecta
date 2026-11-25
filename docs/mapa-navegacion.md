# Mapa de navegación de DonaConecta

SPA pública con Angular Router. La portada es informativa y no exige registro. Solo se enlazan
en la interfaz las páginas implementadas; el resto se documenta aquí para activarse en su fase.

## 1. Rutas implementadas (Fase 04.2)

| Ruta | Página | Título | Carga | Enlaces desde |
|---|---|---|---|---|
| `/` | Portada | DonaConecta \| Una comunidad, muchas manos, un mismo propósito | Lazy | Navbar, brand, footer, breadcrumbs, 404 |
| `/como-donar` | Guía para donar | Cómo donar \| DonaConecta | Lazy | Navbar, hero, proceso, participación, footer, FAQ, 404, Nosotros |
| `/nosotros` | Nosotros | Nosotros \| DonaConecta | Lazy | Navbar, footer, guía, FAQ |
| `/preguntas-frecuentes` | Preguntas frecuentes | Preguntas frecuentes \| DonaConecta | Lazy | Navbar, footer, guía, Nosotros, 404 |
| `/**` | Página 404 | Página no encontrada \| DonaConecta | Lazy | Cualquier ruta no existente |

Todas comparten `PublicLayout` (skip link, navbar, `<main id="contenido-principal">`, footer).
El navbar usa `RouterLinkActive` con `aria-current="page"`; la ruta raíz exige coincidencia
exacta para no quedar activa en las demás páginas.

## 2. Fragmentos internos

| Fragmento | Página | Uso |
|---|---|---|
| `#donar` | `/` | CTA “Conoce qué puedes donar” de la portada. |
| `#como-funciona` | `/` | CTA “Conocer el proceso” de la portada. |
| `#bienes` | `/como-donar` | CTA “Ver qué puedes donar” de la guía. |
| `#pasos` | `/como-donar` | CTA “Ver el proceso previsto” de la guía. |
| `#contenido-principal` | Todas | Enlace de salto accesible; se conserva como ancla nativa. |

Los fragmentos se recorren con `anchorScrolling: 'enabled'` y `scrollPositionRestoration:
'enabled'`, por lo que el botón de retroceso del navegador recupera la posición anterior.

## 3. Rutas planificadas (no enlazadas todavía)

| Ruta prevista | Contenido | Fase |
|---|---|---|
| `/necesidades` | Catálogo de necesidades reales. | 11 |
| `/necesidades/:id` | Detalle de una necesidad. | 11 |
| `/instituciones` | Directorio de organizaciones verificadas. | 10 |
| `/instituciones/:id` | Detalle de una institución. | 10 |
| `/puntos-de-acopio` | Mapa y directorio de puntos autorizados. | 13 |
| `/iniciar-sesion` | Inicio de sesión seguro. | 09 |
| `/registro` | Selección de tipo de registro público. | 09 |
| `/registro/donante` | Registro de donante. | 09 |
| `/registro/institucion` | Registro de representante con verificación. | 10 |
| `/recuperar-contrasena` | Recuperación con token temporal. | 09 |
| `/privacidad` | Política de privacidad. | 20 |
| `/terminos` | Términos de uso. | 20 |

Rutas privadas futuras (panel de donante, panel institucional y administración) usarán guards
de Angular como ayuda de navegación, pero la autorización definitiva será siempre del backend.

## 4. Reglas de activación progresiva

1. Una ruta solo se muestra como enlace cuando su página existe y compila.
2. No se crean pantallas de espera falsas ni formularios sin envío real para rutas planificadas.
3. Al activar una ruta se añaden título, metadescripción, prueba de navegación y entrada en este mapa.
4. Las secciones de la portada resumen módulos, pero no sustituyen sus páginas independientes.
5. El inicio nunca se abre con login ni con modales obligatorios.
