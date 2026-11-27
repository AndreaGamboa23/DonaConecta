/* ============================================================================
   DonaConecta — Fase 06
   004_crear_indices.sql
   Índices aprobados en docs/modelo-fisico.md §5. Los UNIQUE de claves candidata
   ya creados en 002 no se duplican aquí.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/scripts/004_crear_indices.sql
   ============================================================================ */

USE [DonaConectaDB];
GO
/* sqlcmd inicia con QUOTED_IDENTIFIER OFF; los índices filtrados exigen ON. */
SET QUOTED_IDENTIFIER ON;
GO
SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.usuario_roles') AND name = N'UX_usuario_roles_activo')
    CREATE UNIQUE INDEX UX_usuario_roles_activo
        ON dbo.usuario_roles(usuario_id, rol_id)
        WHERE estado = 'ACTIVO';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.institucion_representantes') AND name = N'UX_institucion_contacto_principal')
    CREATE UNIQUE INDEX UX_institucion_contacto_principal
        ON dbo.institucion_representantes(institucion_id)
        WHERE estado = 'ACTIVO' AND es_contacto_principal = 1;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.sesiones_gps') AND name = N'UX_sesiones_gps_activas_entrega')
    CREATE UNIQUE INDEX UX_sesiones_gps_activas_entrega
        ON dbo.sesiones_gps(entrega_id)
        WHERE estado = 'ACTIVA';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.sesiones_gps') AND name = N'UX_sesiones_gps_activas_usuario')
    CREATE UNIQUE INDEX UX_sesiones_gps_activas_usuario
        ON dbo.sesiones_gps(usuario_id)
        WHERE estado = 'ACTIVA';
GO

/* La foto es opcional: se permite que muchas instituciones no tengan foto,
   pero no se repite un mismo archivo entre dos instituciones. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.instituciones') AND name = N'UX_instituciones_foto_no_nula')
    CREATE UNIQUE INDEX UX_instituciones_foto_no_nula
        ON dbo.instituciones(foto_archivo_id)
        WHERE foto_archivo_id IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.necesidades') AND name = N'IX_necesidades_institucion_estado')
    CREATE INDEX IX_necesidades_institucion_estado
        ON dbo.necesidades(institucion_id, estado);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.compromisos') AND name = N'IX_compromisos_necesidad_estado')
    CREATE INDEX IX_compromisos_necesidad_estado
        ON dbo.compromisos(necesidad_id, estado);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.compromisos') AND name = N'IX_compromisos_donante_fecha')
    CREATE INDEX IX_compromisos_donante_fecha
        ON dbo.compromisos(donante_usuario_id, fecha_compromiso DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.entregas') AND name = N'IX_entregas_compromiso_estado')
    CREATE INDEX IX_entregas_compromiso_estado
        ON dbo.entregas(compromiso_id, estado);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.notificaciones') AND name = N'IX_notificaciones_destinatario')
    CREATE INDEX IX_notificaciones_destinatario
        ON dbo.notificaciones(destinatario_usuario_id, leido_en, creado_en DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.auditoria_eventos') AND name = N'IX_auditoria_creado_en')
    CREATE INDEX IX_auditoria_creado_en
        ON dbo.auditoria_eventos(creado_en DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.archivos') AND name = N'IX_archivos_propietario')
    CREATE INDEX IX_archivos_propietario
        ON dbo.archivos(propietario_usuario_id, creado_en DESC);
GO

SELECT
    OBJECT_NAME(object_id) AS Tabla,
    name AS Indice,
    is_unique AS Unico,
    has_filter AS Filtrado
FROM sys.indexes
WHERE object_id IN (
    OBJECT_ID(N'dbo.usuario_roles'),
    OBJECT_ID(N'dbo.institucion_representantes'),
    OBJECT_ID(N'dbo.instituciones'),
    OBJECT_ID(N'dbo.sesiones_gps'),
    OBJECT_ID(N'dbo.necesidades'),
    OBJECT_ID(N'dbo.compromisos'),
    OBJECT_ID(N'dbo.entregas'),
    OBJECT_ID(N'dbo.notificaciones'),
    OBJECT_ID(N'dbo.auditoria_eventos'),
    OBJECT_ID(N'dbo.archivos')
)
AND name LIKE N'[UI]X_%'
ORDER BY Tabla, Indice;
GO
