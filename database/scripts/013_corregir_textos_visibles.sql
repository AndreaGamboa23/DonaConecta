/* ============================================================================
   DonaConecta — corrección puntual de textos visibles en la entrega final
   013_corregir_textos_visibles.sql

   OBJETIVO
   1) Reparar las secuencias UTF-8 mal interpretadas que quedaron en registros
      sintéticos creados después de 011_correcion_codificacion_fase091.sql.
   2) Sustituir títulos where el código DEMO-FINAL-NEC dominaba el encabezado
      por títulos descriptivos, conservando siempre la identificación de demo.

   ALCANCE Y SEGURIDAD
   - Guarda estricta de DB_NAME() = DonaConectaDB_Pruebas. No se ejecuta USE.
   - Una sola transacción; rollback completo ante cualquier error.
   - No ejecuta DDL: las tablas #dc_* son temporales de sesión.
   - Sólo UPDATE sobre columnas NVARCHAR de texto visible. No toca contraseñas,
     hashes, cifrado, cantidades, estados, Fechas ni registros de auditoría.
   - Idempotente: los pares se aplican con REPLACE; al no quedar secuencias
     dañadas la segunda ejecución no modifica valores.

   EJECUCIÓN AUTORIZADA (desde la raíz del repositorio)
     sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 ^
       -d DonaConectaDB_Pruebas ^
       -i database/scripts/013_corregir_textos_visibles.sql ^
       -o C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-013-correcion.txt
   ============================================================================ */

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @BaseActual VARCHAR(128) = CONVERT(VARCHAR(128), DB_NAME());

IF @BaseActual <> 'DonaConectaDB_Pruebas'
BEGIN
    RAISERROR(N'Escritura bloqueada: este script sólo opera en DonaConectaDB_Pruebas. Base actual: %s.', 16, 1, @BaseActual);
    RETURN;
END;

CREATE TABLE #dc_pares (
    secuencia NVARCHAR(2) NOT NULL,
    reemplazo NVARCHAR(1) NOT NULL
);

INSERT INTO #dc_pares (secuencia, reemplazo)
VALUES
    (NCHAR(195) + NCHAR(161), N'á'),
    (NCHAR(195) + NCHAR(169), N'é'),
    (NCHAR(195) + NCHAR(173), N'í'),
    (NCHAR(195) + NCHAR(177), N'ñ'),
    (NCHAR(195) + NCHAR(179), N'ó'),
    (NCHAR(195) + NCHAR(186), N'ú'),
    (NCHAR(195) + NCHAR(160), N'à'),
    (NCHAR(195) + NCHAR(168), N'è'),
    (NCHAR(195) + NCHAR(129), N'Á'),
    (NCHAR(195) + NCHAR(137), N'É'),
    (NCHAR(195) + NCHAR(141), N'Í'),
    (NCHAR(195) + NCHAR(145), N'Ñ'),
    (NCHAR(195) + NCHAR(147), N'Ó'),
    (NCHAR(195) + NCHAR(353), N'Ú');

CREATE TABLE #dc_objetos (
    tabla_nombre SYSNAME NOT NULL,
    columna_nombre SYSNAME NOT NULL,
    columna_clave SYSNAME NOT NULL
);

INSERT INTO #dc_objetos (tabla_nombre, columna_nombre, columna_clave)
VALUES
    (N'instituciones', N'nombre', N'institucion_id'),
    (N'instituciones', N'descripcion', N'institucion_id'),
    (N'necesidades', N'titulo', N'necesidad_id'),
    (N'necesidades', N'descripcion', N'necesidad_id'),
    (N'notificaciones', N'titulo', N'notificacion_id'),
    (N'notificaciones', N'cuerpo', N'notificacion_id'),
    (N'puntos_acopio', N'nombre', N'punto_id'),
    (N'puntos_acopio', N'direccion', N'punto_id'),
    (N'puntos_acopio', N'referencias_entrega', N'punto_id'),
    (N'compromisos', N'observaciones', N'compromiso_id'),
    (N'entregas', N'observaciones', N'entrega_id'),
    (N'recepciones', N'observaciones', N'recepcion_id'),
    (N'auditoria_eventos', N'descripcion', N'evento_id');

