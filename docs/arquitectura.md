# Arquitectura de DonaConecta

Este documento describe la organización general del proyecto tras la Fase 03.

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
