# Base de datos — DonaConecta

`DonaConectaDB` está implementada físicamente en SQL Server 2025 Express siguiendo el modelo
corregido de la Fase 05.1. La carpeta contiene los scripts T-SQL versionados, las pruebas
sintéticas y los procedimientos de respaldo/restauración. El frontend no se modificó y la base
real **no contiene datos de negocio inventados**.

## Entorno verificado

- Instancia: `.\\SQLEXPRESS`
- Edición real: `Microsoft SQL Server 2025 (RTM) - 17.0.1000.7 (X64), Express Edition`
- `EngineEdition = 4`, `IsIntegratedSecurityOnly = 1`
- Colación: `SQL_Latin1_General_CP1_CI_AS`
- Compatibilidad: `170`
- Recuperación: `SIMPLE` (adecuada al entorno local; producción requiere evaluar `FULL` y
  respaldos de log)
- Controlador: `ODBC Driver 18 for SQL Server`
- Autenticación local: Windows; `Encrypt=yes` y `TrustServerCertificate=yes` **solo en local**
- Python verificado: `3.13.17`; `uv`: `0.12.17`. La Fase 07 evaluará `uv` antes de instalar backend.

## Orden de ejecución

Todos los comandos se ejecutan desde la raíz del repositorio con `sqlcmd -b` para detenerse ante
el primer error:

```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/scripts/001_crear_base_datos.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/scripts/002_crear_tablas.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/scripts/003_restricciones_integridad.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/scripts/004_crear_indices.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/scripts/005_catalogos_iniciales.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/scripts/006_crear_vistas.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/scripts/007_procedimientos_almacenados.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/scripts/008_seguridad_permisos.sql"
```

Los scripts son idempotentes donde tiene sentido (`IF NOT EXISTS`, `CREATE OR ALTER`). No usan
`DROP DATABASE`, `DROP TABLE`, `REPLACE` ni credenciales versionadas.

### Índices filtrados

`004_crear_indices.sql` fija `SET QUOTED_IDENTIFIER ON` porque `sqlcmd` inicia con `OFF` y SQL
Server exige `ON` para índices filtrados. Lo mismo hace `001_datos_sinteticos.sql` al insertar en
tablas con esos índices.

## Estado real verificado

| Objeto | Resultado |
|---|---|
| Tablas `dbo` del modelo | 42 |
| Foreign keys, todas `NO ACTION` | 79 |
| Índices `UX`/`IX` creados por `004` en `dbo` | 11 (4 únicos filtrados y 7 de consulta) |
| Vistas `vw_*` | 9 |
| Procedimientos `usp_*` | 2 |
| Roles / permisos / `rol_permisos` | 3 / 37 / 83 |
| Tipos de institución / categorías / unidades / distritos | 5 / 5 / 6 / 28 |
| Usuarios, instituciones, necesidades, productos, compromisos, entregas, recepciones, conversaciones, mensajes, sesiones GPS, parámetros | 0 en cada tabla |

La consulta `SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo')` devuelve
exactamente las 42 tablas del modelo. Los índices `backup_metadata_store` y
`pause_resume_history` que aparecen en `sys.indexes` pertenecen al esquema `sys` de SQL Server
2025 y no forman parte del modelo.

## Catálogos sembrados

- Roles: `DONANTE`, `REPRESENTANTE`, `ADMINISTRADOR`. El registro público nunca asigna
  `ADMINISTRADOR`.
- Permisos: 37 códigos derivados de la matriz de endpoints de `docs/contrato-api.md`. No se
  crearon permisos “por completar”.
- Tipos de institución: `COMEDOR`, `ALBERGUE`, `REFUGIO_ANIMAL`, `ORGANIZACION_SOCIAL`, `OTRO`.
- Categorías de bienes: las cinco usadas por la interfaz pública.
- Unidades de medida: `UN`, `KG`, `L`, `CAJA`, `PAQUETE`, `BOLSA`.
- Distritos: los 28 de la provincia de Huancayo, Junín, según la fuente documentada en
  `005_catalogos_iniciales.sql`.

No se sembraron `productos` ni `parametros_sistema`: no estaban en la lista autorizada y habría
sido necesario inventar datos de negocio.

## Procedimientos almacenados

