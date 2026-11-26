# Recursos visuales — DonaConecta

Esta carpeta contiene cuatro ilustraciones WebP proporcionadas para la Fase 04.3, sus derivados
optimizados y ocho recursos nuevos incorporados en la Fase 07.B. **No son fotografías de
actividades reales**: son ilustraciones usadas solo como recursos visuales. La aclaración se
concentra en `Nosotros > Créditos visuales`, con un acceso discreto desde el pie de página; no se
repite sobre cada imagen.

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

En Fase 04.4 no se recortaron estas ilustraciones para simular cinco fotografías de categorías;
por eso las categorías eran bloques editoriales con color, tipografía e iconografía propia. En
Fase 07.B el usuario proporcionó cinco imágenes específicas para las categorías y se integraron
como accesos protagonistas, sin recortar ilustraciones anteriores ni presentarlas como evidencia.

## Recursos fotográficos incorporados en la Fase 07.B

El usuario incorporó ocho recursos nuevos, creados específicamente para DonaConecta. Se usan tal
cual, sin recortes desde collages, descargas externas ni generación adicional. La autoría o
herramienta de creación no fue declarada; el uso en este proyecto está autorizado por el usuario.
**No se presentan como evidencia de actividades, donantes, beneficiarios ni instituciones
verificadas de DonaConecta.** Los créditos visibles siguen centralizados en
`/nosotros#creditos-visuales`.

| Archivo | Uso principal | Dimensiones | Tamaño |
|---|---|---:|---:|
| `categoria-alimentos.webp` | Acceso «Alimentos no perecibles» | 800 × 800 | 92.3 KB |
| `categoria-ropa.webp` | Acceso «Ropa de abrigo y frazadas» | 800 × 800 | 124.7 KB |
| `categoria-higiene.webp` | Acceso «Higiene y limpieza» | 800 × 800 | 40.8 KB |
| `categoria-animales.webp` | Acceso «Productos para animales» | 800 × 800 | 89.8 KB |
| `categoria-utiles.webp` | Acceso «Útiles escolares» | 800 × 800 | 97.4 KB |
| `registro-donante.webp` | Selección de registro y formulario del donante | 1000 × 1333 | 124.3 KB |
| `registro-institucion.webp` | Selección de registro y formulario institucional | 611 × 836 | 86.7 KB |
| `iniciar-sesion.webp` | Pantalla de acceso | 621 × 836 | 75.8 KB |

Las cinco imágenes de categoría son cuadradas y se muestran con `object-fit: cover` dentro de un
`ratio` reservado, sin deformación. Las tres fotografías de registro y acceso son verticales y se
usan como panel lateral en escritorio; en móvil se adaptan mediante utilidades responsive.

### Verificación técnica real

- Los ocho archivos existen físicamente con los nombres exactos solicitados.
- Cabecera binaria `RIFF/WEBP` y codificación `VP8` confirmadas en los ocho archivos.
- Las 20 imágenes del directorio, incluidas las anteriores, se verificaron con Edge headless y
  Chrome DevTools Protocol: respuesta `200`, `Content-Type: image/webp`, `blob` con peso distinto
  de cero y `decode()` correcto con `naturalWidth`/`naturalHeight` reales. Ninguna devolvió HTML.
- Las rutas públicas son `/assets/images/<archivo>.webp`. `public/` no forma parte de la URL; la
  configuración de `angular.json` sirve `frontend/public` como directorio de assets.
- La imagen principal de cada pantalla declara dimensiones y usa carga prioritaria cuando es LCP;
  las fotografías posteriores al primer viewport conservan `loading="lazy"`.
- Las ocho imágenes nuevas se referencian con etiquetas `<img>` en las rutas públicas indicadas; no
  se usan como `background-image`, `srcset` ni `<picture>`. Los atributos `srcset` y `<picture>`
  presentes en el proyecto pertenecen solo a los cuatro recursos anteriores y sus derivados.

Este modelo no puede inspeccionar visualmente las imágenes; la valoración estética final queda
pendiente de revisión humana.

## Recursos adicionales documentados

Se incorporaron seis ilustraciones WebP generadas o proporcionadas para el proyecto. Se publican
tal cual, sin derivados ni recortes. Las dimensiones indicadas se verificaron en la cabecera de
cada archivo y son aproximadas.

| Archivo | Uso principal | Dimensiones | Tamaño |
|---|---|---:|---:|
| `institucion-comedor.webp` | Ilustración del tipo de institución «comedor comunitario» | 548 × 460 | 53.4 KB |
| `institucion-refugio.webp` | Ilustración del tipo de institución «refugio de animales» | 542 × 460 | 51.1 KB |
| `institucion-albergue.webp` | Ilustración del tipo de institución «albergue infantil» | 549 × 460 | 38.3 KB |
| `institucion-adultos-mayores.webp` | Ilustración del tipo de institución «adultos mayores» | 548 × 461 | 57.6 KB |
| `experiencias-solidarias.webp` | Ilustración de la página editorial «Historias que conectan»: preparación de bienes | 542 × 461 | 42.1 KB |
| `comunidad-solidaria.webp` | Ilustración de la página editorial «Historias que conectan»: colaboración responsable | 549 × 461 | 45.0 KB |

- Los cuatro primeros recursos acompañan a los tipos de institución; los dos últimos se usan en
  `Historias que conectan`.
- No son evidencia de actividades reales ni de instituciones verificadas. No se usan para
  atribuir testimonios, personas identificables ni cifras.
- Formato verificado: contenedor `RIFF/WEBP` con codificación `VP8`. Las rutas públicas son
  `/assets/images/<archivo>.webp`.
- autor/licencia: pendiente de confirmación documental. Conservar los créditos y la licencia según
  el registro proporcionado por el usuario; no atribuir autoría ni licencia que no conste en ese
  registro.
