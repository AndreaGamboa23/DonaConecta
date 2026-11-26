/* ============================================================================
   DonaConecta — Fase 06
   002_restaurar_validacion.sql
   Restaura el respaldo en una base SEPARADA de pruebas. Nunca sobrescribe
   DonaConectaDB. No usa DROP DATABASE ni REPLACE.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/mantenimiento/002_restaurar_validacion.sql
   ============================================================================ */

SET NOCOUNT ON;
GO

IF DB_ID(N'DonaConectaDB_Pruebas') IS NOT NULL
BEGIN
    THROW 50002, N'DonaConectaDB_Pruebas ya existe. No se sobrescribe: inspeccione antes de continuar.', 1;
END;
GO

RESTORE DATABASE [DonaConectaDB_Pruebas]
FROM DISK = N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\Backup\DonaConectaDB_Fase06.bak'
WITH
    MOVE N'DonaConectaDB' TO N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\DATA\DonaConectaDB_Pruebas.mdf',
    MOVE N'DonaConectaDB_log' TO N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\DATA\DonaConectaDB_Pruebas.ldf',
    CHECKSUM,
    STATS = 10;
GO

USE [DonaConectaDB_Pruebas];
GO

SELECT
    DB_NAME() AS BaseRestaurada,
    (SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo')) AS Tablas,
    (SELECT COUNT(*) FROM sys.foreign_keys) AS ForeignKeys,
    (SELECT COUNT(*) FROM sys.views WHERE name LIKE N'vw_%') AS Vistas,
    (SELECT COUNT(*) FROM sys.procedures WHERE name LIKE N'usp_%') AS Procedimientos,
    (SELECT COUNT(*) FROM dbo.usuarios) AS UsuariosReales;
GO
