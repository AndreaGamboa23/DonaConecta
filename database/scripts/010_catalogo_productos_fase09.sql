/* ============================================================================
   DonaConecta — Fase 09 (Avance 02)
   010_catalogo_productos_fase09.sql

   DML idempotente y transaccional: siembra el catálogo informativo de 41 bienes
   materiales publicado en frontend/src/app/core/data/catalogo-informativo.ts.

   ORIGEN Y TRANSFORMACIÓN
   - Se toman los tres campos relevantes del archivo TypeScript: slug, nombre y
     categoriaSlug. El slug se conserva en la columna "slug_origen" de la tabla
     de variables como huella de trazabilidad; el modelo físico dbo.productos no
     tiene columna slug, por lo que no se inventa un campo nuevo (sin DDL).
   - Correspondencia de categorías, resuelta por el código REAL de
     dbo.categorias_bienes (nunca por identificador fijo):
       alimentos        -> ALIMENTOS_NO_PERECIBLES
       ropa             -> ROPA_ABRIGO_FRAZADAS
       higiene          -> HIGIENE_LIMPIEZA
       animales         -> PRODUCTOS_ANIMALES
       utiles-escolares -> UTILES_ESCOLARES
   - Cada producto recibe una fila en dbo.producto_unidades con la unidad UN
     leída de dbo.unidades_medida por código y es_preferida = 1. Es una unidad
     NEUTRAL DE CATÁLOGO para agrupar el bien; no representa una presentación
     comercial (bolsa, caja, paquete, kilogramo ni litro). Las presentaciones
     reales se registrarán cuando existan necesidades y entregas auténticas.
   - No se insertan descripciones: los textos del catálogo informativo son
     divulgación pública, no datos de operación, y este script sólo persiste la
     identidad del bien y su categoría.

   SEGURIDAD / ALCANCE
   - Sin DDL. Sin DELETE ni UPDATE sobre tablas permanentes. Sin datos personales.
   - Bloqueo estricto de base: sólo DonaConectaDB_Pruebas. No se ejecuta USE para
     que un argumento -d incorrecto no pueda ser disfrazado.
   - Ejecutar únicamente por el coordinador, desde la raíz del repositorio:
       sqlcmd -S ".\SQLEXPRESS" -E -C -b -d DonaConectaDB_Pruebas -i database/scripts/010_catalogo_productos_fase09.sql
   - Idempotencia: UQ_productos_categoria_nombre (categoria_id, nombre) y
     PK_producto_unidades (producto_id, unidad_id), comprobadas con NOT EXISTS.
     Si ya existiera una fila UN con es_preferida = 0, NO se modifica: el recuento
     final lo hace visible para revisión humana.
   ============================================================================ */

DECLARE @BaseActual VARCHAR(128) = CONVERT(VARCHAR(128), DB_NAME());

IF @BaseActual <> 'DonaConectaDB_Pruebas'
BEGIN
    RAISERROR(N'Escritura bloqueada: este script sólo opera en DonaConectaDB_Pruebas. Base actual: %s.', 16, 1, @BaseActual);
    RETURN;
