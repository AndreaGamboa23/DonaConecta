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
├── styles.scss              → entrada única: fuentes, tokens, Bootstrap y overrides
├── styles/                  → tokens, global, components y bootstrap-overrides
└── app/
    ├── core/seo/            → DonaTitleStrategy (título y metadescripción por ruta)
    ├── shared/components/   → brand, icon, navbar y footer reutilizables
    ├── layouts/             → public-layout (skip link, navbar, main y footer)
    ├── features/
    │   ├── landing/         → landing.ts + sections/ (seis bloques standalone)
    │   ├── como-donar/      → guía pública de donación
    │   ├── nosotros/        → propósito y compromisos
    │   ├── preguntas-frecuentes/ → preguntas y estado real de módulos
    │   └── not-found/       → página 404
    ├── app.ts / app.html / app.scss
    ├── app.config.ts        → provideRouter, scroll y TitleStrategy
    └── app.routes.ts        → rutas públicas con loadComponent
public/
├── favicon.svg              → símbolo original corazón formado por manos
└── assets/images/README.md  → imágenes autorizadas pendientes y puntos de integración
```

## Regla de diseño

Bootstrap 5 está instalado localmente y es la herramienta principal (~85%); el CSS/SCSS
personalizado se reserva para la identidad visual (~15%). Proporción orientativa, no
medición de líneas. Consultar `docs/sistema-diseno.md` y `AGENTS.md` en la raíz.

## Navegación

Rutas públicas activas: `/`, `/como-donar`, `/nosotros`, `/preguntas-frecuentes` y 404.
Todas usan `loadComponent` y comparten `PublicLayout`. El detalle de rutas, títulos, fragmentos
y rutas planificadas está en `../docs/mapa-navegacion.md`.