CREATE TABLE #dc_filas (
    tabla_nombre SYSNAME NOT NULL,
    columna_nombre SYSNAME NOT NULL,
    columna_clave SYSNAME NOT NULL,
    clave_valor NVARCHAR(100) NOT NULL,
    valor_corregido NVARCHAR(MAX) NOT NULL
);

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Tabla SYSNAME, @Columna SYSNAME, @Clave SYSNAME, @Sql NVARCHAR(MAX);
    DECLARE objetos CURSOR LOCAL FAST_FORWARD FOR
        SELECT tabla_nombre, columna_nombre, columna_clave FROM #dc_objetos;

    OPEN objetos;
    FETCH NEXT FROM objetos INTO @Tabla, @Columna, @Clave;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Sql = N'
            INSERT INTO #dc_filas
                (tabla_nombre, columna_nombre, columna_clave, clave_valor, valor_corregido)
            SELECT ''' + @Tabla + N''', ''' + @Columna + N''', ''' + @Clave + N''',
                   CONVERT(NVARCHAR(100), ' + QUOTENAME(@Clave) + N'), ' + QUOTENAME(@Columna) + N'
              FROM ' + QUOTENAME(@Tabla) + N'
             WHERE ' + QUOTENAME(@Columna) + N' LIKE N''%'' + NCHAR(195) + N''%'';';
        EXEC sp_executesql @Sql;

        FETCH NEXT FROM objetos INTO @Tabla, @Columna, @Clave;
    END;

    CLOSE objetos;
    DEALLOCATE objetos;

    DECLARE @Secuencia NVARCHAR(2), @Reemplazo NVARCHAR(1);
    DECLARE pares CURSOR LOCAL FAST_FORWARD FOR SELECT secuencia, reemplazo FROM #dc_pares;

    OPEN pares;
    FETCH NEXT FROM pares INTO @Secuencia, @Reemplazo;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        UPDATE #dc_filas
           SET valor_corregido = REPLACE(valor_corregido, @Secuencia, @Reemplazo)
         WHERE CHARINDEX(@Secuencia, valor_corregido) > 0;

        FETCH NEXT FROM pares INTO @Secuencia, @Reemplazo;
    END;

    CLOSE pares;
    DEALLOCATE pares;

    DECLARE @Filas SYSNAME, @ValorCorregido NVARCHAR(MAX), @ValorClave NVARCHAR(100);
    DECLARE filas CURSOR LOCAL FAST_FORWARD FOR
        SELECT tabla_nombre, columna_nombre, columna_clave, clave_valor, valor_corregido
          FROM #dc_filas;

    OPEN filas;
    FETCH NEXT FROM filas INTO @Filas, @Columna, @Clave, @ValorClave, @ValorCorregido;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Sql = N'UPDATE t SET ' + QUOTENAME(@Columna) + N' = @valor
                       FROM ' + QUOTENAME(@Filas) + N' t
                      WHERE ' + QUOTENAME(@Clave) + N' = @clave;';
        EXEC sp_executesql @Sql,
            N'@valor NVARCHAR(MAX), @clave NVARCHAR(100)',
            @valor = @ValorCorregido, @clave = @ValorClave;

        FETCH NEXT FROM filas INTO @Filas, @Columna, @Clave, @ValorClave, @ValorCorregido;
    END;

    CLOSE filas;
    DEALLOCATE filas;

    /* Títulos descriptivos: se conserva el sufijo de demo como identificación. */
    UPDATE dbo.instituciones
       SET nombre = N'DEMO-FINAL-Albergue infantil solidario (sintético)'
     WHERE institucion_id = 11;

    UPDATE dbo.instituciones
       SET nombre = N'DEMO-FINAL-Comedor comunitario solidario (sintético)'
     WHERE institucion_id = 12;

    UPDATE dbo.instituciones
       SET nombre = N'DEMO-FINAL-Refugio de animales solidario (sintético)'
     WHERE institucion_id = 13;

    UPDATE dbo.instituciones
       SET nombre = N'DEMO-FINAL-Comedor solidario 49463561 (sintético)'
     WHERE institucion_id = 14;

    UPDATE dbo.instituciones
       SET nombre = N'DEMO-FINAL-Comedor solidario 35aad0b5 (sintético)'
     WHERE institucion_id = 15;

    UPDATE dbo.instituciones
       SET nombre = N'DEMO-FINAL-Comedor solidario 59d0d029 (sintético)'
     WHERE institucion_id = 16;

    UPDATE dbo.puntos_acopio
       SET nombre = N'Acopio albergue infantil solidario (demo)'
     WHERE punto_id = 1;

    UPDATE dbo.puntos_acopio
       SET nombre = N'Acopio comedor comunitario solidario (demo)'
     WHERE punto_id = 2;

    UPDATE dbo.puntos_acopio
       SET nombre = N'Acopio refugio de animales solidario (demo)'
     WHERE punto_id = 3;

    UPDATE dbo.puntos_acopio
       SET nombre = N'Acopio comedor solidario 49463561 (demo)'
     WHERE punto_id = 4;

    UPDATE dbo.puntos_acopio
       SET nombre = N'Acopio comedor solidario 35aad0b5 (demo)'
     WHERE punto_id = 5;

    UPDATE dbo.puntos_acopio
       SET nombre = N'Acopio comedor solidario 59d0d029 (demo)'
     WHERE punto_id = 6;

    UPDATE dbo.necesidades
       SET titulo = N'Alimentos para el albergue infantil (demostración)'
     WHERE necesidad_id = 10;

    UPDATE dbo.necesidades
       SET titulo = N'Alimentos para el comedor comunitario (demostración)'
     WHERE necesidad_id = 11;

    UPDATE dbo.necesidades
       SET titulo = N'Insumos para el refugio de animales (demostración)'
     WHERE necesidad_id = 12;

    UPDATE dbo.necesidades
       SET titulo = N'Bienes de acopio para comedor solidario (demo 49463561)'
     WHERE necesidad_id = 13;

    UPDATE dbo.necesidades
       SET titulo = N'Bienes de acopio para comedor solidario (demo 35aad0b5)'
     WHERE necesidad_id = 14;

    UPDATE dbo.necesidades
       SET titulo = N'Bienes de acopio para comedor solidario (demo 59d0d029)'
     WHERE necesidad_id = 15;

    SELECT COUNT(*) AS FilasReparadas FROM #dc_filas;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
