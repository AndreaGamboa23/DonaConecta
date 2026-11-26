# ============================================================================
# DonaConecta — Fase 06
# 004_concurrencia.ps1
# Prueba real de concurrencia con DOS conexiones independientes contra
# DonaConectaDB_Pruebas. Un tercer cliente observa sys.dm_tran_locks.
# No modifica DonaConectaDB. No crea datos en la base real.
# Ejecutar: powershell -ExecutionPolicy Bypass -File database/tests/004_concurrencia.ps1
# ============================================================================

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Data

$connectionString = 'Server=.\SQLEXPRESS;Database=DonaConectaDB_Pruebas;Integrated Security=SSPI;Encrypt=True;TrustServerCertificate=True;Application Name=DonaConectaFase06Concurrencia;'

function Invoke-SqlNonQuery {
    param([Parameter(Mandatory = $true)][string]$Sql)

    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    try {
        $connection.Open()
        $command = $connection.CreateCommand()
        $command.CommandType = [System.Data.CommandType]::Text
        $command.CommandText = $Sql
        $command.CommandTimeout = 60
        [void]$command.ExecuteNonQuery()
    }
    finally {
        if ($connection.State -ne [System.Data.ConnectionState]::Closed) { $connection.Close() }
        $connection.Dispose()
    }
}

function Get-SqlRow {
    param([Parameter(Mandatory = $true)][string]$Sql)

    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    try {
        $connection.Open()
        $command = $connection.CreateCommand()
        $command.CommandType = [System.Data.CommandType]::Text
        $command.CommandText = $Sql
        $command.CommandTimeout = 60
        $reader = $command.ExecuteReader()
        try {
            if (-not $reader.Read()) { return $null }
            $row = @{}
            for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                $row[$reader.GetName($i)] = $reader.GetValue($i)
            }
            return $row
        }
        finally { $reader.Close() }
    }
    finally {
        if ($connection.State -ne [System.Data.ConnectionState]::Closed) { $connection.Close() }
        $connection.Dispose()
    }
}

function Get-RowValue {
    param([Parameter(Mandatory = $true)]$Row)
    if ($null -eq $Row) { return $null }
    $firstKey = @($Row.Keys | Select-Object -First 1)[0]
    return $Row[$firstKey]
}

function Get-SqlInt {
    param([Parameter(Mandatory = $true)][string]$Sql)
    $row = Get-SqlRow -Sql $Sql
    if ($null -eq $row) { return $null }
    return [int](Get-RowValue -Row $row)
}

$worker = {
    param(
        [string]$ConnString,
        [string]$Procedure,
        [hashtable]$Parameters,
        [string]$Label
    )

    Add-Type -AssemblyName System.Data

    $result = [ordered]@{
        Label       = $Label
        Success     = $false
        ErrorNumber = $null
        Message     = $null
        Id          = $null
    }

    $connection = New-Object System.Data.SqlClient.SqlConnection($ConnString)
    try {
        $connection.Open()
        $command = $connection.CreateCommand()
        $command.CommandType = [System.Data.CommandType]::StoredProcedure
        $command.CommandText = $Procedure
        $command.CommandTimeout = 60

        foreach ($key in $Parameters.Keys) {
            [void]$command.Parameters.AddWithValue($key, $Parameters[$key])
        }

        $outputName = if ($Procedure -like '*RegistrarCompromiso*') { '@compromisoId' } else { '@recepcionId' }
        $output = $command.Parameters.Add($outputName, [System.Data.SqlDbType]::Int)
        $output.Direction = [System.Data.ParameterDirection]::Output

        [void]$command.ExecuteNonQuery()
        $result.Success = $true
        $result.Id = $output.Value
    }
    catch [System.Data.SqlClient.SqlException] {
        $result.ErrorNumber = $_.Exception.Number
        $result.Message = $_.Exception.Message
    }
    catch {
        $result.ErrorNumber = -1
        $result.Message = $_.Exception.ToString()
    }
    finally {
        if ($connection.State -ne [System.Data.ConnectionState]::Closed) { $connection.Close() }
        $connection.Dispose()
    }

    [pscustomobject]$result
}

# ---------------------------------------------------------------- Preparación

