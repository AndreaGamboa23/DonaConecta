/* ============================================================================
   DonaConecta — Fase 06
   006_crear_vistas.sql
   Crea las nueve vistas aprobadas en docs/modelo-logico.md §8. Todas calculan
   datos derivados a partir de registros reales; no almacenan totales.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/scripts/006_crear_vistas.sql
   ============================================================================ */

USE [DonaConectaDB];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
SET NOCOUNT ON;
GO

/* -------------------------------------------------- 1. Disponibilidad por línea
   Reserva vigente = GREATEST(comprometido - recibido del compromiso, 0) solo para
   PENDIENTE/ACEPTADO no vencidos. Recibido total se suma aparte e incluye
   COMPLETADO, para no descontar dos veces lo ya entregado y confirmado. */

CREATE OR ALTER VIEW dbo.vw_disponibilidad_necesidad AS
WITH recibido_por_compromiso AS (
    SELECT
        e.compromiso_id,
        rp.producto_id,
        rp.unidad_id,
        SUM(rp.cantidad_recibida) AS cantidad_recibida
    FROM dbo.recepcion_productos rp
    INNER JOIN dbo.entregas e ON e.entrega_id = rp.entrega_id
    GROUP BY e.compromiso_id, rp.producto_id, rp.unidad_id
),
reservas AS (
    SELECT
        cp.necesidad_id,
        cp.producto_id,
        cp.unidad_id,
        SUM(CASE
                WHEN c.estado IN (N'PENDIENTE', N'ACEPTADO')
                     AND (c.expira_en IS NULL OR c.expira_en >= SYSUTCDATETIME())
                THEN GREATEST(
                    cp.cantidad_comprometida
                        - COALESCE(r.cantidad_recibida, CAST(0 AS DECIMAL(12,3))),
                    CAST(0 AS DECIMAL(12,3)))
                ELSE CAST(0 AS DECIMAL(12,3))
            END) AS cantidad_reservada_vigente
    FROM dbo.compromiso_productos cp
    INNER JOIN dbo.compromisos c
        ON c.compromiso_id = cp.compromiso_id
       AND c.necesidad_id = cp.necesidad_id
    LEFT JOIN recibido_por_compromiso r
        ON r.compromiso_id = c.compromiso_id
       AND r.producto_id = cp.producto_id
       AND r.unidad_id = cp.unidad_id
    GROUP BY cp.necesidad_id, cp.producto_id, cp.unidad_id
),
recibido_total AS (
    SELECT
        cp.necesidad_id,
        cp.producto_id,
        cp.unidad_id,
        SUM(COALESCE(r.cantidad_recibida, CAST(0 AS DECIMAL(12,3)))) AS cantidad_recibida
    FROM dbo.compromiso_productos cp
    LEFT JOIN recibido_por_compromiso r
        ON r.compromiso_id = cp.compromiso_id
       AND r.producto_id = cp.producto_id
       AND r.unidad_id = cp.unidad_id
    GROUP BY cp.necesidad_id, cp.producto_id, cp.unidad_id
)
SELECT
    np.necesidad_id,
    np.producto_id,
    np.unidad_id,
    np.cantidad_requerida,
    COALESCE(res.cantidad_reservada_vigente, CAST(0 AS DECIMAL(12,3))) AS cantidad_reservada_vigente,
    COALESCE(rec.cantidad_recibida, CAST(0 AS DECIMAL(12,3))) AS cantidad_recibida,
    GREATEST(
        np.cantidad_requerida
            - COALESCE(res.cantidad_reservada_vigente, CAST(0 AS DECIMAL(12,3)))
            - COALESCE(rec.cantidad_recibida, CAST(0 AS DECIMAL(12,3))),
        CAST(0 AS DECIMAL(12,3))) AS cantidad_disponible
FROM dbo.necesidad_productos np
LEFT JOIN reservas res
    ON res.necesidad_id = np.necesidad_id
   AND res.producto_id = np.producto_id
   AND res.unidad_id = np.unidad_id
LEFT JOIN recibido_total rec
    ON rec.necesidad_id = np.necesidad_id
   AND rec.producto_id = np.producto_id
   AND rec.unidad_id = np.unidad_id;
GO

/* ----------------------------------------------------- 2. Progreso por necesidad */

CREATE OR ALTER VIEW dbo.vw_progreso_necesidad AS
WITH lineas AS (
    SELECT
        d.necesidad_id,
        CAST(CASE
            WHEN d.cantidad_requerida > 0
            THEN LEAST(
                (d.cantidad_reservada_vigente + d.cantidad_recibida) / d.cantidad_requerida,
                CAST(1 AS DECIMAL(12,3)))
            ELSE CAST(0 AS DECIMAL(12,3))
        END AS DECIMAL(12,3)) AS razon
    FROM dbo.vw_disponibilidad_necesidad d
)
SELECT
    necesidad_id,
    COUNT(*) AS lineas_totales,
    SUM(CASE WHEN razon >= CAST(1 AS DECIMAL(12,3)) THEN 1 ELSE 0 END) AS lineas_cubiertas,
    CAST(ROUND(AVG(razon) * 100, 2) AS DECIMAL(5,2)) AS avance_porcentaje
