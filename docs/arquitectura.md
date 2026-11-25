# Arquitectura de DonaConecta

Este documento describe la organización general del proyecto tras la Fase 04.2.

## 1. Arquitectura cliente-servidor

DonaConecta sigue una arquitectura cliente-servidor modular y por capas:

```
[Navegador]  →  [Frontend Angular]  →  [API REST FastAPI]  →  [SQL Server]
                    (frontend/)          (backend/)             (database/)
```

El frontend se ejecuta en el navegador y únicamente consume APIs HTTP. El backend es el
único componente autorizado para acceder a SQL Server. Esta separación evita exponer la
base de datos al cliente y permite aplicar autorización y validaciones en un solo lugar.

## 2. Responsabilidades del frontend (`frontend/`)

- Renderizar la interfaz: landing, catálogo, formularios, dashboards y estados visuales.
- Gestionar navegación, guardias de ruta, sesión del usuario y errores de petición.
- Enviar todas las operaciones de negocio al backend mediante `HttpClient`.
- Aplicar Bootstrap 5 como herramienta principal de estructura, responsive y componentes,
  con personalización global vía Sass para la identidad visual.
- Organizarse en `core/`, `shared/`, `layouts/`, `features/`, `services/`, `guards/`,
  `interceptors/`, `interfaces/` y `styles/`.

No contiene lógica de persistencia ni acceso directo a SQL Server.

## 3. Responsabilidades del backend (`backend/`)

- Exponer endpoints REST con FastAPI y validar entradas/salidas con Pydantic.
- Aplicar autorización por roles en cada operación sensible.
- Ejecutar reglas de negocio en la capa `services/`.
- Realizar consultas parametrizadas en `repositories/` con `pyodbc`.
- Coordinar transacciones, históricos y auditoría.

## 4. Responsabilidades de SQL Server

- Almacenar la información real del sistema en `DonaConectaDB`.
- Garantizar integridad mediante claves primarias, foráneas, `UNIQUE` y `CHECK`.
- Mantener la normalización hasta 3FN.
- Soportar transacciones para compromisos, cancelaciones y recepciones.

## 5. Comunicación mediante APIs REST y JSON

