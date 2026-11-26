/* ============================================================================
   DonaConecta — Fase 06
   005_catalogos_iniciales.sql
   Siembra únicamente los catálogos autorizados: roles, permisos, categorías de
   bienes, tipos de institución, unidades de medida y distritos verificables.
   No inserta usuarios, instituciones, necesidades, productos ni parámetros:
   esos datos solo deben nacer de operaciones reales en fases posteriores.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/scripts/005_catalogos_iniciales.sql
   ============================================================================ */

USE [DonaConectaDB];
GO
SET NOCOUNT ON;
GO

/* ------------------------------------------------------------------- Roles */

INSERT INTO dbo.roles (codigo, nombre, descripcion, activo)
SELECT v.codigo, v.nombre, v.descripcion, 1
FROM (VALUES
    (N'DONANTE',        N'Donante',        N'Persona que registra compromisos de bienes materiales.'),
    (N'REPRESENTANTE',  N'Representante',  N'Responsable vinculado a una institución verificada.'),
    (N'ADMINISTRADOR',  N'Administrador',  N'Privilegio de verificación y administración del sistema.')
) AS v(codigo, nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM dbo.roles r WHERE r.codigo = v.codigo);
GO

/* --------------------------------------------------------------- Permisos
   Catálogo mínimo derivado de la matriz de endpoints de docs/contrato-api.md.
   No se crea un permiso "por completar": cada código corresponde a una operación
   documentada y será comprobado por el backend en la Fase 09. */

INSERT INTO dbo.permisos (codigo, modulo, descripcion)
SELECT v.codigo, v.modulo, v.descripcion
FROM (VALUES
    (N'USUARIO_VER_PERFIL',               N'USUARIOS',       N'Consultar el propio perfil.'),
    (N'USUARIO_EDITAR_PERFIL',            N'USUARIOS',       N'Actualizar el propio perfil editable.'),
    (N'USUARIO_ADMINISTRAR',              N'USUARIOS',       N'Administrar cuentas, roles y estado.'),
    (N'INSTITUCION_VER',                  N'INSTITUCIONES',  N'Consultar institución permitida.'),
    (N'INSTITUCION_CREAR',                N'INSTITUCIONES',  N'Solicitar una institución.'),
    (N'INSTITUCION_EDITAR_PROPIA',        N'INSTITUCIONES',  N'Editar la solicitud propia.'),
    (N'INSTITUCION_VERIFICAR',            N'INSTITUCIONES',  N'Verificar o suspender instituciones.'),
    (N'NECESIDAD_VER',                    N'NECESIDADES',    N'Consultar necesidades permitidas.'),
    (N'NECESIDAD_CREAR',                  N'NECESIDADES',    N'Crear necesidades institucionales.'),
    (N'NECESIDAD_EDITAR_PROPIA',          N'NECESIDADES',    N'Editar necesidades de la institución propia.'),
    (N'NECESIDAD_ADMINISTRAR',            N'NECESIDADES',    N'Administrar necesidades.'),
    (N'COMPROMISO_CREAR',                 N'DONACIONES',     N'Registrar un compromiso con disponibilidad real.'),
    (N'COMPROMISO_VER_PROPIO',            N'DONACIONES',     N'Consultar compromisos propios o vinculados.'),
    (N'COMPROMISO_CANCELAR_PROPIO',       N'DONACIONES',     N'Cancelar un compromiso propio.'),
    (N'ENTREGA_CREAR',                    N'DONACIONES',     N'Registrar entregas parciales.'),
    (N'ENTREGA_VER_PROPIA',               N'DONACIONES',     N'Consultar entregas propias o vinculadas.'),
    (N'ENTREGA_ACTUALIZAR_ESTADO',        N'DONACIONES',     N'Cambiar el estado de una entrega.'),
    (N'RECEPCION_CONFIRMAR',              N'DONACIONES',     N'Confirmar recepción como representante autorizado.'),
    (N'PUNTO_ACOPIO_VER',                 N'UBICACION',      N'Consultar puntos de acopio públicos.'),
    (N'PUNTO_ACOPIO_ADMINISTRAR',         N'UBICACION',      N'Administrar puntos de acopio institucionales.'),
    (N'GPS_COMPARTIR',                    N'UBICACION',      N'Iniciar y detener seguimiento con consentimiento.'),
    (N'GPS_VER_AUTORIZADO',               N'UBICACION',      N'Consultar seguimiento autorizado.'),
    (N'CONVERSACION_CREAR',               N'MENSAJERIA',     N'Abrir conversación sobre un recurso válido.'),
    (N'CONVERSACION_VER_PROPIA',          N'MENSAJERIA',     N'Consultar conversaciones propias.'),
    (N'MENSAJE_ENVIAR',                   N'MENSAJERIA',     N'Enviar mensajes como participante activo.'),
    (N'MENSAJE_LEER',                     N'MENSAJERIA',     N'Leer mensajes y registrar marca de lectura.'),
    (N'CONVERSACION_ADMINISTRAR',         N'MENSAJERIA',     N'Cerrar conversaciones y gestionar reportes.'),
    (N'NOTIFICACION_VER_PROPIA',          N'NOTIFICACIONES', N'Consultar notificaciones propias.'),
    (N'NOTIFICACION_MARCAR_LEIDA',        N'NOTIFICACIONES', N'Marcar notificaciones propias como leídas.'),
    (N'ARCHIVO_SUBIR',                    N'ARCHIVOS',       N'Cargar archivos validados.'),
    (N'ARCHIVO_DESCARGAR_AUTORIZADO',     N'ARCHIVOS',       N'Descargar archivos según permiso y propiedad.'),
    (N'AUDITORIA_VER',                    N'AUDITORIA',      N'Consultar auditoría administrativa.'),
    (N'DASHBOARD_DONANTE',                N'DASHBOARDS',     N'Consultar indicadores propios del donante.'),
    (N'DASHBOARD_INSTITUCION',            N'DASHBOARDS',     N'Consultar indicadores de la institución.'),
    (N'DASHBOARD_ADMIN',                  N'DASHBOARDS',     N'Consultar indicadores globales.'),
    (N'PARAMETRO_VER',                    N'CONFIGURACION',  N'Consultar parámetros del sistema.'),
    (N'PARAMETRO_EDITAR',                 N'CONFIGURACION',  N'Actualizar parámetros del sistema.')
) AS v(codigo, modulo, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM dbo.permisos p WHERE p.codigo = v.codigo);
GO

