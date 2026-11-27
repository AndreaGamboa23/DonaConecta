/* ============================================================================
   DonaConecta — escenario sintético coherente de puntos de acopio
   014_publicar_puntos_demo.sql

   OBJETIVO
   Los puntos 1, 2 y 3 existen y pertenecen a instituciones verificadas, pero
   fueron sembrados sin coordenadas y sin evento de autorización. Por eso el
   directorio y los perfiles decían que no había puntos. Este script completa
   ese mismo escenario sintético con coordenadas de demostración y registra la
   publicación en auditoría, sin crear puntos nuevos ni asignar puntos ajenos.

   ALCANCE Y SEGURIDAD
   - Guarda estricta de DB_NAME() = DonaConectaDB_Pruebas. No se ejecuta USE.
   - Una sola transacción; rollback completo ante cualquier error.
   - No ejecuta DDL. No modifica compromisos, entregas, recepciones ni usuarios.
   - Idempotente: sólo actualiza puntos con coordenadas nulas y no duplica el
     evento de auditoría si ya existe una publicación para ese punto.

   EJECUCIÓN AUTORIZADA
     sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 ^
       -d DonaConectaDB_Pruebas ^
       -i database/scripts/014_publicar_puntos_demo.sql ^
       -o C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-014-puntos.txt
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

BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE p
       SET latitud = -12.0652,
           longitud = -75.2031
      FROM dbo.puntos_acopio p
     INNER JOIN dbo.instituciones i ON i.institucion_id = p.institucion_id
     WHERE p.punto_id IN (1, 2, 3)
       AND i.estado_verificacion = N'VERIFICADA'
       AND (p.latitud IS NULL OR p.longitud IS NULL);

    INSERT INTO dbo.auditoria_eventos (
        usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
        origen, resultado, descripcion, creado_en
    )
    SELECT 30,
           N'PUNTO_COORDENADAS_PUBLICADAS',
           N'PUNTOS_ACOPIO',
           N'PUNTO_ACOPIO',
           CONVERT(VARCHAR(50), p.punto_id),
           N'SISTEMA',
           N'OK',
           N'Coordenadas sintéticas de demostración publicadas por el administrador de pruebas.',
           SYSUTCDATETIME()
      FROM dbo.puntos_acopio p
     INNER JOIN dbo.instituciones i ON i.institucion_id = p.institucion_id
     WHERE p.punto_id IN (1, 2, 3)
       AND i.estado_verificacion = N'VERIFICADA'
       AND p.latitud IS NOT NULL
       AND p.longitud IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM dbo.auditoria_eventos ae
           WHERE ae.recurso_tipo = N'PUNTO_ACOPIO'
             AND ae.recurso_id = CONVERT(VARCHAR(50), p.punto_id)
             AND ae.tipo_evento = N'PUNTO_COORDENADAS_PUBLICADAS'
       );

    SELECT p.punto_id AS punto_id,
           p.institucion_id AS institucion_id,
           p.nombre AS nombre,
           p.latitud AS latitud,
           p.longitud AS longitud
      FROM dbo.puntos_acopio p
     WHERE p.punto_id IN (1, 2, 3, 4, 5, 6)
     ORDER BY p.punto_id;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
