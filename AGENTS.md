# AGENTS.md — DonaConecta

Reglas permanentes de desarrollo del proyecto DonaConecta. Se aplican en todas las fases
y deben respetarse antes de escribir, modificar o eliminar cualquier archivo.

---

## 1. Propósito y alcance

DonaConecta es una plataforma web de impacto social que conecta ciudadanos donantes con
organizaciones sociales, comedores comunitarios, albergues infantiles y refugios de
animales de Huancayo, Junín, Perú.

- Gestiona **exclusivamente donaciones de bienes materiales**.
- **No** procesa pagos, transferencias bancarias ni donaciones monetarias.
- Objetivo académico: Ingeniería de Sistemas e Informática — Universidad Continental.
- Debe demostrar los conocimientos de desarrollo web, programación backend y bases de datos
  vistos en clases, con código comprensible y sostenible ante el docente.
- Repositorio: `https://github.com/AndreaGamboa23/DonaConecta.git`.

---

## 2. Control de versiones

- Verificar siempre la rama antes de cualquier escritura: `git branch --show-current`.
- La rama obligatoria de trabajo es **`Andrea`**. Si la rama no es `Andrea`, **detenerse
  inmediatamente** e informar.
- **No modificar `main`**.
- **No cambiar de rama**, hacer `merge` ni `rebase` sin autorización explícita.
- **No realizar commits ni push automáticamente**.
- El **Avance 01** quedó publicado en `main` con el commit `1d5bc00`. El **Avance 02** se
  desarrolla exclusivamente en `Andrea`; `main` y `Jhon` no se modifican.
- Al finalizar cada fase se propone un mensaje de commit descriptivo, sin ejecutarlo,
  con el formato: `tipo(alcance): descripción breve en español`.
  Ejemplo: `docs: agregar AGENTS.md con reglas permanentes del proyecto`.
- Los Pull Requests hacia `main` deben revisarse antes de integrarse.
- Nunca subir credenciales, tokens, archivos `.env` ni datos personales a GitHub.

---

## 3. Tecnologías obligatorias

| Capa | Tecnologías |
|---|---|
| Frontend | Angular 22, TypeScript, HTML5, Bootstrap 5, CSS y SCSS |
| Backend | Python 3.13, FastAPI, Uvicorn, Pydantic, PyODBC, WebSockets |
| Base de datos | Microsoft SQL Server 2025 Express, T-SQL, PyODBC |
| Gestor de entornos | `uv` en evaluación, siguiendo el procedimiento de clases; no duplicar gestores |
| Versionamiento y herramientas | Git, GitHub, OpenCode, Visual Studio Code |

- No sustituir estas tecnologías.
- No agregar dependencias innecesarias. Toda dependencia nueva debe justificarse
  técnicamente y documentarse en `docs/decisiones-tecnicas.md`.
- Evaluar `uv` como gestor de dependencias y entornos virtuales en la Fase 07, antes de
  instalar backend. No introducir gestores incompatibles o duplicados.
- No versionar `.venv/`, `__pycache__/`, archivos `.env` ni credenciales; `.env.example`
  debe permanecer sin valores sensibles.
- No usar Tailwind CSS, Angular Material ni otros frameworks de diseño adicionales.
- No usar Firebase, Supabase, MongoDB, SQLite ni otras bases de datos sustitutas.
- No crear nuevamente el proyecto Angular existente.

---

## 4. Regla prioritaria: MÁS BOOTSTRAP QUE CSS

Bootstrap 5 es la herramienta principal para construir las interfaces. Objetivo
orientativo: **aproximadamente 85% Bootstrap / 15% CSS y SCSS personalizado**.
Esta proporción es una guía de criterio, **no una medición obligatoria de líneas de código**.

Priorizar las clases nativas de Bootstrap:

- `container`, `container-fluid`
- `row`, `col` y breakpoints `sm`, `md`, `lg`, `xl`, `xxl`
- `d-flex`, `d-grid`, `justify-content-*`, `align-items-*`, `gap-*`
- Utilidades de márgenes y padding (`m-*`, `p-*`), tamaños (`w-*`, `h-*`)
- `btn`, `card`, `navbar`
- `form-control`, `form-select`, `input-group`
- `table`, `table-responsive`
- `modal`, `accordion`, `alert`, `badge`, `progress`, `spinner`
- `pagination`, `dropdown`, `offcanvas`, `list-group`
- Utilidades responsive

No escribir CSS personalizado para reproducir funcionalidades que Bootstrap ya ofrece.

Personalizar Bootstrap **globalmente** mediante variables Sass y CSS: paleta, tipografías,
radios, sombras y espaciados en un único archivo de tokens. Usar CSS/SCSS personalizado
**únicamente** cuando Bootstrap no permita resolver adecuadamente una necesidad visual
o funcional.

Evitar:

- Hojas de estilo extensas.
- Estilos inline innecesarios.
- Clases personalizadas redundantes.
- Media queries innecesarias: usar las utilidades responsive de Bootstrap.
- Uso excesivo de `!important`.
- Duplicación de propiedades.
- Componentes propios que reimplementen Bootstrap sin necesidad.

Integrar las interacciones de los componentes con Angular y su gestión de estado.
Evitar manipulaciones innecesarias del DOM fuera del ciclo de Angular.

---

## 5. Identidad visual original

Concepto rector: **Conexiones que transforman**.
Valores: solidaridad, confianza, colaboración, transparencia, esperanza y responsabilidad social.

Paleta institucional:

| Color | Hex |
|---|---|
| Azul profundo | `#12304A` |
| Azul conexión | `#3679A8` |
| Azul suave | `#DCEBF5` |
| Crema cálido | `#F7F5EF` |
| Blanco | `#FFFFFF` |
| Verde esperanza | `#80B69A` |
| Ámbar solidario | `#D5A451` |

El rojo se reserva para errores o alertas críticas; no debe ser color predominante.

Tipografías propuestas: **Manrope** para títulos e **Inter** para contenido y componentes.
Verificar licencias antes de incorporarlas (las fuentes de Google Fonts usan OFL 1.1).

Crear un sistema visual consistente mediante la personalización global de Bootstrap.
La plataforma **no debe parecer una plantilla administrativa genérica**. Diseñar:

- Landing page editorial original con hero de impacto social.
- Catálogo de necesidades con tarjetas personalizadas y barras de progreso reales.
- Indicadores de prioridad y formularios profesionales.
- Dashboards con identidad propia, gráficos y tablas desde datos reales.
- Navegación intuitiva, iconografía consistente y estados visuales coherentes
  (carga, vacío, error y confirmación).

Usar fotografías contextualizadas y respetuosas, con licencia verificada y atribución
documentada. Emplear espacios equilibrados y microinteracciones sutiles; evitar animaciones
excesivas. Garantizar responsive con el sistema grid y las utilidades de Bootstrap.
Verificar accesibilidad, contraste AA, navegación por teclado, foco visible y
`prefers-reduced-motion`.

---

## 6. Arquitectura

Arquitectura cliente-servidor modular y organizada por capas, sin complejidad innecesaria.

**Frontend:** `core`, `shared`, `layouts`, `features`, `services`, `guards`,
`interceptors`, `interfaces`, `routing`, `assets`, `styles`.

