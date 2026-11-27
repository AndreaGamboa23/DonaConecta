/* ============================================================================
   DonaConecta — Fase 08.1
   009_corregir_indice_foto_institucion.sql

   Corrige un defecto del modelo físico: UQ_instituciones_foto era una
   restricción UNIQUE sobre una columna NULL. SQL Server permite un solo NULL
   en ese tipo de restricción, por lo que una segunda institución sin foto
   provocaba el error 2601. Se sustituye por un índice único filtrado que
   conserva la intención (un archivo de foto no se comparte) sin limitar el
   número de instituciones sin foto.

   Ejecutar SOLO con la base objetivo explícita:
     sqlcmd -S ".\SQLEXPRESS" -E -C -b -d DonaConectaDB_Pruebas -i database/scripts/009_corregir_indice_foto_institucion.sql
   ============================================================================ */

SET NOCOUNT ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF DB_NAME() NOT IN (N'DonaConectaDB', N'DonaConectaDB_Pruebas')
BEGIN
    RAISERROR(N'Ejecutar con sqlcmd -d DonaConectaDB o -d DonaConectaDB_Pruebas.', 16, 1);
    RETURN;
END
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE name = N'UQ_instituciones_foto' AND type = N'UQ')
BEGIN
    ALTER TABLE dbo.instituciones DROP CONSTRAINT UQ_instituciones_foto;
    PRINT N'Restriccion UQ_instituciones_foto eliminada.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.instituciones') AND name = N'UX_instituciones_foto_no_nula')
BEGIN
    CREATE UNIQUE INDEX UX_instituciones_foto_no_nula
        ON dbo.instituciones(foto_archivo_id)
        WHERE foto_archivo_id IS NOT NULL;
    PRINT N'Indice filtrado UX_instituciones_foto_no_nula creado.';
END
GO

SELECT name AS Indice, is_unique AS Unico, has_filter AS Filtrado
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.instituciones') AND name LIKE N'%foto%';
GO