FROM lineas
GROUP BY necesidad_id;
GO

/* ------------------------------------------------ 3. Directorio público filtrado */

CREATE OR ALTER VIEW dbo.vw_directorio_instituciones AS
SELECT
    i.institucion_id,
    i.nombre,
    i.slug,
    ti.nombre AS tipo,
    d.nombre AS distrito,
    i.estado_verificacion,
    i.foto_archivo_id
FROM dbo.instituciones i
INNER JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
WHERE i.estado_verificacion = N'VERIFICADA';
GO

/* --------------------------------------- 4. Autorización institucional compuesta */

CREATE OR ALTER VIEW dbo.vw_representante_autorizado AS
SELECT
    ir.usuario_id,
    ir.institucion_id,
    ur.estado AS rol_estado,
    ir.estado AS vinculo_estado,
    i.estado_verificacion AS institucion_estado,
    CAST(CASE
        WHEN ur.estado = N'ACTIVO'
             AND ir.estado = N'ACTIVO'
             AND i.estado_verificacion = N'VERIFICADA'
        THEN 1 ELSE 0
    END AS BIT) AS autorizado
FROM dbo.institucion_representantes ir
INNER JOIN dbo.usuario_roles ur
    ON ur.usuario_id = ir.usuario_id
   AND ur.rol_id = (SELECT rol_id FROM dbo.roles WHERE codigo = N'REPRESENTANTE')
INNER JOIN dbo.instituciones i ON i.institucion_id = ir.institucion_id;
GO

/* --------------------------------------------- 5. Participantes válidos de entrega */

CREATE OR ALTER VIEW dbo.vw_participantes_entrega AS
WITH contexto AS (
    SELECT
        e.entrega_id,
        e.responsable_usuario_id,
        c.donante_usuario_id,
        n.institucion_id
    FROM dbo.entregas e
    INNER JOIN dbo.compromisos c ON c.compromiso_id = e.compromiso_id
    INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
),
participantes AS (
    SELECT
        ctx.entrega_id,
        ctx.donante_usuario_id AS usuario_id,
        CAST(N'DONANTE' AS VARCHAR(20)) AS rol,
        ctx.institucion_id,
        CAST(CASE
            WHEN u.estado_cuenta = N'ACTIVO'
                 AND EXISTS (SELECT 1 FROM dbo.donantes d WHERE d.usuario_id = ctx.donante_usuario_id)
            THEN 1 ELSE 0
        END AS BIT) AS activo
    FROM contexto ctx
    INNER JOIN dbo.usuarios u ON u.usuario_id = ctx.donante_usuario_id

    UNION ALL

    SELECT
        ctx.entrega_id,
        ir.usuario_id,
        CAST(N'REPRESENTANTE' AS VARCHAR(20)) AS rol,
        ctx.institucion_id,
        CAST(CASE WHEN ra.autorizado = 1 AND ir.estado = N'ACTIVO' THEN 1 ELSE 0 END AS BIT) AS activo
    FROM contexto ctx
    INNER JOIN dbo.institucion_representantes ir ON ir.institucion_id = ctx.institucion_id
    INNER JOIN dbo.vw_representante_autorizado ra
        ON ra.usuario_id = ir.usuario_id
       AND ra.institucion_id = ir.institucion_id

    UNION ALL

    SELECT
        ctx.entrega_id,
        ctx.responsable_usuario_id,
        ISNULL((
            SELECT TOP 1 r.codigo
            FROM dbo.usuario_roles ur
            INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id
            WHERE ur.usuario_id = ctx.responsable_usuario_id
              AND ur.estado = N'ACTIVO'
            ORDER BY CASE r.codigo
                WHEN N'ADMINISTRADOR' THEN 1
                WHEN N'REPRESENTANTE' THEN 2
                ELSE 3
            END
        ), CAST(N'DONANTE' AS VARCHAR(20))) AS rol,
        ctx.institucion_id,
        CAST(CASE WHEN u.estado_cuenta = N'ACTIVO' THEN 1 ELSE 0 END AS BIT) AS activo
    FROM contexto ctx
    INNER JOIN dbo.usuarios u ON u.usuario_id = ctx.responsable_usuario_id
)
SELECT
    entrega_id,
    usuario_id,
    rol,
    institucion_id,
    CAST(MAX(CAST(activo AS INT)) AS BIT) AS activo
FROM participantes
GROUP BY entrega_id, usuario_id, rol, institucion_id;
GO

/* ------------------------------------------------------- 6. Bandeja de conversaciones */

