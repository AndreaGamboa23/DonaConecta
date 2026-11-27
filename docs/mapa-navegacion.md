# Mapa de navegación de DonaConecta

SPA pública con Angular Router. La portada es la entrada a servicios y no exige registro.
Solo se enlazan las páginas cuya ruta existe y compila; las operaciones sin backend muestran su
estado real, sin datos ni acciones de ejemplo. La sección 10 registra las rutas y servicios
activados en el cierre funcional de la entrega; las secciones 1–9 conservan el estado histórico
de las fases 07.A–07.B.2.

## 1. Rutas implementadas (Fases 07.A y 07.B)

| Ruta | Página | Título | Carga | Enlaces desde |
|---|---|---|---|---|
| `/` | Portada de servicios | DonaConecta \| Una comunidad, muchas manos, un mismo propósito | Lazy | Navbar, marca, footer, barra móvil, 404 |
| `/explorar` | Guía inteligente de bienes | Explorar qué donar \| DonaConecta | Lazy | Navbar, buscador de portada, categorías, footer, barra móvil |
| `/explorar/:categoria` | Guía por categoría | Guía de alimentos, ropa, higiene, animales o útiles escolares \| DonaConecta | Lazy | Categorías compartidas, resultados de búsqueda |
| `/explorar/:categoria/:producto` | Detalle informativo del bien | Guía de donación: producto \| DonaConecta | Lazy | Resultados, relacionados, guía por categoría |
| `/necesidades` | Catálogo preparado | Explorar necesidades \| DonaConecta | Lazy | Navbar, hero, barra móvil, footer, alerta de búsqueda |
| `/instituciones` | Directorio por tipos | Instituciones \| DonaConecta | Lazy | Navbar, accesos rápidos, footer |
| `/puntos-de-acopio` | Puntos de acopio preparados | Puntos de acopio \| DonaConecta | Lazy | Navbar, accesos rápidos, footer |
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
| `/historias` | Historias que conectan | Historias que conectan \| DonaConecta | Lazy | Menú «Más», Explorar, footer |
| `/**` | Página 404 | Página no encontrada \| DonaConecta | Lazy | Cualquier ruta no existente |

Todas comparten `PublicLayout` (skip link, navbar, `<main id="contenido-principal">`, footer de
escritorio y barra inferior móvil). Cada ruta define título y metadescripción propios;
`DonaTitleStrategy` aplica ambos. `loadComponent` mantiene el bundle inicial por debajo del
presupuesto de 600 kB ajustado en Fase 07.A.

## 2. Navegación principal y móvil

- **Navbar de escritorio:** marca con acceso al inicio; grupo principal Inicio, Explorar,
  Instituciones, Mensajes y `Más`; acciones Iniciar sesión (secundaria) y Regístrate (principal).
- **Menú «Más»:** Puntos de acopio, Mis donaciones, Cómo donar, Historias que conectan,
  Nosotros y Preguntas frecuentes. Se cierra con Escape, clic fuera y selección; las acciones de
  cuenta no representan una sesión autenticada.
- **Barra inferior móvil:** Inicio, Explorar, Donaciones, Mensajes y Perfil. Usa icono y etiqueta
  visibles, indicador de selección, `env(safe-area-inset-bottom)` y `RouterLinkActive` con
  `aria-current="page"`. No muestra contadores ni insignias falsas; un visitante puede explorar
  sin registrarse.

`RouterLinkActive` usa coincidencia exacta solo en `/` para que «Inicio» no quede activo en las
demás páginas. El footer de escritorio concentra los enlaces públicos, los accesos de cuenta y
el enlace discreto a `/nosotros#creditos-visuales`.

## 3. Fragmentos internos

| Fragmento | Página | Uso |
|---|---|---|
| `#inicio` | `/` | Hero principal y acceso desde el brand. |
| `#donar` | `/` | Categorías informativas de la portada. |
| `#buscar-categorias` | `/` | Buscador principal del catálogo informativo de 41 bienes. |
| `#solicitudes` | `/` | Estado real del catálogo de necesidades. |
| `#como-funciona` | `/` | Proceso resumido de la portada. |
| `#nosotros` | `/` | Resumen del proyecto en la portada. |
| `#participa` | `/` | Cierre de participación de la portada. |
| `#bienes` | `/como-donar` | Guía de bienes materiales; las tarjetas enlazan a su categoría en `/explorar`. |
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

## 7. Sistema de categorías compartido (Fase 07.B)

`CATEGORIAS_INFORMATIVAS` es la única fuente de las cinco categorías. El componente
`CategoriasDestacadas` las representa con `CategoriaDonacion`: fotografía protagonista, nombre,
descripción breve y enlace real a `/explorar/:slug` (por ejemplo, `/explorar/alimentos`). Se usa
en tres páginas sin duplicar datos:

| Página | Función |
|---|---|
| `/` | Sección `#donar` de la portada, junto al buscador principal. |
| `/necesidades` | Sección «Explora por categoría» bajo el estado real del catálogo. |
| `/como-donar` | Bloque `#bienes` de la guía de bienes materiales. |

En escritorio las cinco tarjetas se organizan en una fila cuando el ancho lo permite
(`row-cols-xl-5`); en móvil pasan a una cuadrícula accesible. Las imágenes están en
`/assets/images/categoria-*.webp`, reservan `aspect-ratio: 1 / 1` y usan `object-fit: cover`.
Los enlaces de registro, acceso, mensajes y donaciones siguen llevando a rutas existentes; no se
añadieron pestañas inactivas ni acciones simuladas.

