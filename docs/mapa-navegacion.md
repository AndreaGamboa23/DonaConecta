# Mapa de navegación de DonaConecta

SPA pública con Angular Router. La portada es la entrada a servicios y no exige registro.
Solo se enlazan las páginas cuya ruta existe y compila; las operaciones sin backend muestran su
estado real, sin datos ni acciones de ejemplo.

## 1. Rutas implementadas (Fase 07.A)

| Ruta | Página | Título | Carga | Enlaces desde |
|---|---|---|---|---|
| `/` | Portada de servicios | DonaConecta \| Una comunidad, muchas manos, un mismo propósito | Lazy | Navbar, marca, footer, barra móvil, 404 |
| `/necesidades` | Catálogo preparado | Explorar necesidades \| DonaConecta | Lazy | Navbar, hero, barra móvil, footer, alerta de búsqueda |
| `/instituciones` | Directorio preparado | Instituciones \| DonaConecta | Lazy | Navbar, accesos rápidos, footer |
| `/puntos-de-acopio` | Puntos de acopio preparados | Puntos de acopio \| DonaConecta | Lazy | Accesos rápidos, menú «Más», footer |
| `/registro` | Elección de registro | Crea tu cuenta \| DonaConecta | Lazy | Navbar, hero, accesos rápidos, login, FAQ |
| `/registro/donante` | Formulario de donante | Registro de donante \| DonaConecta | Lazy | `/registro`, login, footer |
| `/registro/institucion` | Registro institucional por pasos | Registro de institución \| DonaConecta | Lazy | `/registro`, portada, login, footer |
| `/iniciar-sesion` | Acceso y recuperación | Iniciar sesión \| DonaConecta | Lazy | Navbar, hero, `/registro`, barra de servicios |
| `/mensajes` | Bandeja y panel preparados | Mensajes \| DonaConecta | Lazy | Navbar, accesos rápidos, barra móvil, footer |
| `/mis-donaciones` | Actividad preparada | Mis donaciones \| DonaConecta | Lazy | Accesos rápidos, barra móvil, footer |
| `/seguimiento/:id` | Seguimiento manual autorizado | Seguimiento de entrega \| DonaConecta | Lazy | Solo con un identificador real de compromiso/entrega |
| `/perfil` | Perfil preparado | Mi perfil \| DonaConecta | Lazy | Accesos rápidos, barra móvil, footer |
| `/como-donar` | Guía para donar | Cómo donar \| DonaConecta | Lazy | Navbar, hero, portada, pie, FAQ, 404 |
| `/nosotros` | Nosotros | Nosotros \| DonaConecta | Lazy | Menú «Más», hero, portada, footer, FAQ |
| `/preguntas-frecuentes` | Preguntas frecuentes | Preguntas frecuentes \| DonaConecta | Lazy | Menú «Más», footer, guía, Nosotros, 404 |
| `/**` | Página 404 | Página no encontrada \| DonaConecta | Lazy | Cualquier ruta no existente |

Todas comparten `PublicLayout` (skip link, navbar, `<main id="contenido-principal">`, footer de
escritorio y barra inferior móvil). Cada ruta define título y metadescripción propios;
`DonaTitleStrategy` aplica ambos. `loadComponent` mantiene el bundle inicial por debajo del
presupuesto de 500 kB.

## 2. Navegación principal y móvil

- **Navbar de escritorio:** Inicio, Explorar, Instituciones, Cómo donar y Mensajes.
- **Menú «Más»:** Nosotros, Preguntas frecuentes y Puntos de acopio mediante `<details>` nativo.
- **Acciones de cuenta:** Iniciar sesión y Regístrate. No representan una sesión autenticada.
- **Barra inferior móvil:** Inicio, Explorar, Donaciones, Mensajes y Perfil. Usa
  `env(safe-area-inset-bottom)` y `RouterLinkActive` con `aria-current="page"`. No muestra
  contadores ni insignias falsas.

`RouterLinkActive` usa coincidencia exacta solo en `/` para que «Inicio» no quede activo en las
demás páginas. El footer de escritorio concentra los enlaces públicos, los accesos de cuenta y
el enlace discreto a `/nosotros#creditos-visuales`.

## 3. Fragmentos internos

| Fragmento | Página | Uso |
|---|---|---|
| `#inicio` | `/` | Hero principal y acceso desde el brand. |
| `#donar` | `/` | Categorías informativas de la portada. |
| `#buscar-categorias` | `/` | Buscador local de cinco categorías verificadas. |
| `#solicitudes` | `/` | Estado real del catálogo de necesidades. |
| `#como-funciona` | `/` | Proceso resumido de la portada. |
| `#nosotros` | `/` | Resumen del proyecto en la portada. |
| `#participa` | `/` | Cierre de participación de la portada. |
| `#bienes` | `/como-donar` | Destino de las categorías y del buscador local. |
| `#que-es`, `#estado`, `#pasos`, `#seguimiento` | `/como-donar` | Secciones de la guía. |
| `#creditos-visuales` | `/nosotros` | Créditos centralizados de las ilustraciones. |
| `#contenido-principal` | Todas | Enlace de salto accesible; se conserva como ancla nativa. |

Los fragmentos funcionan con `anchorScrolling: 'enabled'` y
`scrollPositionRestoration: 'enabled'`; el botón de retroceso recupera la posición previa.

## 4. Estado real de los servicios

`BackendEstadoService.integracionHabilitada` es `false`. Los servicios de registro, acceso,
exploración, donaciones, mensajería, seguimiento y perfil devuelven `ServicioPendienteError` en vez
de llamar a una API inexistente. El aviso visible comunica «sin conexión» sin exponer rutas
técnicas; los endpoints previstos quedan documentados en `docs/contrato-api.md`.

- Los formularios validan localmente con Reactive Forms; no envían ni guardan datos.
- `password_confirmation` existe solo en el navegador; el indicador de fuerza es orientativo.
- El registro público nunca crea administradores. La solicitud institucional quedaría pendiente
  de verificación cuando exista el servicio real.
- No se solicitan documentos privados ni se usan `localStorage`/`sessionStorage` como base de datos.
- No hay sesión, token, conversación, mensaje, donación, ubicación ni estadística simulada.

## 5. Rutas planificadas (no enlazadas todavía)

| Ruta prevista | Contenido | Fase |
|---|---|---|
| `/necesidades/:id` | Detalle de una necesidad real. | 11 |
| `/instituciones/:id` | Detalle de una institución verificada. | 10 |
| `/recuperar-contrasena` | Restablecimiento con token temporal. | 09 |
| `/privacidad` | Política de privacidad. | 20 |
| `/terminos` | Términos de uso. | 20 |
| Panel donante, panel institucional y administración | Rutas privadas con guards y autorización en backend. | 09–17 |

`/seguimiento/:id` ya tiene pantalla, pero no se enlaza desde la interfaz mientras no exista un
identificador real de compromiso o entrega.

## 6. Reglas de activación progresiva

1. Una ruta solo se muestra como enlace cuando su página existe, compila y no sugiere datos falsos.
2. No se crean pantallas de espera falsas; el estado pendiente se declara explícitamente.
3. Al activar una ruta se añaden título, metadescripción, prueba de navegación y entrada en este mapa.
4. Las secciones de la portada resumen módulos, pero no sustituyen sus páginas independientes.
5. El inicio nunca se abre con login ni con modales obligatorios.
6. La autorización definitiva será siempre del backend; los guards de Angular solo ayudan a la navegación.
