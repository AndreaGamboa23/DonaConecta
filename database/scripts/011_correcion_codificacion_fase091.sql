/* ============================================================================
   DonaConecta — corrección de codificación ejecutada en la entrega final
   011_correcion_codificacion_fase091.sql

   OBJETIVO
   Corregir únicamente el texto NVARCHAR dañado cuando bytes UTF-8 fueron
   interpretados como una página ANSI de Windows al ejecutar scripts históricos.
   Ejemplos reales detectados en DonaConectaDB_Pruebas:
     InstituciÃ³n -> Institución
     sintÃ©tica   -> sintética
     Ãštiles      -> Útiles   (variante Windows-1252 de C3 9A)

   ALCANCE Y SEGURIDAD
   - Guarda estricta de DB_NAME() = DonaConectaDB_Pruebas. No se ejecuta USE.
   - Una sola transacción; rollback completo ante cualquier error.
   - No crea tablas permanentes: los valores originales se conservan en la tabla
     temporal #dc_datos_codificacion durante la sesión y se exportan con
     `sqlcmd -o` a una ruta FUERA del repositorio antes de cerrar la sesión.
   - Quedan prohibidos los reemplazos genéricos de 'Ã': sólo se sustituyen pares
     exactos de bytes UTF-8 mal interpretados, listados en #dc_pares_codificacion.
   - No toca DonaConectaDB, usuarios, contraseñas, hashes, cantidades, estados,
     compromisos, entregas ni auditoría estructural. No ejecuta DDL.
   - Idempotente: si no quedan secuencias dañadas, el script no modifica filas.

   EJECUCIÓN AUTORIZADA (desde la raíz del repositorio)
     sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 ^
       -d DonaConectaDB_Pruebas ^
       -i database/scripts/011_correcion_codificacion_fase091.sql ^
       -o C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-011-correcion-despues.txt

   Las consultas finales de este archivo son la evidencia de los pares
   afectados, con valor original y valor corregido, y el recuento de restos.
   ============================================================================ */

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @BaseActual VARCHAR(128) = CONVERT(VARCHAR(128), DB_NAME());

IF @BaseActual <> 'DonaConectaDB_Pruebas'
BEGIN
    RAISERROR(N'Escritura bloqueada: este script sólo opera en DonaConectaDB_Pruebas. Base actual: %s.', 16, 1, @BaseActual);
    RETURN;
END;

/* Respaldos en memoria de la sesión: no se convierten en objetos permanentes. */
CREATE TABLE #dc_pares_codificacion (
    pare_id    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    secuencia  NVARCHAR(2)  NOT NULL,
    reemplazo  NVARCHAR(1)  NOT NULL,
    detalle    NVARCHAR(40) NOT NULL
);

CREATE TABLE #dc_datos_codificacion (
    tabla_nombre   VARCHAR(60)  NOT NULL,
    columna_nombre VARCHAR(60)  NOT NULL,
    clave_valor    NVARCHAR(100) NOT NULL,
    valor_original NVARCHAR(MAX) NOT NULL,
    valor_corregido NVARCHAR(MAX) NOT NULL
);