El contrato entre frontend y backend es HTTP/JSON. El frontend envía peticiones
(`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) y el backend responde con códigos de estado y
cuerpos JSON validados por esquemas Pydantic. Las credenciales se manejan con tokens y
configuración en variables de entorno, nunca en el código fuente ni en `localStorage`
como sustituto de la base de datos.

## 6. Organización de carpetas

```
DonaConecta/
├── AGENTS.md          → reglas permanentes del proyecto
├── README.md          → documentación general
├── .gitignore         → archivos generados y secretos ignorados
├── frontend/          → proyecto Angular existente, conservado íntegramente
├── backend/           → API REST (preparada, sin implementar aún)
├── database/          → scripts T-SQL versionados (sin crear aún)
└── docs/              → documentación técnica y decisiones
```

No se crearon repositorios Git anidados. La raíz sigue siendo el único repositorio.

## 7. Justificación de la separación por capas

- **Claridad para sustentación:** cada responsabilidad tiene un lugar identifiable.
- **Seguridad:** la autorización y las consultas parametrizadas viven en el backend.
- **Mantenibilidad:** cambios en la interfaz no obligan a cambiar persistencia y viceversa.
- **Integridad:** las reglas de concurrencia de cantidades se controlan en backend y SQL Server.
- **Rúbrica académica:** facilita evidenciar frontend, backend y base de datos por separado.

La arquitectura es deliberadamente simple: no se introducen ORM ni patrones complejos
que dificulten explicar el código en la sustentación.

## 8. Decisiones técnicas tomadas en la Fase 03

1. Se trasladó el proyecto Angular existente a `frontend/` con `git mv`, sin regenerarlo.
2. Se conservaron `src/`, `public/`, `angular.json`, `package.json`, `package-lock.json`
   y los `tsconfig*.json`; sus rutas internas son relativas al proyecto y siguen válidas.
3. Se mantuvieron `node_modules/`, `dist/` y `.angular/` fuera del código fuente versionado.
4. Se dejó `.vscode/` en la raíz como configuración general del repositorio y se ajustaron
   las tareas npm para ejecutarlas dentro de `frontend/`.
5. Se amplió `.gitignore` para ignorar dependencias, artefactos y secretos en cualquier
   nivel del repositorio, permitiendo versionar `.env.example`.
6. Bootstrap 5 continúa reservado como herramienta principal; su instalación y
   personalización se difiere a la Fase 04 según `AGENTS.md`.

## 9. Estado real al cierre de la Fase 03

El frontend Angular fue reorganizado y se verificó su compilación y sus pruebas. El
backend y la base de datos **no están implementados**; solo se prepararon sus carpetas
y documentación. Los resultados concretos de build y pruebas se registran en el informe
de entrega de la fase.

## 10. Navegación SPA (Fase 04.2)

La Fase 04 transformó la portada y la Fase 04.2 la convirtió en una SPA multipágina:

```
app.ts (RouterOutlet)
└── PublicLayout
    ├── Navbar (RouterLink + RouterLinkActive)
    ├── <main id="contenido-principal"> → RouterOutlet
    │   ├── /                     → Landing (lazy)
    │   ├── /como-donar           → ComoDonar (lazy)
    │   ├── /nosotros             → Nosotros (lazy)
    │   ├── /preguntas-frecuentes → PreguntasFrecuentes (lazy)
    │   └── /**                   → NotFoundPage (lazy)
    └── Footer (RouterLink)
```

- `app.config.ts` registra `provideRouter(routes)`, `withInMemoryScrolling` y una
  `TitleStrategy` propia que actualiza título y metadescripción por ruta.
- `core/seo/dona-title-strategy.ts` centraliza el SEO sin dependencias adicionales.
- Todas las páginas usan `loadComponent`, de modo que el bundle inicial se mantiene por debajo
  del presupuesto de 500 kB y cada sección se descarga bajo demanda.
- Las rutas privadas futuras añadirán guards de Angular como ayuda de navegación; la
  autorización definitiva permanecerá en el backend.
- El mapa completo de rutas implementadas y planificadas está en `docs/mapa-navegacion.md`.

## 11. Requisitos académicos permanentes (registro actual)

Estos requisitos complementan lo anterior y son obligatorios desde la Fase 05. La norma
completa está en `AGENTS.md`, sección 18; aquí se resume la organización acordada.

- Cliente-servidor: Angular consume HTTP/WebSocket; FastAPI es el único acceso a SQL Server.
- Backend de referencia: `backend/src/backend/` con `apis/`, `repositories/`, `schemas/`,
  `services/`, `database/`, `security/`, `core/`, `websockets/`, `__init__.py` y `main.py`.
  `backend/tests/` y los archivos de configuración se crearán cuando exista una necesidad real.
- `main.py` solo configura la aplicación y registra enrutamiento; no concentra responsabilidades.
- `uv` se evaluará en la Fase 07 siguiendo el procedimiento de clases. No se instala todavía,
  no se duplican gestores y no se versionan `.venv/`, `__pycache__/` ni `.env`.

## 12. Separación de responsabilidades por capa

| Capa | Responsabilidad |
|---|---|
| `apis/` | Reciben solicitudes HTTP, verifican autenticación/autorización, invocan servicios y devuelven respuestas. |
| `schemas/` | Modelos Pydantic que validan entradas y salidas de las APIs. |
| `services/` | Reglas de negocio, validaciones funcionales y coordinación de operaciones. |
| `repositories/` | Consultas parametrizadas a SQL Server mediante PyODBC. |
| `database/` | Conexiones, transacciones y configuración de acceso a SQL Server. |
| `security/` | Hashing Argon2id, cifrado evaluado, autenticación, autorización y protección de credenciales. |
| `websockets/` | Conexiones autorizadas para mensajería privada y seguimiento GPS en tiempo real. |

## 13. Contrato REST y documentación

- `GET` consulta, `POST` crea, `PUT` reemplaza por completo, `PATCH` modifica parcialmente y
  `DELETE` solo cuando las reglas de negocio lo permitan. Prohibido `GET` que modifique datos;
  no se implementan métodos innecesarios solo para completar un CRUD.
- Convención propuesta, a validar en Fase 05/07: `/api/v1/usuarios`, `/api/v1/instituciones`,
  `/api/v1/necesidades`, `/api/v1/donaciones`, `/api/v1/entregas`, `/api/v1/puntos-de-acopio`,
  `/api/v1/conversaciones`, `/api/v1/notificaciones` y `/api/v1/seguimientos`.
- Parámetros de ruta, consulta, filtros, paginación y cuerpos JSON según corresponda; respuestas
  con esquemas Pydantic consistentes.
- Códigos: `200`, `201`, `202`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429` y `500`.
  Formato de error homogéneo, sin trazas, credenciales ni mensajes de SQL Server.
- OpenAPI, Swagger UI y ReDoc disponibles en desarrollo; en producción se evalúa restringirlos.
  Cada operación documenta parámetros, esquemas, respuestas, errores, autenticación y permisos.
- Donaciones, entregas y recepciones conservan su trazabilidad: se prefiere baja lógica o
  cambio de estado antes que eliminación física cuando existen relaciones.

## 14. Modelo de datos y tiempo real

- Modelos conceptual, lógico y físico; entidad-relación y cardinalidades; 1FN, 2FN y 3FN;
  PK, FK, `UNIQUE`, `CHECK`, integridad referencial, `JOIN`, vistas y procedimientos
  justificados; índices, transacciones, control de concurrencia, respaldos, restauración
  y auditoría.
- El modelo contemplará usuarios, donantes voluntarios, instituciones y su verificación,
  roles y permisos, directorio público, necesidades, categorías de bienes, compromisos,
  entregas parciales y totales, confirmaciones de recepción, puntos de acopio, horarios,
  GPS autorizado, chat privado, notificaciones, evidencias, historiales, dashboards
  y auditoría. Solo bienes materiales: sin pagos ni transferencias.
- REST persiste cada operación y consulta datos reales. WebSockets solo transporta eventos de
  mensajería privada, GPS autorizado, cambios de estado y notificaciones; valida identidad y
  autorización de cada participante y persiste lo necesario en SQL Server. Sin rastreo
  permanente, coordenadas públicas ni GPS como sustituto de la confirmación de recepción.

## 15. Seguridad y trabajo en equipo

- Argon2id para contraseñas; AES-256-GCM evaluado solo para datos recuperables que lo justifiquen;
  HTTPS/TLS y WSS según entorno; CORS restringido, rate limiting y errores sin trazas.
- Autorización en backend por rol **y** propiedad del recurso, también en WebSockets. Los guards
  de Angular son ayuda de navegación, no control definitivo.
- El frontend se trabaja en `frontend/`; backend y base de datos en `backend/` y `database/`.
  No se modifican ramas ni archivos de otro integrante sin coordinación. Antes de implementar
  se acuerdan modelo de datos, nombres de campos, rutas, métodos HTTP, esquemas JSON, estados,
  reglas de negocio, contratos de integración y seguridad.
- **Estado actual:** solo se registra documentación. No hay backend instalado, tablas
  definitivas ni scripts SQL. La Fase 04.4 permanece intacta y la Fase 05 sigue pendiente de
  autorización explícita.