END;

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Catalogo TABLE (
    codigo_categoria VARCHAR(30)  NOT NULL,
    nombre           NVARCHAR(120) NOT NULL,
    slug_origen      VARCHAR(60)  NOT NULL,
    PRIMARY KEY (codigo_categoria, nombre)
);

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO @Catalogo (codigo_categoria, nombre, slug_origen)
    VALUES
        (N'ALIMENTOS_NO_PERECIBLES', N'Arroz',                              N'arroz'),                  /* arroz */
        (N'ALIMENTOS_NO_PERECIBLES', N'Fideos',                             N'fideos'),                 /* fideos */
        (N'ALIMENTOS_NO_PERECIBLES', N'Lentejas',                           N'lentejas'),               /* lentejas */
        (N'ALIMENTOS_NO_PERECIBLES', N'Frejoles',                           N'frejoles'),               /* frejoles */
        (N'ALIMENTOS_NO_PERECIBLES', N'Avena',                              N'avena'),                  /* avena */
        (N'ALIMENTOS_NO_PERECIBLES', N'Aceite vegetal',                     N'aceite-vegetal'),         /* aceite-vegetal */
        (N'ALIMENTOS_NO_PERECIBLES', N'Conservas',                          N'conservas'),              /* conservas */
        (N'ALIMENTOS_NO_PERECIBLES', N'Leche de larga duración',            N'leche-larga-duracion'),   /* leche-larga-duracion */
        (N'ALIMENTOS_NO_PERECIBLES', N'Otros no perecibles',                N'otros-no-perecibles'),    /* otros-no-perecibles */

        (N'ROPA_ABRIGO_FRAZADAS',    N'Chompas',                            N'chompas'),                /* chompas */
        (N'ROPA_ABRIGO_FRAZADAS',    N'Casacas',                            N'casacas'),                /* casacas */
        (N'ROPA_ABRIGO_FRAZADAS',    N'Frazadas',                           N'frazadas'),               /* frazadas */
        (N'ROPA_ABRIGO_FRAZADAS',    N'Mantas',                             N'mantas'),                 /* mantas */
        (N'ROPA_ABRIGO_FRAZADAS',    N'Pantalones',                         N'pantalones'),             /* pantalones */
        (N'ROPA_ABRIGO_FRAZADAS',    N'Polos',                              N'polos'),                  /* polos */
        (N'ROPA_ABRIGO_FRAZADAS',    N'Medias',                             N'medias'),                 /* medias */
        (N'ROPA_ABRIGO_FRAZADAS',    N'Calzado',                            N'calzado'),                /* calzado */

        (N'HIGIENE_LIMPIEZA',        N'Jabón',                              N'jabon'),                  /* jabon */
        (N'HIGIENE_LIMPIEZA',        N'Champú',                             N'champu'),                 /* champu */
        (N'HIGIENE_LIMPIEZA',        N'Pasta dental',                       N'pasta-dental'),           /* pasta-dental */
        (N'HIGIENE_LIMPIEZA',        N'Cepillos dentales nuevos',           N'cepillos-nuevos'),        /* cepillos-nuevos */
        (N'HIGIENE_LIMPIEZA',        N'Papel higiénico',                    N'papel-higienico'),        /* papel-higienico */
        (N'HIGIENE_LIMPIEZA',        N'Detergente',                         N'detergente'),             /* detergente */
        (N'HIGIENE_LIMPIEZA',        N'Productos de limpieza compatibles',  N'productos-compatibles'),  /* productos-compatibles (higiene) */

        (N'PRODUCTOS_ANIMALES',      N'Alimento para perros y gatos',       N'alimento-perros-gatos'),  /* alimento-perros-gatos */
        (N'PRODUCTOS_ANIMALES',      N'Mantas para animales',               N'mantas-animales'),        /* mantas-animales */
        (N'PRODUCTOS_ANIMALES',      N'Correas',                            N'correas'),                /* correas */
        (N'PRODUCTOS_ANIMALES',      N'Comederos',                          N'comederos'),              /* comederos */
        (N'PRODUCTOS_ANIMALES',      N'Bebederos',                          N'bebederos'),              /* bebederos */
        (N'PRODUCTOS_ANIMALES',      N'Productos de limpieza compatibles',  N'limpieza-compatible'),    /* limpieza-compatible (animales) */
        (N'PRODUCTOS_ANIMALES',      N'Accesorios para animales',           N'accesorios'),             /* accesorios */

        (N'UTILES_ESCOLARES',        N'Cuadernos',                          N'cuadernos'),              /* cuadernos */
        (N'UTILES_ESCOLARES',        N'Mochilas',                           N'mochilas'),               /* mochilas */
        (N'UTILES_ESCOLARES',        N'Lápices',                            N'lapices'),                /* lapices */
        (N'UTILES_ESCOLARES',        N'Colores',                            N'colores'),                /* colores */
        (N'UTILES_ESCOLARES',        N'Lapiceros',                          N'lapiceros'),              /* lapiceros */
        (N'UTILES_ESCOLARES',        N'Borradores',                         N'borradores'),             /* borradores */
        (N'UTILES_ESCOLARES',        N'Cartucheras',                        N'cartucheras'),            /* cartucheras */
        (N'UTILES_ESCOLARES',        N'Libros',                             N'libros'),                 /* libros */
        (N'UTILES_ESCOLARES',        N'Reglas',                             N'reglas'),                 /* reglas */
        (N'UTILES_ESCOLARES',        N'Material artístico',                 N'material-artistico');     /* material-artistico */

    IF (SELECT COUNT(*) FROM @Catalogo) <> 41
        RAISERROR(N'El catálogo origen debe tener exactamente 41 bienes materiales.', 16, 1);

    IF (SELECT COUNT(*) FROM @Catalogo c
        INNER JOIN dbo.categorias_bienes cat ON cat.codigo = c.codigo_categoria) <> 41
        RAISERROR(N'Falta alguno de los cinco códigos de categoría reales en dbo.categorias_bienes.', 16, 1);

    INSERT INTO dbo.productos (categoria_id, nombre)
    SELECT cat.categoria_id, c.nombre
    FROM @Catalogo c
    INNER JOIN dbo.categorias_bienes cat ON cat.codigo = c.codigo_categoria
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.productos p
        WHERE p.categoria_id = cat.categoria_id
          AND p.nombre = c.nombre
    );

    INSERT INTO dbo.producto_unidades (producto_id, unidad_id, es_preferida)
    SELECT p.producto_id, u.unidad_id, CAST(1 AS BIT)
    FROM @Catalogo c
    INNER JOIN dbo.categorias_bienes cat ON cat.codigo = c.codigo_categoria
    INNER JOIN dbo.productos p
            ON p.categoria_id = cat.categoria_id AND p.nombre = c.nombre
    INNER JOIN dbo.unidades_medida u ON u.codigo = N'UN'
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.producto_unidades pu
        WHERE pu.producto_id = p.producto_id
          AND pu.unidad_id = u.unidad_id
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    DECLARE @NumeroError INT = ERROR_NUMBER();
    DECLARE @LineaError  INT = ERROR_LINE();
    RAISERROR(N'La siembra del catálogo fue revertida. Código de error: %d; línea: %d.', 16, 1, @NumeroError, @LineaError);