**Backend:** referencia obligatoria `backend/src/backend/` con `apis/`, `repositories/`,
`schemas/`, `services/`, `database/`, `security/`, `core/`, `websockets/`, `__init__.py` y
`main.py`. La carpeta `backend/tests/` y los archivos de configuración se crearán solo cuando
exista una necesidad real en las fases autorizadas.

Separar correctamente presentación, lógica de negocio y persistencia. `main.py` no concentra
todas las responsabilidades. El frontend nunca accede directamente a SQL Server: toda operación
pasa por APIs REST reales; los WebSockets solo complementan los eventos en tiempo real.

---

## 7. Base de datos

- Microsoft SQL Server es la **única base de datos principal**.
- Instancia local: `.\\SQLEXPRESS`. Base propuesta: `DonaConectaDB`.
- Controlador: `ODBC Driver 18 for SQL Server`. Autenticación local: Windows.
- `Encrypt=yes` y `TrustServerCertificate=yes` **solo en el entorno local autorizado**.
  En producción debe validarse un certificado confiable (`TrustServerCertificate=no`).
- Diseñar modelo **conceptual, lógico y físico**, con modelo entidad-relación y cardinalidades.
- Normalizar desde 1FN y 2FN hasta **tercera forma normal (3FN)**.
- Usar claves primarias, claves foráneas, restricciones `UNIQUE` y `CHECK`,
  integridad referencial, campos obligatorios, índices justificados y transacciones.
- Emplear `JOIN`, vistas y procedimientos almacenados solo cuando estén justificados;
  planificar respaldos, restauración y auditoría desde el diseño.
- Consultas **parametrizadas**; prohibida la concatenación de cadenas SQL.
- Prevenir compromisos que superen las cantidades disponibles mediante control
  transaccional (bloqueo y validación en repositorio/servicio).
- No almacenar cantidades derivadas innecesariamente: calcularlas desde registros reales.
- No eliminar registros relacionados sin evaluar integridad referencial; preferir baja lógica.
- **No crear bases de datos, tablas ni ejecutar scripts de modificación** sin autorización
  de la fase correspondiente.

---

## 8. Funcionalidad real

Perfiles del sistema: **visitante**, **donante**, **representante de organización** y
**administrador**. Los módulos respetan los requisitos del diagnóstico de la Fase 01.

El modelo de datos y las APIs deberán contemplar, en las fases correspondientes: usuarios,
registro voluntario de donantes, registro y verificación de instituciones, roles y permisos,
directorio público, necesidades, categorías de bienes, compromisos de donación, entregas
parciales y totales, confirmaciones de recepción, puntos de acopio, horarios, GPS autorizado,
chat privado, notificaciones, evidencias, historiales, dashboards y auditoría.

- Todas las operaciones de negocio se comunican mediante **APIs REST reales** y persisten
  en SQL Server.
- Los formularios envían información al backend; los dashboards consultan estadísticas
  reales; las tablas muestran registros almacenados.
- Acciones de crear, editar, confirmar, actualizar y eliminar deben persistir correctamente.
- **No usar `localStorage` como sustituto de la base de datos**.
- **No simular backend** ni presentar datos falsos como reales.
- No inventar estadísticas, testimonios ni organizaciones verificadas.
- No crear botones decorativos ni sin funcionalidad.
- Los datos de prueba deben estar claramente identificados como tales.

---

## 9. Seguridad

- Contraseñas almacenadas mediante **Argon2id** con una librería mantenida; nunca en texto
  plano, con cifrado reversible ni mediante MD5, SHA-1 o SHA-256 simple.
- Autorización **obligatoria en backend** para cada operación sensible. El frontend
  oculta rutas por rol, pero el backend siempre verifica.
- Validación de formularios en frontend y backend (Pydantic).
- Consultas SQL parametrizadas; prevención de inyección SQL y XSS.
- CORS restringido a orígenes autorizados.
- Configuración y secretos en variables de entorno; `.env` ignorado por Git.
- Protección de datos personales; DTO de respuesta explícitos sin campos sensibles
  como `PasswordHash` o tokens.
- Validación de archivos: extensión, MIME, tamaño y nombre; documentos privados fuera de rutas públicas.
- Evaluar AES-256-GCM solo para datos recuperables que lo justifiquen; no desarrollar criptografía propia.
- HTTPS/TLS y WSS en los entornos que correspondan; CORS restringido y rate limiting en operaciones sensibles.
- Autorización por rol **y** propiedad del recurso, también en WebSockets.
- Gestión segura de claves y secretos; rotación y versión documentadas si se implementa cifrado.
- Manejo seguro de errores: sin stack traces ni credenciales en respuestas.
- Principio de mínimo privilegio. No exponer credenciales en código ni en GitHub.

---

## 10. Metodología de desarrollo

Trabajar por fases y módulos.

**Antes de modificar archivos:**

1. Inspeccionar su contenido.
2. Comprender su función.
3. Identificar dependencias.
4. Planificar los cambios y explicar la decisión.

**Después de implementar:**

1. Revisar el código.
2. Ejecutar pruebas.
3. Verificar funcionamiento e integración con las APIs.
4. Comprobar persistencia en SQL Server cuando corresponda.
5. Revisar diseño responsive.
6. Eliminar código duplicado.
7. Revisar el uso prioritario de Bootstrap sobre CSS personalizado.
8. Documentar decisiones y resultados.
9. Proponer un commit descriptivo.

**No afirmar que una funcionalidad está terminada sin evidencias de funcionamiento.**

---

## 11. Requisitos académicos

Orientar el desarrollo hacia el máximo nivel de la rúbrica:

- Frontend funcional, responsive y modular.
- Uso predominante de Bootstrap 5.
- Backend modular, validado y con lógica de negocio real.
- Base de datos normalizada hasta 3FN.
- Integración real frontend–backend–SQL Server.
- Uso correcto de Git: ramas, commits descriptivos y Pull Requests.
- Dominio técnico durante la sustentación.

Mantener un código legible y comprensible para un estudiante universitario. Explicar al
finalizar cada fase el funcionamiento, los archivos involucrados y las decisiones técnicas.

---

## 12. Alcance por fase

Cada fase debe declarar explícitamente qué está autorizado a crear o modificar.

**Fase 02 — alcance ya ejecutado:** únicamente la creación de este archivo `AGENTS.md`.
Durante esa fase no se instaló Bootstrap, no se movieron carpetas, no se modificaron
componentes Angular, no se creó backend ni base de datos, no se modificaron otros
archivos, no se realizaron commits ni push y `main` permaneció intacta.

Las fases siguientes requieren autorización explícita antes de instalar dependencias,
mover la carpeta Angular a `frontend/`, crear el backend o ejecutar scripts SQL.

---

## 13. Comandos y rutas de referencia

Verificados en la Fase 01:

