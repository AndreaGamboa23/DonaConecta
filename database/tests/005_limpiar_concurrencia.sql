/* ============================================================================
   DonaConecta — Fase 06
   005_limpiar_concurrencia.sql
   Limpia SOLO el escenario sintético de concurrencia en DonaConectaDB_Pruebas
   para poder repetir 004_concurrencia.ps1. No toca DonaConectaDB ni los datos
   sintéticos de 001_datos_sinteticos.sql ni los resultados de 003_procedimientos.sql.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/tests/005_limpiar_concurrencia.sql
   ============================================================================ */

USE [DonaConectaDB_Pruebas];
GO
SET NOCOUNT ON;
GO

IF DB_NAME() <> N'DonaConectaDB_Pruebas'
BEGIN
    THROW 59000, N'Este script solo puede ejecutarse en DonaConectaDB_Pruebas.', 1;
END;

DECLARE @titulos TABLE (titulo NVARCHAR(200) NOT NULL PRIMARY KEY);

INSERT INTO @titulos (titulo)
VALUES (N'Necesidad sintética concurrencia A'), (N'Necesidad sintética concurrencia B');

DECLARE @compromisos TABLE (compromiso_id INT NOT NULL PRIMARY KEY);

INSERT INTO @compromisos (compromiso_id)
SELECT c.compromiso_id
FROM dbo.compromisos c
INNER JOIN dbo.necesidades n ON n.necesidad_id = c.necesidad_id
INNER JOIN @titulos t ON t.titulo = n.titulo;

DELETE rev
FROM dbo.recepcion_evidencias rev
INNER JOIN dbo.recepciones r ON r.recepcion_id = rev.recepcion_id
INNER JOIN dbo.entregas e ON e.entrega_id = r.entrega_id
INNER JOIN @compromisos c ON c.compromiso_id = e.compromiso_id;

DELETE rp
FROM dbo.recepcion_productos rp
INNER JOIN dbo.recepciones r ON r.recepcion_id = rp.recepcion_id
INNER JOIN dbo.entregas e ON e.entrega_id = r.entrega_id
INNER JOIN @compromisos c ON c.compromiso_id = e.compromiso_id;

DELETE n
FROM dbo.notificaciones n
INNER JOIN dbo.recepciones r ON r.recepcion_id = n.recepcion_id
INNER JOIN dbo.entregas e ON e.entrega_id = r.entrega_id
INNER JOIN @compromisos c ON c.compromiso_id = e.compromiso_id;

DELETE r
FROM dbo.recepciones r
INNER JOIN dbo.entregas e ON e.entrega_id = r.entrega_id
INNER JOIN @compromisos c ON c.compromiso_id = e.compromiso_id;

DELETE ep
FROM dbo.entrega_productos ep
INNER JOIN dbo.entregas e ON e.entrega_id = ep.entrega_id
INNER JOIN @compromisos c ON c.compromiso_id = e.compromiso_id;

DELETE eh
FROM dbo.entrega_historial eh
INNER JOIN dbo.entregas e ON e.entrega_id = eh.entrega_id
INNER JOIN @compromisos c ON c.compromiso_id = e.compromiso_id;

DELETE e
FROM dbo.entregas e
INNER JOIN @compromisos c ON c.compromiso_id = e.compromiso_id;

DELETE n
FROM dbo.notificaciones n
INNER JOIN @compromisos c ON c.compromiso_id = n.compromiso_id;

DELETE ch
FROM dbo.compromiso_historial ch
INNER JOIN @compromisos c ON c.compromiso_id = ch.compromiso_id;

DELETE cp
FROM dbo.compromiso_productos cp
INNER JOIN @compromisos c ON c.compromiso_id = cp.compromiso_id;

DELETE c
FROM dbo.compromisos c
INNER JOIN @compromisos tmp ON tmp.compromiso_id = c.compromiso_id;

DELETE np
FROM dbo.necesidad_productos np
INNER JOIN dbo.necesidades n ON n.necesidad_id = np.necesidad_id
INNER JOIN @titulos t ON t.titulo = n.titulo;

DELETE n
FROM dbo.necesidades n
INNER JOIN @titulos t ON t.titulo = n.titulo;

SELECT
    (SELECT COUNT(*) FROM dbo.necesidades n INNER JOIN @titulos t ON t.titulo = n.titulo) AS NecesidadesPendientes,
    (SELECT COUNT(*) FROM @compromisos) AS CompromisosEliminados;
GO