END CATCH;

/* Recuentos finales sobre datos reales: 41 / 41 / 41 se esperan en una base
   de pruebas que aún no tenga este catálogo. El cuarto recuento detecta filas
   UN preexistentes con es_preferida = 0 (no se modifican por diseño). */
SELECT N'Productos del catálogo presentes' AS Verificacion,
       COUNT(*) AS Filas
FROM @Catalogo c
INNER JOIN dbo.categorias_bienes cat ON cat.codigo = c.codigo_categoria
INNER JOIN dbo.productos p ON p.categoria_id = cat.categoria_id AND p.nombre = c.nombre
UNION ALL
SELECT N'Unidad UN asociada a los 41 productos',
       COUNT(*)
FROM @Catalogo c
INNER JOIN dbo.categorias_bienes cat ON cat.codigo = c.codigo_categoria
INNER JOIN dbo.productos p ON p.categoria_id = cat.categoria_id AND p.nombre = c.nombre
INNER JOIN dbo.producto_unidades pu ON pu.producto_id = p.producto_id
INNER JOIN dbo.unidades_medida u ON u.unidad_id = pu.unidad_id AND u.codigo = N'UN'
UNION ALL
SELECT N'Unidad UN marcada como preferida',
       COUNT(CASE WHEN pu.es_preferida = 1 THEN 1 END)
FROM @Catalogo c
INNER JOIN dbo.categorias_bienes cat ON cat.codigo = c.codigo_categoria
INNER JOIN dbo.productos p ON p.categoria_id = cat.categoria_id AND p.nombre = c.nombre
INNER JOIN dbo.producto_unidades pu ON pu.producto_id = p.producto_id
INNER JOIN dbo.unidades_medida u ON u.unidad_id = pu.unidad_id AND u.codigo = N'UN'
UNION ALL
SELECT N'Total productos en la base de pruebas', COUNT(*) FROM dbo.productos
UNION ALL
SELECT N'Total producto_unidades en la base de pruebas', COUNT(*) FROM dbo.producto_unidades;
