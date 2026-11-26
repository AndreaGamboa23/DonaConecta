/* ============================================================================
   DonaConecta — Fase 06
   003_restaurar_verificacion_final.sql
   Restaura el respaldo FINAL en una base separada y verifica que no contenga
   datos de negocio y que los dos procedimientos estén en su versión corregida.
   Nunca sobrescribe DonaConectaDB ni DonaConectaDB_Pruebas. No usa DROP/REPLACE.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/mantenimiento/003_restaurar_verificacion_final.sql
   ============================================================================ */

SET NOCOUNT ON;
GO

IF DB_ID(N'DonaConectaDB_Verificacion') IS NOT NULL
BEGIN
    THROW 50003, N'DonaConectaDB_Verificacion ya existe. No se sobrescribe: inspeccione antes de continuar.', 1;
END;
GO

RESTORE DATABASE [DonaConectaDB_Verificacion]
FROM DISK = N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\Backup\DonaConectaDB_Fase06.bak'
WITH
    MOVE N'DonaConectaDB' TO N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\DATA\DonaConectaDB_Verificacion.mdf',
    MOVE N'DonaConectaDB_log' TO N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\DATA\DonaConectaDB_Verificacion.ldf',
    CHECKSUM,
    STATS = 10;
GO

USE [DonaConectaDB_Verificacion];
GO

SELECT
    DB_NAME() AS BaseRestaurada,
    (SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo')) AS Tablas,
    (SELECT COUNT(*) FROM sys.foreign_keys) AS ForeignKeys,
    (SELECT COUNT(*) FROM sys.views WHERE name LIKE N'vw_%') AS Vistas,
    (SELECT COUNT(*) FROM sys.procedures WHERE name LIKE N'usp_%') AS Procedimientos,
    (SELECT COUNT(*) FROM dbo.usuarios) AS UsuariosReales,
    (SELECT COUNT(*) FROM dbo.instituciones) AS InstitucionesReales,
    (SELECT COUNT(*) FROM dbo.necesidades) AS NecesidadesReales,
    (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
     FROM sys.sql_modules
     WHERE object_id = OBJECT_ID(N'dbo.usp_ConfirmarRecepcion')
       AND definition LIKE N'%fecha_real_inicio = COALESCE%') AS ProcedimientoCorregido;
GO