## 8. Navegación corregida y estados de servicio (Fase 07.B.1)

- **Navbar de escritorio:** una sola fila con Inicio, Explorar, Instituciones, Mensajes, el
  desplegable `Más`, Iniciar sesión y Regístrate. `Más` reúne Puntos de acopio, Mis donaciones,
  Cómo donar, Nosotros y Preguntas frecuentes. El botón usa `aria-expanded`, cierra con Escape,
  clic fuera y selección de opción; el indicador de ruta activa se mantiene con `RouterLinkActive`.
- **Móvil:** el menú desplegable muestra acceso a sesión y registro; la barra inferior conserva
  Inicio, Explorar, Donaciones, Mensajes y Perfil con `aria-current` real.
- **Explorar e Instituciones:** los filtros actúan sobre catálogos sembrados y el panel de
  resultados permanece en `servicio-no-disponible` mientras no haya API autorizada. No se afirma
  que no existan registros.
- **Mensajes:** en escritorio bandeja y conversación son simultáneas; en móvil la conversación
  sustituye a la bandeja solo al recibir un `conversacionId` real y ofrece volver. No hay chats
  de ejemplo ni envío habilitado.
- **Mapa y seguimiento:** `/puntos-de-acopio` muestra el mapa base de Huancayo; `/seguimiento/:id`
  reutiliza el componente con estado de sesión sin ubicación inventada. Ninguna ruta nueva se
  enlaza antes de estar implementada; el acceso a perfiles de institución queda preparado en
  `InstitucionCard` y se activará solo con ruta pública real.

## 9. Catálogo, búsqueda y historias (Fase 07.B.2)

- **Acceso público:** cualquier visitante puede usar `/explorar`, sus cinco guías por categoría
  y las fichas de producto sin registrarse. No hay puerta de autenticación ni modal obligatorio.
- **Búsqueda única:** el buscador de la portada y el de `/explorar` comparten
  `CatalogoInformativoService`. Los sinónimos se resuelven localmente: «cobijas» → Frazadas,
  «mochilas» → Mochilas, «chompas» → Chompas, «shampoo» → Champú, «croquetas» → comida de perros.
  Se muestran coincidencias exactas primero, relacionados y un estado honesto sin resultados.
- **Detalle:** cada ficha permite volver al listado, abrir productos relacionados, consultar
  condiciones recomendadas, preparación, no recomendados y alternativas. Es orientación editorial,
  nunca una solicitud pendiente ni una donación simulada.
- **Instituciones y tipos:** las cuatro tarjetas ilustradas representan categorías de institución,
  no organizaciones registradas ni verificadas. Los datos reales aparecerán cuando el backend
  autorizado entregue los DTO.
- **Historias:** `/historias` pertenece al menú «Más» y al pie. Usa ilustraciones declaradas y no
  testimonios, puntuaciones, comentarios ni favoritos activos; esas funciones están propuestas en
  `docs/propuesta-experiencias-valoraciones-favoritos.md`.
- **Enlaces verificados:** las 20 rutas de la aplicación tienen título y metadescripción propios;
  la comprobación CDP no encontró anclas vacías ni enlaces internos a rutas inexistentes.

## 10. Cierre funcional de la entrega (26 de noviembre de 2026)

| Ruta | Estado real | Acceso |
|---|---|---|
| `/necesidades/:id` | Líneas por producto/unidad, disponibilidad SQL y compromiso restringido a donantes. | Público; acción de donación sólo con sesión de donante. |
| `/instituciones/tipo/:tipo` y `/instituciones/:id` | Directorio y perfiles desde `DonaConectaDB_Pruebas`, sin contactos inventados. | Público. |
| `/mis-donaciones` | Compromisos reales, cantidades recibidas/pendientes, punto, horarios, historial y enlaces de gestión. | Donante autenticado. |
| `/donaciones/:id` | Detalle autorizado de un compromiso con entregas, recepciones y línea de tiempo. | Donante dueño o representante autorizado. |
| `/mensajes` | Bandeja y conversación persistidas en SQL Server, cifrado AES-256-GCM e idempotencia por `client_message_id`. | Participantes de la conversación. |
| `/puntos-de-acopio` | Listado real con marcadores sólo cuando las coordenadas fueron autorizadas. | Público. |
| `/institucional/compromisos` | Programación de entregas y recepciones parciales/totales. | Representante autorizado. |
| `/institucional/puntos-acopio` | Alta, reemplazo, estado y baja de puntos con horarios. | Representante autorizado. |
| `/seguimiento/:id` | Sesión GPS voluntaria, duración máxima, indicador visible, detención y alternativa manual. | Donante participante. |

`BackendEstadoService` ya no mantiene un interruptor global: declara una lista explícita de
operaciones con API REST real y devuelve `ServicioPendienteError` para las que no existen. Las
secciones 4 y 5 de este documento corresponden al estado anterior de Fase 07.B.1 y no describen
el cierre actual. La mensajería usa polling HTTP; no se implementó WebSocket. No se repitieron
las comprobaciones CDP de Fase 09.1 y la valoración estética final sigue pendiente de revisión
humana.
