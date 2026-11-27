/* ============================================================================
   DonaConecta — datos sintéticos de demostración de la entrega final
   012_datos_demo_final.sql

   DML idempotente y transaccional. Sólo DonaConectaDB_Pruebas; sin DDL, sin
   DELETE, sin UPDATE sobre registros técnicos existentes y sin secretos.

   CONTENIDO
   - Tres instituciones PENDIENTE de verificación, claramente sintéticas:
     comedor, albergue infantil y refugio de animales.
   - Un representante vinculado por institución, reutilizando cuentas
     sintéticas ya existentes con rol REPRESENTANTE ACTIVO. No se crean
     usuarios, contraseñas, hashes ni claves.
   - Un donante sintético ya existente, reutilizado como referencia de la
     demostración (no se crea ni se modifica su contraseña).
   - Tres necesidades PUBLICADA con tres líneas de producto cada una, usando
     productos y la unidad UN del catálogo real. No se cambian unidades
     históricas ni se suman unidades incompatibles.
   - Un punto de acopio por institución con horarios ACTIVOS. No se inventan
     coordenadas: latitud y longitud quedan NULL.

   VERIFICACIÓN
   Las instituciones quedan en PENDIENTE. El agente principal debe ejecutar el
   flujo API de verificación administrativa; hasta entonces
   dbo.vw_representante_autorizado y el directorio público no las muestran como
   verificadas. Este script NO verifica instituciones por su cuenta.

   EJECUCIÓN
     sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 ^
       -d DonaConectaDB_Pruebas ^
       -i database/scripts/012_datos_demo_final.sql ^
       -o C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-012-demo.txt
   ============================================================================ */

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @BaseActual VARCHAR(128) = CONVERT(VARCHAR(128), DB_NAME());

IF @BaseActual <> 'DonaConectaDB_Pruebas'
BEGIN
    RAISERROR(N'Escritura bloqueada: este script sólo opera en DonaConectaDB_Pruebas. Base actual: %s.', 16, 1, @BaseActual);
    RETURN;
END;

DECLARE @Instituciones TABLE (
    clave           VARCHAR(30)  NOT NULL PRIMARY KEY,
    slug            VARCHAR(220) NOT NULL,
    nombre          NVARCHAR(200) NOT NULL,
    tipo_codigo     VARCHAR(30)  NOT NULL,
    distrito_nombre NVARCHAR(100) NOT NULL,
    descripcion     NVARCHAR(MAX) NOT NULL,
    direccion       NVARCHAR(300) NOT NULL,
    representante_email NVARCHAR(256) NOT NULL,
    institucion_id  INT NULL
);

DECLARE @Puntos TABLE (
    clave           VARCHAR(30) NOT NULL PRIMARY KEY,
    institucion_clave VARCHAR(30) NOT NULL,
    nombre          NVARCHAR(150) NOT NULL,
    direccion       NVARCHAR(300) NOT NULL,
    referencias     NVARCHAR(500) NOT NULL,
    distrito_nombre NVARCHAR(100) NOT NULL,
    punto_id        INT NULL
);

DECLARE @Necesidades TABLE (
    clave           VARCHAR(30) NOT NULL PRIMARY KEY,
    institucion_clave VARCHAR(30) NOT NULL,
    punto_clave     VARCHAR(30) NOT NULL,
    titulo          NVARCHAR(200) NOT NULL,
    descripcion     NVARCHAR(MAX) NOT NULL,
    prioridad       VARCHAR(10) NOT NULL,
    creado_por_email NVARCHAR(256) NOT NULL,
    necesidad_id    INT NULL
);

DECLARE @Lineas TABLE (
    necesidad_clave VARCHAR(30) NOT NULL,
    categoria_codigo VARCHAR(30) NOT NULL,
    producto_nombre NVARCHAR(120) NOT NULL,
    cantidad_requerida DECIMAL(12,3) NOT NULL
);

INSERT INTO @Instituciones
    (clave, slug, nombre, tipo_codigo, distrito_nombre, descripcion, direccion, representante_email)
