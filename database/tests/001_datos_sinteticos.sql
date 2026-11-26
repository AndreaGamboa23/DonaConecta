/* ============================================================================
   DonaConecta — Fase 06
   001_datos_sinteticos.sql
   Datos SINTÉTICOS de prueba. Ejecutar SOLO contra DonaConectaDB_Pruebas.
   NUNCA ejecutar contra DonaConectaDB: la base real debe quedar sin usuarios,
   instituciones, necesidades, compromisos ni entregas inventados.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/tests/001_datos_sinteticos.sql
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

DECLARE @ahora DATETIME2(0) = SYSUTCDATETIME();

DECLARE @rolAdmin INT     = (SELECT rol_id FROM dbo.roles WHERE codigo = N'ADMINISTRADOR');
DECLARE @rolRep INT       = (SELECT rol_id FROM dbo.roles WHERE codigo = N'REPRESENTANTE');
DECLARE @rolDonante INT   = (SELECT rol_id FROM dbo.roles WHERE codigo = N'DONANTE');
DECLARE @distritoId INT   = (SELECT distrito_id FROM dbo.distritos WHERE nombre = N'Huancayo');
DECLARE @tipoId INT       = (SELECT tipo_id FROM dbo.tipos_institucion WHERE codigo = N'COMEDOR');
DECLARE @categoriaId INT  = (SELECT categoria_id FROM dbo.categorias_bienes WHERE codigo = N'ALIMENTOS_NO_PERECIBLES');
DECLARE @unidadId INT     = (SELECT unidad_id FROM dbo.unidades_medida WHERE codigo = N'UN');
DECLARE @productoId INT;

/* password_hash es un marcador explícito: NO es una credencial real ni un hash válido. */
INSERT INTO dbo.usuarios (email, password_hash, nombres, apellidos, estado_cuenta, email_verificado_en)
SELECT v.email, N'TEST_ONLY_NO_HASH', v.nombres, N'Prueba', N'ACTIVO', @ahora
FROM (VALUES
    (N'test_admin@donaconecta.invalid',    N'Admin'),
    (N'test_rep@donaconecta.invalid',      N'Representante'),
    (N'test_donante@donaconecta.invalid',  N'DonanteUno'),
    (N'test_donante2@donaconecta.invalid', N'DonanteDos')
) AS v(email, nombres)
WHERE NOT EXISTS (SELECT 1 FROM dbo.usuarios u WHERE u.email = v.email);

DECLARE @adminId INT   = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_admin@donaconecta.invalid');
DECLARE @repId INT     = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_rep@donaconecta.invalid');
DECLARE @donanteId INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_donante@donaconecta.invalid');
DECLARE @donante2Id INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_donante2@donaconecta.invalid');

INSERT INTO dbo.usuario_roles (usuario_id, rol_id, estado, asignado_por_usuario_id)
SELECT v.usuario_id, v.rol_id, N'ACTIVO', @adminId
FROM (VALUES
    (@adminId, @rolAdmin),
    (@repId, @rolRep),
    (@donanteId, @rolDonante),
    (@donante2Id, @rolDonante)
) AS v(usuario_id, rol_id)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.usuario_roles ur
    WHERE ur.usuario_id = v.usuario_id AND ur.rol_id = v.rol_id);

INSERT INTO dbo.donantes (usuario_id, distrito_id, preferencia_notificacion, consentimiento_datos, acepta_terminos)
SELECT v.usuario_id, @distritoId, N'TODAS', 1, 1
FROM (VALUES (@donanteId), (@donante2Id)) AS v(usuario_id)
WHERE NOT EXISTS (SELECT 1 FROM dbo.donantes d WHERE d.usuario_id = v.usuario_id);

INSERT INTO dbo.instituciones (
    tipo_id, distrito_id, nombre, slug, estado_verificacion,
    fecha_registro, fecha_verificacion, verificado_por_usuario_id)
SELECT @tipoId, @distritoId, N'Institución sintética de prueba', N'institucion-sintetica-prueba',
       N'VERIFICADA', @ahora, @ahora, @adminId