BEGIN TRY
    BEGIN TRANSACTION;

    /* Pares exactos. El primer carácter es siempre U+00C3 (byte UTF-8 C3).
       El segundo se expresa con NCHAR para no depender de la página de código
       del archivo: C3 A1 -> á, C3 A9 -> é, C3 AD -> í, C3 B1 -> ñ,
       C3 B3 -> ó, C3 BA -> ú, C3 BC -> ü y sus equivalentes en mayúscula.
       Los valores C3 9A y C3 9C se leyeron como 'š' y 'œ' (Windows-1252). */
    INSERT INTO #dc_pares_codificacion (secuencia, reemplazo, detalle)
    VALUES
        (NCHAR(195) + NCHAR(161), N'á', N'C3 A1 -> a con tilde'),
        (NCHAR(195) + NCHAR(169), N'é', N'C3 A9 -> e con tilde'),
        (NCHAR(195) + NCHAR(173), N'í', N'C3 AD -> i con tilde'),
        (NCHAR(195) + NCHAR(177), N'ñ', N'C3 B1 -> eñe'),
        (NCHAR(195) + NCHAR(179), N'ó', N'C3 B3 -> o con tilde'),
        (NCHAR(195) + NCHAR(186), N'ú', N'C3 BA -> u con tilde'),
        (NCHAR(195) + NCHAR(252), N'ü', N'C3 BC -> u con diéresis'),
        (NCHAR(195) + NCHAR(160), N'à', N'C3 A0 -> a con acento grave'),
        (NCHAR(195) + NCHAR(168), N'è', N'C3 A8 -> e con acento grave'),
        (NCHAR(195) + NCHAR(172), N'ì', N'C3 AC -> i con acento grave'),
        (NCHAR(195) + NCHAR(178), N'ò', N'C3 B2 -> o con acento grave'),
        (NCHAR(195) + NCHAR(185), N'ù', N'C3 B9 -> u con acento grave'),
        (NCHAR(195) + NCHAR(128), N'À', N'C3 80 -> A con acento grave'),
        (NCHAR(195) + NCHAR(129), N'Á', N'C3 81 -> A con tilde'),
        (NCHAR(195) + NCHAR(137), N'É', N'C3 89 (Windows-1252) -> E con tilde'),
        (NCHAR(195) + NCHAR(141), N'Í', N'C3 8D -> I con tilde'),
        (NCHAR(195) + NCHAR(145), N'Ñ', N'C3 91 (Windows-1252) -> eñe mayúscula'),
        (NCHAR(195) + NCHAR(147), N'Ó', N'C3 93 (Windows-1252) -> O con tilde'),
        (NCHAR(195) + NCHAR(353), N'Ú', N'C3 9A (Windows-1252) -> U con tilde'),
        (NCHAR(195) + NCHAR(339), N'Ü', N'C3 9C (Windows-1252) -> U con diéresis');

    /* Sólo columnas NVARCHAR con la secuencia dañada. Se incluyen las tres
       columnas que la propuesta anterior omitía: categorias_bienes.nombre,
       distritos.departamento y productos.descripcion. */
    INSERT INTO #dc_datos_codificacion
        (tabla_nombre, columna_nombre, clave_valor, valor_original, valor_corregido)
    SELECT N'auditoria_eventos', N'descripcion', CONVERT(NVARCHAR(100), evento_id), descripcion, descripcion
      FROM dbo.auditoria_eventos WHERE descripcion LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'categorias_bienes', N'descripcion', CONVERT(NVARCHAR(100), categoria_id), descripcion, descripcion
      FROM dbo.categorias_bienes WHERE descripcion LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'categorias_bienes', N'nombre', CONVERT(NVARCHAR(100), categoria_id), nombre, nombre
      FROM dbo.categorias_bienes WHERE nombre LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'distritos', N'nombre', CONVERT(NVARCHAR(100), distrito_id), nombre, nombre
      FROM dbo.distritos WHERE nombre LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'distritos', N'departamento', CONVERT(NVARCHAR(100), distrito_id), departamento, departamento
      FROM dbo.distritos WHERE departamento LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'instituciones', N'nombre', CONVERT(NVARCHAR(100), institucion_id), nombre, nombre
      FROM dbo.instituciones WHERE nombre LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'necesidades', N'titulo', CONVERT(NVARCHAR(100), necesidad_id), titulo, titulo
      FROM dbo.necesidades WHERE titulo LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'necesidades', N'descripcion', CONVERT(NVARCHAR(100), necesidad_id), descripcion, descripcion
      FROM dbo.necesidades WHERE descripcion LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'notificaciones', N'titulo', CONVERT(NVARCHAR(100), notificacion_id), titulo, titulo
      FROM dbo.notificaciones WHERE titulo LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'notificaciones', N'cuerpo', CONVERT(NVARCHAR(100), notificacion_id), cuerpo, cuerpo
      FROM dbo.notificaciones WHERE cuerpo LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'permisos', N'descripcion', CONVERT(NVARCHAR(100), permiso_id), descripcion, descripcion
      FROM dbo.permisos WHERE descripcion LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'productos', N'nombre', CONVERT(NVARCHAR(100), producto_id), nombre, nombre
      FROM dbo.productos WHERE nombre LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'productos', N'descripcion', CONVERT(NVARCHAR(100), producto_id), descripcion, descripcion
      FROM dbo.productos WHERE descripcion LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'roles', N'descripcion', CONVERT(NVARCHAR(100), rol_id), descripcion, descripcion
      FROM dbo.roles WHERE descripcion LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'tipos_institucion', N'nombre', CONVERT(NVARCHAR(100), tipo_id), nombre, nombre
      FROM dbo.tipos_institucion WHERE nombre LIKE N'%' + NCHAR(195) + N'%'
    UNION ALL
    SELECT N'tipos_institucion', N'descripcion', CONVERT(NVARCHAR(100), tipo_id), descripcion, descripcion
      FROM dbo.tipos_institucion WHERE descripcion LIKE N'%' + NCHAR(195) + N'%';

    /* Aplica únicamente los pares declarados, sin tocar otros caracteres. */
    DECLARE @IndicePar INT = 1;
    WHILE @IndicePar <= (SELECT COUNT(*) FROM #dc_pares_codificacion)
    BEGIN
        UPDATE d
           SET d.valor_corregido = REPLACE(d.valor_corregido, p.secuencia, p.reemplazo)
          FROM #dc_datos_codificacion d
         CROSS JOIN #dc_pares_codificacion p
         WHERE p.pare_id = @IndicePar;

        SET @IndicePar += 1;
    END;

    /* Escritura sobre las filas reales, siempre desde el valor corregido en la
       tabla temporal. No hay INSERT/DELETE sobre tablas permanentes. */
    UPDATE t SET descripcion = d.valor_corregido
      FROM dbo.auditoria_eventos t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'auditoria_eventos' AND d.columna_nombre = N'descripcion'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.evento_id);

    UPDATE t SET descripcion = d.valor_corregido
      FROM dbo.categorias_bienes t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'categorias_bienes' AND d.columna_nombre = N'descripcion'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.categoria_id);

    UPDATE t SET nombre = d.valor_corregido
      FROM dbo.categorias_bienes t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'categorias_bienes' AND d.columna_nombre = N'nombre'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.categoria_id);

    UPDATE t SET nombre = d.valor_corregido
      FROM dbo.distritos t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'distritos' AND d.columna_nombre = N'nombre'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.distrito_id);

    UPDATE t SET departamento = d.valor_corregido
      FROM dbo.distritos t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'distritos' AND d.columna_nombre = N'departamento'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.distrito_id);

    UPDATE t SET nombre = d.valor_corregido
      FROM dbo.instituciones t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'instituciones' AND d.columna_nombre = N'nombre'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.institucion_id);

    UPDATE t SET titulo = d.valor_corregido
      FROM dbo.necesidades t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'necesidades' AND d.columna_nombre = N'titulo'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.necesidad_id);

    UPDATE t SET descripcion = d.valor_corregido
      FROM dbo.necesidades t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'necesidades' AND d.columna_nombre = N'descripcion'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.necesidad_id);

    UPDATE t SET titulo = d.valor_corregido
      FROM dbo.notificaciones t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'notificaciones' AND d.columna_nombre = N'titulo'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.notificacion_id);

    UPDATE t SET cuerpo = d.valor_corregido
      FROM dbo.notificaciones t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'notificaciones' AND d.columna_nombre = N'cuerpo'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.notificacion_id);

    UPDATE t SET descripcion = d.valor_corregido
      FROM dbo.permisos t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'permisos' AND d.columna_nombre = N'descripcion'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.permiso_id);

    UPDATE t SET nombre = d.valor_corregido
      FROM dbo.productos t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'productos' AND d.columna_nombre = N'nombre'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.producto_id);

    UPDATE t SET descripcion = d.valor_corregido
      FROM dbo.productos t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'productos' AND d.columna_nombre = N'descripcion'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.producto_id);

    UPDATE t SET descripcion = d.valor_corregido
      FROM dbo.roles t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'roles' AND d.columna_nombre = N'descripcion'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.rol_id);

    UPDATE t SET nombre = d.valor_corregido
      FROM dbo.tipos_institucion t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'tipos_institucion' AND d.columna_nombre = N'nombre'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.tipo_id);

    UPDATE t SET descripcion = d.valor_corregido
      FROM dbo.tipos_institucion t
      INNER JOIN #dc_datos_codificacion d
        ON d.tabla_nombre = N'tipos_institucion' AND d.columna_nombre = N'descripcion'
       AND d.clave_valor = CONVERT(NVARCHAR(100), t.tipo_id);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    DECLARE @NumeroError INT = ERROR_NUMBER();
    DECLARE @LineaError  INT = ERROR_LINE();
    RAISERROR(N'La corrección fue revertida. Código de error: %d; línea: %d.', 16, 1, @NumeroError, @LineaError);
