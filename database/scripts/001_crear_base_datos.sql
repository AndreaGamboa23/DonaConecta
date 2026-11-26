/* ============================================================================
   DonaConecta — Fase 06
   001_crear_base_datos.sql
   Crea DonaConectaDB sin destruir una base existente.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/scripts/001_crear_base_datos.sql
   ============================================================================ */

SET NOCOUNT ON;
GO

IF DB_ID(N'DonaConectaDB') IS NOT NULL
BEGIN
    THROW 50001, N'DonaConectaDB ya existe. No se sobrescribe: inspeccione la base antes de continuar.', 1;
END;
GO

/* Los archivos MDF/LDF se crean en la ruta de datos por defecto de la instancia,
   fuera del repositorio Git. No se especifica FILENAME para que el script sea
   reproducible en el equipo del compañero. */
EXEC(N'CREATE DATABASE [DonaConectaDB] COLLATE SQL_Latin1_General_CP1_CI_AS');
GO

/* Recuperación SIMPLE: entorno local de desarrollo, sin cadenas de log crecientes.
   En producción se evaluaría FULL con respaldos de log. */
ALTER DATABASE [DonaConectaDB] SET RECOVERY SIMPLE WITH NO_WAIT;
GO

USE [DonaConectaDB];
GO

SELECT
    DB_NAME()                       AS BaseDatos,
    DATABASEPROPERTYEX(DB_NAME(), 'Collation') AS Collation,
    DATABASEPROPERTYEX(DB_NAME(), 'Recovery')  AS ModeloRecuperacion;
GO