VALUES
    (N'COMEDOR',  N'demo-final-comedor',   N'DEMO-FINAL-Comedor comunitario',
        N'COMEDOR', N'Huancayo',
        N'Datos sintéticos de demostración. No representa una organización real.',
        N'DEMO-DIRECCION-SINTETICA-SIN-VALOR-REAL-01', N'representante.fase09@ejemplo.com'),
    (N'ALBERGUE', N'demo-final-albergue',  N'DEMO-FINAL-Albergue infantil',
        N'ALBERGUE', N'El Tambo',
        N'Datos sintéticos de demostración. No representa una institución real ni incluye menores identificables.',
        N'DEMO-DIRECCION-SINTETICA-SIN-VALOR-REAL-02', N'f08f.representante@ejemplo.com'),
    (N'REFUGIO',  N'demo-final-refugio',   N'DEMO-FINAL-Refugio de animales',
        N'REFUGIO_ANIMAL', N'Chilca',
        N'Datos sintéticos de demostración. No representa un refugio real.',
        N'DEMO-DIRECCION-SINTETICA-SIN-VALOR-REAL-03', N'f08f.ui.representante@ejemplo.com');

INSERT INTO @Puntos
    (clave, institucion_clave, nombre, direccion, referencias, distrito_nombre)
VALUES
    (N'PUNTO-COMEDOR',  N'COMEDOR',  N'DEMO-FINAL-Punto comedor',
        N'DEMO-DIRECCION-SINTETICA-SIN-VALOR-REAL-01', N'Referencia sintética sin ubicación real.', N'Huancayo'),
    (N'PUNTO-ALBERGUE', N'ALBERGUE', N'DEMO-FINAL-Punto albergue',
        N'DEMO-DIRECCION-SINTETICA-SIN-VALOR-REAL-02', N'Referencia sintética sin ubicación real.', N'El Tambo'),
    (N'PUNTO-REFUGIO',  N'REFUGIO',  N'DEMO-FINAL-Punto refugio',
        N'DEMO-DIRECCION-SINTETICA-SIN-VALOR-REAL-03', N'Referencia sintética sin ubicación real.', N'Chilca');

INSERT INTO @Necesidades
    (clave, institucion_clave, punto_clave, titulo, descripcion, prioridad, creado_por_email)
VALUES
    (N'NEC-COMEDOR', N'COMEDOR', N'PUNTO-COMEDOR',
        N'DEMO-FINAL-NEC-COMEDOR-01', N'Necesidad sintética con tres bienes materiales. Sin beneficiarios reales.', N'ALTA',
        N'representante.fase09@ejemplo.com'),
    (N'NEC-ALBERGUE', N'ALBERGUE', N'PUNTO-ALBERGUE',
        N'DEMO-FINAL-NEC-ALBERGUE-01', N'Necesidad sintética con tres bienes materiales. Sin menores identificables.', N'MEDIA',
        N'f08f.representante@ejemplo.com'),
    (N'NEC-REFUGIO', N'REFUGIO', N'PUNTO-REFUGIO',
        N'DEMO-FINAL-NEC-REFUGIO-01', N'Necesidad sintética con tres bienes para animales. Sin animales identificables.', N'ALTA',
        N'f08f.ui.representante@ejemplo.com');

INSERT INTO @Lineas (necesidad_clave, categoria_codigo, producto_nombre, cantidad_requerida)
VALUES
    (N'NEC-COMEDOR',  N'ALIMENTOS_NO_PERECIBLES', N'Arroz', 20.000),
    (N'NEC-COMEDOR',  N'ALIMENTOS_NO_PERECIBLES', N'Fideos', 15.000),
    (N'NEC-COMEDOR',  N'ALIMENTOS_NO_PERECIBLES', N'Aceite vegetal', 8.000),
    (N'NEC-ALBERGUE', N'ROPA_ABRIGO_FRAZADAS',   N'Frazadas', 12.000),
    (N'NEC-ALBERGUE', N'UTILES_ESCOLARES',        N'Cuadernos', 30.000),
    (N'NEC-ALBERGUE', N'UTILES_ESCOLARES',        N'Mochilas', 10.000),
    (N'NEC-REFUGIO',  N'PRODUCTOS_ANIMALES',      N'Alimento para perros y gatos', 25.000),
    (N'NEC-REFUGIO',  N'PRODUCTOS_ANIMALES',      N'Mantas para animales', 14.000),
    (N'NEC-REFUGIO',  N'PRODUCTOS_ANIMALES',      N'Comederos', 6.000);

