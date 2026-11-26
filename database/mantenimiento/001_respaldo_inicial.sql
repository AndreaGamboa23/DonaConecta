/* ============================================================================
   DonaConecta — Fase 06
   001_respaldo_inicial.sql
   Respaldo completo de DonaConectaDB fuera del repositorio Git. No versionar
   archivos .bak, .mdf ni .ldf.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/mantenimiento/001_respaldo_inicial.sql
   ============================================================================ */

SET NOCOUNT ON;
GO

BACKUP DATABASE [DonaConectaDB]
TO DISK = N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\Backup\DonaConectaDB_Fase06.bak'
WITH INIT, CHECKSUM, STATS = 10;
GO

RESTORE VERIFYONLY
FROM DISK = N'C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\Backup\DonaConectaDB_Fase06.bak'
WITH CHECKSUM;
GO