WHERE NOT EXISTS (SELECT 1 FROM dbo.instituciones i WHERE i.slug = N'institucion-sintetica-prueba');

DECLARE @institucionId INT = (SELECT institucion_id FROM dbo.instituciones WHERE slug = N'institucion-sintetica-prueba');

INSERT INTO dbo.institucion_representantes (
    institucion_id, usuario_id, cargo, es_contacto_principal, estado, fecha_inicio)
SELECT @institucionId, @repId, N'Responsable de prueba', 1, N'ACTIVO', @ahora
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.institucion_representantes ir
    WHERE ir.institucion_id = @institucionId AND ir.usuario_id = @repId);

INSERT INTO dbo.productos (categoria_id, nombre, descripcion, activo)
SELECT @categoriaId, N'Producto sintético de prueba', N'Únicamente para pruebas de la Fase 06.', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.productos p
    WHERE p.categoria_id = @categoriaId AND p.nombre = N'Producto sintético de prueba');

SET @productoId = (SELECT producto_id FROM dbo.productos
                   WHERE nombre = N'Producto sintético de prueba');

INSERT INTO dbo.producto_unidades (producto_id, unidad_id, es_preferida)
SELECT @productoId, @unidadId, 1
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.producto_unidades pu
    WHERE pu.producto_id = @productoId AND pu.unidad_id = @unidadId);

INSERT INTO dbo.necesidades (
    institucion_id, titulo, descripcion, prioridad, estado,
    fecha_publicacion, fecha_limite, creado_por_usuario_id, creado_en, actualizado_en)
SELECT @institucionId, v.titulo, N'Necesidad sintética creada para validar reglas de la Fase 06.',
       N'ALTA', N'PUBLICADA', @ahora, DATEADD(DAY, 30, @ahora), @repId, @ahora, @ahora
FROM (VALUES
    (N'Necesidad sintética concurrencia'),
    (N'Necesidad sintética recepcion'),
    (N'Necesidad sintética vencida')
) AS v(titulo)
WHERE NOT EXISTS (SELECT 1 FROM dbo.necesidades n WHERE n.titulo = v.titulo);

INSERT INTO dbo.necesidad_productos (necesidad_id, producto_id, unidad_id, cantidad_requerida)
SELECT n.necesidad_id, @productoId, @unidadId,
       CASE n.titulo
           WHEN N'Necesidad sintética concurrencia' THEN CAST(10 AS DECIMAL(12,3))
           WHEN N'Necesidad sintética recepcion' THEN CAST(20 AS DECIMAL(12,3))
           ELSE CAST(5 AS DECIMAL(12,3))
       END
FROM dbo.necesidades n
WHERE n.titulo IN (N'Necesidad sintética concurrencia', N'Necesidad sintética recepcion', N'Necesidad sintética vencida')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.necesidad_productos np
      WHERE np.necesidad_id = n.necesidad_id
        AND np.producto_id = @productoId
        AND np.unidad_id = @unidadId);

/* Compromiso ACEPTADO y entrega para probar recepciones y GPS. */
DECLARE @necesidadRecepcionId INT = (
    SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética recepcion');

INSERT INTO dbo.compromisos (
    necesidad_id, donante_usuario_id, estado, fecha_compromiso, expira_en, creado_en)
SELECT @necesidadRecepcionId, @donanteId, N'ACEPTADO', @ahora, DATEADD(DAY, 1, @ahora), @ahora
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.compromisos c
    WHERE c.necesidad_id = @necesidadRecepcionId
      AND c.donante_usuario_id = @donanteId
      AND c.estado = N'ACEPTADO');

DECLARE @compromisoId INT = (
    SELECT TOP 1 c.compromiso_id
    FROM dbo.compromisos c
    WHERE c.necesidad_id = @necesidadRecepcionId
      AND c.donante_usuario_id = @donanteId
      AND c.estado = N'ACEPTADO'
    ORDER BY c.compromiso_id);