BEGIN TRY
    BEGIN TRANSACTION;

    /* Catálogos y cuentas reutilizadas: si falta alguno, se revierte todo. */
    IF EXISTS (
        SELECT 1 FROM @Instituciones i
        LEFT JOIN dbo.tipos_institucion t ON t.codigo = i.tipo_codigo
        LEFT JOIN dbo.distritos d ON d.nombre = i.distrito_nombre
        LEFT JOIN dbo.usuarios u ON u.email = i.representante_email
        LEFT JOIN dbo.usuario_roles ur ON ur.usuario_id = u.usuario_id
            AND ur.rol_id = (SELECT rol_id FROM dbo.roles WHERE codigo = N'REPRESENTANTE')
            AND ur.estado = N'ACTIVO'
        WHERE t.tipo_id IS NULL OR d.distrito_id IS NULL OR u.usuario_id IS NULL OR ur.rol_id IS NULL)
        THROW 52092, 'Falta un tipo, distrito o representante sintético del catálogo real.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.usuarios d
        INNER JOIN dbo.donantes dr ON dr.usuario_id = d.usuario_id
        WHERE d.email = N'donante.fase09@ejemplo.com')
        THROW 52093, 'No existe el donante sintético reutilizado por la demostración.', 1;

    IF EXISTS (
        SELECT 1 FROM @Lineas l
        LEFT JOIN dbo.categorias_bienes c ON c.codigo = l.categoria_codigo
        LEFT JOIN dbo.productos p ON p.categoria_id = c.categoria_id AND p.nombre = l.producto_nombre
        LEFT JOIN dbo.producto_unidades pu ON pu.producto_id = p.producto_id
        LEFT JOIN dbo.unidades_medida u ON u.unidad_id = pu.unidad_id AND u.codigo = N'UN'
        WHERE c.categoria_id IS NULL OR p.producto_id IS NULL OR pu.unidad_id IS NULL OR u.unidad_id IS NULL)
        THROW 52094, 'Falta un producto o la unidad UN del catálogo real para alguna línea demo.', 1;

    /* 1. Instituciones PENDIENTE, sin coordenadas. */
    INSERT INTO dbo.instituciones
        (tipo_id, distrito_id, nombre, slug, descripcion, direccion, estado_verificacion)
    SELECT t.tipo_id, d.distrito_id, i.nombre, i.slug, i.descripcion, i.direccion, N'PENDIENTE'
      FROM @Instituciones i
      INNER JOIN dbo.tipos_institucion t ON t.codigo = i.tipo_codigo
      INNER JOIN dbo.distritos d ON d.nombre = i.distrito_nombre
     WHERE NOT EXISTS (SELECT 1 FROM dbo.instituciones real WHERE real.slug = i.slug);

    UPDATE i
       SET i.institucion_id = real.institucion_id
      FROM @Instituciones i
      INNER JOIN dbo.instituciones real ON real.slug = i.slug;

    /* 2. Representantes vinculados. El vínculo está ACTIVO, pero la
          autorización efectiva sólo existirá tras la verificación por API. */
    INSERT INTO dbo.institucion_representantes
        (institucion_id, usuario_id, cargo, es_contacto_principal, estado, fecha_inicio)
    SELECT i.institucion_id, u.usuario_id, N'DEMO-Responsable sintético', CAST(1 AS BIT), N'ACTIVO', SYSUTCDATETIME()
      FROM @Instituciones i
      INNER JOIN dbo.usuarios u ON u.email = i.representante_email
     WHERE NOT EXISTS (
        SELECT 1 FROM dbo.institucion_representantes ir
        WHERE ir.institucion_id = i.institucion_id AND ir.usuario_id = u.usuario_id);

    /* 3. Puntos de acopio sin GPS inventado. */
    INSERT INTO dbo.puntos_acopio
        (institucion_id, distrito_id, nombre, direccion, referencias_entrega, latitud, longitud, estado)
    SELECT i.institucion_id, d.distrito_id, p.nombre, p.direccion, p.referencias, NULL, NULL, N'ACTIVO'
      FROM @Puntos p
      INNER JOIN @Instituciones i ON i.clave = p.institucion_clave
      INNER JOIN dbo.distritos d ON d.nombre = p.distrito_nombre
     WHERE NOT EXISTS (
        SELECT 1 FROM dbo.puntos_acopio real
        WHERE real.institucion_id = i.institucion_id AND real.nombre = p.nombre);

    UPDATE p
       SET p.punto_id = real.punto_id
      FROM @Puntos p
      INNER JOIN dbo.puntos_acopio real
        ON real.nombre = p.nombre
       AND real.institucion_id = (SELECT i.institucion_id FROM @Instituciones i WHERE i.clave = p.institucion_clave);

    /* 4. Horarios ficticios y coherentes: lunes a sábado. */
    INSERT INTO dbo.puntos_acopio_horarios (punto_id, dia_semana, hora_apertura, hora_cierre, activo)
    SELECT p.punto_id, h.dia_semana, CAST(h.apertura AS TIME(0)), CAST(h.cierre AS TIME(0)), CAST(1 AS BIT)
      FROM @Puntos p
     CROSS JOIN (VALUES
        (CAST(1 AS TINYINT), N'09:00', N'13:00'),
        (CAST(2 AS TINYINT), N'09:00', N'13:00'),
        (CAST(3 AS TINYINT), N'09:00', N'13:00'),
        (CAST(4 AS TINYINT), N'09:00', N'13:00'),
        (CAST(5 AS TINYINT), N'09:00', N'13:00'),
        (CAST(6 AS TINYINT), N'10:00', N'12:00')
     ) AS h(dia_semana, apertura, cierre)
     WHERE p.punto_id IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM dbo.puntos_acopio_horarios real
           WHERE real.punto_id = p.punto_id AND real.dia_semana = h.dia_semana
             AND real.hora_apertura = CAST(h.apertura AS TIME(0)));

    /* 5. Necesidades publicadas sobre instituciones pendientes. */
    INSERT INTO dbo.necesidades
        (institucion_id, titulo, descripcion, prioridad, estado, fecha_publicacion,
         fecha_limite, punto_acopio_id, creado_por_usuario_id)
    SELECT i.institucion_id, n.titulo, n.descripcion, n.prioridad, N'PUBLICADA', SYSUTCDATETIME(),
           DATEADD(DAY, 30, SYSUTCDATETIME()), p.punto_id, u.usuario_id
      FROM @Necesidades n
      INNER JOIN @Instituciones i ON i.clave = n.institucion_clave
      INNER JOIN @Puntos p ON p.clave = n.punto_clave
      INNER JOIN dbo.usuarios u ON u.email = n.creado_por_email
     WHERE NOT EXISTS (SELECT 1 FROM dbo.necesidades real WHERE real.titulo = n.titulo);

    UPDATE n
       SET n.necesidad_id = real.necesidad_id
      FROM @Necesidades n
      INNER JOIN dbo.necesidades real ON real.titulo = n.titulo;

    /* 6. Líneas con (producto, unidad UN) válidos del catálogo real. */
    INSERT INTO dbo.necesidad_productos
        (necesidad_id, producto_id, unidad_id, cantidad_requerida)
    SELECT n.necesidad_id, p.producto_id, u.unidad_id, l.cantidad_requerida
      FROM @Lineas l
      INNER JOIN @Necesidades n ON n.clave = l.necesidad_clave
      INNER JOIN dbo.categorias_bienes c ON c.codigo = l.categoria_codigo
      INNER JOIN dbo.productos p ON p.categoria_id = c.categoria_id AND p.nombre = l.producto_nombre
      INNER JOIN dbo.producto_unidades pu ON pu.producto_id = p.producto_id
      INNER JOIN dbo.unidades_medida u ON u.unidad_id = pu.unidad_id AND u.codigo = N'UN'
     WHERE NOT EXISTS (
        SELECT 1 FROM dbo.necesidad_productos real
        WHERE real.necesidad_id = n.necesidad_id
          AND real.producto_id = p.producto_id
          AND real.unidad_id = u.unidad_id);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    DECLARE @NumeroError INT = ERROR_NUMBER();
    DECLARE @LineaError  INT = ERROR_LINE();
    RAISERROR(N'La siembra demo fue revertida. Código de error: %d; línea: %d.', 16, 1, @NumeroError, @LineaError);
