/* ============================================================================
   DonaConecta — Fase 06
   007_procedimientos_almacenados.sql
   Los dos únicos procedimientos que modifican disponibilidad. Son dueños de su
   transacción: se invocan con autocommit=True desde PyODBC en Fase 07, sin
   transacción externa anidada.

   Errores de negocio (THROW, sin mensajes de SQL Server al cliente):
     52001 COMPROMISO_EXCEDE_DISPONIBILIDAD
     52002 NECESIDAD_NO_PUBLICADA
     52003 DONANTE_NO_AUTORIZADO
     52004 LINEAS_INVALIDAS
     52005 EXPIRACION_INVALIDA
     52006 RECEPCION_DUPLICADA
     52007 REPRESENTANTE_NO_AUTORIZADO
     52008 CANTIDAD_RECIBIDA_INVALIDA
     52009 ENTREGA_NO_VALIDA
     52010 ESTADO_RECEPCION_INVALIDO
     52011 EVIDENCIA_INVALIDA

   AJUSTE DOCUMENTADO: compromiso_historial no registra la creación porque
   estado_anterior es NOT NULL y debe ser distinto de estado_nuevo. El historial
   comienza con la primera transición real. Se documenta en modelo-fisico.md.

   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/scripts/007_procedimientos_almacenados.sql
   ============================================================================ */

USE [DonaConectaDB];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
SET NOCOUNT ON;
GO

/* ------------------------------------------------------- Registrar compromiso */

CREATE OR ALTER PROCEDURE dbo.usp_RegistrarCompromiso
    @necesidadId        INT,
    @donanteUsuarioId   INT,
    @lineasJson         NVARCHAR(MAX),
    @expiracionMinutos  INT,
    @compromisoId       INT OUTPUT
