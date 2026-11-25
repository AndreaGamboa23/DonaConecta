# DonaConecta

Plataforma web de impacto social que conecta ciudadanos donantes con organizaciones
sociales, comedores comunitarios, albergues infantiles y refugios de animales de
Huancayo, Junín, Perú.

DonaConecta gestiona **exclusivamente donaciones de bienes materiales**. No procesa
pagos, transferencias bancarias ni donaciones monetarias. Su propósito es mejorar la
organización, comunicación, coordinación y seguimiento de las donaciones.

Proyecto universitario de Ingeniería de Sistemas e Informática — Universidad Continental.

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | Angular 22, TypeScript, HTML5, Bootstrap 5, SCSS/CSS |
| Backend | Python 3.13, FastAPI, Uvicorn, Pydantic |
| Base de datos | Microsoft SQL Server 2025 Express, T-SQL, pyodbc |
| Herramientas | Git, GitHub, OpenCode, Visual Studio Code |

Bootstrap 5 es la herramienta principal de diseño. El CSS/SCSS personalizado se reserva
para la identidad visual propia, siguiendo la regla registrada en `AGENTS.md`.

## Estructura del repositorio

```
DonaConecta/
├── AGENTS.md      → reglas permanentes de desarrollo
├── README.md      → este documento
├── .gitignore     → artefactos generados y secretos
├── frontend/      → proyecto Angular existente
├── backend/       → API REST (preparada, sin implementar aún)
├── database/      → scripts T-SQL versionados (sin crear aún)
└── docs/          → arquitectura, diseño, requisitos, navegación, seguridad y plan por fases
```

No existen repositorios Git anidados. La raíz es el único repositorio.

## Ejecutar Angular

Las dependencias se instalan dentro de `frontend/`. Comandos actualizados tras la
reorganización de la Fase 03:

```bash
cd frontend
npm ci          # primera vez o para restaurar dependencias según package-lock.json
npm start       # http://localhost:4200/
npm run build   # compilación de producción
npm test        # pruebas unitarias con Vitest
```

También puede ejecutarse sin entrar a la carpeta:

```bash
npm --prefix frontend run build
```

## Estado real del desarrollo

- **Frontend:** proyecto Angular 22 conservado íntegramente en `frontend/`. Bootstrap 5 y
  las fuentes Manrope/Inter están instaladas y personalizadas globalmente. La Fase 04 incluye
  una portada editorial con hero, franja de confianza, catálogo en mosaico, línea de tiempo,
  sección de propósito social y CTA comunitario. La Fase 04.2 añade una SPA con rutas reales:
  `/`, `/como-donar`, `/nosotros`, `/preguntas-frecuentes` y una 404 propia, con títulos,
  metadescripción, scroll por fragmentos y carga diferida. No se integraron fotografías: hay
  una lista exacta de imágenes autorizadas pendientes y sus puntos de conexión. Los módulos de
  negocio, formularios, dashboards y conexión con APIs **no están implementados**.
- **Backend:** carpeta preparada con documentación. **No hay endpoints, dependencias
  instaladas ni entorno virtual.**
- **Base de datos:** carpeta preparada. **No se ha creado `DonaConectaDB`, no hay tablas
  ni scripts de modificación.**

## Documentación

- `AGENTS.md`: reglas obligatorias de trabajo, tecnologías, diseño, seguridad, metodología y
  calidad visual permanente.
- `docs/arquitectura.md`: arquitectura cliente-servidor y navegación SPA.
- `docs/sistema-diseno.md`: tokens, composición, accesibilidad, fotografía pendiente y
  evidencia de verificación de las fases 04 y 04.2.
- `docs/decisiones-tecnicas.md`: decisiones nuevas y advertencias de dependencias.
- `docs/requisitos-funcionales.md` y `docs/requisitos-no-funcionales.md`: qué hace el sistema
  y con qué criterios de calidad.
- `docs/mapa-navegacion.md`: rutas implementadas, fragmentos y rutas planificadas no enlazadas.
- `docs/seguridad-privacidad.md`: estrategia progresiva de seguridad y privacidad.
- `docs/plan-desarrollo.md`: fases 01 a 20 con alcance y estado real.
- `backend/README.md`, `database/README.md`: alcance previsto y estado real.

El desarrollo continúa por fases autorizadas. Consultar `AGENTS.md` antes de cualquier
modificación.