```powershell
# Rama y estado
git branch --show-current
git status --short --branch

# Frontend (ejecutar desde frontend/ una vez reestructurado)
npm run build
npm test

# Python 3.13 (el alias de Microsoft Store en el PATH no funciona)
& 'C:\Users\ANDREA\AppData\Local\Programs\Python\Python313\python.exe' --version
& 'C:\Users\ANDREA\AppData\Local\Programs\Python\Python313\python.exe' -m venv backend\.venv

# SQL Server: solo lectura
sqlcmd -S ".\SQLEXPRESS" -E -C -Q "SELECT @@VERSION AS VersionSQL;"
sqlcmd -S ".\SQLEXPRESS" -E -C -Q "SELECT name FROM sys.databases ORDER BY name;"
```

La cadena de conexión local-authorizada es:

```
DRIVER={ODBC Driver 18 for SQL Server};SERVER=.\SQLEXPRESS;DATABASE=DonaConectaDB;Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;
```

Ninguna credencial debe escribirse en el repositorio.

---

## 14. Calidad visual obligatoria (requisitos permanentes desde la Fase 04)

La calidad estética es un requisito de la fase, no un extra. Compilar, usar Bootstrap y ser
responsive **no** basta para declarar terminada una interfaz.

- La experiencia debe sentirse como un producto digital profesional, original, cálido y
  memorable; no como una plantilla, un ejercicio básico ni un dashboard genérico.
- Evitar el minimalismo excesivo: páginas con mucho espacio vacío, un título, dos botones y
  una ilustración simple. Buscar riqueza visual equilibrada con jerarquía clara, fondos
  alternados, composiciones asimétricas, fotografía o gráficos propios y microinteracciones
  sutiles.
- Concepto de marca: **Una comunidad, muchas manos, un mismo propósito**, complementado con
  **Conexiones que transforman**. El logotipo, la iconografía y las composiciones deben
  reforzar esa idea; prohibido reutilizar el par de círculos unidos por una línea.
- Cada sección debe tener composición propia, pero compartir tokens, paleta, tipografía,
  radios, sombras y componentes reutilizables. El sistema visual sirve para landing,
  catálogos, formularios, tablas y dashboards futuros.
- Bootstrap 5 continúa siendo la herramienta principal (~85%). El SCSS/CSS propio se reserva
  a formas orgánicas, conectores narrativos, foco visible, movimiento reducido y detalles de
  identidad; no se reimplementan componentes ni utilidades de Bootstrap.
- Las fotografías deben tener licencia verificable o ser proporcionadas por el usuario,
  guardarse localmente en `frontend/public/assets/images/` y documentarse (autor, fuente y
  licencia). Si no hay imágenes autorizadas, se declara la limitación, se listan las imágenes
  requeridas y se deja una integración clara. Nunca presentar fotografías ilustrativas como
  evidencia real de actividades de DonaConecta ni explotar la vulnerabilidad de las personas.
- Todo enlace o botón visible debe realizar una acción existente. No se simulan donaciones,
  estadísticas, testimonios, organizaciones verificadas ni autenticación.
- Antes de cerrar una fase visual se revisan composición, contraste, accesibilidad, menú
  móvil, ausencia de desbordamiento horizontal y resultados reales de build y pruebas. Si no
  hay herramientas de inspección visual, declarar la limitación y pedir capturas al usuario;
  no inventar inspecciones visuales.
- No integrar fotografías externas si no pueden inspeccionarse visualmente. Ante esa
  limitación, dejar ranuras explícitas, listar archivos requeridos (nombre, tema,
  orientación, resolución y sección) y documentar autor, fuente y licencia al incorporarlos.

---

## 15. Navegación SPA multipágina (requisito permanente desde la Fase 04.2)

DonaConecta no es una landing de anclas: es una SPA con páginas independientes.

- Usar Angular Router para cada módulo principal, con `RouterLink`, `RouterLinkActive`,
  layouts reutilizables, lazy loading cuando corresponda, guards en rutas privadas y página
  404 personalizada.
- El inicio es público y orienta sin exigir registro; nunca se abre con login ni con modales
  obligatorios.
- Cada ruta activa debe tener título propio y descripción metadatos coherentes. Gestionar el
  desplazamiento con `withInMemoryScrolling`, incluyendo fragmentos y botón de retroceso.
- Activar rutas progresivamente: solo se enlazan en la interfaz las páginas realmente
  implementadas. Las rutas planificadas se documentan, pero no se muestran como enlaces
  funcionales ni se simulan con pantallas falsas.
- Las secciones internas del inicio pueden resumir módulos, pero no sustituyen sus páginas
  independientes.
- Perfiles: visitante (no autenticado), donante, representante institucional y
  administrador. El registro público nunca crea administradores.

**Plan de experiencia como aplicación de servicios (desde Fase 04.4, solo documental):**

- La portada funciona como entrada a servicios, no como una landing de anclas. El visitante debe
  encontrar primero accesos reales: explorar categorías, guía de donación, proyecto y ayuda.
- Navegación pública prevista cuando existan las páginas correspondientes: Inicio, Explorar
  necesidades, Instituciones, Puntos de acopio, Cómo donar, Mis donaciones, Mensajes,
  Notificaciones y Perfil. Los módulos privados solo se enlazarán después de autenticación y
  autorización en backend; hasta entonces no se muestran como enlaces funcionales.
- En móvil, la futura barra inferior autenticada contendrá Inicio, Explorar, Mis donaciones,
  Mensajes y Perfil. No se crearán pestañas inactivas ni contadores falsos. Esta barra se
  implementará con la PWA (Fase 18) y solo para sesiones válidas.
- La sensación de aplicación debe lograrse con jerarquía clara, paneles de acceso, iconografía
  consistente, estados reales y microinteracciones sutiles; nunca copiando la identidad visual ni
  el comportamiento de aplicaciones comerciales de reparto.

---

## 16. Seguridad y privacidad desde el diseño (requisito permanente)

La seguridad se implementa progresivamente en todas las fases, no solo al final.

- Aplicar confidencialidad, integridad, disponibilidad, autenticación, autorización,
  trazabilidad, privacidad desde el diseño, mínimo privilegio y defensa en profundidad.
- Tomar como referencia OWASP para web y APIs. Evaluar la normativa peruana de protección de
  datos sin afirmar cumplimiento legal ni certificaciones sin evaluación formal.
- Contraseñas con Argon2id; recuperación mediante tokens temporales y límite de intentos.
- Evaluar cifrado autenticado (por ejemplo AES-256-GCM) solo para datos recuperables que lo
  justifiquen. No implementar criptografía propia, no guardar claves en el repositorio ni
  enviarlas al navegador; documentar datos cifrados, rotación y versión de claves.
- HTTPS/WSS/TLS en producción; `TrustServerCertificate=yes` solo en desarrollo local.
  No anunciar cifrado de extremo a extremo en el chat cuando solo exista TLS y cifrado en
  reposo.
- Autorización en backend para cada operación, verificando rol **y** propiedad del recurso.
  Los guards de Angular son ayuda de navegación, no control de acceso definitivo.
- Consultas parametrizadas con pyodbc, validación Pydantic, CORS restringido, cabeceras de
  seguridad, rate limiting en operaciones sensibles y errores sin trazas internas.
- Validar archivos por contenido real, extensión, MIME, tamaño y nombre seguro; documentos
  privados fuera de rutas públicas y descarga autorizada.
