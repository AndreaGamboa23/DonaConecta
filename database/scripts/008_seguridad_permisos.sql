/* ============================================================================
   DonaConecta — Fase 06
   008_seguridad_permisos.sql
   Seguridad a nivel de base de datos. No contiene contraseñas ni secretos.

   - dc_app: rol de la aplicación. SELECT en dbo, escritura solo en tablas de
     negocio y EXECUTE en los dos procedimientos transaccionales.
   - dc_admin: rol administrativo sin permisos DDL.
   - dc_app_usuario: usuario WITHOUT LOGIN, sin contraseña, usado únicamente
     para comprobar permisos con EXECUTE AS. NO sustituye al login dedicado que
     debe crearse fuera del repositorio con autenticación Windows.

   Plantilla para el entorno local (ejecutar manualmente con la cuenta real,
   nunca versionar credenciales):
     CREATE LOGIN [EQUIPO\DonaConectaApp] FROM WINDOWS;
     CREATE USER [EQUIPO\DonaConectaApp] FOR LOGIN [EQUIPO\DonaConectaApp];
     ALTER ROLE [dc_app] ADD MEMBER [EQUIPO\DonaConectaApp];

   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/scripts/008_seguridad_permisos.sql
   ============================================================================ */

USE [DonaConectaDB];
GO
SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'dc_app' AND type = N'R')
    CREATE ROLE [dc_app];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'dc_admin' AND type = N'R')
    CREATE ROLE [dc_admin];
GO

/* Usuario sin login: no puede conectarse por sí solo; permite probar el rol. */
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'dc_app_usuario')
    CREATE USER [dc_app_usuario] WITHOUT LOGIN;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members drm
    INNER JOIN sys.database_principals miembro ON miembro.principal_id = drm.member_principal_id
    INNER JOIN sys.database_principals rol ON rol.principal_id = drm.role_principal_id
    WHERE miembro.name = N'dc_app_usuario' AND rol.name = N'dc_app'
)
    ALTER ROLE [dc_app] ADD MEMBER [dc_app_usuario];
GO

/* Lectura general para que el backend pueda construir DTO y autorizar por propiedad.
   La ocultación de password_hash/token_hash se garantiza en los DTO de FastAPI. */
GRANT SELECT ON SCHEMA::dbo TO [dc_app];
GO

GRANT EXECUTE ON OBJECT::dbo.usp_RegistrarCompromiso TO [dc_app];
GRANT EXECUTE ON OBJECT::dbo.usp_ConfirmarRecepcion TO [dc_app];
GO

/* Escritura operativa. Los catálogos iniciales quedan como solo lectura para la
   aplicación: solo dc_admin puede mantenerlos. */
DECLARE @tablasEscritura TABLE (nombre SYSNAME NOT NULL PRIMARY KEY);

INSERT INTO @tablasEscritura (nombre)
VALUES
    (N'usuarios'), (N'usuario_roles'), (N'tokens_seguridad'), (N'donantes'),
    (N'parametros_sistema'), (N'archivos'), (N'instituciones'),
    (N'institucion_representantes'), (N'institucion_documentos'),
    (N'verificaciones_institucion'), (N'productos'), (N'producto_unidades'),
    (N'necesidades'), (N'necesidad_productos'), (N'necesidad_fotos'),
    (N'compromisos'), (N'compromiso_productos'), (N'compromiso_historial'),
    (N'entregas'), (N'entrega_productos'), (N'entrega_historial'),
    (N'recepciones'), (N'recepcion_productos'), (N'recepcion_evidencias'),
    (N'puntos_acopio'), (N'puntos_acopio_horarios'), (N'sesiones_gps'),
    (N'gps_ultima_ubicacion'), (N'conversaciones'), (N'mensajes'),
    (N'conversacion_participantes'), (N'mensaje_adjuntos'), (N'reportes_mensaje'),
    (N'notificaciones');

DECLARE @nombre SYSNAME;
DECLARE @sql NVARCHAR(MAX);
DECLARE cur_tablas CURSOR LOCAL FAST_FORWARD FOR
    SELECT nombre FROM @tablasEscritura ORDER BY nombre;

OPEN cur_tablas;
FETCH NEXT FROM cur_tablas INTO @nombre;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'GRANT INSERT, UPDATE, DELETE ON OBJECT::dbo.' + QUOTENAME(@nombre) + N' TO [dc_app]';
    EXEC(@sql);
    FETCH NEXT FROM cur_tablas INTO @nombre;
END;

CLOSE cur_tablas;
DEALLOCATE cur_tablas;
GO

/* La auditoría y los historiales son append-only para la aplicación. */
GRANT INSERT ON OBJECT::dbo.auditoria_eventos TO [dc_app];
GO

DENY UPDATE, DELETE ON OBJECT::dbo.auditoria_eventos TO [dc_app];
DENY UPDATE, DELETE ON OBJECT::dbo.compromiso_historial TO [dc_app];
DENY UPDATE, DELETE ON OBJECT::dbo.entrega_historial TO [dc_app];
DENY UPDATE, DELETE ON OBJECT::dbo.verificaciones_institucion TO [dc_app];
GO

/* Rol administrativo: sin DDL; puede mantener catálogos y consultar auditoría. */
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [dc_admin];
GRANT EXECUTE ON SCHEMA::dbo TO [dc_admin];
GO

/* ------------------------------------------------------------ Verificación real */

EXECUTE AS USER = N'dc_app_usuario';
SELECT
    HAS_PERMS_BY_NAME(N'dbo.roles', N'OBJECT', N'SELECT') AS PuedeLeerRoles,
    HAS_PERMS_BY_NAME(N'dbo.roles', N'OBJECT', N'INSERT') AS PuedeInsertarRoles,
    HAS_PERMS_BY_NAME(N'dbo.compromisos', N'OBJECT', N'INSERT') AS PuedeEscribirCompromisos,
    HAS_PERMS_BY_NAME(N'dbo.auditoria_eventos', N'OBJECT', N'DELETE') AS PuedeBorrarAuditoria,
    HAS_PERMS_BY_NAME(N'dbo.usp_RegistrarCompromiso', N'OBJECT', N'EXECUTE') AS PuedeRegistrarCompromiso;
REVERT;
GO

SELECT
    dp.name AS Principal,
    dp.type_desc AS Tipo,
    rp.name AS Rol
FROM sys.database_role_members drm
INNER JOIN sys.database_principals dp ON dp.principal_id = drm.member_principal_id
INNER JOIN sys.database_principals rp ON rp.principal_id = drm.role_principal_id
WHERE rp.name IN (N'dc_app', N'dc_admin')
ORDER BY Rol, Principal;
GO