Invoke-SqlNonQuery -Sql @'
SET NOCOUNT ON;
IF DB_NAME() <> N'DonaConectaDB_Pruebas'
    THROW 59000, N'Solo se permite ejecutar contra DonaConectaDB_Pruebas.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.necesidades n
    WHERE n.titulo IN (N'Necesidad sintética concurrencia A', N'Necesidad sintética concurrencia B')
      AND EXISTS (SELECT 1 FROM dbo.compromisos c WHERE c.necesidad_id = n.necesidad_id)
)
    THROW 59010, N'El escenario de concurrencia ya existe. Restaurar la base de pruebas antes de repetir.', 1;

DECLARE @ahora DATETIME2(0) = SYSUTCDATETIME();
DECLARE @institucionId INT = (SELECT institucion_id FROM dbo.instituciones WHERE slug = N'institucion-sintetica-prueba');
DECLARE @repId INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_rep@donaconecta.invalid');
DECLARE @donanteId INT = (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_donante@donaconecta.invalid');
DECLARE @productoId INT = (SELECT producto_id FROM dbo.productos WHERE nombre = N'Producto sintético de prueba');
DECLARE @unidadId INT = (SELECT unidad_id FROM dbo.unidades_medida WHERE codigo = N'UN');

IF NOT EXISTS (SELECT 1 FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia A')
    INSERT INTO dbo.necesidades (
        institucion_id, titulo, descripcion, prioridad, estado,
        fecha_publicacion, fecha_limite, creado_por_usuario_id, creado_en, actualizado_en)
    VALUES (
        @institucionId, N'Necesidad sintética concurrencia A',
        N'Dos conexiones compiten por 2 unidades.', N'ALTA', N'PUBLICADA',
        @ahora, DATEADD(DAY, 1, @ahora), @repId, @ahora, @ahora);

IF NOT EXISTS (SELECT 1 FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia B')
    INSERT INTO dbo.necesidades (
        institucion_id, titulo, descripcion, prioridad, estado,
        fecha_publicacion, fecha_limite, creado_por_usuario_id, creado_en, actualizado_en)
    VALUES (
        @institucionId, N'Necesidad sintética concurrencia B',
        N'Dos conexiones compiten por confirmar la misma entrega.', N'ALTA', N'PUBLICADA',
        @ahora, DATEADD(DAY, 1, @ahora), @repId, @ahora, @ahora);

DECLARE @necA INT = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia A');
DECLARE @necB INT = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia B');

INSERT INTO dbo.necesidad_productos (necesidad_id, producto_id, unidad_id, cantidad_requerida)
SELECT @necA, @productoId, @unidadId, CAST(2 AS DECIMAL(12,3))
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.necesidad_productos
    WHERE necesidad_id = @necA AND producto_id = @productoId AND unidad_id = @unidadId);

INSERT INTO dbo.necesidad_productos (necesidad_id, producto_id, unidad_id, cantidad_requerida)
SELECT @necB, @productoId, @unidadId, CAST(4 AS DECIMAL(12,3))
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.necesidad_productos
    WHERE necesidad_id = @necB AND producto_id = @productoId AND unidad_id = @unidadId);

DECLARE @compromisoB INT = (
    SELECT TOP 1 c.compromiso_id FROM dbo.compromisos c
    WHERE c.necesidad_id = @necB AND c.estado = N'ACEPTADO'
    ORDER BY c.compromiso_id);

IF @compromisoB IS NULL
BEGIN
    INSERT INTO dbo.compromisos (
        necesidad_id, donante_usuario_id, estado, fecha_compromiso, expira_en, creado_en)
    VALUES (@necB, @donanteId, N'ACEPTADO', @ahora, DATEADD(DAY, 1, @ahora), @ahora);
    SET @compromisoB = CAST(SCOPE_IDENTITY() AS INT);
END;

INSERT INTO dbo.compromiso_productos (
    compromiso_id, necesidad_id, producto_id, unidad_id, cantidad_comprometida)
SELECT @compromisoB, @necB, @productoId, @unidadId, CAST(4 AS DECIMAL(12,3))
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.compromiso_productos
    WHERE compromiso_id = @compromisoB AND producto_id = @productoId AND unidad_id = @unidadId);