- Secretos en variables de entorno; `.env` ignorado; `.env.example` sin valores sensibles.
- Auditar operaciones críticas sin registrar contraseñas, tokens, mensajes completos ni
  coordenadas innecesarias. Prever respaldos protegidos y pruebas de restauración.
- GPS: consentimiento explícito, inicio manual, indicador visible, botón de detención,
  caducidad, mínimo privilegio y alternativa manual por estados. No rastreo permanente,
  no coordenadas públicas, no ubicación como prueba de recepción.
- Chat: persistencia en SQL Server, autorización de participantes incluso en WebSocket,
  reconexión, lecturas, reportes y controles antiabuso; jamás localStorage como base de datos.
- Notificaciones: no exponer información sensible en pantallas bloqueadas. Evidencias:
  eliminar EXIF innecesario y proteger imágenes de menores o personas vulnerables.

---

## 17. Planificación definitiva por fases

| Fase | Alcance | Estado |
|---|---|---|
| 01 | Diagnóstico técnico. | Ejecutada |
| 02 | Creación de `AGENTS.md`. | Ejecutada |
| 03 | Organización de arquitectura en `frontend/`, `backend/`, `database/` y `docs/`. | Ejecutada |
| 04 | Diseño visual profesional, Bootstrap e identidad original. | Ejecutada |
| 04.2 | Ampliación funcional documental, navegación pública independiente y plan de seguridad. | Ejecutada |
| 04.3 | Rediseño visual fotográfico con ilustraciones generadas con IA, optimización de imágenes y verificación responsive. | Ejecutada |
| 04.4 | Contraste legible del hero, imagen principal confirmada, limpieza de mensajes técnicos y portada como acceso a servicios. | Ejecutada |
| 05 | Modelo entidad-relación y normalización 3FN. | Ejecutada (propuesta revisada en 05.1) |
| 05.1 | Revisión, corrección y documentación técnica del modelo. | Ejecutada |
| 06 | Implementación de Microsoft SQL Server. | Ejecutada |
| 07 | Backend FastAPI, conexión y arquitectura de servicios. | Avance parcial integrado en Avance 01 (ver Fase 08.2); pendiente de cierre formal |
| 08 | Landing definitiva y navegación pública integrada. | Pendiente |
| 08.2 | CRUD real de usuarios, perfil personal, sesiones revocables y celular cifrado. | Ejecutada e integrada en Avance 01 |
| 09 | Paneles administrativo e institucional, verificación real, catálogo de productos y necesidades (Avance 02). La autenticación, el registro y las sesiones quedaron cubiertos en 08.2. | Ejecutada |
| 09.1 | Experiencia pública real: detalle de necesidades, directorio y perfiles SQL, accesos por rol y correcciones de contrato. | Ejecutada |
| Cierre de entrega | Integración funcional mínima de donación, acopio, entrega, recepción, chat persistente, notificaciones y GPS autorizado. | Ejecutada; ver §18.8 |
| 10 | Registro, verificación y directorio de instituciones. | Pendiente como fase formal |
| 11 | Catálogo y gestión de necesidades. | Pendiente como fase formal |
| 12 | Compromisos, donaciones y entregas. | Funcionalidad básica integrada en el cierre; fase formal pendiente |
| 13 | Mapas, ubicaciones y puntos de acopio. | Funcionalidad básica integrada en el cierre; fase formal pendiente |
| 14 | Seguimiento GPS autorizado. | Funcionalidad básica integrada en el cierre; fase formal pendiente |
| 15 | Chat y mensajería en tiempo real. | Persistencia HTTP integrada; WebSocket pendiente |
| 16 | Notificaciones, evidencias y trazabilidad. | Funcionalidad básica integrada en el cierre; fase formal pendiente |
| 17 | Dashboards y estadísticas reales. | Pendiente |
| 18 | Aplicación instalable PWA. | Pendiente |
| 19 | Pruebas integrales, seguridad y optimización. | Pendiente |
| 20 | Documentación, despliegue y sustentación final. | Pendiente |

**Alcance autorizado de la Fase 04.2:** actualizar `AGENTS.md` y documentos; revisar rutas;
implementar `/como-donar`, `/nosotros`, `/preguntas-frecuentes` y 404; conectar las páginas
existentes con Angular Router; mantener la calidad visual; verificar build, pruebas y
navegación. No implementar GPS real, mensajería, autenticación, cifrado de datos de negocio,
API ni base de datos. No comenzar Fase 05 sin autorización explícita.

**Alcance autorizado y resultado de la Fase 04.3:** integrar únicamente las cuatro ilustraciones
generadas con IA proporcionadas por el usuario; conservar los originales y crear derivados WebP
optimizados y móviles sin instalar dependencias; rediseñar la portada, `/como-donar`, `/nosotros`,
FAQ, 404, navbar y footer manteniendo rutas, fragmentos, `RouterLinkActive` y `<details>` reales;
actualizar `AGENTS.md` y documentación visual/técnica; verificar build, pruebas, imágenes,
enlaces, menú móvil, contraste, accesibilidad y ausencia de desbordamiento en 360, 390, 576, 768,
1024, 1440 y 1920 px. No se agregó funcionalidad de negocio, autenticación, GPS, chat, API ni
base de datos; las imágenes se declaran ilustrativas y la valoración estética final queda pendiente
de revisión humana. No comenzar Fase 05 sin autorización explícita.

**Alcance autorizado de la Fase 04.4:** corregir el contraste de los encabezados sobre fotografía
sin `!important`; usar `nosotros-comunidad.webp` como hero principal y `hero-comunidad.webp` en la
guía de bienes materiales; eliminar de la interfaz aclaraciones repetidas, mensajes de fases,
construcción y lenguaje dirigido al programador; concentrar los créditos visuales en
`/nosotros#creditos-visuales` con enlace discreto desde el pie; reorganizar la portada como entrada
a servicios mediante accesos reales, sin buscador ni ubicación simulados; optimizar navbar, footer
y experiencia móvil; actualizar documentación; verificar build, pruebas, rutas, enlaces, imágenes,
contraste efectivo, accesibilidad, menú móvil, consola y `git status`. No implementar
autenticación, GPS real, chat, API, cifrado de negocio ni base de datos. No comenzar Fase 05 sin
autorización explícita.

**Resultado de la Fase 04.4:** el hero usa `nosotros-comunidad` con título blanco y destacado crema;
`hero-comunidad` pasó a la guía de bienes materiales. La portada incorpora cuatro accesos reales y
las categorías enlazan a `/como-donar#bienes`. Se eliminaron los mensajes técnicos de la interfaz y
los créditos visuales quedaron centralizados en `/nosotros#creditos-visuales`. Build: 494.03 kB
(92.51 kB transferidos) y seis chunks diferidos; pruebas: 3 archivos y 5 pruebas aprobadas.
Verificación CDP: 5 rutas con título/meta propios y un solo `h1`, 35 combinaciones de ancho y ruta
sin desbordamiento ni imágenes rotas, 0 errores de consola y 0 fallos de red, menú móvil
`false → true → false`, FAQ real y fragmentos activos. Contraste efectivo del título muestreado
sobre la imagen: 12.03:1 medio, 9.06:1 en el percentil 90 y 3.87:1 en el peor 0.1% a 1440 px;
9.70:1 / 6.20:1 / 4.57:1 a 390 px. El texto es negrita de 66.24 px y 37.05 px respectivamente,
por lo que supera el umbral AA de 3:1 para texto grande. La valoración estética final sigue
pendiente de revisión humana; el modelo no puede inspeccionar capturas ni imágenes.

