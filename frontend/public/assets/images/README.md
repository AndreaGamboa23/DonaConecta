# Recursos visuales — DonaConecta

Esta carpeta contiene las cuatro ilustraciones WebP proporcionadas para la Fase 04.3 y sus
derivados optimizados. **No son fotografías de actividades reales**: son imágenes generadas con
IA, usadas solo como recursos ilustrativos. La aclaración se concentra en `Nosotros >
Créditos visuales`, con un acceso discreto desde el pie de página; no se repite sobre cada imagen.

## Procedencia

| Archivo original | Autor / fuente | Licencia o autorización | Uso |
|---|---|---|---|
| `hero-comunidad.webp` | Generado con IA, proporcionado por el usuario para DonaConecta | Uso autorizado por el usuario para este proyecto; modelo/herramienta no declarada | Hero de `/como-donar` (bienes materiales) |
| `como-donar.webp` | Generado con IA, proporcionado por el usuario para DonaConecta | Uso autorizado por el usuario para este proyecto; modelo/herramienta no declarada | Introducción de categorías de la portada |
| `nosotros-comunidad.webp` | Generado con IA, proporcionado por el usuario para DonaConecta | Uso autorizado por el usuario para este proyecto; modelo/herramienta no declarada | Hero principal de la portada |
| `juntos-transformamos.webp` | Generado con IA, proporcionado por el usuario para DonaConecta | Uso autorizado por el usuario para este proyecto; modelo/herramienta no declarada | Cierre de participación de la portada |

La reasignación de la Fase 04.4 se basa en la revisión del usuario: `nosotros-comunidad.webp`
muestra personas colaborando en un entorno comunitario andino con espacio a la izquierda para el
texto; `hero-comunidad.webp` muestra cajas, manos y productos, por lo que corresponde a la guía de
bienes materiales. `/nosotros` usa ahora un bloque abstracto con la paleta institucional.

No se afirma que las personas representadas sean integrantes, donantes, beneficiarios u
organizaciones verificadas de DonaConecta. No se usan testimonios ni cifras derivadas de estas
imágenes.

## Inspección técnica y optimización

Los cuatro originales se verificaron como:

- Contenedor `RIFF/WEBP`, codificación **VP8L (WebP sin pérdida)**.
- Dimensiones **1672 × 941 px** (aprox. 16:9).
- Tamaños entre **1.62 MB y 1.86 MB**.
- Chunk **C2PA** de procedencia conservado en los originales.

No había ImageMagick, `cwebp`, ffmpeg ni Pillow instalados. Para evitar dependencias nuevas se
usó el codificador WebP nativo de Microsoft Edge mediante Chrome DevTools Protocol, sin instalar
paquetes ni desactivar protecciones de npm. Se generaron derivados **VP8 con pérdida**:

| Original | Original | Optimizado | Móvil (960 × 540) | Diferencia media por canal |
|---|---:|---:|---:|---:|
| `hero-comunidad.webp` | 1789.3 KB | 205.8 KB | 83.0 KB | 2.19 / 255 |
| `como-donar.webp` | 1623.1 KB | 149.7 KB | 60.1 KB | 1.95 / 255 |
| `nosotros-comunidad.webp` | 1768.4 KB | 191.6 KB | 78.6 KB | 2.10 / 255 |
| `juntos-transformamos.webp` | 1856.1 KB | 224.6 KB | 92.4 KB | 2.18 / 255 |

Los derivados conservan el perfil de color (`ICCP`) y eliminan el chunk C2PA para reducir peso;
los originales **no se eliminaron** y siguen siendo la copia de procedencia. La diferencia media
por canal es ~2/255, verificada al comparar los originales y los optimizados redimensionados a
960 × 540 en el navegador.

## Archivos usados por la interfaz

- `*-opt.webp`: versión de escritorio, 1672 × 941 px.
- `*-movil.webp`: versión móvil, 960 × 540 px, seleccionada con `<source media="(max-width: 575.98px)">`.
- Las etiquetas `<img>` declaran `width`, `height`, `sizes` y `srcset` para evitar desplazamiento
  de layout.
- La imagen del hero principal usa `loading="eager"` y `fetchpriority="high"`.
- Las imágenes posteriores al primer viewport usan `loading="lazy"`.

No se recortan estas ilustraciones para simular cinco fotografías de categorías. Las categorías
son bloques editoriales con color, tipografía e iconografía propia.