WITH EXECUTE AS OWNER
AS
BEGIN
    SET XACT_ABORT ON;
    SET NOCOUNT ON;

    DECLARE @ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @bloqueo INT;
    DECLARE @lineas TABLE (
        producto_id INT NOT NULL,
        unidad_id   INT NOT NULL,
        cantidad    DECIMAL(12,3) NOT NULL,
        PRIMARY KEY (producto_id, unidad_id)
    );

    INSERT INTO @lineas (producto_id, unidad_id, cantidad)
    SELECT l.productoId, l.unidadId, l.cantidad
    FROM OPENJSON(@lineasJson)
    WITH (
        productoId INT          N'$.productoId',
        unidadId   INT          N'$.unidadId',
        cantidad   DECIMAL(12,3) N'$.cantidad'
    ) AS l;

    IF NOT EXISTS (SELECT 1 FROM @lineas)
        THROW 52004, N'LINEAS_INVALIDAS', 1;

    IF EXISTS (
        SELECT 1
        FROM @lineas
        WHERE producto_id IS NULL OR unidad_id IS NULL OR cantidad IS NULL OR cantidad <= 0
    )
        THROW 52004, N'LINEAS_INVALIDAS', 1;

    IF EXISTS (SELECT 1 FROM @lineas GROUP BY producto_id, unidad_id HAVING COUNT(*) > 1)
        THROW 52004, N'LINEAS_INVALIDAS', 1;

    IF @expiracionMinutos IS NULL OR @expiracionMinutos <= 0
        THROW 52005, N'EXPIRACION_INVALIDA', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.usuarios u
        INNER JOIN dbo.usuario_roles ur ON ur.usuario_id = u.usuario_id
        INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id
        INNER JOIN dbo.donantes d ON d.usuario_id = u.usuario_id
        WHERE u.usuario_id = @donanteUsuarioId
          AND u.estado_cuenta = N'ACTIVO'
          AND r.codigo = N'DONANTE'
          AND ur.estado = N'ACTIVO'
    )
        THROW 52003, N'DONANTE_NO_AUTORIZADO', 1;

    SET @compromisoId = NULL;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @estadoNecesidad VARCHAR(15);
        DECLARE @institucionId INT;

        /* Orden de bloqueo: necesidades -> compromisos -> líneas. */
        SELECT
            @estadoNecesidad = n.estado,
            @institucionId = n.institucion_id
        FROM dbo.necesidades AS n WITH (UPDLOCK, HOLDLOCK)
        WHERE n.necesidad_id = @necesidadId;

        IF @estadoNecesidad IS NULL OR @estadoNecesidad <> N'PUBLICADA'
            THROW 52002, N'NECESIDAD_NO_PUBLICADA', 1;

        /* La range lock sobre necesidad_id impide un segundo compromiso concurrente. */
        SELECT @bloqueo = COUNT(*)
        FROM dbo.compromisos AS c WITH (UPDLOCK, HOLDLOCK)
        WHERE c.necesidad_id = @necesidadId;

        IF EXISTS (
            SELECT 1
            FROM @lineas l
            LEFT JOIN dbo.necesidad_productos np
                ON np.necesidad_id = @necesidadId
               AND np.producto_id = l.producto_id
               AND np.unidad_id = l.unidad_id
            WHERE np.necesidad_id IS NULL
        )
            THROW 52004, N'LINEAS_INVALIDAS', 1;

        /* La vista se lee dentro de la transacción, con los padres ya bloqueados. */
        IF EXISTS (
            SELECT 1
            FROM @lineas l
            INNER JOIN dbo.vw_disponibilidad_necesidad v
                ON v.necesidad_id = @necesidadId
               AND v.producto_id = l.producto_id
               AND v.unidad_id = l.unidad_id
            WHERE l.cantidad > v.cantidad_disponible
        )
            THROW 52001, N'COMPROMISO_EXCEDE_DISPONIBILIDAD', 1;

        INSERT INTO dbo.compromisos (
            necesidad_id, donante_usuario_id, estado, fecha_compromiso,
            expira_en, observaciones, creado_en)
        VALUES (
            @necesidadId, @donanteUsuarioId, N'PENDIENTE', @ahora,
            DATEADD(MINUTE, @expiracionMinutos, @ahora), NULL, @ahora);

        SET @compromisoId = CAST(SCOPE_IDENTITY() AS INT);

        INSERT INTO dbo.compromiso_productos (
            compromiso_id, necesidad_id, producto_id, unidad_id, cantidad_comprometida)
        SELECT @compromisoId, @necesidadId, l.producto_id, l.unidad_id, l.cantidad
        FROM @lineas l;

        /* Se notifica al contacto principal autorizado; si no existe, se omite
           la notificación sin invalidar un compromiso válido. */
        DECLARE @representanteId INT;

        SELECT TOP 1 @representanteId = ra.usuario_id
        FROM dbo.vw_representante_autorizado ra
        INNER JOIN dbo.institucion_representantes ir
            ON ir.usuario_id = ra.usuario_id
           AND ir.institucion_id = ra.institucion_id
        WHERE ra.institucion_id = @institucionId
          AND ra.autorizado = 1
          AND ir.estado = N'ACTIVO'
          AND ir.es_contacto_principal = 1
        ORDER BY ir.fecha_inicio DESC;

        IF @representanteId IS NULL
            SELECT TOP 1 @representanteId = ra.usuario_id
            FROM dbo.vw_representante_autorizado ra
            WHERE ra.institucion_id = @institucionId
              AND ra.autorizado = 1
            ORDER BY ra.usuario_id;

        IF @representanteId IS NOT NULL
            INSERT INTO dbo.notificaciones (
                destinatario_usuario_id, tipo, titulo, cuerpo, compromiso_id)
            VALUES (
                @representanteId, N'COMPROMISO_ESTADO', N'Nuevo compromiso registrado',
                N'Se registró un compromiso de bienes materiales.', @compromisoId);

        INSERT INTO dbo.auditoria_eventos (
            usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
            origen, resultado, descripcion, creado_en)
        VALUES (
            @donanteUsuarioId, N'COMPROMISO_CREADO', N'DONACIONES', N'COMPROMISO',
            CAST(@compromisoId AS VARCHAR(50)), N'WEB', N'OK',
            N'Compromiso registrado con disponibilidad verificada.', @ahora);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        SET @compromisoId = NULL;
        THROW;
    END CATCH