**Alcance autorizado de la Fase 05.1:** revisar, corregir y documentar el modelo entidad-relación
aprobado, sin implementación. Se crearon `docs/modelo-conceptual.md`,
`docs/modelo-entidad-relacion.md`, `docs/modelo-logico.md`, `docs/modelo-fisico.md`,
`docs/diccionario-datos.md`, `docs/normalizacion.md`, `docs/reglas-negocio.md` y
`docs/contrato-api.md`; se actualizaron seguridad/privacidad, decisiones técnicas, plan de
desarrollo y este archivo. No se creó `DonaConectaDB`, no se ejecutó DDL ni DML, no se instalaron
dependencias, no se modificó el frontend, no se inventaron datos y no se realizaron commits.
No comenzar Fase 06 sin autorización explícita.

**Resultado de la Fase 05.1:** modelo definitivo de **42 tablas** en ocho módulos; ocho diagramas
Mermaid; registro diferenciado con endpoint único `POST /api/v1/autenticacion/registro`;
activación institucional por rol, vínculo y estado; disponibilidad calculada como
`requerida − (reserva vigente restante + recibido)` sin doble conteo; FK compuestos contra
asociaciones cruzadas; GPS con una sola posición privada cifrada; notificaciones con recurso
opcional; dos procedimientos dueños de su transacción; borrado físico limitado a borradores.
La validación fue documental en ese momento; las pruebas reales de SQL Server y concurrencia se
ejecutaron después en la Fase 06 y se resumen más abajo.

**Alcance autorizado de la Fase 06:** crear físicamente `DonaConectaDB` en `.\SQLEXPRESS` desde el
modelo de Fase 05.1; versionar scripts numerados para base, tablas, FK, índices, catálogos,
vistas, procedimientos y permisos; sembrar solo roles, permisos, tipos de institución, unidades,
categorías y distritos verificables; crear cuenta/rol de aplicación sin contraseñas versionadas;
probar integridad, reglas, concurrencia con dos conexiones, respaldo y restauración en bases
separadas; actualizar documentación. No modificar `frontend/`, no implementar FastAPI, no instalar
dependencias Python, no crear datos de negocio inventados, no ejecutar commits ni push.

**Resultado de la Fase 06:** `DonaConectaDB` existe con **42 tablas**, **79 FK** `NO ACTION`,
**11 índices propios**, **9 vistas** y **2 procedimientos** transaccionales. Catálogos reales:
3 roles, 37 permisos, 83 asignaciones, 5 tipos de institución, 5 categorías, 6 unidades y 28
distritos de Huancayo. La base real permanece con **0 filas** en todas las tablas de negocio.
`dc_app` puede leer catálogos y escribir operaciones, pero no insertar catálogos ni borrar
auditoría; `dc_admin` no tiene DDL. Pruebas ejecutadas: 11/11 de integridad, 15/15 de
procedimientos y concurrencia con dos conexiones (una operación válida y una `409` lógica
`52001`/`52006`, sin interbloqueos `1205`). Respaldo final verificado con `CHECKSUM` y
`RESTORE VERIFYONLY`, y restaurado en `DonaConectaDB_Verificacion` sin datos de negocio.
Se documentaron los ajustes de implementación (sin historial de creación, parámetros opcionales
de recepción y `fecha_real_inicio` obligatoria) y las contradicciones documentales pendientes de
coordinación (`docs/arquitectura.md` §15, `backend/README.md`, `README.md` y RF-12). No se afirma
TDE, Always Encrypted, cifrado de respaldo ni cifrado de aplicación: la instancia es Express y la
estrategia Argon2id/AES-256-GCM queda para Fase 07. No comenzar Fase 07 sin autorización explícita.

**Alcance autorizado de la Fase 07.A:** preparar en `frontend/` la SPA de servicios con rutas
independientes, formularios reactivos de registro y acceso, pantallas preparadas de exploración,
mensajería, donaciones, perfil y seguimiento, navbar y barra inferior móvil; actualizar
`docs/mapa-navegacion.md`, `docs/decisiones-tecnicas.md`, `docs/seguridad-privacidad.md`,
`docs/plan-desarrollo.md` y este archivo. No implementar FastAPI, dependencias Python, SQL,
autenticación, tokens, GPS, chat real, documentos privados ni almacenamiento local de datos;
no modificar el trabajo del compañero ni ejecutar commits o push.

**Resultado de la Fase 07.A:** dieciséis rutas `loadComponent` con título y metadescripción propios;
layout público con navbar, pie y barra móvil de cinco destinos reales; formularios con
`FormGroupDirective` verificado en ejecución (10 controles de donante, 12 de institución, 2 de
acceso y 1 de recuperación) y validadores compartidos. `BackendEstadoService` mantiene la
integración en `false`: los servicios devuelven `ServicioPendienteError` y `HttpClient` se resuelve
solo al activar el flag. Build: 545.17 kB iniciales y 105.02 kB transferidos, sin exceder el
presupuesto ajustado a 600 kB; pruebas: 14/14. Verificación CDP: 52 combinaciones de 16 rutas y
siete anchos (360–1920 px), 0 errores de consola, 0 desbordamientos, 0 imágenes o anclas rotas, un
solo `h1` por ruta y menú móvil `false → true → false`. Sin avisos `NG0913` tras marcar como
`eager` la imagen LCP visible de `/registro/donante`. No se crearon datos, sesiones ni
estadísticas simuladas. La valoración estética final sigue pendiente de revisión humana. La Fase 07
de backend continúa pendiente y no se inicia sin autorización explícita.

**Alcance autorizado de la Fase 07.B:** rediseñar visualmente la SPA existente en `frontend/` con
las ocho imágenes nuevas proporcionadas por el usuario; reorganizar navbar y barra inferior móvil;
convertir las categorías en accesos protagonistas reutilizables en Inicio, Explorar y Cómo donar;
mejorar registro, acceso, mensajes, perfil, donaciones, puntos de acopio y seguimiento sin datos,
sesiones, mensajes ni GPS simulados; reducir los avisos técnicos a una nota breve por pantalla;
actualizar `AGENTS.md`, `docs/sistema-diseno.md`, `docs/mapa-navegacion.md`,
`docs/decisiones-tecnicas.md`, `docs/plan-desarrollo.md` y el README de imágenes; verificar build,
pruebas, imágenes, enlaces, formularios, navegación, consola y responsive. No modificar `backend/`
ni `database/`; no instalar dependencias; no activar FastAPI, autenticación, chat ni GPS; no
aumentar presupuestos para ocultar advertencias; no ejecutar commits ni push.

