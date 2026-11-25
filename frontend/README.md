# Frontend — DonaConecta

Proyecto Angular 22 existente, trasladado a esta carpeta en la Fase 03 sin haber sido
regenerado.

## Comandos

Ejecutar siempre desde esta carpeta:

```bash
npm ci          # primera vez o tras restaurar dependencias
npm start       # servidor de desarrollo en http://localhost:4200/
npm run build   # compilación de producción
npm test        # pruebas unitarias (Vitest)
```

## Estructura

```
src/
├── main.ts
├── index.html
├── styles.scss              → estilos globales (tokens en Fase 04)
├── styles/                  → future tokens, mixins y overrides de Bootstrap
└── app/
    ├── core/                → servicios globales, guardias e interceptores
    ├── shared/              → componentes reutilizables
    ├── layouts/             → plantillas de página
    ├── features/            → módulos funcionales (se crearán en fases posteriores)
    ├── app.ts / app.html / app.scss
    ├── app.config.ts
    └── app.routes.ts
public/                      → assets estáticos (configurado en angular.json)
```

## Regla de diseño

Bootstrap 5 será la herramienta principal (~85%) y el CSS/SCSS personalizado se reserva
para la identidad visual (~15%). Proporción orientativa, no medición de líneas.
Bootstrap **no está instalado todavía**; su incorporación corresponde a la Fase 04.
Consultar `AGENTS.md` en la raíz del repositorio.
