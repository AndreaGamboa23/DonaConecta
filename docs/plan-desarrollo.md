# Plan de desarrollo por fases

Plan definitivo registrado en `AGENTS.md`. Los alcances se ejecutan solo con autorización
explícita; no se adelanta una fase sin esa autorización.

| Fase | Alcance | Estado |
|---|---|---|
| 01 | Diagnóstico técnico. | Ejecutada |
| 02 | Creación de `AGENTS.md`. | Ejecutada |
| 03 | Organización de arquitectura en `frontend/`, `backend/`, `database/` y `docs/`. | Ejecutada |
| 04 | Diseño visual profesional, Bootstrap e identidad original. | Ejecutada |
| 04.2 | Ampliación funcional documental, navegación pública independiente y plan de seguridad. | Ejecutada |
| 04.3 | Rediseño fotográfico con ilustraciones generadas, optimización WebP y verificación responsive. | Ejecutada |
| 04.4 | Contraste legible del hero, imagen principal confirmada y portada como acceso a servicios. | Ejecutada |
| 05 | Modelo entidad-relación y normalización 3FN. | Ejecutada (propuesta revisada en 05.1) |
| 05.1 | Revisión, corrección y documentación técnica del modelo. | Ejecutada |
| 06 | Implementación de Microsoft SQL Server. | Pendiente, requiere autorización |
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

## 1. Alcance ejecutado en la Fase 04.2

- Actualización de `AGENTS.md` con navegación SPA, seguridad/privacidad y planificación.
- Documentos nuevos: requisitos funcionales y no funcionales, mapa de navegación,
  seguridad/privacidad y este plan.
- Actualización de arquitectura, sistema de diseño, decisiones técnicas y READMEs.
- Revisión de la arquitectura de rutas: `PublicLayout`, lazy loading, `TitleStrategy` para
  título y metadescripción, `withInMemoryScrolling` y 404 personalizada.
- Implementación de `/como-donar`, `/nosotros` y `/preguntas-frecuentes` con información real
  y sin datos inventados.
- Conexión de navbar, footer, marca y CTA de la portada con rutas y fragmentos reales.
- Verificación de build, pruebas, enlaces, menú móvil, responsive y estado de Git.

**No ejecutado:** GPS real, mensajería, autenticación, cifrado de datos de negocio, APIs,
creación de base de datos, tablas ni pantallas simuladas de módulos futuros.

## 2. Dependencias entre fases

1. La Fase 05 (modelo 3FN) precede a la creación de tablas en la Fase 06.
2. La Fase 07 (backend) habilita la autenticación de la Fase 09 y los módulos de datos desde
   la Fase 10.
3. Los dashboards de la Fase 17 requieren los registros reales generados entre las fases 10 y 16.
4. La PWA de la Fase 18 se implementa después de definir autenticación y sincronización segura.
5. Las pruebas integrales de la Fase 19 se ejecutan sobre el sistema completo, no sobre simulaciones.

## 3. Criterio de cierre de cada fase

No se declara terminada una fase sin evidencia de compilación, pruebas, integración con las APIs
correspondientes, persistencia cuando aplique, revisión responsive, revisión de Bootstrap frente
a CSS propio, documentación y propuesta de commit. El commit se propone, nunca se ejecuta
automáticamente.

## 4. Resultado de la Fase 05.1

Se crearon y validaron documentalmente:

- `docs/modelo-conceptual.md`, `docs/modelo-entidad-relacion.md`, `docs/modelo-logico.md`,
  `docs/modelo-fisico.md`, `docs/diccionario-datos.md`, `docs/normalizacion.md`,
  `docs/reglas-negocio.md` y `docs/contrato-api.md`.
- Actualizaciones de `docs/seguridad-privacidad.md`, `docs/decisiones-tecnicas.md`,
  `docs/plan-desarrollo.md` y `AGENTS.md`.

Resultado: **42 tablas** organizadas en ocho módulos, ocho diagramas Mermaid validados,
normalización demostrada con cuatro ejemplos, matriz de estados, fórmula de disponibilidad sin
doble conteo, contrato REST con los cinco métodos y eventos WebSocket.

**No ejecutado:** DDL, DML, creación de `DonaConectaDB`, instalación de dependencias,
implementación de FastAPI, modificación del frontend, formularios simulados ni datos inventados.
La validación fue documental; las pruebas reales de SQL Server y concurrencia quedan pendientes.

## 5. Prioridad funcional posterior a la base y la API

Una vez implementados SQL Server (Fase 06) y FastAPI (Fase 07), se prioriza:

1. Registro voluntario con selección “Quiero donar” / “Represento una institución”.
2. Inicio de sesión y perfil.
3. Verificación institucional.
4. Catálogo de bienes y necesidades.
5. Compromisos de donación.
6. Chat privado de consultas sobre necesidades reales.
7. Mapas y seguimiento GPS.
8. Notificaciones.

El chat de consultas se implementa antes del GPS porque solo requiere usuarios, instituciones
verificadas y necesidades reales. La aplicación sigue siendo una plataforma de servicios: no se
sustituye por una página institucional ni se rellena con pantallas falsas.

## 6. Plan exacto para la Fase 06 (solo con autorización)

1. Verificar permisos de creación de base de datos en `.\SQLEXPRESS` y crear `DonaConectaDB`.
2. Verificar en la instancia real las capacidades de cifrado nativo antes de elegirlas.
3. Crear esquema `dbo`, catálogos base y sembrar **solo** valores administrativos reales:
   roles, permisos, distritos de Huancayo, tipos de institución, categorías de bienes y
   unidades de medida. Sin instituciones, usuarios, donaciones ni ubicaciones inventadas.
4. Crear las 42 tablas en orden de dependencia con PK, FK `NO ACTION`, `UNIQUE`, `CHECK`,
   `DEFAULT` y `ROWVERSION` según `docs/modelo-fisico.md`.
5. Crear los índices justificados, las nueve vistas y los dos procedimientos almacenados.
6. Crear cuenta de aplicación con mínimo privilegio (DML, sin DDL en producción) y probar
   conexión parametrizada con `ODBC Driver 18`.
7. Ejecutar consultas de comprobación etiquetadas como prueba y retirarlas antes de avanzar.
8. Probar concurrencia: dos compromisos simultáneos, vencimiento sin limpieza, recepción parcial
   y confirmaciones duplicadas. Registrar resultados reales; no afirmar éxito sin evidencia.
9. Configurar respaldo inicial y prueba de restauración fuera del repositorio.
10. Actualizar documentación con evidencias y proponer commit descriptivo sin ejecutarlo.

## 7. Reparto de trabajo

- **Frontend:** contratos DTO e interfaces derivadas del modelo, servicios `HttpClient`,
  interceptor, guards y formularios reactivos sin datos simulados. No se activan rutas privadas
  hasta que exista autenticación real.
- **Backend/base de datos:** Fase 06 (DDL, catálogos, vistas, procedimientos, cuenta y respaldo)
  y Fase 07 (`pyproject.toml`/`uv.lock`, `backend/src/backend/`, PyODBC, Pydantic, OpenAPI).
- **Coordinación previa:** nombres de tablas y columnas, códigos de estado, rutas, métodos HTTP,
  JSON de respuesta, formato de error y eventos WebSocket. Se usa un único modelo: el de esta
  fase. `backend/README.md` se corrige de forma coordinada en Fase 07.