Solo `usp_RegistrarCompromiso` y `usp_ConfirmarRecepcion` modifican disponibilidad. Son dueños
de su transacción con `XACT_ABORT ON`, `TRY/CATCH`, `XACT_STATE()` y `THROW`; desde PyODBC se
invocan con una conexión dedicada en `autocommit=True`, sin transacción externa anidada. Devuelven
el id creado por `OUTPUT` y usan `UPDLOCK, HOLDLOCK` con orden fijo de bloqueo. Los códigos de
error de negocio son `52001`–`52011`.

Ajustes de implementación documentados en `docs/modelo-fisico.md`:

- No se inserta `compromiso_historial` en la creación porque `estado_anterior` es obligatorio;
  el historial comienza con la primera transición real.
- `usp_ConfirmarRecepcion` acepta `@observaciones` y `@evidenciasJson` como parámetros opcionales
  para cumplir `CK_recepciones_observacion` y persistir evidencias reales.
- `usp_ConfirmarRecepcion` actualiza `fecha_real_inicio` junto con `fecha_real_fin` para cumplir
  `CK_entregas_fechas`.

## Seguridad

`008_seguridad_permisos.sql` crea los roles de base de datos `dc_app` y `dc_admin` y el usuario
`dc_app_usuario` **sin login ni contraseña**, usado solo para comprobar permisos con
`EXECUTE AS`. Resultado real:

| Permiso | `dc_app` |
|---|---|
| `SELECT` en catálogos | 1 |
| `INSERT` en catálogos | 0 |
| `INSERT` en `compromisos` | 1 |
| `DELETE` en `auditoria_eventos` | 0 |
| `EXECUTE` en `usp_RegistrarCompromiso` | 1 |

`dc_admin` puede mantener catálogos pero **no tiene permisos DDL**. El script no contiene
contraseñas. La cuenta Windows dedicada de aplicación debe crearse manualmente fuera del
repositorio; la plantilla está en el encabezado del script.

No se afirma TDE, Always Encrypted, cifrado de extremo a extremo ni cifrado nativo activo: la
instancia es Express (`EngineEdition = 4`), `EncryptionState` es `NULL` y no hay column master
keys ni symmetric keys. La estrategia Argon2id/AES-256-GCM sigue pendiente de implementación en
Fase 07. Ver `docs/seguridad-privacidad.md` §11.3.

## Pruebas y respaldos

Las pruebas usan **solo** `DonaConectaDB_Pruebas`, creada desde el respaldo. Nunca se ejecutaron
sobre `DonaConectaDB`.

```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/mantenimiento/001_respaldo_inicial.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/mantenimiento/002_restaurar_validacion.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/tests/001_datos_sinteticos.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/tests/002_integridad_reglas.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/tests/003_procedimientos.sql"
powershell -NoProfile -ExecutionPolicy Bypass -File "database/tests/004_concurrencia.ps1"
```

Si se repite la prueba de concurrencia, limpiar primero su escenario:

```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "database/tests/005_limpiar_concurrencia.sql"
```

Resultados reales: 11/11 pruebas de integridad, 15/15 pruebas de procedimientos y 3/3
comprobaciones de concurrencia (incluida ausencia de interbloqueos `1205`). El respaldo final se
validó con `CHECKSUM` + `RESTORE VERIFYONLY` y se restauró en `DonaConectaDB_Verificacion`, sin
datos de negocio y con los procedimientos corregidos.

Los archivos `.bak`, `.mdf` y `.ldf` están fuera del repositorio. La ruta local es
`C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\Backup`. El cifrado del archivo
de respaldo sigue pendiente de evaluación; no se declara realizado.

## Consultas de solo lectura para SSMS

```sql
SELECT name FROM sys.databases ORDER BY name;

SELECT TABLE_NAME = t.name, COLUMN_COUNT =
    (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = t.object_id)
FROM sys.tables t
WHERE t.schema_id = SCHEMA_ID(N'dbo')
ORDER BY t.name;

SELECT * FROM dbo.vw_disponibilidad_necesidad;
SELECT * FROM dbo.vw_progreso_necesidad;
SELECT * FROM dbo.vw_directorio_instituciones;
```

No se incluyen capturas de SSMS: las herramientas disponibles no permiten inspeccionarlas. La
verificación se realizó con `sqlcmd` y se documenta en `docs/plan-desarrollo.md`.
