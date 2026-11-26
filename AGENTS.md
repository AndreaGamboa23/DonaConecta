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
| 07 | Backend FastAPI, conexión y arquitectura de servicios. | Pendiente |
| 08 | Landing definitiva y navegación pública integrada. | Pendiente |
| 09 | Autenticación segura, registro, sesiones y roles. | Pendiente |
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