END
GO

/* -------------------------------------------------------- Confirmar recepción
   Parámetros @observaciones y @evidenciasJson son adicionales respecto del
   documento de diseño y son necesarios para cumplir CK_recepciones_observacion
   y para permitir evidencias reales sin inventar archivos. */

CREATE OR ALTER PROCEDURE dbo.usp_ConfirmarRecepcion
    @entregaId            INT,
    @recibidoPorUsuarioId INT,
    @lineasJson           NVARCHAR(MAX),
    @estadoRecepcion      VARCHAR(20),
    @observaciones        NVARCHAR(500)  = NULL,
    @evidenciasJson       NVARCHAR(MAX)  = NULL,
    @recepcionId          INT OUTPUT
WITH EXECUTE AS OWNER
AS
BEGIN
    SET XACT_ABORT ON;
    SET NOCOUNT ON;

    DECLARE @ahora DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @bloqueo INT;

    IF @estadoRecepcion NOT IN (N'PARCIAL', N'CONFIRMADA', N'OBSERVADA')
        OR @estadoRecepcion IS NULL
        THROW 52010, N'ESTADO_RECEPCION_INVALIDO', 1;

    IF @estadoRecepcion = N'OBSERVADA' AND (@observaciones IS NULL OR LTRIM(@observaciones) = N'')
        THROW 52010, N'ESTADO_RECEPCION_INVALIDO', 1;

    DECLARE @lineas TABLE (
        producto_id INT NOT NULL,
        unidad_id   INT NOT NULL,
        cantidad    DECIMAL(12,3) NOT NULL,
        PRIMARY KEY (producto_id, unidad_id)
    );

    INSERT INTO @lineas (producto_id, unidad_id, cantidad)
    SELECT l.productoId, l.unidadId, l.cantidad
    FROM OPENJSON(@lineasJson)
    WITH (
        productoId INT          N'$.productoId',
        unidadId   INT          N'$.unidadId',
        cantidad   DECIMAL(12,3) N'$.cantidad'
    ) AS l;

    IF NOT EXISTS (SELECT 1 FROM @lineas)
        THROW 52008, N'CANTIDAD_RECIBIDA_INVALIDA', 1;

    IF EXISTS (
        SELECT 1
        FROM @lineas
        WHERE producto_id IS NULL OR unidad_id IS NULL OR cantidad IS NULL OR cantidad < 0
    )
        THROW 52008, N'CANTIDAD_RECIBIDA_INVALIDA', 1;

    IF EXISTS (SELECT 1 FROM @lineas GROUP BY producto_id, unidad_id HAVING COUNT(*) > 1)
        THROW 52008, N'CANTIDAD_RECIBIDA_INVALIDA', 1;

    DECLARE @evidencias TABLE (archivo_id BIGINT NOT NULL PRIMARY KEY);

    IF @evidenciasJson IS NOT NULL
        INSERT INTO @evidencias (archivo_id)
        SELECT DISTINCT ev.archivoId
        FROM OPENJSON(@evidenciasJson)
        WITH (archivoId BIGINT N'$.archivoId') AS ev
        WHERE ev.archivoId IS NOT NULL;

    SET @recepcionId = NULL;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @compromisoId INT;
        DECLARE @entregaEstado VARCHAR(15);
        DECLARE @institucionId INT;
        DECLARE @donanteId INT;
        DECLARE @compromisoEstado VARCHAR(15);

        /* Orden de bloqueo: entregas -> entrega_productos -> recepciones. */
        SELECT
            @compromisoId = c.compromiso_id,
            @entregaEstado = e.estado,
            @institucionId = n.institucion_id,
            @donanteId = c.donante_usuario_id
        FROM dbo.entregas e WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.compromisos c ON c.compromiso_id = e.compromiso_id
        INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
        WHERE e.entrega_id = @entregaId;

        IF @compromisoId IS NULL
            THROW 52009, N'ENTREGA_NO_VALIDA', 1;

        IF @entregaEstado = N'CANCELADA'
           OR (@entregaEstado = N'ENTREGADA' AND @estadoRecepcion <> N'CONFIRMADA')
            THROW 52009, N'ENTREGA_NO_VALIDA', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.recepciones AS r WITH (UPDLOCK, HOLDLOCK)
            WHERE r.entrega_id = @entregaId
        )
            THROW 52006, N'RECEPCION_DUPLICADA', 1;

        SELECT @bloqueo = COUNT(*)
        FROM dbo.entrega_productos AS ep WITH (UPDLOCK, HOLDLOCK)
        WHERE ep.entrega_id = @entregaId;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.vw_representante_autorizado ra
            WHERE ra.usuario_id = @recibidoPorUsuarioId
              AND ra.institucion_id = @institucionId
              AND ra.autorizado = 1
        )
            THROW 52007, N'REPRESENTANTE_NO_AUTORIZADO', 1;

        IF EXISTS (
            SELECT 1
            FROM @lineas l
            LEFT JOIN dbo.entrega_productos ep
                ON ep.entrega_id = @entregaId
               AND ep.producto_id = l.producto_id
               AND ep.unidad_id = l.unidad_id
            WHERE ep.entrega_id IS NULL
        )
            THROW 52008, N'CANTIDAD_RECIBIDA_INVALIDA', 1;

        IF EXISTS (
            SELECT 1
            FROM @lineas l
            INNER JOIN dbo.entrega_productos ep
                ON ep.entrega_id = @entregaId
               AND ep.producto_id = l.producto_id
               AND ep.unidad_id = l.unidad_id
            WHERE l.cantidad > ep.cantidad_entregada
        )
            THROW 52008, N'CANTIDAD_RECIBIDA_INVALIDA', 1;

        IF EXISTS (
            SELECT 1
            FROM @evidencias ev
            LEFT JOIN dbo.archivos a ON a.archivo_id = ev.archivo_id
            WHERE a.archivo_id IS NULL
               OR a.tipo <> N'EVIDENCIA_RECEPCION'
               OR a.visibilidad <> N'PRIVADO'
               OR a.eliminado_en IS NOT NULL
        )
            THROW 52011, N'EVIDENCIA_INVALIDA', 1;

        INSERT INTO dbo.recepciones (
            entrega_id, recibido_por_usuario_id, fecha_confirmacion,
            estado, observaciones)
        VALUES (
            @entregaId, @recibidoPorUsuarioId, @ahora,
            @estadoRecepcion, @observaciones);

        SET @recepcionId = CAST(SCOPE_IDENTITY() AS INT);

        INSERT INTO dbo.recepcion_productos (
            recepcion_id, entrega_id, producto_id, unidad_id, cantidad_recibida)
        SELECT @recepcionId, @entregaId, l.producto_id, l.unidad_id, l.cantidad
        FROM @lineas l;

        INSERT INTO dbo.recepcion_evidencias (recepcion_id, archivo_id)
        SELECT @recepcionId, ev.archivo_id
        FROM @evidencias ev;

        DECLARE @nuevoEstadoEntrega VARCHAR(15) =
            CASE WHEN @estadoRecepcion = N'CONFIRMADA' THEN N'ENTREGADA' ELSE N'INCIDENCIA' END;

        IF @entregaEstado <> @nuevoEstadoEntrega
        BEGIN
            UPDATE dbo.entregas
            SET estado = @nuevoEstadoEntrega,
                /* CK_entregas_fechas exige inicio cuando existe fin. */
                fecha_real_inicio = COALESCE(fecha_real_inicio, @ahora),
                fecha_real_fin = CASE
                    WHEN @nuevoEstadoEntrega = N'ENTREGADA' THEN @ahora
                    ELSE fecha_real_fin
                END
            WHERE entrega_id = @entregaId;

            INSERT INTO dbo.entrega_historial (
                entrega_id, estado_anterior, estado_nuevo, cambiado_en, usuario_id, motivo)
            VALUES (
                @entregaId, @entregaEstado, @nuevoEstadoEntrega, @ahora,
                @recibidoPorUsuarioId,
                COALESCE(@observaciones,
                    CASE WHEN @nuevoEstadoEntrega = N'INCIDENCIA'
                         THEN N'RECEPCION_PARCIAL' ELSE N'RECEPCION_CONFIRMADA' END));
        END

        SELECT @compromisoEstado = c.estado
        FROM dbo.compromisos c WITH (UPDLOCK, HOLDLOCK)
        WHERE c.compromiso_id = @compromisoId;

        IF @estadoRecepcion = N'CONFIRMADA'
           AND @compromisoEstado = N'ACEPTADO'
           AND NOT EXISTS (
                SELECT 1
                FROM dbo.compromiso_productos cp
                LEFT JOIN (
                    SELECT
                        e.compromiso_id,
                        rp.producto_id,
                        rp.unidad_id,
                        SUM(rp.cantidad_recibida) AS cantidad_recibida
                    FROM dbo.recepcion_productos rp
                    INNER JOIN dbo.entregas e ON e.entrega_id = rp.entrega_id
                    WHERE e.compromiso_id = @compromisoId
                    GROUP BY e.compromiso_id, rp.producto_id, rp.unidad_id
                ) rec
                    ON rec.compromiso_id = cp.compromiso_id
                   AND rec.producto_id = cp.producto_id
                   AND rec.unidad_id = cp.unidad_id
                WHERE cp.compromiso_id = @compromisoId
                  AND COALESCE(rec.cantidad_recibida, CAST(0 AS DECIMAL(12,3))) < cp.cantidad_comprometida
           )
        BEGIN
            UPDATE dbo.compromisos
            SET estado = N'COMPLETADO'
            WHERE compromiso_id = @compromisoId;

            INSERT INTO dbo.compromiso_historial (
                compromiso_id, estado_anterior, estado_nuevo, cambiado_en, usuario_id, motivo)
            VALUES (
                @compromisoId, @compromisoEstado, N'COMPLETADO', @ahora,
                @recibidoPorUsuarioId, N'RECEPCION_CONFIRMADA_TOTAL');
        END

        INSERT INTO dbo.notificaciones (
            destinatario_usuario_id, tipo, titulo, cuerpo, recepcion_id)
        VALUES (
            @donanteId, N'RECEPCION_CONFIRMADA', N'Recepción registrada',
            N'Se registró la confirmación de recepción de la entrega.', @recepcionId);

        INSERT INTO dbo.auditoria_eventos (
            usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
            origen, resultado, descripcion, creado_en)
        VALUES (
            @recibidoPorUsuarioId, N'RECEPCION_CONFIRMADA', N'DONACIONES', N'RECEPCION',
            CAST(@recepcionId AS VARCHAR(50)), N'WEB', N'OK',
            N'Recepción registrada por representante autorizado.', @ahora);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        SET @recepcionId = NULL;
        THROW;
    END CATCH
END
GO

SELECT
    name AS Procedimiento,
    (SELECT COUNT(*) FROM sys.parameters p WHERE p.object_id = o.object_id) AS Parametros
FROM sys.procedures o
WHERE schema_id = SCHEMA_ID(N'dbo')
  AND name LIKE N'usp_%'
ORDER BY name;
GO
