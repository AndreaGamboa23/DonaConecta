/* ============================================================================
   DonaConecta — Fase 06
   002_integridad_reglas.sql
   Pruebas sintéticas de integridad y reglas. Solo DonaConectaDB_Pruebas.
   Las operaciones inválidas se ejecutan dentro de transacciones revertidas.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/tests/002_integridad_reglas.sql
   ============================================================================ */

USE [DonaConectaDB_Pruebas];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
SET NOCOUNT ON;
GO

IF DB_NAME() <> N'DonaConectaDB_Pruebas'
BEGIN
    THROW 59000, N'Este script solo puede ejecutarse en DonaConectaDB_Pruebas.', 1;
END;

DECLARE @resultados TABLE (
    prueba VARCHAR(80) NOT NULL PRIMARY KEY,
    resultado VARCHAR(10) NOT NULL,
    detalle NVARCHAR(300) NULL
);

DECLARE @productoId INT = (SELECT producto_id FROM dbo.productos WHERE nombre = N'Producto sintético de prueba');
DECLARE @unidadId INT = (SELECT unidad_id FROM dbo.unidades_medida WHERE codigo = N'UN');
DECLARE @repId INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_rep@donaconecta.invalid');
DECLARE @donante2Id INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_donante2@donaconecta.invalid');

/* -------------------------------------------------- 1. Estructura desplegada */

IF (SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo')) = 42
   AND (SELECT COUNT(*) FROM sys.foreign_keys) = 79
   AND (SELECT COUNT(*) FROM sys.views WHERE name LIKE N'vw_%') = 9
   AND (SELECT COUNT(*) FROM sys.procedures WHERE name LIKE N'usp_%') = 2
    INSERT INTO @resultados VALUES (N'Estructura 42/79/9/2', N'PASS', N'Objetos esperados presentes.');
ELSE
    INSERT INTO @resultados VALUES (N'Estructura 42/79/9/2', N'FAIL', N'El conteo de objetos no coincide.');

/* ------------------------------------- 2. Autorización institucional compuesta */

IF (SELECT COUNT(*) FROM dbo.vw_representante_autorizado
    WHERE usuario_id = @repId AND autorizado = 1) = 1
    INSERT INTO @resultados VALUES (N'Representante autorizado', N'PASS', N'Rol, vínculo e institución válidos.');
ELSE
    INSERT INTO @resultados VALUES (N'Representante autorizado', N'FAIL', N'La vista no autorizó al representante.');

/* ---------------------------------------------- 3. Directorio solo verificadas */

IF (SELECT COUNT(*) FROM dbo.vw_directorio_instituciones
    WHERE slug = N'institucion-sintetica-prueba') = 1
    INSERT INTO @resultados VALUES (N'Directorio públicо', N'PASS', N'Institución verificada visible.');
ELSE
    INSERT INTO @resultados VALUES (N'Directorio públicо', N'FAIL', N'Institución verificada no visible.');

/* ------------------------------- 4. Reserva vencida excluida sin limpieza física */

DECLARE @reservadoVencido DECIMAL(12,3);
DECLARE @disponibleVencido DECIMAL(12,3);

SELECT @reservadoVencido = cantidad_reservada_vigente,
       @disponibleVencido = cantidad_disponible
FROM dbo.vw_disponibilidad_necesidad
WHERE necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética vencida')
  AND producto_id = @productoId AND unidad_id = @unidadId;

IF @reservadoVencido = CAST(0 AS DECIMAL(12,3)) AND @disponibleVencido = CAST(5 AS DECIMAL(12,3))
    INSERT INTO @resultados VALUES (N'Reserva vencida', N'PASS', N'Reserva 0 y disponible 5.');
ELSE
    INSERT INTO @resultados VALUES (N'Reserva vencida', N'FAIL',
        CONCAT(N'Reserva=', @reservadoVencido, N' Disponible=', @disponibleVencido));

/* ----------------------------------- 5. Disponibilidad con compromiso ACEPTADO */

DECLARE @reservadoAceptado DECIMAL(12,3);
DECLARE @disponibleAceptado DECIMAL(12,3);

SELECT @reservadoAceptado = cantidad_reservada_vigente,
       @disponibleAceptado = cantidad_disponible
FROM dbo.vw_disponibilidad_necesidad
WHERE necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética recepcion')
  AND producto_id = @productoId AND unidad_id = @unidadId;

IF @reservadoAceptado = CAST(10 AS DECIMAL(12,3)) AND @disponibleAceptado = CAST(10 AS DECIMAL(12,3))
    INSERT INTO @resultados VALUES (N'Disponibilidad base', N'PASS', N'Reserva 10 y disponible 10.');
ELSE
    INSERT INTO @resultados VALUES (N'Disponibilidad base', N'FAIL',
        CONCAT(N'Reserva=', @reservadoAceptado, N' Disponible=', @disponibleAceptado));

/* --------------------------------------------------- 6. CHECK de latitud inválida */

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.instituciones (tipo_id, distrito_id, nombre, slug, latitud, estado_verificacion, fecha_registro)
    SELECT tipo_id, distrito_id, N'Latitud inválida', N'latitud-invalida', CAST(100 AS DECIMAL(9,6)), N'PENDIENTE', SYSUTCDATETIME()
    FROM (SELECT TOP 1 tipo_id FROM dbo.tipos_institucion) t
    CROSS JOIN (SELECT TOP 1 distrito_id FROM dbo.distritos) d;
    ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'CHECK latitud', N'FAIL', N'Latitud 100 fue aceptada.');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'CHECK latitud', N'PASS', N'Restricción CHECK rechazó la fila.');