/* Donante: permisos de donación, catálogo público y mensajería propia. */
INSERT INTO dbo.rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM dbo.roles r
CROSS JOIN dbo.permisos p
WHERE r.codigo = N'DONANTE'
  AND p.codigo IN (
      N'USUARIO_VER_PERFIL', N'USUARIO_EDITAR_PERFIL', N'NECESIDAD_VER',
      N'COMPROMISO_CREAR', N'COMPROMISO_VER_PROPIO', N'COMPROMISO_CANCELAR_PROPIO',
      N'ENTREGA_CREAR', N'ENTREGA_VER_PROPIA', N'ENTREGA_ACTUALIZAR_ESTADO',
      N'PUNTO_ACOPIO_VER', N'GPS_COMPARTIR', N'GPS_VER_AUTORIZADO',
      N'CONVERSACION_CREAR', N'CONVERSACION_VER_PROPIA', N'MENSAJE_ENVIAR', N'MENSAJE_LEER',
      N'NOTIFICACION_VER_PROPIA', N'NOTIFICACION_MARCAR_LEIDA',
      N'ARCHIVO_SUBIR', N'ARCHIVO_DESCARGAR_AUTORIZADO', N'DASHBOARD_DONANTE')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.rol_permisos rp
      WHERE rp.rol_id = r.rol_id AND rp.permiso_id = p.permiso_id);
GO