**Resultado de la Fase 07.B:** las ocho imágenes nuevas se sirven desde `/assets/images/...` y se
verificaron como WebP reales con HTTP `200` y `Content-Type: image/webp`; las 20 imágenes del
directorio decodificaron correctamente sin HTML ni recursos rotos. El sistema compartido de
categorías sustituye las tarjetas numeradas por fotografía, nombre, descripción y enlace real a
`/como-donar#bienes`. El navbar separa navegación pública, acceso personal y registro; la barra
móvil conserva cinco destinos reales con icono, etiqueta e indicador de selección. Se eliminaron
los fondos rayados, los controles deshabilitados sin función, los avisos repetidos y el contrato
muerto `operacion` de `ServicePage`. Perfil, mis donaciones y seguimiento muestran composiciones
propias con estados vacíos honestos. Build: 547.00 kB iniciales y 105.43 kB transferidos, dentro
del presupuesto de 600 kB; pruebas: 9 archivos y 14/14 pruebas. Verificación CDP: 47 combinaciones
de 16 rutas y siete anchos (360–1920 px), 0 desbordamientos, 0 títulos o metadescripciones
ausentes, 0 imágenes rotas o sin dimensiones, 0 anclas rotas, 0 errores de consola, 0 avisos
`NG0913`, 0 lenguaje técnico y formularios con `FormGroupDirective` en los casos verificados.
`git diff --check` no reportó errores de whitespace; solo avisos de normalización LF/CRLF. Las
capturas quedaron fuera del repositorio. La valoración estética final sigue pendiente de revisión
humana; la Fase 07 de backend continúa pendiente y no se inicia sin autorización explícita.

**Alcance autorizado de la Fase 07.B.1:** corregir en `frontend/` la navegación, la jerarquía visual
y la experiencia de servicios; implementar la parte visual/cartográfica autorizada del mapa en
`/puntos-de-acopio`; preparar catálogo, directorio, chat y seguimiento para la integración futura;
auditar el flujo real de registro y entregar el informe de contratos para backend. Instalar solo
las dependencias cartográficas necesarias (`leaflet`, `@types/leaflet`); conservar `BackendEstadoService`
en `false`; no modificar `backend/` ni `database/`; no activar autenticación, GPS real, chat ni
envíos HTTP; no crear datos simulados ni ejecutar commits o push. La Fase 07 de backend sigue
pendiente y separada.

**Resultado de la Fase 07.B.1:** el navbar quedó en una sola fila de escritorio con Inicio,
Explorar, Instituciones, Mensajes, `Más`, Iniciar sesión y Regístrate; el desplegable incluye
Puntos de acopio, Mis donaciones, Cómo donar, Nosotros y FAQ, con chevron propio, `aria-expanded`,
Escape y cierre por clic fuera. La barra inferior móvil conserva cinco destinos y el menú muestra
acceso a sesión y registro. `PageHero` eliminó el círculo decorativo de 9 rem, usa color explícito
para el título sobre azul y redujo el espacio vertical; se reforzó el contraste fotográfico y se
elevaron las áreas táctiles. `/necesidades` e `/instituciones` incorporan buscadores, filtros y
estados de resultado honestos; `InstitucionCard` está preparada para DTO reales sin datos de
ejemplo. `/mensajes` separa bandeja y conversación con vista móvil independiente y sin chats
simulados. `/puntos-de-acopio` usa Leaflet 1.9.4 con teselas de OpenStreetMap, centro verificado
de Huancayo (Wikidata Q468782), zoom, desplazamiento, retorno, geolocalización voluntaria y
estados de permisos; no hay marcadores de negocio, rutas ni ETAs. `/seguimiento/:id` documenta
las limitaciones de geolocalización en PWA y segundo plano. Se corrigieron los avisos de registro
sin activar el envío y se creó `docs/informe-backend-fase-07b1.md` con el contrato para backend.
Build: **562,41 kB** iniciales y **108,35 kB** transferidos, dentro del presupuesto de 600 kB;
pruebas: **9 archivos y 15/15** aprobadas. Persisten únicamente las advertencias de deprecación
de `@import` de Sass. La verificación con CDP y el `git diff --check` final se registran en
`docs/plan-desarrollo.md`. La valoración estética final sigue pendiente de revisión humana; la
Fase 07 de backend no se inicia sin autorización explícita.

**Alcance autorizado de la Fase 07.B.2:** convertir `frontend/` en una aplicación de servicios
comunitarios con catálogo informativo de 41 bienes, buscador local tolerante a tildes, mayúsculas,
sinónimos, singular/plural y aproximación moderada, detalle por producto, guías por categoría,
directorio por tipos de institución y la página editorial «Historias que conectan». Corregir el
borde inferior del hero, usar las seis imágenes nuevas como ilustraciones declaradas, reforzar el
navbar y la barra móvil, robustecer el mapa Leaflet sin puntos inventados y documentar como
propuestas los comentarios, valoraciones, favoritos y el entorno `DonaConectaDB_Pruebas`. No
modificar `backend/` ni `database/`; no instalar dependencias; no activar HTTP, WebSocket,
autenticación, GPS real ni chat; no crear datos de negocio simulados; no ejecutar commits ni push.

**Resultado de la Fase 07.B.2:** rutas nuevas `/explorar`, `/explorar/:categoria` y
`/explorar/:categoria/:producto` con título y metadescripción propios, además de `/historias`.
El buscador de portada lleva «cobijas» a `/explorar?q=cobijas` y muestra Frazadas; el de Explorar
devuelve resultados para «mochilas» y ofrece seis sugerencias. Las categorías son accesos reales
con foto uniforme, sin etiquetas redundantes, y el detalle muestra condiciones, preparación y
relacionados. Instituciones presenta cuatro tipos ilustrativos sin nombres ni verificaciones
inventados; Historias usa las dos ilustraciones nuevas sin testimonios ni puntuaciones. El hero
reserva 5,5 rem para la ola crema y conserva `object-fit: cover` en los cinco anchos medidos.
Leaflet conserva la atribución de OpenStreetMap, cargó 18/18 mosaicos, dejó `.leaflet-pane` en
`absolute` y no muestra marcadores de negocio. La causa del fallo anterior era una compilación de
desarrollo sin `leaflet.css`; el build de producción sí lo incluía. Build: **564,27 kB** iniciales
y **108,82 kB** transferidos, dentro del presupuesto de 600 kB; pruebas: **12 archivos y 28/28**
aprobadas. Verificación CDP: **105 combinaciones** de 27 rutas y siete anchos (360–1920 px) con
0 títulos o metadescripciones ausentes, 0 `h1` duplicados, 0 desbordes, 0 imágenes o anclas rotas,
0 lenguaje técnico, 0 errores de consola y 0 enlaces internos inválidos; menú móvil
`false → true → false`, `Más` con «Historias que conectan» y formulario de donante con 10
controles. Las capturas quedan en `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-07b2-capturas`,
fuera del repositorio. Persisten solo las advertencias de deprecación de `@import` de Sass. La
valoración estética final sigue pendiente de revisión humana; la Fase 07 de backend continúa
pendiente y no se inicia sin autorización explícita.