END CATCH;

/* -------------------------------- 7. CHECK tipo de notificación versus recurso */

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.notificaciones (destinatario_usuario_id, tipo, titulo, cuerpo, mensaje_id)
    VALUES (@repId, N'MENSAJE_NUEVO', N'Prueba', N'No debe aceptarse sin mensaje.', NULL);
    ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'CHECK notificación', N'FAIL', N'Tipo MENSAJE_NUEVO sin mensaje fue aceptado.');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'CHECK notificación', N'PASS', N'El CHECK exigió la FK del recurso.');
END CATCH;

/* ------------------------------------------ 8. FK compuesta anti cruce de need */

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.compromiso_productos (compromiso_id, necesidad_id, producto_id, unidad_id, cantidad_comprometida)
    SELECT c.compromiso_id,
           (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia'),
           @productoId, @unidadId, CAST(1 AS DECIMAL(12,3))
    FROM dbo.compromisos c
    WHERE c.necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética recepcion');
    ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'FK compuesta compromiso', N'FAIL', N'Asociación cruzada aceptada.');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'FK compuesta compromiso', N'PASS', N'FK (compromiso_id, necesidad_id) rechazó el cruce.');
END CATCH;

/* --------------------------------------- 9. Índice filtrado de sesión GPS activa */

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.sesiones_gps (
        entrega_id, usuario_id, consentimiento_dado, consentimiento_en,
        fecha_inicio, expira_en, estado)
    SELECT e.entrega_id, @donante2Id, 1, SYSUTCDATETIME(), SYSUTCDATETIME(),
           DATEADD(HOUR, 2, SYSUTCDATETIME()), N'ACTIVA'
    FROM dbo.entregas e
    WHERE e.compromiso_id = (
        SELECT TOP 1 c.compromiso_id FROM dbo.compromisos c
        WHERE c.necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética recepcion'));
    ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'GPS sesión activa única', N'FAIL', N'Segunda sesión activa aceptada.');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'GPS sesión activa única', N'PASS', N'Índice filtrado único rechazó la segunda sesión.');
END CATCH;

/* --------------------------------------------------- 10. ROWVERSION obsoleto */

BEGIN TRANSACTION;

DECLARE @filaVersion ROWVERSION = (SELECT fila_version FROM dbo.usuarios WHERE usuario_id = @repId);

UPDATE dbo.usuarios
SET apellidos = N'CambioValido'
WHERE usuario_id = @repId AND fila_version = @filaVersion;

DECLARE @filasObsoletas INT;

UPDATE dbo.usuarios
SET apellidos = N'CambioObsoleto'
WHERE usuario_id = @repId AND fila_version = @filaVersion;

SET @filasObsoletas = @@ROWCOUNT;

ROLLBACK TRANSACTION;

IF @filasObsoletas = 0
    INSERT INTO @resultados VALUES (N'ROWVERSION obsoleto', N'PASS', N'PATCH obsoleto no afectó filas.');
ELSE
    INSERT INTO @resultados VALUES (N'ROWVERSION obsoleto', N'FAIL', N'PATCH obsoleto afectó la fila.');

/* --------------------------------------- 11. Borrado de necesidad con compromisos */

BEGIN TRY
    BEGIN TRANSACTION;
    DELETE FROM dbo.necesidades
    WHERE titulo = N'Necesidad sintética recepcion';
    ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'No borrar con compromisos', N'FAIL', N'FK NO ACTION no impidió el borrado.');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    INSERT INTO @resultados VALUES (N'No borrar con compromisos', N'PASS', N'FK impidió el borrado físico.');
END CATCH;

SELECT prueba AS Prueba, resultado AS Resultado, detalle AS Detalle
FROM @resultados
ORDER BY prueba;

IF EXISTS (SELECT 1 FROM @resultados WHERE resultado = N'FAIL')
    THROW 59001, N'Hubo fallos en las pruebas de integridad.', 1;
GO
