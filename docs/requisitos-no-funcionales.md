# Requisitos no funcionales de DonaConecta

Documento de referencia de la Fase 04.2. Complementa `docs/requisitos-funcionales.md` con
calidad, seguridad, privacidad, rendimiento y criterios de aceptación.

## 1. Diseño y usabilidad

| ID | Requisito | Criterio |
|---|---|---|
| RNF-01 | Bootstrap primero | ~85% Bootstrap 5 / ~15% CSS-SCSS propio. No reimplementar componentes ni utilidades de Bootstrap. |
| RNF-02 | Identidad original | Paleta, tipografías, radios, sombras y símbolo propios compartidos por todas las páginas. |
| RNF-03 | Calidad visual | Composiciones con jerarquía y fondos alternos; evitar plantillas administrativas genéricas y minimalismo vacío. |
| RNF-04 | Responsive | Sin desbordamiento horizontal entre 360 y 1920 px, usando grid y utilidades Bootstrap. |
| RNF-05 | Accesibilidad | Contraste AA, navegación por teclado, foco visible, nombres accesibles, `aria-current` y `prefers-reduced-motion`. |
| RNF-06 | Microinteracciones | Sutiles y coherentes; sin animaciones excesivas. |

## 2. Arquitectura y rendimiento

| ID | Requisito | Criterio |
|---|---|---|
| RNF-07 | Separación de capas | Presentación, lógica de negocio y persistencia separadas; backend único acceso a SQL Server. |
| RNF-08 | Modularidad | `core`, `shared`, `layouts`, `features`, `services`, `guards`, `interceptors`, `interfaces`, `routing`, `assets`, `styles`. |
| RNF-09 | Carga diferida | Las páginas se cargan con `loadComponent`; el bundle inicial se mantiene por debajo del presupuesto de 500 kB. |
| RNF-10 | Trazabilidad de ruta | Cada ruta tiene título y descripción meta propios; scroll con fragmentos y restauración. |
| RNF-11 | Simplicidad | Sin dependencias innecesarias, ORM ni patrones difíciles de explicar en sustentación. |

## 3. Datos y backend

| ID | Requisito | Criterio |
|---|---|---|
| RNF-12 | Datos reales | Dashboards, tablas y formularios consumen APIs REST y SQL Server. |
| RNF-13 | Integridad | 3FN, claves, `UNIQUE`, `CHECK`, transacciones y control de concurrencia de cantidades. |
| RNF-14 | Consultas seguras | Parametrización con `pyodbc`; prohibida la concatenación de SQL. |
| RNF-15 | Validación | Pydantic en backend y validación de formularios en frontend. |
| RNF-16 | Errores | Respuestas sin stack traces, credenciales ni datos internos. |

## 4. Seguridad y privacidad

| ID | Requisito | Criterio |
|---|---|---|
| RNF-17 | Contraseñas | Argon2id con librería mantenida; prohibidos texto plano y hashes rápidos. |
| RNF-18 | Autorización | Verificación en backend de rol **y** propiedad del recurso para cada operación sensible. |
| RNF-19 | Transporte | HTTPS/WSS/TLS en producción; `TrustServerCertificate=yes` solo en desarrollo local. |
| RNF-20 | Secretos | Variables de entorno, `.env` ignorado y `.env.example` sin valores sensibles. |
| RNF-21 | Defensa en profundidad | CORS restringido, cabeceras de seguridad, CSRF cuando corresponda y rate limiting. |
| RNF-22 | Privacidad desde el diseño | Mínimo privilegio, DTO explícitos y auditoría sin secretos ni datos innecesarios. |
| RNF-23 | Archivos | Validación por extensión, MIME real, tamaño y nombre seguro; documentos privados fuera de rutas públicas. |
| RNF-24 | Normativa | Evaluar la normativa peruana de protección de datos sin afirmar cumplimiento ni certificaciones sin evaluación formal. |

Detalle completo en `docs/seguridad-privacidad.md`.

## 5. Verificación y evolución

| ID | Requisito | Criterio |
|---|---|---|
| RNF-25 | Pruebas | Build y pruebas unitarias ejecutados en cada fase; registro de resultados reales. |
| RNF-26 | Navegación verificada | Comprobar rutas, enlaces, menú móvil, títulos y ausencia de desbordamiento. |
| RNF-27 | Documentación | Decisiones técnicas, mapa de navegación y estado real actualizados por fase. |
| RNF-28 | PWA futura | Instalable y offline solo cuando los datos sincronizados sean reales y seguros (Fase 18). |