**Alcance autorizado de la Fase 08.2:** completar, antes de la publicación del Avance 01, el CRUD
real de usuarios con `GET`/`PUT`/`PATCH`/`DELETE`, rediseñar el perfil personal con cuatro
pestañas, documentar todas las operaciones en Swagger, revocar sesiones en el servidor y cifrar el
celular con AES-256-GCM. Actualizar el informe histórico de Fase 08, el plan de desarrollo y este
archivo. Usar sólo `DonaConectaDB_Pruebas`; conservar las cuentas de prueba existentes y no ejecutar
DDL ni DML estructural. No modificar `Jhon`, `main` ni `respaldo-avance-01`; no crear commits, push,
merges ni cambiar de rama. El resultado quedó integrado posteriormente en `Andrea` y `main`.

**Resultado de la Fase 08.2:** once operaciones HTTP documentadas con autenticación, cuerpo y
respuestas; perfil con Información personal, Actividad, Preferencias y Seguridad y privacidad;
navbar actualizado al guardar y logout que revoca el JWT antes de limpiar `sessionStorage`. El
celular se persiste con nonce único, versión de clave y clave fuera del repositorio; la baja es
lógica, exige reautenticación y confirmación, bloquea compromisos activos, revoca sesiones y deja
auditoría. Evidencias: **34/34** comprobaciones de API y SQL, **20/20** de flujo en navegador,
**42/42** de OpenAPI/Swagger, **50/50** pruebas Angular en 20 archivos y **7/7** pruebas Python.
Build: **569,46 kB** iniciales y **110,23 kB** transferidos, dentro del presupuesto de 600 kB.
`DonaConectaDB` sigue con 0 usuarios y las cuatro cuentas previas permanecen `ACTIVO`. Detalle en
`docs/informe-crud-perfil-fase-08.2.md`. La valoración estética final sigue pendiente de revisión
humana y no se ejecutaron commit, push, merge ni cambio de rama.

---

## 18. Requisitos permanentes de arquitectura académica, API REST y base de datos

Esta sección complementa las secciones 3, 6 a 9 y 16. Toda fase posterior debe respetarla.

### 18.1 Arquitectura y capas

- Cliente-servidor: Angular consume APIs HTTP/WebSocket; FastAPI es el único acceso a SQL Server.
- Backend de referencia: `backend/src/backend/` con `apis/`, `repositories/`, `schemas/`,
  `services/`, `database/`, `security/`, `core/`, `websockets/`, `__init__.py` y `main.py`.
- Responsabilidades: las APIs reciben peticiones y verifican autenticación/autorización;
  `schemas/` valida entradas y salidas con Pydantic; `services/` contiene reglas de negocio;
  `repositories/` ejecuta consultas parametrizadas con PyODBC; `database/` gestiona conexiones
  y transacciones; `security/` implementa hashing, cifrado, autenticación y autorización;
  `websockets/` gestiona conexiones autorizadas para mensajería y seguimiento GPS.
- `main.py` solo configura la aplicación y registra enrutamiento; no concentra las
  responsabilidades. Se evita sobreingeniería y se prioriza código explicable en sustentación.
- Evaluar `uv` como gestor de dependencias y entornos siguiendo clases. No instalar todavía,
  no duplicar gestores y no versionar `.venv/`, `__pycache__/` ni `.env`.

### 18.2 API REST

- Usar `GET` para consultar, `POST` para crear, `PUT` para reemplazar completamente, `PATCH`
  para modificar parcialmente y `DELETE` solo cuando las reglas de negocio lo permitan.
- Prohibido usar `GET` para operaciones que modifiquen datos. Diferenciar `PUT` de `PATCH`.
  No implementar métodos innecesarios solo para completar un CRUD.
- Convención propuesta, a validar en Fase 05/07: `/api/v1/usuarios`, `/api/v1/instituciones`,
  `/api/v1/necesidades`, `/api/v1/donaciones`, `/api/v1/entregas`,
  `/api/v1/puntos-de-acopio`, `/api/v1/conversaciones`, `/api/v1/notificaciones` y
  `/api/v1/seguimientos`.
- Emplear parámetros de ruta, parámetros de consulta, filtros, paginación y cuerpos JSON según
  corresponda. Las respuestas usan esquemas Pydantic consistentes.
