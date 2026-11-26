/* ============================================================================
   DonaConecta — Fase 06
   003_procedimientos.sql
   Pruebas de usp_RegistrarCompromiso y usp_ConfirmarRecepcion.
   Solo DonaConectaDB_Pruebas. Ejecutar después de 001_datos_sinteticos.sql
   sobre una base recién restaurada. Detalles en ASCII para evitar problemas de
   código de página en sqlcmd.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/tests/003_procedimientos.sql
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
    detalle VARCHAR(300) NULL
);

DECLARE @ahora DATETIME2(0) = SYSUTCDATETIME();
DECLARE @productoId INT = (SELECT producto_id FROM dbo.productos WHERE nombre = N'Producto sintético de prueba');
DECLARE @unidadId INT = (SELECT unidad_id FROM dbo.unidades_medida WHERE codigo = N'UN');
DECLARE @donanteId INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_donante@donaconecta.invalid');
DECLARE @donante2Id INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_donante2@donaconecta.invalid');
DECLARE @repId INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_rep@donaconecta.invalid');
DECLARE @institucionId INT = (SELECT institucion_id FROM dbo.instituciones WHERE slug = N'institucion-sintetica-prueba');
DECLARE @necConcId INT = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia');
DECLARE @necRecepcionId INT = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética recepcion');
DECLARE @json NVARCHAR(MAX);
DECLARE @out INT;
DECLARE @err INT;

/* Necesidad no publicada para comprobar 52002. */
DECLARE @necBorradorId INT = (
    SELECT TOP 1 necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética borrador');

IF @necBorradorId IS NULL
BEGIN
    INSERT INTO dbo.necesidades (
        institucion_id, titulo, descripcion, prioridad, estado,
        creado_por_usuario_id, creado_en, actualizado_en)
    VALUES (
        @institucionId, N'Necesidad sintética borrador',
        N'Necesidad sintética en borrador para probar el estado publicado.',
        N'BAJA', N'BORRADOR', @repId, @ahora, @ahora);
    SET @necBorradorId = CAST(SCOPE_IDENTITY() AS INT);
END;

/* Archivo sintético para comprobar evidencia válida e inválida. */
DECLARE @archivoId BIGINT = (
    SELECT TOP 1 archivo_id FROM dbo.archivos
    WHERE nombre_almacenado = N'evidencia-sintetica-prueba.webp');

IF @archivoId IS NULL
BEGIN
    INSERT INTO dbo.archivos (
        propietario_usuario_id, creado_por_usuario_id, nombre_original,
        nombre_almacenado, extension, content_type, tamano_bytes,
        hash_sha256, ruta_almacenamiento, visibilidad, tipo)
    VALUES (
        @repId, @repId, N'evidencia-sintetica-prueba.webp',
        N'evidencia-sintetica-prueba.webp', N'webp', N'image/webp', 1024,
        HASHBYTES(N'SHA2_256', N'evidencia-sintetica-prueba'),
        N'/private/evidencia-sintetica-prueba.webp', N'PRIVADO', N'EVIDENCIA_RECEPCION');
    SET @archivoId = CAST(SCOPE_IDENTITY() AS BIGINT);
END;

/* Escenario de recepciones: 6 + 4 = 10 unidades entregadas. */
DECLARE @compromisoRecepcionId INT = (
    SELECT TOP 1 c.compromiso_id
    FROM dbo.compromisos c
    WHERE c.necesidad_id = @necRecepcionId AND c.estado = N'ACEPTADO'
    ORDER BY c.compromiso_id);

DECLARE @entrega1Id INT = (
    SELECT TOP 1 e.entrega_id
    FROM dbo.entregas e
    WHERE e.compromiso_id = @compromisoRecepcionId
    ORDER BY e.entrega_id);

IF NOT EXISTS (SELECT 1 FROM dbo.recepciones WHERE entrega_id = @entrega1Id)
    UPDATE dbo.entrega_productos
    SET cantidad_entregada = CAST(6 AS DECIMAL(12,3))
    WHERE entrega_id = @entrega1Id
      AND producto_id = @productoId AND unidad_id = @unidadId;

DECLARE @entrega2Id INT = (
    SELECT TOP 1 e.entrega_id
    FROM dbo.entregas e
    WHERE e.compromiso_id = @compromisoRecepcionId
      AND e.entrega_id <> @entrega1Id
    ORDER BY e.entrega_id);

IF @entrega2Id IS NULL
BEGIN
    INSERT INTO dbo.entregas (compromiso_id, fecha_programada, estado, responsable_usuario_id)
    VALUES (@compromisoRecepcionId, DATEADD(DAY, 2, @ahora), N'PROGRAMADA', @repId);
    SET @entrega2Id = CAST(SCOPE_IDENTITY() AS INT);

    INSERT INTO dbo.entrega_productos (
        entrega_id, compromiso_id, producto_id, unidad_id, cantidad_entregada)
    VALUES (@entrega2Id, @compromisoRecepcionId, @productoId, @unidadId, CAST(4 AS DECIMAL(12,3)));
END;

/* ======================================================== RegistrarCompromiso */

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":11}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_RegistrarCompromiso
        @necesidadId = @necConcId, @donanteUsuarioId = @donanteId,
        @lineasJson = @json, @expiracionMinutos = 30, @compromisoId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP excede disponibilidad', N'FAIL', N'11 units were accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52001
        INSERT INTO @resultados VALUES (N'SP excede disponibilidad', N'PASS', N'Error 52001');
    ELSE
        INSERT INTO @resultados VALUES (N'SP excede disponibilidad', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_RegistrarCompromiso
        @necesidadId = @necBorradorId, @donanteUsuarioId = @donanteId,
        @lineasJson = @json, @expiracionMinutos = 30, @compromisoId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP necesidad no publicada', N'FAIL', N'BORRADOR was accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52002
        INSERT INTO @resultados VALUES (N'SP necesidad no publicada', N'PASS', N'Error 52002');
    ELSE
        INSERT INTO @resultados VALUES (N'SP necesidad no publicada', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_RegistrarCompromiso
        @necesidadId = @necConcId, @donanteUsuarioId = @repId,
        @lineasJson = @json, @expiracionMinutos = 30, @compromisoId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP donante no autorizado', N'FAIL', N'Representative was accepted as donor');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52003
        INSERT INTO @resultados VALUES (N'SP donante no autorizado', N'PASS', N'Error 52003');
    ELSE
        INSERT INTO @resultados VALUES (N'SP donante no autorizado', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_RegistrarCompromiso
        @necesidadId = @necConcId, @donanteUsuarioId = @donanteId,
        @lineasJson = @json, @expiracionMinutos = 0, @compromisoId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP expiracion invalida', N'FAIL', N'Zero minutes was accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52005
        INSERT INTO @resultados VALUES (N'SP expiracion invalida', N'PASS', N'Error 52005');
    ELSE
        INSERT INTO @resultados VALUES (N'SP expiracion invalida', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = N'[]';
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_RegistrarCompromiso
        @necesidadId = @necConcId, @donanteUsuarioId = @donanteId,
        @lineasJson = @json, @expiracionMinutos = 30, @compromisoId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP lineas vacias', N'FAIL', N'Empty lines were accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52004
        INSERT INTO @resultados VALUES (N'SP lineas vacias', N'PASS', N'Error 52004');
    ELSE
        INSERT INTO @resultados VALUES (N'SP lineas vacias', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":999999,"unidadId":', @unidadId, N',"cantidad":1}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_RegistrarCompromiso
        @necesidadId = @necConcId, @donanteUsuarioId = @donanteId,
        @lineasJson = @json, @expiracionMinutos = 30, @compromisoId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP linea inexistente', N'FAIL', N'Unknown product was accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52004
        INSERT INTO @resultados VALUES (N'SP linea inexistente', N'PASS', N'Error 52004');
    ELSE
        INSERT INTO @resultados VALUES (N'SP linea inexistente', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_RegistrarCompromiso
        @necesidadId = @necConcId, @donanteUsuarioId = @donanteId,
        @lineasJson = @json, @expiracionMinutos = 30, @compromisoId = @out OUTPUT;

    DECLARE @dispTrasReserva DECIMAL(12,3) = (
        SELECT cantidad_disponible
        FROM dbo.vw_disponibilidad_necesidad
        WHERE necesidad_id = @necConcId
          AND producto_id = @productoId AND unidad_id = @unidadId);

    IF @out IS NOT NULL AND @dispTrasReserva = CAST(4 AS DECIMAL(12,3))
        INSERT INTO @resultados VALUES (N'SP compromiso valido', N'PASS', N'Id generated; available 10 -> 4');
    ELSE
        INSERT INTO @resultados VALUES (N'SP compromiso valido', N'FAIL', CONCAT(N'Id=', @out, N' Available=', @dispTrasReserva));
END TRY
BEGIN CATCH
    INSERT INTO @resultados VALUES (N'SP compromiso valido', N'FAIL', CONCAT(N'Error ', ERROR_NUMBER()));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":5}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_RegistrarCompromiso
        @necesidadId = @necConcId, @donanteUsuarioId = @donante2Id,
        @lineasJson = @json, @expiracionMinutos = 30, @compromisoId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP excede tras reserva', N'FAIL', N'5 units were accepted with only 4 available');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52001
        INSERT INTO @resultados VALUES (N'SP excede tras reserva', N'PASS', N'Error 52001');
    ELSE
        INSERT INTO @resultados VALUES (N'SP excede tras reserva', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

/* ======================================================= ConfirmarRecepcion */

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_ConfirmarRecepcion
        @entregaId = @entrega1Id, @recibidoPorUsuarioId = @donante2Id,
        @lineasJson = @json, @estadoRecepcion = N'PARCIAL',
        @observaciones = N'Prueba', @recepcionId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP receptor no autorizado', N'FAIL', N'Donor was accepted as receiver');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52007
        INSERT INTO @resultados VALUES (N'SP receptor no autorizado', N'PASS', N'Error 52007');
    ELSE
        INSERT INTO @resultados VALUES (N'SP receptor no autorizado', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":7}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_ConfirmarRecepcion
        @entregaId = @entrega1Id, @recibidoPorUsuarioId = @repId,
        @lineasJson = @json, @estadoRecepcion = N'PARCIAL',
        @observaciones = N'Prueba', @recepcionId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP recibido > entregado', N'FAIL', N'7 of 6 units were accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52008
        INSERT INTO @resultados VALUES (N'SP recibido > entregado', N'PASS', N'Error 52008');
    ELSE
        INSERT INTO @resultados VALUES (N'SP recibido > entregado', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_ConfirmarRecepcion
        @entregaId = @entrega1Id, @recibidoPorUsuarioId = @repId,
        @lineasJson = @json, @estadoRecepcion = N'OBSERVADA',
        @recepcionId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP observada sin observacion', N'FAIL', N'OBSERVADA without reason was accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52010
        INSERT INTO @resultados VALUES (N'SP observada sin observacion', N'PASS', N'Error 52010');
    ELSE
        INSERT INTO @resultados VALUES (N'SP observada sin observacion', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
DECLARE @jsonEvidenciaInvalida NVARCHAR(MAX) = N'[{"archivoId":999999}]';
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_ConfirmarRecepcion
        @entregaId = @entrega1Id, @recibidoPorUsuarioId = @repId,
        @lineasJson = @json, @estadoRecepcion = N'PARCIAL',
        @observaciones = N'Prueba', @evidenciasJson = @jsonEvidenciaInvalida,
        @recepcionId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP evidencia invalida', N'FAIL', N'Unknown file was accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52011
        INSERT INTO @resultados VALUES (N'SP evidencia invalida', N'PASS', N'Error 52011');
    ELSE
        INSERT INTO @resultados VALUES (N'SP evidencia invalida', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_ConfirmarRecepcion
        @entregaId = @entrega1Id, @recibidoPorUsuarioId = @repId,
        @lineasJson = @json, @estadoRecepcion = N'PARCIAL',
        @observaciones = N'Recepcion parcial sintetica', @recepcionId = @out OUTPUT;

    DECLARE @estadoEntrega1 VARCHAR(15) = (SELECT estado FROM dbo.entregas WHERE entrega_id = @entrega1Id);
    DECLARE @estadoCompPromedio VARCHAR(15) = (SELECT estado FROM dbo.compromisos WHERE compromiso_id = @compromisoRecepcionId);
    DECLARE @dispTrasParcial DECIMAL(12,3) = (
        SELECT cantidad_disponible
        FROM dbo.vw_disponibilidad_necesidad
        WHERE necesidad_id = @necRecepcionId
          AND producto_id = @productoId AND unidad_id = @unidadId);

    IF @out IS NOT NULL
       AND @estadoEntrega1 = N'INCIDENCIA'
       AND @estadoCompPromedio = N'ACEPTADO'
       AND @dispTrasParcial = CAST(10 AS DECIMAL(12,3))
        INSERT INTO @resultados VALUES (N'SP recepcion parcial', N'PASS', N'Partial status; no double count; available 10');
    ELSE
        INSERT INTO @resultados VALUES (N'SP recepcion parcial', N'FAIL',
            CONCAT(N'Recepcion=', @out, N' Entrega=', @estadoEntrega1, N' Compromiso=', @estadoCompPromedio, N' Available=', @dispTrasParcial));
END TRY
BEGIN CATCH
    INSERT INTO @resultados VALUES (N'SP recepcion parcial', N'FAIL', CONCAT(N'Error ', ERROR_NUMBER()));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":6}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_ConfirmarRecepcion
        @entregaId = @entrega1Id, @recibidoPorUsuarioId = @repId,
        @lineasJson = @json, @estadoRecepcion = N'CONFIRMADA',
        @observaciones = N'Prueba', @recepcionId = @out OUTPUT;
    INSERT INTO @resultados VALUES (N'SP recepcion duplicada', N'FAIL', N'Second receipt was accepted');
END TRY
BEGIN CATCH
    SET @err = ERROR_NUMBER();
    IF @err = 52006
        INSERT INTO @resultados VALUES (N'SP recepcion duplicada', N'PASS', N'Error 52006');
    ELSE
        INSERT INTO @resultados VALUES (N'SP recepcion duplicada', N'FAIL', CONCAT(N'Unexpected error ', @err));
END CATCH;

SET @json = CONCAT(N'[{"productoId":', @productoId, N',"unidadId":', @unidadId, N',"cantidad":4}]');
DECLARE @jsonEvidenciaValida NVARCHAR(MAX) = CONCAT(N'[{"archivoId":', @archivoId, N'}]');
SET @out = NULL;
BEGIN TRY
    EXEC dbo.usp_ConfirmarRecepcion
        @entregaId = @entrega2Id, @recibidoPorUsuarioId = @repId,
        @lineasJson = @json, @estadoRecepcion = N'CONFIRMADA',
        @observaciones = N'Recepcion total sintetica', @evidenciasJson = @jsonEvidenciaValida,
        @recepcionId = @out OUTPUT;

    DECLARE @estadoEntrega2 VARCHAR(15) = (SELECT estado FROM dbo.entregas WHERE entrega_id = @entrega2Id);
    DECLARE @estadoCompFinal VARCHAR(15) = (SELECT estado FROM dbo.compromisos WHERE compromiso_id = @compromisoRecepcionId);
    DECLARE @dispFinal DECIMAL(12,3) = (
        SELECT cantidad_disponible
        FROM dbo.vw_disponibilidad_necesidad
        WHERE necesidad_id = @necRecepcionId
          AND producto_id = @productoId AND unidad_id = @unidadId);
    DECLARE @evidencias INT = (SELECT COUNT(*) FROM dbo.recepcion_evidencias WHERE recepcion_id = @out);
    DECLARE @notifDonante INT = (
        SELECT COUNT(*) FROM dbo.notificaciones
        WHERE destinatario_usuario_id = @donanteId
          AND tipo = N'RECEPCION_CONFIRMADA' AND recepcion_id = @out);
    DECLARE @auditoria INT = (
        SELECT COUNT(*) FROM dbo.auditoria_eventos
        WHERE tipo_evento = N'RECEPCION_CONFIRMADA' AND recurso_id = CAST(@out AS VARCHAR(50)));

    IF @out IS NOT NULL
       AND @estadoEntrega2 = N'ENTREGADA'
       AND @estadoCompFinal = N'COMPLETADO'
       AND @dispFinal = CAST(10 AS DECIMAL(12,3))
       AND @evidencias = 1 AND @notifDonante = 1 AND @auditoria = 1
        INSERT INTO @resultados VALUES (N'SP recepcion total', N'PASS', N'Completed; evidence, notice and audit persisted; no double count');
    ELSE
        INSERT INTO @resultados VALUES (N'SP recepcion total', N'FAIL',
            CONCAT(N'Recepcion=', @out, N' Entrega=', @estadoEntrega2, N' Compromiso=', @estadoCompFinal,
                   N' Available=', @dispFinal, N' Evidence=', @evidencias, N' Notice=', @notifDonante, N' Audit=', @auditoria));
END TRY
BEGIN CATCH
    INSERT INTO @resultados VALUES (N'SP recepcion total', N'FAIL', CONCAT(N'Error ', ERROR_NUMBER()));
END CATCH;

/* ------------------------------------------------------ Resultado y cierre */

SELECT prueba AS Prueba, resultado AS Resultado, detalle AS Detalle
FROM @resultados
ORDER BY prueba;

IF EXISTS (SELECT 1 FROM @resultados WHERE resultado = N'FAIL')
    THROW 59001, N'Hubo fallos en las pruebas de procedimientos.', 1;
GO
