# Informe de la Fase 09.1 — experiencia pública real, detalle de necesidades y directorio

**Rama:** `Andrea`. **Base autorizada para datos sintéticos:** `DonaConectaDB_Pruebas`.
`DonaConectaDB` no se modificó y `ALLOW_MAIN_DB_WRITES=no` permaneció vigente.
No se ejecutaron DDL, DML de negocio, commit, push, merge, rebase ni cambio de rama.

## 1. Objetivo y resultado

La Fase 09.1 convirtió las pantallas públicas en una experiencia conectada al backend real
de la Fase 09. El visitante ya no ve catálogos ni solicitudes simuladas: Explorar consulta
necesidades `PUBLICADA` de instituciones `VERIFICADA`, cada solicitud tiene una ficha con
líneas reales por producto y unidad, el directorio y los perfiles se leen desde SQL Server,
y el Inicio muestra accesos distintos según la sesión.

SQL Server sigue siendo la única fuente de las decisiones de publicación y verificación.
El frontend no filtra ni inventa estados: los repositorios aplican `n.estado = N'PUBLICADA'`
e `i.estado_verificacion = N'VERIFICADA'` antes de construir los DTO.

## 2. Backend implementado

### 2.1 Lecturas públicas nuevas

| Método y ruta | DTO | Función |
|---|---|---|
| `GET /api/v1/necesidades/{id_necesidad}` | `NecesidadDetallePublica` | Ficha con líneas, disponibilidad y avance reales. |
| `GET /api/v1/instituciones/tipos` | `list[TipoInstitucionPublico]` | Tipos SQL con total real de verificadas. |
| `GET /api/v1/instituciones/{id_institucion}` | `InstitucionDetallePublica` | Perfil público autorizado y solicitudes vigentes. |

Se agregaron filtros de `prioridad`, `limit` y `offset` al listado de necesidades, y
`tipoCodigo`, `distritoId` y `q` al directorio. Los DTO no exponen latitud, longitud, correos
de representantes, hashes, nonces ni auditoría.

### 2.2 Reglas y magnitudes

- Disponibilidad: `requerida − reserva vigente restante − recibido`, calculada por
  `vw_disponibilidad_necesidad`; avance real desde `vw_progreso_necesidad`.
- Los totales agregados se conservan en el DTO por compatibilidad, pero la interfaz **no los
  muestra como una sola unidad**. La ficha agrupa la disponibilidad por `unidad_id` y la tabla
  detalla cada `(producto, unidad)`.
- Los `TOP 1` del detalle llevan `ORDER BY np.producto_id, np.unidad_id` para evitar valores
  no deterministas en necesidades multilínea.
- Los puntos de acopio solo se publican si están `ACTIVO` y pertenecen a la institución de la
  necesidad.