END CATCH;

/* ----------------------------------------------------------------- EVIDENCIA */
SELECT N'Instituciones sintéticas finales' AS Verificacion, COUNT(*) AS Filas
  FROM dbo.instituciones WHERE slug LIKE 'demo-final-%'
UNION ALL
SELECT N'Instituciones pendientes de verificación', COUNT(*)
  FROM dbo.instituciones WHERE slug LIKE 'demo-final-%' AND estado_verificacion = N'PENDIENTE'
UNION ALL
SELECT N'Representantes vinculados', COUNT(*)
  FROM dbo.institucion_representantes ir
  INNER JOIN dbo.instituciones i ON i.institucion_id = ir.institucion_id
 WHERE i.slug LIKE 'demo-final-%'
UNION ALL
SELECT N'Necesidades sintéticas finales', COUNT(*)
  FROM dbo.necesidades WHERE titulo LIKE N'DEMO-FINAL-NEC-%'
UNION ALL
SELECT N'Líneas de necesidad sintéticas', COUNT(*)
  FROM dbo.necesidad_productos np
  INNER JOIN dbo.necesidades n ON n.necesidad_id = np.necesidad_id
 WHERE n.titulo LIKE N'DEMO-FINAL-NEC-%'
UNION ALL
SELECT N'Puntos de acopio sintéticos', COUNT(*)
  FROM dbo.puntos_acopio p
  INNER JOIN dbo.instituciones i ON i.institucion_id = p.institucion_id
 WHERE i.slug LIKE 'demo-final-%'
