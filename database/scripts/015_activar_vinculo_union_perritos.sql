/* Autoriza el vínculo del representante sintético con Union Perritos sin aprobar la institución. */
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO
IF DB_NAME() <> N'DonaConectaDB_Pruebas'
BEGIN
    THROW 53001, 'Script sólo permitido en DonaConectaDB_Pruebas.', 1;
END;
GO
BEGIN TRAN;
UPDATE ir
SET ir.estado = N'ACTIVO'
FROM dbo.institucion_representantes ir
INNER JOIN dbo.usuarios u ON u.usuario_id = ir.usuario_id
INNER JOIN dbo.instituciones i ON i.institucion_id = ir.institucion_id
WHERE ir.usuario_id = 39
  AND ir.institucion_id = 17
  AND u.email = N'uniocanino@gmail.con'
  AND i.nombre = N'Union Perritos'
  AND ir.estado = N'PENDIENTE';
COMMIT;
GO
SELECT ir.institucion_id, i.nombre, i.estado_verificacion, ir.usuario_id, ir.estado AS vinculo
FROM dbo.institucion_representantes ir
INNER JOIN dbo.instituciones i ON i.institucion_id = ir.institucion_id
WHERE ir.usuario_id = 39;
GO