/* Representante: permisos institucionales condicionados por propiedad y verificación. */
INSERT INTO dbo.rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM dbo.roles r
CROSS JOIN dbo.permisos p
WHERE r.codigo = N'REPRESENTANTE'
  AND p.codigo IN (
      N'USUARIO_VER_PERFIL', N'USUARIO_EDITAR_PERFIL',
      N'INSTITUCION_VER', N'INSTITUCION_CREAR', N'INSTITUCION_EDITAR_PROPIA',
      N'NECESIDAD_VER', N'NECESIDAD_CREAR', N'NECESIDAD_EDITAR_PROPIA',
      N'COMPROMISO_VER_PROPIO', N'ENTREGA_CREAR', N'ENTREGA_VER_PROPIA',
      N'ENTREGA_ACTUALIZAR_ESTADO', N'RECEPCION_CONFIRMAR',
      N'PUNTO_ACOPIO_VER', N'PUNTO_ACOPIO_ADMINISTRAR', N'GPS_VER_AUTORIZADO',
      N'CONVERSACION_CREAR', N'CONVERSACION_VER_PROPIA', N'MENSAJE_ENVIAR', N'MENSAJE_LEER',
      N'NOTIFICACION_VER_PROPIA', N'NOTIFICACION_MARCAR_LEIDA',
      N'ARCHIVO_SUBIR', N'ARCHIVO_DESCARGAR_AUTORIZADO', N'DASHBOARD_INSTITUCION')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.rol_permisos rp
      WHERE rp.rol_id = r.rol_id AND rp.permiso_id = p.permiso_id);
GO

/* Administrador: catálogo completo de permisos; el registro público nunca asigna este rol. */
INSERT INTO dbo.rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM dbo.roles r
CROSS JOIN dbo.permisos p
WHERE r.codigo = N'ADMINISTRADOR'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.rol_permisos rp
      WHERE rp.rol_id = r.rol_id AND rp.permiso_id = p.permiso_id);
GO

/* ------------------------------------------------------- Tipos de institución */

INSERT INTO dbo.tipos_institucion (codigo, nombre, descripcion)
SELECT v.codigo, v.nombre, v.descripcion
FROM (VALUES
    (N'COMEDOR',           N'Comedor comunitario', N'Organización que entrega comidas a la comunidad.'),
    (N'ALBERGUE',          N'Albergue infantil',   N'Espacio de acogida para niñas, niños y adolescentes.'),
    (N'REFUGIO_ANIMAL',    N'Refugio de animales', N'Organización que resguarda animales rescatados.'),
    (N'ORGANIZACION_SOCIAL', N'Organización social', N'Institución sin fines de lucro con impacto social.'),
    (N'OTRO',              N'Otro',                N'Otra forma organización verificable.')
) AS v(codigo, nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM dbo.tipos_institucion t WHERE t.codigo = v.codigo);
GO

/* --------------------------------------------------------- Categorías de bienes
   Nombres tomados de la interfaz pública ya implementada en Fase 04.4. */

INSERT INTO dbo.categorias_bienes (codigo, nombre, descripcion, orden, activo)
SELECT v.codigo, v.nombre, v.descripcion, v.orden, 1
FROM (VALUES
    (N'ALIMENTOS_NO_PERECIBLES', N'Alimentos no perecibles', N'Arroz, frijoles, leche en polvo, aceite y conservas.', CAST(1 AS TINYINT)),
    (N'ROPA_ABRIGO_FRAZADAS',    N'Ropa de abrigo y frazadas', N'Chompas, frazadas, calcetines y gorros en buen estado.', CAST(2 AS TINYINT)),
    (N'HIGIENE_LIMPIEZA',        N'Higiene y limpieza', N'Jabón, pasta de dientes, detergente y papel higiénico.', CAST(3 AS TINYINT)),
    (N'PRODUCTOS_ANIMALES',      N'Productos para animales', N'Concentrado, mantas, correas y utensilios de limpieza.', CAST(4 AS TINYINT)),
    (N'UTILES_ESCOLARES',        N'Útiles escolares', N'Cuadernos, lápices, mochilas y libros.', CAST(5 AS TINYINT))
) AS v(codigo, nombre, descripcion, orden)
WHERE NOT EXISTS (SELECT 1 FROM dbo.categorias_bienes c WHERE c.codigo = v.codigo);
GO