INSERT INTO dbo.compromiso_productos (compromiso_id, necesidad_id, producto_id, unidad_id, cantidad_comprometida)
SELECT @compromisoId, c.necesidad_id, @productoId, @unidadId, CAST(10 AS DECIMAL(12,3))
FROM dbo.compromisos c
WHERE c.compromiso_id = @compromisoId
  AND NOT EXISTS (
      SELECT 1 FROM dbo.compromiso_productos cp
      WHERE cp.compromiso_id = @compromisoId
        AND cp.producto_id = @productoId
        AND cp.unidad_id = @unidadId);

INSERT INTO dbo.entregas (
    compromiso_id, fecha_programada, estado, responsable_usuario_id)
SELECT @compromisoId, DATEADD(DAY, 1, @ahora), N'PROGRAMADA', @repId
WHERE NOT EXISTS (SELECT 1 FROM dbo.entregas e WHERE e.compromiso_id = @compromisoId);

DECLARE @entregaId INT = (
    SELECT TOP 1 e.entrega_id FROM dbo.entregas e
    WHERE e.compromiso_id = @compromisoId
    ORDER BY e.entrega_id);

INSERT INTO dbo.entrega_productos (entrega_id, compromiso_id, producto_id, unidad_id, cantidad_entregada)
SELECT @entregaId, e.compromiso_id, @productoId, @unidadId, CAST(10 AS DECIMAL(12,3))
FROM dbo.entregas e
WHERE e.entrega_id = @entregaId
  AND NOT EXISTS (
      SELECT 1 FROM dbo.entrega_productos ep
      WHERE ep.entrega_id = @entregaId
        AND ep.producto_id = @productoId
        AND ep.unidad_id = @unidadId);

/* Una sesión GPS activa sembrada: permite probar el índice filtrado único. */
INSERT INTO dbo.sesiones_gps (
    entrega_id, usuario_id, consentimiento_dado, consentimiento_en,
    fecha_inicio, expira_en, estado)
SELECT @entregaId, @donanteId, 1, @ahora, @ahora, DATEADD(HOUR, 1, @ahora), N'ACTIVA'
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.sesiones_gps s
    WHERE s.entrega_id = @entregaId AND s.estado = N'ACTIVA');

/* Compromiso PENDIENTE vencido sin limpieza: la vista debe excluirlo de inmediato. */
DECLARE @necesidadVencidaId INT = (
    SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética vencida');

INSERT INTO dbo.compromisos (
    necesidad_id, donante_usuario_id, estado, fecha_compromiso, expira_en, creado_en)
SELECT @necesidadVencidaId, @donante2Id, N'PENDIENTE', @ahora, DATEADD(MINUTE, -1, @ahora), @ahora
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.compromisos c
    WHERE c.necesidad_id = @necesidadVencidaId AND c.estado = N'PENDIENTE');

DECLARE @compromisoVencidoId INT = (
    SELECT TOP 1 c.compromiso_id FROM dbo.compromisos c
    WHERE c.necesidad_id = @necesidadVencidaId AND c.estado = N'PENDIENTE'
    ORDER BY c.compromiso_id);

INSERT INTO dbo.compromiso_productos (compromiso_id, necesidad_id, producto_id, unidad_id, cantidad_comprometida)
SELECT @compromisoVencidoId, @necesidadVencidaId, @productoId, @unidadId, CAST(5 AS DECIMAL(12,3))
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.compromiso_productos cp
    WHERE cp.compromiso_id = @compromisoVencidoId
      AND cp.producto_id = @productoId
      AND cp.unidad_id = @unidadId);

SELECT
    (SELECT COUNT(*) FROM dbo.usuarios) AS UsuariosSinteticos,
    (SELECT COUNT(*) FROM dbo.instituciones) AS InstitucionesSinteticas,
    (SELECT COUNT(*) FROM dbo.necesidades) AS NecesidadesSinteticas,
    (SELECT COUNT(*) FROM dbo.compromisos) AS CompromisosSinteticos,
    (SELECT COUNT(*) FROM dbo.entregas) AS EntregasSinteticas,
    (SELECT COUNT(*) FROM dbo.sesiones_gps) AS SesionesGPSSinteticas;
GO