- Códigos: `200`, `201`, `202`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429` y `500`
  según el caso. Formato de error homogéneo, sin trazas, credenciales ni mensajes de SQL Server.
- FastAPI debe exponer OpenAPI, Swagger UI y ReDoc en desarrollo. En producción se evalúa
  restringir la documentación. Cada operación documenta parámetros, esquemas, respuestas,
  errores, autenticación y permisos.
- Proteger la trazabilidad de donaciones, entregas y recepciones; preferir baja lógica o
  cambios de estado antes que eliminación física cuando existan relaciones.

### 18.3 Frontend Angular

- Mantener la arquitectura modular existente: interfaces TypeScript, servicios, páginas,
  layouts, componentes, rutas, guards e interceptores dentro de los módulos funcionales.
- Usar `HttpClient` y Observables para APIs reales; centralizar errores, sesión y headers en
  servicios/interceptores. Evitar llamadas repetitivas o lógica de negocio dentro de componentes.
- No conectar Angular directamente con SQL Server ni usar `localStorage` como base de datos.

### 18.4 Base de datos y tiempo real

- Diseñar modelos conceptual, lógico y físico; entidad-relación, cardinalidades, 1FN, 2FN y
  3FN; PK, FK, `UNIQUE`, `CHECK`, integridad referencial, JOIN, vistas y procedimientos
  justificados; índices, transacciones, concurrencia, respaldos, restauración y auditoría.
- REST persiste operaciones y consulta datos reales. WebSockets solo transporta eventos de
  mensajería privada, GPS autorizado, cambios de estado y notificaciones; valida identidad y
  autorización de cada participante y persiste lo necesario en SQL Server.
- No rastreo permanente, no coordenadas públicas y no sustituir confirmación de recepción por GPS.

### 18.5 Trabajo en equipo y alcance actual

- El frontend se trabaja en `frontend/`; backend y base de datos en `backend/` y `database/`.
  No modificar ramas ni archivos de otro integrante sin coordinación.
- Acordar antes de implementar: modelo de datos, nombres de campos, rutas, métodos HTTP,
  esquemas JSON, estados, reglas de negocio, contratos de integración y seguridad.
- **Alcance actual:** la Fase 06 implementó físicamente el modelo único compartido en
  `docs/modelo-*.md`, `docs/diccionario-datos.md`, `docs/normalizacion.md`,
  `docs/reglas-negocio.md` y `docs/contrato-api.md`, con scripts en `database/scripts/`. No crear
  backend, dependencias Python ni nuevas tablas sin autorización de fase. No reorganizar el
  frontend existente ni interrumpir o reemplazar Fase 04.4. El único modelo válido para el equipo
  sigue siendo el de Fase 05.1, ahora desplegado en `DonaConectaDB`.

### 18.6 Alcance autorizado de la Fase 09 (Avance 02)

- Trabajar exclusivamente en `Andrea`, conservando íntegramente el Avance 01 (`1d5bc00`).
  No modificar `main`, `Jhon` ni `respaldo-avance-01`; no ejecutar commit, push, merge, rebase,
  `reset --hard` ni `git clean`.
- Usar únicamente `DonaConectaDB_Pruebas` para datos sintéticos y verificaciones. `DonaConectaDB`
  permanece intacta; `ALLOW_MAIN_DB_WRITES=no` sigue vigente.
- No ejecutar DDL. Se permite preparar y ejecutar DML idempotente/transaccional de catálogos
  (productos de bienes materiales) sólo después de verificar que el destino es la base de pruebas.
- Se autoriza aprovisionar localmente una cuenta administrativa sintética en la base de pruebas
  mediante un mecanismo que lea la contraseña de un secreto local o la solicite por consola.
  La contraseña no se versiona, no se muestra en informes ni se fija en el código fuente; el rol
  `ADMINISTRADOR` se asigna con el modelo real y el registro público sigue sin poder crearlo.
- Implementar panel administrativo y panel institucional, verificación con auditoría transaccional,
  directorio público real, catálogo SQL, CRUD de necesidades y resultados reales en Explorar.
- Reutilizar los endpoints y repositorios ya integrados de Jhon cuando sean válidos; no duplicar
  operaciones innecesariamente ni simular datos, sesiones, GPS, chat o pruebas no ejecutadas.

**Resultado de la Fase 09:** paneles reales con 14 operaciones nuevas documentadas en OpenAPI,
verificación con historial y auditoría transaccionales, catálogo SQL de 41 bienes con unidad
neutral `UN`, CRUD de necesidades con `fila_version` y resultados reales en Explorar. Cuenta
administrativa sintética aprovisionada con secreto local y Argon2id; roles vigentes restaurados al
reactivar cuentas. Catalogación ejecutada dos veces con recuentos idénticos en
`DonaConectaDB_Pruebas`; `DonaConectaDB` intacta. Evidencias: 21/21 + 21/21 comprobaciones de API,
1789/1789 en navegador (28 rutas y 404 × siete anchos), 69/69 pruebas Angular, 24/24 pruebas
Python y build de 583,23 kB iniciales. Detalle en `docs/informe-paneles-fase-09.md`. La valoración
estética final sigue pendiente de revisión humana; no se ejecutaron commit, push ni cambio de rama.

### 18.7 Alcance autorizado de la Fase 09.1

- Trabajar exclusivamente en `Andrea`, conservando íntegramente Avance 01 y Fase 09. No modificar
  `main`, `Jhon` ni `respaldo-avance-01`; no ejecutar commit, push, merge, rebase, `reset --hard`
  ni `git clean`.
- Usar solo lecturas reales de `DonaConectaDB_Pruebas`. No ejecutar DDL ni DML de negocio;
  `DonaConectaDB` permanece intacta y `ALLOW_MAIN_DB_WRITES=no` sigue vigente.
- Reutilizar los endpoints y repositorios de Fase 09; agregar sólo lecturas públicas mínimas con
  DTO explícitos, sin coordenadas, correos de representantes, hashes ni auditoría.
- Convertir Explorar, detalle de necesidades, directorio, perfiles e Inicio en una experiencia
  con datos SQL reales, estados honestos y accesos por rol. No inventar necesidades,
  instituciones, contactos, horarios, GPS, chat ni sesiones.
- Calcular disponibilidad desde `vw_disponibilidad_necesidad` y avance desde
  `vw_progreso_necesidad`. No sumar unidades incompatibles ni presentar una unidad global.
- Preparar, sin ejecutar, una propuesta reversible para la codificación mojibake y documentar
  la normalización de unidades pendiente de autorización.
- Verificar build, pruebas, API, OpenAPI, CDP responsive, `git diff --check` y `git status`.

**Resultado de la Fase 09.1:** tres lecturas públicas nuevas con DTO Pydantic, filtros reales,
determinismo en `TOP 1`, escape de comodines `LIKE`, fechas UTC, filtro de punto de acopio activo
y de su institución, y `response_model` en los dos listados que lo omitían. Frontend con ficha de
necesidad por producto/unidad, compromiso restringido a donantes, directorio por
`tipo.codigo`, perfil público sin contactos inventados, tarjeta reutilizable y accesos de Inicio
por rol. Se corrigió la URL real de verificación administrativa y defectos de accesibilidad y
estados. Evidencias: **34/34** pruebas Python, **70/70** Angular, **2179/2179** comprobaciones CDP
en 34 rutas y siete anchos, 10 respuestas API verificadas, OpenAPI de 31 rutas/39 operaciones/
54 esquemas y build de 585,95 kB iniciales. No se ejecutó DDL, DML, commit, push ni cambio de rama.
El SP actual no garantiza duplicados por donante en concurrencia verdadera; la corrección de
mojibake y de unidades queda pendiente de autorización. Detalle en
`docs/informe-experiencia-directorio-fase-09.1.md`. La valoración estética final sigue pendiente
de revisión humana.

### 18.8 Alcance autorizado del cierre funcional de la entrega

- Trabajar exclusivamente en `Andrea`, conservando Avance 01, Fase 09 y Fase 09.1. No modificar
  `main`, `Jhon` ni `respaldo-avance-01`; no ejecutar commit, push, merge, rebase, `reset --hard`
  ni `git clean`.
- Usar únicamente `DonaConectaDB_Pruebas` para el flujo y las verificaciones. No ejecutar DDL;
  la corrección de codificación y los datos sintéticos se hicieron con scripts idempotentes
  (`011` y `012`) bajo la guarda de base autorizada. `DonaConectaDB` permanece intacta y
  `ALLOW_MAIN_DB_WRITES=no`.
- Integrar compromisos con persistencia real, puntos y horarios, entregas y recepciones, chat
  persistente, notificaciones y GPS con consentimiento, sin inventar datos, sesiones, GPS,
  mensajes ni estadísticas. El transporte WebSocket queda fuera de este cierre: se usa polling
  HTTP y se documenta como mejora futura.
- Registrar en OpenAPI las operaciones nuevas, mantener la autorización en backend por rol y
  propiedad, conservar Argon2id, AES-256-GCM, sesiones revocables y consultas parametrizadas.
- Verificar de forma enfocada: flujo API real, comprobaciones negativas, pruebas Python y
  Angular, build y `git diff --check`. No repetir las 2179 comprobaciones CDP de Fase 09.1.

**Resultado del cierre funcional:** flujo integral **12/12** en `DonaConectaDB_Pruebas` y
autorización **4/4**; OpenAPI con **47 rutas, 59 operaciones y 89 esquemas**; **75/75** pruebas
Python y **88/88** Angular en 33 archivos; build de **590,83 kB** iniciales y **114,74 kB**
transferidos. Se corrigieron el orden de routers en `main.py`, las columnas físicas leídas por
`_fila_compromiso` y el uso de `OUTPUT INSERTED.*` en lugar de `SCOPE_IDENTITY()` en mensajes,
conversaciones y sesiones GPS. Los mensajes quedan cifrados en SQL Server y las coordenadas
sólo se publican con autorización registrada. Persisten como pendientes el WebSocket de
mensajería/GPS, la corrección concurrente del procedimiento de compromisos y la valoración
estética humana. Detalle en `docs/informe-implementacion-final.md` y
`docs/contrato-integracion-final.md`. No se ejecutaron commit, push ni cambio de rama.
