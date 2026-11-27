# Propuesta de unidades y bienes de la Fase 09.1

> Documento técnico, sin ejecución de DDL ni DML. Única base autorizada para datos
> sintéticos: `DonaConectaDB_Pruebas`. `DonaConectaDB` permanece intacta.

## 1. Situación verificada

Consulta de solo lectura ejecutada el 26 de noviembre de 2026 sobre
`DonaConectaDB_Pruebas` (SQL Server 2025 Express):

| Indicador | Valor real |
|---|---:|
| Necesidades `PUBLICADA` | 6 |
| Instituciones `VERIFICADA` | 2 |
| Productos activos | 42 |
| Puntos de acopio | 0 |
| Horarios de puntos de acopio | 0 |
| Líneas de necesidad | 6 |

Las seis líneas existentes usan la unidad `UN`:

| Producto | Unidad | Líneas | Cantidad requerida total |
|---|---|---:|---:|
| `producto_id=1`, «Producto sintético de prueba» | `UN` | 5 | 41.000 |
| `producto_id=3`, «Arroz» | `UN` | 1 | 5.000 |

`producto_id=1` es un producto técnico heredado de las pruebas de concurrencia de la
Fase 06. No se elimina: las necesidades antiguas lo referencian y borrarlo rompería
integridad referencial y trazabilidad. El catálogo informativo de bienes lo excluye porque
no es un bien donable, pero las líneas de necesidades publicadas lo muestran con su nombre
real y una etiqueta «Dato de prueba». Esta política es una decisión de presentación, no
una modificación de datos.

Los 41 bienes del catálogo público se crearon en Fase 09 con la unidad neutra `UN`
porque el catálogo es informativo y no declara presentación comercial. Las unidades
reales sembradas en Fase 06 (`UN`, `KG`, `L`, `CAJA`, `PAQUETE`, `BOLSA`) no se
sustituyen de forma automática: hacerlo implicaría inventar una presentación que la
institución no registró.

## 2. Decisión aplicada en Fase 09.1

1. El detalle de una necesidad muestra cada línea con **su propio producto y su propia
   unidad**, leídos de SQL Server. No se usa una sola unidad global para resumir bienes
   distintos.
2. El campo `unidad_medida_base` se conserva en el DTO por compatibilidad, pero la
   interfaz **no lo usa** en totales: no se suman cantidades de unidades distintas. El
   resumen muestra líneas solicitadas, líneas completas y avance; la disponibilidad se
   agrupa por `unidad_id` y se muestra por símbolo real.
3. El compromiso se registra por `(producto_id, unidad_id, cantidad)`, con el mismo
   criterio del procedimiento almacenado. No se convierten unidades en el frontend y el
   formulario acepta cantidades decimales positivas.
4. El directorio y el perfil público no muestran puntos de acopio, horarios, teléfonos,
   correos ni coordenadas cuando la base no los tiene. No se inventan datos de contacto.

## 3. Propuesta para una fase posterior (no ejecutada)

Si el equipo decide que el catálogo informativo debe pasar a unidades comercialmente
utilizables, la propuesta es:

1. Definir, con criterio institucional, una tabla de equivalencias por producto y
   presentación (`producto_id`, `unidad_id`, factor, observación), sin mezclar
   `UN` con unidades de masa o volumen sin una regla explícita.
2. Revisar las cinco líneas que hoy usan `producto_id=1` y decidir si se reclasifican,
   se marcan como datos de prueba o se conservan solo como evidencia histórica.
3. Aplicar cualquier cambio mediante DML transaccional idempotente en
   `DonaConectaDB_Pruebas`, con respaldo previo y verificación posterior. No se ejecuta
   en esta fase porque no hay autorización de DDL/DML de negocio.
4. Actualizar `docs/modelo-fisico.md`, `docs/diccionario-datos.md` y
   `docs/contrato-api.md` antes de modificar las respuestas públicas.
5. Mantener la regla de disponibilidad
   `requerida − reserva vigente restante − recibido`, calculada por SQL Server, sin
   doble conteo y sin cantidades derivadas almacenadas.

## 4. Codificación observada

Los archivos `.sql` fuente están en UTF-8 válido y la API entrega JSON UTF-8. El texto
mojibake visible en registros antiguos proviene de ejecuciones históricas de scripts
por `sqlcmd` con la página ANSI de Windows, no de una falla de codificación del backend
actual. Se preparó `database/scripts/011_correcion_codificacion_fase091.sql` como
propuesta reversible y validada con `SET NOEXEC ON`, pero **no se ejecutó**. Cualquier
corrección de datos requiere autorización explícita y debe realizarse solo en
`DonaConectaDB_Pruebas`.