UNION ALL
SELECT N'Horarios de acopio sintéticos', COUNT(*)
  FROM dbo.puntos_acopio_horarios h
  INNER JOIN dbo.puntos_acopio p ON p.punto_id = h.punto_id
  INNER JOIN dbo.instituciones i ON i.institucion_id = p.institucion_id
 WHERE i.slug LIKE 'demo-final-%';

SELECT i.institucion_id, i.nombre, ti.codigo AS tipo, i.estado_verificacion,
       d.nombre AS distrito, i.latitud, i.longitud,
       (SELECT COUNT(*) FROM dbo.necesidades n WHERE n.institucion_id = i.institucion_id) AS necesidades
  FROM dbo.instituciones i
  INNER JOIN dbo.tipos_institucion ti ON ti.tipo_id = i.tipo_id
  INNER JOIN dbo.distritos d ON d.distrito_id = i.distrito_id
 WHERE i.slug LIKE 'demo-final-%'
 ORDER BY i.institucion_id;

SELECT n.necesidad_id, n.titulo, n.estado, n.punto_acopio_id,
       p.nombre AS producto, u.codigo AS unidad, np.cantidad_requerida
  FROM dbo.necesidades n
  INNER JOIN dbo.necesidad_productos np ON np.necesidad_id = n.necesidad_id
  INNER JOIN dbo.productos p ON p.producto_id = np.producto_id
  INNER JOIN dbo.unidades_medida u ON u.unidad_id = np.unidad_id
 WHERE n.titulo LIKE N'DEMO-FINAL-NEC-%'
 ORDER BY n.necesidad_id, p.nombre;