/* ---------------------------------------------------------- Unidades de medida */

INSERT INTO dbo.unidades_medida (codigo, nombre, simbolo, permite_fracciones, decimales)
SELECT v.codigo, v.nombre, v.simbolo, v.permite_fracciones, v.decimales
FROM (VALUES
    (N'UN',      N'Unidad',      N'un',   CAST(0 AS BIT), CAST(0 AS TINYINT)),
    (N'KG',      N'Kilogramo',   N'kg',   CAST(1 AS BIT), CAST(1 AS TINYINT)),
    (N'L',       N'Litro',       N'L',    CAST(1 AS BIT), CAST(1 AS TINYINT)),
    (N'CAJA',    N'Caja',        N'cja',  CAST(0 AS BIT), CAST(0 AS TINYINT)),
    (N'PAQUETE', N'Paquete',     N'paq',  CAST(0 AS BIT), CAST(0 AS TINYINT)),
    (N'BOLSA',   N'Bolsa',       N'bolsa', CAST(0 AS BIT), CAST(0 AS TINYINT))
) AS v(codigo, nombre, simbolo, permite_fracciones, decimales)
WHERE NOT EXISTS (SELECT 1 FROM dbo.unidades_medida u WHERE u.codigo = v.codigo);
GO

/* ------------------------------------------------------------------ Distritos
   Fuente verificada: "Provincia de Huancayo", Wikipedia en español, tabla de 28
   distritos que cita INEI, "Perú: Estimaciones y Proyecciones de Población por
   Departamento, Provincia y Distrito 2020". Consultado el 2026-11-25.
   https://es.wikipedia.org/wiki/Provincia_de_Huancayo
   No se siembran coordenadas: la tabla no las contiene y no se inventan. */

INSERT INTO dbo.distritos (nombre, provincia, departamento, activo)
SELECT v.nombre, N'Huancayo', N'Junín', 1
FROM (VALUES
    (N'Carhuacallanga'),
    (N'Chacapampa'),
    (N'Chicche'),
    (N'Chilca'),
    (N'Chongos Alto'),
    (N'Chupuro'),
    (N'Colca'),
    (N'Cullhuas'),
    (N'El Tambo'),
    (N'Huacrapuquio'),
    (N'Hualhuas'),
    (N'Huancán'),
    (N'Huancayo'),
    (N'Huasicancha'),
    (N'Huayucachi'),
    (N'Ingenio'),
    (N'Pariahuanca'),
    (N'Pilcomayo'),
    (N'Pucará'),
    (N'Quichuay'),
    (N'Quilcas'),
    (N'San Agustín de Cajas'),
    (N'San Jerónimo de Tunán'),
    (N'San Pedro de Saño'),
    (N'Santo Domingo de Acobamba'),
    (N'Sapallanga'),
    (N'Sicaya'),
    (N'Viques')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM dbo.distritos d WHERE d.nombre = v.nombre);
GO

/* ---------------------------------------------------------- Verificación final */

SELECT 'roles' AS Catalogo, COUNT(*) AS Filas FROM dbo.roles
UNION ALL SELECT 'permisos', COUNT(*) FROM dbo.permisos
UNION ALL SELECT 'rol_permisos', COUNT(*) FROM dbo.rol_permisos
UNION ALL SELECT 'tipos_institucion', COUNT(*) FROM dbo.tipos_institucion
UNION ALL SELECT 'categorias_bienes', COUNT(*) FROM dbo.categorias_bienes
UNION ALL SELECT 'unidades_medida', COUNT(*) FROM dbo.unidades_medida
UNION ALL SELECT 'distritos', COUNT(*) FROM dbo.distritos
UNION ALL SELECT 'productos (intencionalmente vacío)', COUNT(*) FROM dbo.productos
UNION ALL SELECT 'usuarios (intencionalmente vacío)', COUNT(*) FROM dbo.usuarios
UNION ALL SELECT 'parametros_sistema (intencionalmente vacío)', COUNT(*) FROM dbo.parametros_sistema;
GO