END CATCH;

/* --------------------------------------------------------------- EVIDENCIA
   Estas consultas se exportan con sqlcmd -o al directorio temporal indicado
   arriba. No se guarda ningún respaldo en el repositorio ni en la base. */

SELECT tabla_nombre, columna_nombre, COUNT(*) AS FilasAfectadas
  FROM #dc_datos_codificacion
 GROUP BY tabla_nombre, columna_nombre
 ORDER BY tabla_nombre, columna_nombre;

SELECT p.detalle,
       UNICODE(SUBSTRING(p.secuencia, 2, 1)) AS CodigoSegundoByte,
       p.reemplazo AS ValorCorregido,
       COUNT(d.clave_valor) AS VecesAplicado
  FROM #dc_pares_codificacion p
 INNER JOIN #dc_datos_codificacion d
    ON CHARINDEX(p.secuencia, d.valor_original) > 0
 GROUP BY p.pare_id, p.detalle, p.secuencia, p.reemplazo
 ORDER BY p.pare_id;

SELECT tabla_nombre, columna_nombre, clave_valor, valor_original, valor_corregido
  FROM #dc_datos_codificacion
 ORDER BY tabla_nombre, columna_nombre, clave_valor;

SELECT
      (SELECT COUNT(*) FROM dbo.auditoria_eventos WHERE descripcion LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.categorias_bienes WHERE descripcion LIKE N'%' + NCHAR(195) + N'%' OR nombre LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.distritos WHERE nombre LIKE N'%' + NCHAR(195) + N'%' OR departamento LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.instituciones WHERE nombre LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.necesidades WHERE titulo LIKE N'%' + NCHAR(195) + N'%' OR descripcion LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.notificaciones WHERE titulo LIKE N'%' + NCHAR(195) + N'%' OR cuerpo LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.permisos WHERE descripcion LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.productos WHERE nombre LIKE N'%' + NCHAR(195) + N'%' OR descripcion LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.roles WHERE descripcion LIKE N'%' + NCHAR(195) + N'%')
    + (SELECT COUNT(*) FROM dbo.tipos_institucion WHERE nombre LIKE N'%' + NCHAR(195) + N'%' OR descripcion LIKE N'%' + NCHAR(195) + N'%')
    AS RestosMojibakeEnColumnasRevisadas;
