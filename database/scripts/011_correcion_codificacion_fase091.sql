/*
  011_correcion_codificacion_fase091.sql

  PROPUESTA REVERSIBLE — NO EJECUTAR SIN AUTORIZACIÓN EXPLÍCITA DE FASE 09.1.

  Objetivo: corregir únicamente el texto almacenado con mojibake por la ejecución
  histórica de scripts .sql mediante sqlcmd con la página ANSI de Windows. Los
  archivos fuente son UTF-8 válidos; el daño está en las cadenas NVARCHAR ya
  insertadas en DonaConectaDB_Pruebas.

  Alcance:
  - Solo DonaConectaDB_Pruebas (guarda de base de datos).
  - Solo columnas NVARCHAR con el patrón N'%Ã%'.
  - No toca DonaConectaDB, no crea usuarios, no modifica cantidades, estados,
    compromisos, entregas ni auditoría estructural.
  - Antes del UPDATE se copian los valores originales a una tabla de respaldo.
    La sección final muestra cómo restaurarlos si la corrección no es aceptada.

  Esta corrección NO cambia el código, los scripts originales ni la forma en que
  se ejecutarán los futuros scripts: esos deben ejecutarse con `-f 65001` o
  mediante PyODBC/Python, que ya entrega los acentos correctamente.
*/

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF DB_NAME() <> N'DonaConectaDB_Pruebas'
        THROW 52090, 'Este script solo puede ejecutarse en DonaConectaDB_Pruebas.', 1;

    IF OBJECT_ID(N'dbo.dc_f091_respaldo_codificacion', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.dc_f091_respaldo_codificacion (
            respaldo_id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_dc_f091_respaldo PRIMARY KEY,
            tabla_nombre   VARCHAR(60)  NOT NULL,
            columna_nombre VARCHAR(60)  NOT NULL,
            clave_valor    NVARCHAR(100) NOT NULL,
            valor_original NVARCHAR(MAX) NULL,
            corregido_en   DATETIME2(0) NOT NULL CONSTRAINT DF_dc_f091_respaldo_fecha DEFAULT (SYSUTCDATETIME())
        );
    END;

/* --------------------------------------------------------- 1. Respaldo previo */
-- Se registran todos los valores que contienen el patrón mojibake detectado.
INSERT INTO dbo.dc_f091_respaldo_codificacion
    (tabla_nombre, columna_nombre, clave_valor, valor_original)
SELECT N'auditoria_eventos', N'descripcion', CONVERT(NVARCHAR(100), evento_id), descripcion
FROM dbo.auditoria_eventos WHERE descripcion LIKE N'%Ã%'
UNION ALL
SELECT N'categorias_bienes', N'descripcion', CONVERT(NVARCHAR(100), categoria_id), descripcion
FROM dbo.categorias_bienes WHERE descripcion LIKE N'%Ã%'
UNION ALL
SELECT N'distritos', N'nombre', CONVERT(NVARCHAR(100), distrito_id), nombre
FROM dbo.distritos WHERE nombre LIKE N'%Ã%'
UNION ALL
SELECT N'distritos', N'departamento', CONVERT(NVARCHAR(100), distrito_id), departamento
FROM dbo.distritos WHERE departamento LIKE N'%Ã%'
UNION ALL
SELECT N'instituciones', N'nombre', CONVERT(NVARCHAR(100), institucion_id), nombre
FROM dbo.instituciones WHERE nombre LIKE N'%Ã%'
UNION ALL
SELECT N'necesidades', N'titulo', CONVERT(NVARCHAR(100), necesidad_id), titulo
FROM dbo.necesidades WHERE titulo LIKE N'%Ã%'
UNION ALL
SELECT N'necesidades', N'descripcion', CONVERT(NVARCHAR(100), necesidad_id), descripcion
FROM dbo.necesidades WHERE descripcion LIKE N'%Ã%'
UNION ALL
SELECT N'notificaciones', N'titulo', CONVERT(NVARCHAR(100), notificacion_id), titulo
FROM dbo.notificaciones WHERE titulo LIKE N'%Ã%'
UNION ALL
SELECT N'notificaciones', N'cuerpo', CONVERT(NVARCHAR(100), notificacion_id), cuerpo
FROM dbo.notificaciones WHERE cuerpo LIKE N'%Ã%'
UNION ALL
SELECT N'permisos', N'descripcion', CONVERT(NVARCHAR(100), permiso_id), descripcion
FROM dbo.permisos WHERE descripcion LIKE N'%Ã%'
UNION ALL
SELECT N'productos', N'nombre', CONVERT(NVARCHAR(100), producto_id), nombre
FROM dbo.productos WHERE nombre LIKE N'%Ã%'
UNION ALL
SELECT N'roles', N'descripcion', CONVERT(NVARCHAR(100), rol_id), descripcion
FROM dbo.roles WHERE descripcion LIKE N'%Ã%'
UNION ALL
SELECT N'tipos_institucion', N'nombre', CONVERT(NVARCHAR(100), tipo_id), nombre
FROM dbo.tipos_institucion WHERE nombre LIKE N'%Ã%'
UNION ALL
SELECT N'tipos_institucion', N'descripcion', CONVERT(NVARCHAR(100), tipo_id), descripcion
FROM dbo.tipos_institucion WHERE descripcion LIKE N'%Ã%';

/* ------------------------------------------------------------- 2. Corrección */
-- Cada par corresponde a un byte UTF-8 interpretado como Latin-1.
-- Se aplica REPLACE sobre el valor guarding el respaldo anterior.

UPDATE dbo.auditoria_eventos
SET descripcion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(descripcion,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE descripcion LIKE N'%Ã%';

UPDATE dbo.categorias_bienes
SET descripcion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(descripcion,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE descripcion LIKE N'%Ã%';

UPDATE dbo.distritos
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nombre,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE nombre LIKE N'%Ã%';

UPDATE dbo.distritos
SET departamento = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(departamento,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE departamento LIKE N'%Ã%';

UPDATE dbo.instituciones
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nombre,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE nombre LIKE N'%Ã%';

UPDATE dbo.necesidades
SET titulo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(titulo,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE titulo LIKE N'%Ã%';

UPDATE dbo.necesidades
SET descripcion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(descripcion,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE descripcion LIKE N'%Ã%';

UPDATE dbo.notificaciones
SET titulo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(titulo,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE titulo LIKE N'%Ã%';

UPDATE dbo.notificaciones
SET cuerpo = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(cuerpo,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE cuerpo LIKE N'%Ã%';

UPDATE dbo.permisos
SET descripcion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(descripcion,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE descripcion LIKE N'%Ã%';

UPDATE dbo.productos
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nombre,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE nombre LIKE N'%Ã%';

UPDATE dbo.roles
SET descripcion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(descripcion,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE descripcion LIKE N'%Ã%';

UPDATE dbo.tipos_institucion
SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nombre,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE nombre LIKE N'%Ã%';

UPDATE dbo.tipos_institucion
SET descripcion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(descripcion,
    N'Ã¡', N'á'), N'Ã©', N'é'), N'Ã­', N'í'), N'Ã³', N'ó'), N'Ãº', N'ú'), N'Ã±', N'ñ')
WHERE descripcion LIKE N'%Ã%';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

/* ------------------------------------------------------------ 3. Verificación */
SELECT tabla_nombre, columna_nombre, COUNT(*) AS valores_respaldados
FROM dbo.dc_f091_respaldo_codificacion
GROUP BY tabla_nombre, columna_nombre
ORDER BY tabla_nombre, columna_nombre;

SELECT
    (SELECT COUNT(*) FROM dbo.instituciones WHERE nombre LIKE N'%Ã%')
    + (SELECT COUNT(*) FROM dbo.necesidades WHERE titulo LIKE N'%Ã%' OR descripcion LIKE N'%Ã%')
    + (SELECT COUNT(*) FROM dbo.productos WHERE nombre LIKE N'%Ã%')
    + (SELECT COUNT(*) FROM dbo.tipos_institucion WHERE nombre LIKE N'%Ã%' OR descripcion LIKE N'%Ã%')
    AS restos_mojibake_en_tablas_visibles;
GO

/* ----------------------------------------------------------------- 4. Rollback
   Solo si se decide revertir. Descomentar y ejecutar en la misma base:

UPDATE dbo.auditoria_eventos SET descripcion = r.valor_original
FROM dbo.dc_f091_respaldo_codificacion r
WHERE r.tabla_nombre = N'auditoria_eventos' AND r.columna_nombre = N'descripcion'
  AND CONVERT(NVARCHAR(100), dbo.auditoria_eventos.evento_id) = r.clave_valor;
-- Repetir el patrón para cada tabla/columna listada en la sección 1.

DELETE FROM dbo.dc_f091_respaldo_codificacion;
*/