- Los comodines `%`, `_`, `[` y `\` se escapan en búsquedas `LIKE`, siempre con parámetros `?`.
- Las fechas `DATETIME2` se serializan con sufijo UTC `Z`; las horas de horarios se mantienen
  como `TIME` y no se presentan como fechas.
- `POST /api/v1/compromisos` devuelve `409 / COMPROMISO_VIGENTE` para un compromiso vigente
  previo del mismo donante. El frontend bloquea envíos concurrentes del mismo clic.

### 2.3 Contrato y pruebas

`docs/contrato-api.md` §10 documenta las tres operaciones nuevas, la excepción de paginación
de los dos listados públicos y las contradicciones históricas: no existe
`GET /necesidades/{id}/disponibilidad` porque la disponibilidad está integrada en el detalle;
la ruta efectiva es `/compromisos/mis-compromisos`; y `/donaciones/mias` es un alias oculto
preexistente, no nuevo en esta fase.

`backend/tests/test_directorio_fase091.py` se reescribió con repositorios sustituidos para que
la suite sea hermética: ya no depende de IDs, nombres ni estados concretos de una base mutable.
Además verifica por introspección que las reglas de publicación y las vistas reales están
presentes en el código de los repositorios.

## 3. Frontend implementado

- **Explorar/Necesidades:** resultados reales, prioridad, filtros, estados distintos para
  carga, vacío, error y servicio no disponible, y carga progresiva por `limit`/`offset`.
- **Detalle de necesidad:** ficha con línea por producto y unidad, barra de avance real,
  disponibilidad agrupada por unidad, ausencia honesta de punto de acopio y formulario de
  compromiso solo para donantes con sesión real.
- **Directorio:** los tipos se leen del campo SQL `tipo.codigo`; cada tipo enlaza a
  `/instituciones/tipo/:codigo` y el perfil a `/instituciones/:id`. `ADULTOS_MAYORES` se mantiene
  como texto editorial, nunca como tipo falso.
- **Perfil público:** datos autorizados, bienes solicitados agrupados por `(producto, unidad)`,
  contactos y acopios solo si existen en la base. No se inventan teléfonos, correos, fotos,
  direcciones ni horarios.
- **Inicio:** accesos por rol. Visitante ve registro y acceso; donante ve Mis donaciones y
  Mensajes; representante ve Mi panel y Mis necesidades; administrador conserva su panel.
- **Componentes compartidos:** `NecesidadCard` y `InstitucionCard` consumen DTOs reales.
  La tarjeta de necesidad muestra líneas solicitadas y avance, sin sumar unidades distintas.
- **Correcciones de accesibilidad y calidad:** `aria-current` en el tipo activo, foco visible
  bajo `prefers-reduced-motion`, acción de privacidad renderizada en FAQ, mapeo ISO correcto de
  `dia_semana` (`1=Lunes`, `7=Domingo`), e URL correcta de verificación administrativa
  (`/api/v1/admin/instituciones/{id}/verificar`).

El producto técnico `producto_id=1` no se eliminó. El catálogo informativo lo excluye porque
no es un bien donable; cuando aparece en una necesidad publicada se muestra con su nombre real
y la etiqueta «Dato de prueba». La decisión y la propuesta de unidades están en
`docs/propuesta-unidades-fase091.md`.

## 4. Datos reales verificados

Consulta de solo lectura sobre `DonaConectaDB_Pruebas`:

| Indicador | Valor |
|---|---:|
| Necesidades `PUBLICADA` | 6 |
| Instituciones `VERIFICADA` | 2 |
| Productos activos | 42 |
| Puntos de acopio | 0 |
| Horarios de acopio | 0 |

Las diez respuestas API verificadas incluyeron `200` para `/health`, listado y detalle de
necesidades, tipos, filtros de directorio y perfil; `404 / RECURSO_NO_PUBLICO` para
`/necesidades/99999` y `/instituciones/99999`. `/instituciones?tipoCodigo=ALBERGUE` devolvió
`[]`, sin instituciones inventadas.

## 5. Evidencias de ejecución

| Comprobación | Resultado |
|---|---|
| `uv run pytest -q` | **34/34** aprobadas, 1 aviso de deprecación de `httpx` en `TestClient`. |
| `npm test -- --watch=false` | **70/70** pruebas en **25 archivos**. |
| `npm run build` | **585,95 kB** iniciales y **113,51 kB** transferidos; dentro del presupuesto de 600 kB. Solo avisos de deprecación de `@import` de Sass. |
| Navegador real (CDP) | **2179/2179** comprobaciones en **34 rutas × 7 anchos** (360–1920 px): título y metadescripción propios, un solo `h1`, sin desbordamiento, imágenes y anclas válidas, sin errores JS ni respuestas `5xx`, menú móvil `false → true → false` y contenido real por ruta. |
| OpenAPI | **31 rutas, 39 operaciones y 54 esquemas**; ambos listados nuevos declaran `response_model`. |
| `git diff --check` | Sin errores de whitespace; solo avisos de normalización LF/CRLF. |
| Capturas | Seis PNG en `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-f091-capturas`, fuera del repositorio. |

## 6. Codificación y cambios pendientes de autorización

Los archivos `.sql` fuente son UTF-8 válidos y la API entrega JSON UTF-8. El mojibake
observado en registros antiguos proviene de ejecuciones históricas por `sqlcmd` con la página
ANSI de Windows. Se preparó `database/scripts/011_correcion_codificacion_fase091.sql` como
propuesta reversible: guarda de base, transacción única, respaldo previo, `QUOTED_IDENTIFIER ON`
y sección de restauración. Fue validado con `SET NOEXEC ON` y **no se ejecutó**.

Tampoco se ejecutó la normalización de unidades del catálogo. Cambiar `UN` por una presentación
comercial implicaría inventar datos no registrados por la institución.

## 7. Limitaciones declaradas

1. El control de compromiso duplicado es secuencial. El procedimiento almacenado actual bloquea
   por disponibilidad, pero no por `(donante, necesidad)`; dos peticiones verdaderamente
   simultáneas podrían crear dos compromisos. Corregirlo requiere modificar el SP y su índice,
   fuera del alcance autorizado.
2. No se corrigieron los textos mojibake almacenados ni las unidades: cualquier DML requiere
   autorización explícita.
3. La verificación CDP es programática. La valoración estética final requiere revisión humana
   de las capturas; el modelo no afirma una inspección visual que no realizó.
4. La URL de verificación administrativa se corrigió en el frontend, pero no se ejecutó una
   nueva verificación contra la base porque eso modificaría datos.

## 8. Cierre y propuesta de commit

La fase queda lista para revisión funcional y visual. No se realizó commit, push, merge ni
cambio de rama.

Mensaje propuesto, sin ejecutar:

```text
feat(frontend): conectar directorio y detalle de necesidades con datos reales
```