DECLARE @entregaB INT = (
    SELECT TOP 1 e.entrega_id FROM dbo.entregas e
    WHERE e.compromiso_id = @compromisoB
    ORDER BY e.entrega_id);

IF @entregaB IS NULL
BEGIN
    INSERT INTO dbo.entregas (
        compromiso_id, fecha_programada, estado, responsable_usuario_id)
    VALUES (@compromisoB, DATEADD(DAY, 1, @ahora), N'PROGRAMADA', @repId);
    SET @entregaB = CAST(SCOPE_IDENTITY() AS INT);
END;

INSERT INTO dbo.entrega_productos (
    entrega_id, compromiso_id, producto_id, unidad_id, cantidad_entregada)
SELECT @entregaB, @compromisoB, @productoId, @unidadId, CAST(4 AS DECIMAL(12,3))
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.entrega_productos
    WHERE entrega_id = @entregaB AND producto_id = @productoId AND unidad_id = @unidadId);
'@

$ids = Get-SqlRow -Sql @'
SET NOCOUNT ON;
SELECT
    (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia A') AS NecA,
    (SELECT entrega_id FROM dbo.entregas e
     WHERE e.compromiso_id = (
         SELECT TOP 1 c.compromiso_id FROM dbo.compromisos c
         WHERE c.necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia B')
         ORDER BY c.compromiso_id)) AS EntregaB,
    (SELECT producto_id FROM dbo.productos WHERE nombre = N'Producto sintético de prueba') AS ProductoId,
    (SELECT unidad_id FROM dbo.unidades_medida WHERE codigo = N'UN') AS UnidadId,
    (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_donante@donaconecta.invalid') AS Donante1,
    (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_donante2@donaconecta.invalid') AS Donante2,
    (SELECT usuario_id FROM dbo.usuarios WHERE email = N'test_rep@donaconecta.invalid') AS RepId;
'@

$necA = [int]$ids.NecA
$entregaB = [int]$ids.EntregaB
$productoId = [int]$ids.ProductoId
$unidadId = [int]$ids.UnidadId
$donante1 = [int]$ids.Donante1
$donante2 = [int]$ids.Donante2
$repId = [int]$ids.RepId

$jsonCompromiso = '[{"productoId":' + $productoId + ',"unidadId":' + $unidadId + ',"cantidad":2}]'
$jsonRecepcion = '[{"productoId":' + $productoId + ',"unidadId":' + $unidadId + ',"cantidad":4}]'

# -------------------------------------------------------------- Ejecución A

$jobsA = @()
$jobsA += Start-Job -ScriptBlock $worker -ArgumentList @(
    $connectionString, 'dbo.usp_RegistrarCompromiso',
    @{ '@necesidadId' = $necA; '@donanteUsuarioId' = $donante1; '@lineasJson' = $jsonCompromiso; '@expiracionMinutos' = 30 },
    'Compromiso-Conexion-1')
$jobsA += Start-Job -ScriptBlock $worker -ArgumentList @(
    $connectionString, 'dbo.usp_RegistrarCompromiso',
    @{ '@necesidadId' = $necA; '@donanteUsuarioId' = $donante2; '@lineasJson' = $jsonCompromiso; '@expiracionMinutos' = 30 },
    'Compromiso-Conexion-2')

$observerA = [ordered]@{ Samples = 0; MaxLocks = 0; Note = '' }
$observerConnection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $observerConnection.Open()
    $observerCommand = $observerConnection.CreateCommand()
    $observerCommand.CommandText = @'
SELECT COUNT(*) AS LockCount
FROM sys.dm_tran_locks AS l
LEFT JOIN sys.partitions AS p
    ON p.hobt_id = l.resource_associated_entity_id
   AND l.resource_type IN (N'KEY', N'PAGE', N'RID', N'HOBT')
WHERE OBJECT_NAME(
    CASE WHEN l.resource_type = N'OBJECT' THEN l.resource_associated_entity_id
         ELSE p.object_id END
) IN (N'necesidades', N'compromisos', N'entregas', N'recepciones');
'@
    while (@($jobsA | Where-Object { $_.State -eq 'Running' }).Count -gt 0) {
        try {
            $lockCount = [int]$observerCommand.ExecuteScalar()
            $observerA.Samples++
            if ($lockCount -gt $observerA.MaxLocks) { $observerA.MaxLocks = $lockCount }
        }
        catch {
            $observerA.Note = 'sys.dm_tran_locks no disponible: ' + $_.Exception.Message
            break
        }
        Start-Sleep -Milliseconds 5
    }
}
finally {
    if ($observerConnection.State -ne [System.Data.ConnectionState]::Closed) { $observerConnection.Close() }
    $observerConnection.Dispose()
}

[void](Wait-Job -Job $jobsA)
$resultadosA = @()
foreach ($job in $jobsA) {
    $resultadosA += Receive-Job -Job $job
    Remove-Job -Job $job
}

# -------------------------------------------------------------- Ejecución B

$jobsB = @()
$jobsB += Start-Job -ScriptBlock $worker -ArgumentList @(
    $connectionString, 'dbo.usp_ConfirmarRecepcion',
    @{ '@entregaId' = $entregaB; '@recibidoPorUsuarioId' = $repId; '@lineasJson' = $jsonRecepcion; '@estadoRecepcion' = 'CONFIRMADA'; '@observaciones' = 'Concurrencia sintetica' },
    'Recepcion-Conexion-1')
$jobsB += Start-Job -ScriptBlock $worker -ArgumentList @(
    $connectionString, 'dbo.usp_ConfirmarRecepcion',
    @{ '@entregaId' = $entregaB; '@recibidoPorUsuarioId' = $repId; '@lineasJson' = $jsonRecepcion; '@estadoRecepcion' = 'CONFIRMADA'; '@observaciones' = 'Concurrencia sintetica' },
    'Recepcion-Conexion-2')

$observerB = [ordered]@{ Samples = 0; MaxLocks = 0; Note = '' }
$observerConnection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $observerConnection.Open()
    $observerCommand = $observerConnection.CreateCommand()
    $observerCommand.CommandText = @'
SELECT COUNT(*) AS LockCount
FROM sys.dm_tran_locks AS l
LEFT JOIN sys.partitions AS p
    ON p.hobt_id = l.resource_associated_entity_id
   AND l.resource_type IN (N'KEY', N'PAGE', N'RID', N'HOBT')
WHERE OBJECT_NAME(
    CASE WHEN l.resource_type = N'OBJECT' THEN l.resource_associated_entity_id
         ELSE p.object_id END
) IN (N'necesidades', N'compromisos', N'entregas', N'recepciones');
'@
    while (@($jobsB | Where-Object { $_.State -eq 'Running' }).Count -gt 0) {
        try {
            $lockCount = [int]$observerCommand.ExecuteScalar()
            $observerB.Samples++
            if ($lockCount -gt $observerB.MaxLocks) { $observerB.MaxLocks = $lockCount }
        }
        catch {
            $observerB.Note = 'sys.dm_tran_locks no disponible: ' + $_.Exception.Message
            break
        }
        Start-Sleep -Milliseconds 5
    }
}
finally {
    if ($observerConnection.State -ne [System.Data.ConnectionState]::Closed) { $observerConnection.Close() }
    $observerConnection.Dispose()
}

[void](Wait-Job -Job $jobsB)
$resultadosB = @()
foreach ($job in $jobsB) {
    $resultadosB += Receive-Job -Job $job
    Remove-Job -Job $job
}

# -------------------------------------------------------------- Verificación

$compromisosA = Get-SqlInt -Sql @'
SELECT COUNT(*) FROM dbo.compromisos c
WHERE c.necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia A');
'@
$disponibleA = Get-SqlRow -Sql @'
SELECT TOP 1 cantidad_disponible FROM dbo.vw_disponibilidad_necesidad
WHERE necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia A');
'@
$recepcionesB = Get-SqlInt -Sql "SELECT COUNT(*) FROM dbo.recepciones WHERE entrega_id = $entregaB"
$estadoEntregaB = Get-SqlRow -Sql "SELECT estado FROM dbo.entregas WHERE entrega_id = $entregaB"
$estadoCompromisoB = Get-SqlRow -Sql @'
SELECT TOP 1 c.estado FROM dbo.compromisos c
WHERE c.necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia B');
'@
$disponibleB = Get-SqlRow -Sql @'
SELECT TOP 1 cantidad_disponible FROM dbo.vw_disponibilidad_necesidad
WHERE necesidad_id = (SELECT necesidad_id FROM dbo.necesidades WHERE titulo = N'Necesidad sintética concurrencia B');
'@

$exitosA = @($resultadosA | Where-Object { $_.Success })
$fallosA = @($resultadosA | Where-Object { -not $_.Success })
$exitosB = @($resultadosB | Where-Object { $_.Success })
$fallosB = @($resultadosB | Where-Object { -not $_.Success })

$resultadoFinal = @()

$okA = ($exitosA.Count -eq 1 -and $fallosA.Count -eq 1 -and
        $fallosA[0].ErrorNumber -eq 52001 -and
        $compromisosA -eq 1 -and [int](Get-RowValue -Row $disponibleA) -eq 0)
$resultadoFinal += [pscustomobject]@{
    Prueba    = 'Compromiso concurrente'
    Resultado = if ($okA) { 'PASS' } else { 'FAIL' }
    Detalle   = 'Exitos=' + $exitosA.Count + ' Errores=' + $fallosA.Count +
                ' Codigo=' + $fallosA[0].ErrorNumber +
                ' Compromisos=' + $compromisosA +
                ' Disponible=' + [int](Get-RowValue -Row $disponibleA)
}

$okB = ($exitosB.Count -eq 1 -and $fallosB.Count -eq 1 -and
        $fallosB[0].ErrorNumber -eq 52006 -and
        $recepcionesB -eq 1 -and
        [string](Get-RowValue -Row $estadoEntregaB) -eq 'ENTREGADA' -and
        [string](Get-RowValue -Row $estadoCompromisoB) -eq 'COMPLETADO' -and
        [int](Get-RowValue -Row $disponibleB) -eq 0)
$resultadoFinal += [pscustomobject]@{
    Prueba    = 'Recepcion concurrente'
    Resultado = if ($okB) { 'PASS' } else { 'FAIL' }
    Detalle   = 'Exitos=' + $exitosB.Count + ' Errores=' + $fallosB.Count +
                ' Codigo=' + $fallosB[0].ErrorNumber +
                ' Recepciones=' + $recepcionesB +
                ' Entrega=' + [string](Get-RowValue -Row $estadoEntregaB) +
                ' Compromiso=' + [string](Get-RowValue -Row $estadoCompromisoB) +
                ' Disponible=' + [int](Get-RowValue -Row $disponibleB)
}

$deadlocks = @($resultadosA + $resultadosB | Where-Object { $_.ErrorNumber -eq 1205 })
$resultadoFinal += [pscustomobject]@{
    Prueba    = 'Interbloqueos (1205)'
    Resultado = if ($deadlocks.Count -eq 0) { 'PASS' } else { 'FAIL' }
    Detalle   = 'Deadlocks=' + $deadlocks.Count
}

$resultadoFinal += [pscustomobject]@{
    Prueba    = 'Observador dm_tran_locks A'
    Resultado = if ($observerA.MaxLocks -gt 0) { 'PASS' } else { 'INFO' }
    Detalle   = 'Samples=' + $observerA.Samples + ' MaxLocks=' + $observerA.MaxLocks + ' ' + $observerA.Note
}

$resultadoFinal += [pscustomobject]@{
    Prueba    = 'Observador dm_tran_locks B'
    Resultado = if ($observerB.MaxLocks -gt 0) { 'PASS' } else { 'INFO' }
    Detalle   = 'Samples=' + $observerB.Samples + ' MaxLocks=' + $observerB.MaxLocks + ' ' + $observerB.Note
}

$resultadoFinal | Format-Table -AutoSize | Out-String -Width 240

Write-Output 'Detalle de conexiones A:'
$resultadosA | Select-Object Label, Success, ErrorNumber, Id | Format-Table -AutoSize | Out-String -Width 200
Write-Output 'Detalle de conexiones B:'
$resultadosB | Select-Object Label, Success, ErrorNumber, Id | Format-Table -AutoSize | Out-String -Width 200

if (@($resultadoFinal | Where-Object { $_.Resultado -eq 'FAIL' }).Count -gt 0) {
    throw 'Hubo fallos en la prueba de concurrencia.'
}
