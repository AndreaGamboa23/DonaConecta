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
