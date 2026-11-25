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
| Backend | Python 3.13, FastAPI, Uvicorn, Pydantic |
| Base de datos | Microsoft SQL Server 2025 Express, T-SQL, pyodbc |
| Versionamiento y herramientas | Git, GitHub, OpenCode, Visual Studio Code |

- No sustituir estas tecnologías.
- No agregar dependencias innecesarias. Toda dependencia nueva debe justificarse
  técnicamente y documentarse en `docs/decisiones-tecnicas.md`.
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

**Backend:** `main.py`, `core`, `routers`, `services`, `repositories`, `models`,
`schemas`, `database`, `dependencies`, `tests`.

Separar correctamente presentación, lógica de negocio y persistencia. El frontend nunca
accede directamente a SQL Server: toda operación pasa por APIs REST reales.

---

## 7. Base de datos

- Microsoft SQL Server es la **única base de datos principal**.
- Instancia local: `.\\SQLEXPRESS`. Base propuesta: `DonaConectaDB`.
- Controlador: `ODBC Driver 18 for SQL Server`. Autenticación local: Windows.
- `Encrypt=yes` y `TrustServerCertificate=yes` **solo en el entorno local autorizado**.
  En producción debe validarse un certificado confiable (`TrustServerCertificate=no`).
- Normalización hasta **tercera forma normal (3FN)**.
- Usar claves primarias, claves foráneas, restricciones `UNIQUE` y `CHECK`,
  integridad referencial, campos obligatorios, índices justificados y transacciones.
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
- Validación de archivos: extensión, MIME, tamaño y nombre.
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
| 05 | Modelo entidad-relación y normalización 3FN. | Pendiente |
| 06 | Implementación de Microsoft SQL Server. | Pendiente |
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