CREATE OR ALTER VIEW dbo.vw_conversaciones_usuario AS
WITH participantes AS (
    SELECT
        cp.conversacion_id,
        cp.usuario_id,
        (
            SELECT m2.creado_en
            FROM dbo.mensajes m2
            WHERE m2.conversacion_id = cp.conversacion_id
              AND m2.mensaje_id = cp.ultimo_mensaje_leido_id
        ) AS ultimo_leido_en
    FROM dbo.conversacion_participantes cp
    WHERE cp.estado = N'ACTIVO'
)
SELECT
    p.usuario_id,
    p.conversacion_id,
    COUNT(m.mensaje_id) AS total_mensajes,
    SUM(CASE
        WHEN m.creado_en > COALESCE(p.ultimo_leido_en, CONVERT(DATETIME2(0), N'1900-01-01T00:00:00', 127))
        THEN 1 ELSE 0
    END) AS mensajes_no_leidos,
    MAX(m.creado_en) AS ultimo_mensaje_en
FROM participantes p
LEFT JOIN dbo.mensajes m
    ON m.conversacion_id = p.conversacion_id
   AND m.eliminado_en IS NULL
GROUP BY p.usuario_id, p.conversacion_id;
GO

/* ----------------------------------------------------------- 7. Resumen donante */

CREATE OR ALTER VIEW dbo.vw_donante_resumen AS
SELECT
    d.usuario_id,
    (
        SELECT COUNT(*)
        FROM dbo.compromisos c
        WHERE c.donante_usuario_id = d.usuario_id
          AND c.estado IN (N'PENDIENTE', N'ACEPTADO')
          AND (c.expira_en IS NULL OR c.expira_en >= SYSUTCDATETIME())
    ) AS compromisos_activos,
    (
        SELECT COUNT(*)
        FROM dbo.compromisos c
        INNER JOIN dbo.entregas e ON e.compromiso_id = c.compromiso_id
        WHERE c.donante_usuario_id = d.usuario_id
          AND e.estado IN (N'PROGRAMADA', N'EN_CAMINO', N'INCIDENCIA')
    ) AS entregas_pendientes,
    (
        SELECT COUNT(DISTINCT r.recepcion_id)
        FROM dbo.compromisos c
        INNER JOIN dbo.entregas e ON e.compromiso_id = c.compromiso_id
        INNER JOIN dbo.recepciones r ON r.entrega_id = e.entrega_id
        WHERE c.donante_usuario_id = d.usuario_id
          AND r.estado = N'CONFIRMADA'
    ) AS donaciones_confirmadas
FROM dbo.donantes d;
GO

/* ------------------------------------------------------- 8. Resumen institución */

CREATE OR ALTER VIEW dbo.vw_institucion_resumen AS
SELECT
    i.institucion_id,
    (
        SELECT COUNT(*)
        FROM dbo.necesidades n
        WHERE n.institucion_id = i.institucion_id
          AND n.estado = N'PUBLICADA'
    ) AS necesidades_publicadas,
    (
        SELECT COUNT(*)
        FROM dbo.necesidades n
        INNER JOIN dbo.compromisos c ON c.necesidad_id = n.necesidad_id
        WHERE n.institucion_id = i.institucion_id
          AND c.estado IN (N'PENDIENTE', N'ACEPTADO', N'COMPLETADO')
    ) AS compromisos_recibidos,
    (
        SELECT COUNT(DISTINCT r.recepcion_id)
        FROM dbo.necesidades n
        INNER JOIN dbo.compromisos c ON c.necesidad_id = n.necesidad_id
        INNER JOIN dbo.entregas e ON e.compromiso_id = c.compromiso_id
        INNER JOIN dbo.recepciones r ON r.entrega_id = e.entrega_id
        WHERE n.institucion_id = i.institucion_id
          AND r.estado = N'CONFIRMADA'
    ) AS recepciones_confirmadas
FROM dbo.instituciones i;
GO

/* ------------------------------------------------------------ 9. Resumen admin */

CREATE OR ALTER VIEW dbo.vw_admin_resumen AS
SELECT
    (
        SELECT COUNT(*)
        FROM dbo.instituciones i
        WHERE i.estado_verificacion IN (N'PENDIENTE', N'EN_REVISION')
    ) AS instituciones_pendientes,
    (
        SELECT COUNT(*)
        FROM dbo.usuarios u
        WHERE u.estado_cuenta = N'ACTIVO'
    ) AS usuarios_activos,
    (
        (SELECT COUNT(*) FROM dbo.entregas e WHERE e.estado = N'INCIDENCIA')
        + (SELECT COUNT(*) FROM dbo.recepciones r WHERE r.estado = N'OBSERVADA')
    ) AS incidencias_abiertas;
GO

SELECT
    name AS Vista,
    (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = v.object_id) AS Columnas
FROM sys.views v
WHERE schema_id = SCHEMA_ID(N'dbo')
  AND name LIKE N'vw_%'
ORDER BY name;
GO
