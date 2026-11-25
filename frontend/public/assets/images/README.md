# Recursos visuales pendientes — DonaConecta

Esta carpeta está preparada para recibir fotografías autorizadas. **Actualmente no contiene
imágenes**: el diseño usa composiciones SVG originales mientras se consiguen recursos con
licencia verificable.

Regla: solo incorporar fotografías con licencia verificable o proporcionadas por el usuario,
documentando autor, fuente y licencia en `docs/sistema-diseno.md`. Las fotografías son
ilustrativas: **no deben presentarse como actividades reales de DonaConecta** y llevan una
aclaración visible en la interfaz.

## Imágenes solicitadas

| Archivo sugerido | Tema | Orientación | Resolución mínima | Sección |
|---|---|---|---|---|
| `hero-comunidad.webp` | Personas de la comunidad organizando y compartiendo cajas de alimentos o frazadas; luz natural, tonos cálidos, composición con espacio para texto. | Horizontal 4:3 | 1600 × 1200 px | Hero (`HeroSection`) |
| `categoria-alimentos.webp` | Sacos y cajas de alimentos no perecibles. | Horizontal 16:9 | 1200 × 675 px | Qué puedes donar |
| `categoria-abrigo.webp` | Frazadas y ropa de abrigo dobladas. | Horizontal 16:9 | 1200 × 675 px | Qué puedes donar |
| `categoria-higiene.webp` | Productos de higiene y limpieza sobre fondo neutro. | Horizontal 16:9 | 1200 × 675 px | Qué puedes donar |
| `categoria-animales.webp` | Alimento y utensilios para animales; evitar imágenes de sufrimiento. | Horizontal 16:9 | 1200 × 675 px | Qué puedes donar |
| `categoria-escolares.webp` | Cuadernos, lápices y mochilas. | Horizontal 16:9 | 1200 × 675 px | Qué puedes donar |
| `proposito-huancayo.webp` | Contexto andino de Huancayo; personas trabajando o comerciando, sin explotar vulnerabilidad. | Horizontal 4:3 | 1600 × 1200 px | Nosotros (`PurposeSection`) |

## Integración

Cada sección tiene una propiedad `photoSrc` inicializada en `''`:

- `frontend/src/app/features/landing/sections/hero-section/hero-section.ts`
- `frontend/src/app/features/landing/sections/purpose-section/purpose-section.ts`

Las categorías usan el campo `image` de cada objeto en `categories-section.ts`.

Al colocar un archivo, reemplazar `''` por su ruta, por ejemplo:

```ts
protected readonly photoSrc = 'assets/images/hero-comunidad.webp';
```

Mientras la ruta esté vacía, la interfaz muestra la composición SVG original. No se usan
enlaces externos ni imágenes rotas.
