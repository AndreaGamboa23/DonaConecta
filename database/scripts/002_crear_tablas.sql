/* ============================================================================
   DonaConecta — Fase 06
   002_crear_tablas.sql
   Crea las 42 tablas aprobadas con columnas, PRIMARY KEY, UNIQUE, CHECK y DEFAULT.
   Las FOREIGN KEY se agregan en 003_restricciones_integridad.sql para poder
   crear primero todas las claves candidatas referenciadas.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/scripts/002_crear_tablas.sql
   ============================================================================ */

USE [DonaConectaDB];
GO
SET NOCOUNT ON;
GO

/* ---------------------------------------------------------------- Módulo 1: identidad y acceso */

CREATE TABLE dbo.roles (
    rol_id      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_roles PRIMARY KEY,
    codigo      VARCHAR(20) NOT NULL CONSTRAINT UQ_roles_codigo UNIQUE
                CONSTRAINT CK_roles_codigo CHECK (codigo IN ('DONANTE','REPRESENTANTE','ADMINISTRADOR')),
    nombre      NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255) NULL,
    activo      BIT NOT NULL CONSTRAINT DF_roles_activo DEFAULT (1)
);
GO

CREATE TABLE dbo.permisos (
    permiso_id  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_permisos PRIMARY KEY,
    codigo      VARCHAR(60) NOT NULL CONSTRAINT UQ_permisos_codigo UNIQUE,
    modulo      VARCHAR(40) NOT NULL CONSTRAINT CK_permisos_modulo CHECK
                (modulo IN ('USUARIOS','INSTITUCIONES','NECESIDADES','DONACIONES','UBICACION',
                            'MENSAJERIA','NOTIFICACIONES','ARCHIVOS','AUDITORIA','DASHBOARDS','CONFIGURACION')),
    descripcion NVARCHAR(255) NULL
);
GO

CREATE TABLE dbo.rol_permisos (
    rol_id      INT NOT NULL,
    permiso_id  INT NOT NULL,
    CONSTRAINT PK_rol_permisos PRIMARY KEY (rol_id, permiso_id)
);
GO

CREATE TABLE dbo.distritos (
    distrito_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_distritos PRIMARY KEY,
    nombre      NVARCHAR(100) NOT NULL CONSTRAINT UQ_distritos_nombre UNIQUE,
    provincia   NVARCHAR(100) NOT NULL,
    departamento NVARCHAR(100) NOT NULL,
    activo      BIT NOT NULL CONSTRAINT DF_distritos_activo DEFAULT (1)
);
GO

CREATE TABLE dbo.usuarios (
    usuario_id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_usuarios PRIMARY KEY,
    email                 NVARCHAR(256) NOT NULL CONSTRAINT UQ_usuarios_email UNIQUE,
    password_hash         NVARCHAR(255) NOT NULL,
    hash_version          SMALLINT NOT NULL CONSTRAINT DF_usuarios_hash_version DEFAULT (1)
                          CONSTRAINT CK_usuarios_hash_version CHECK (hash_version > 0),
    nombres               NVARCHAR(100) NOT NULL,
    apellidos             NVARCHAR(100) NOT NULL,
    telefono_cifrado      VARBINARY(256) NULL,
    telefono_nonce        VARBINARY(12) NULL,
    telefono_clave_version SMALLINT NULL,
    estado_cuenta         VARCHAR(25) NOT NULL CONSTRAINT CK_usuarios_estado CHECK
                          (estado_cuenta IN ('PENDIENTE_VERIFICACION','ACTIVO','BLOQUEADO','BAJA')),
    email_verificado_en   DATETIME2(0) NULL,
    intentos_fallidos     INT NOT NULL CONSTRAINT DF_usuarios_intentos DEFAULT (0)
                          CONSTRAINT CK_usuarios_intentos CHECK (intentos_fallidos >= 0),
    bloqueado_hasta       DATETIME2(0) NULL,
    ultimo_acceso_en      DATETIME2(0) NULL,
    fecha_registro        DATETIME2(0) NOT NULL CONSTRAINT DF_usuarios_fecha_registro DEFAULT (SYSUTCDATETIME()),
    fecha_baja            DATETIME2(0) NULL,
    fila_version          ROWVERSION,
    CONSTRAINT CK_usuarios_telefono_cifrado CHECK (
        (telefono_cifrado IS NULL AND telefono_nonce IS NULL AND telefono_clave_version IS NULL)
        OR (telefono_cifrado IS NOT NULL AND telefono_nonce IS NOT NULL
            AND telefono_clave_version IS NOT NULL AND DATALENGTH(telefono_nonce) = 12
            AND telefono_clave_version > 0)
    )
);
GO

CREATE TABLE dbo.usuario_roles (
    usuario_id            INT NOT NULL,
    rol_id                INT NOT NULL,
    estado                VARCHAR(15) NOT NULL CONSTRAINT CK_usuario_roles_estado CHECK
                          (estado IN ('PENDIENTE','ACTIVO','INACTIVO')),
    asignado_en           DATETIME2(0) NOT NULL CONSTRAINT DF_usuario_roles_asignado DEFAULT (SYSUTCDATETIME()),
    asignado_por_usuario_id INT NULL,
    CONSTRAINT PK_usuario_roles PRIMARY KEY (usuario_id, rol_id)
);
GO

CREATE TABLE dbo.tokens_seguridad (
    token_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_tokens_seguridad PRIMARY KEY,
    usuario_id       INT NOT NULL,
    tipo             VARCHAR(30) NOT NULL CONSTRAINT CK_tokens_tipo CHECK
                     (tipo IN ('VERIFICAR_EMAIL','RECUPERAR_CLAVE','REFRESCAR_SESION','VERIFICAR_CAMBIO_EMAIL')),
    token_hash       VARBINARY(32) NOT NULL CONSTRAINT UQ_tokens_token_hash UNIQUE
                     CONSTRAINT CK_tokens_hash CHECK (DATALENGTH(token_hash) = 32),
    creado_en        DATETIME2(0) NOT NULL CONSTRAINT DF_tokens_creado DEFAULT (SYSUTCDATETIME()),
    expira_en        DATETIME2(0) NOT NULL,
    usado_en         DATETIME2(0) NULL,
    revocado_en      DATETIME2(0) NULL,
    intentos         INT NOT NULL CONSTRAINT DF_tokens_intentos DEFAULT (0)
                     CONSTRAINT CK_tokens_intentos CHECK (intentos >= 0),
    sucede_a_token_id BIGINT NULL,
    CONSTRAINT CK_tokens_expiracion CHECK (expira_en > creado_en)
);
GO

CREATE TABLE dbo.donantes (
    usuario_id               INT NOT NULL CONSTRAINT PK_donantes PRIMARY KEY,
    distrito_id              INT NOT NULL,
    preferencia_notificacion VARCHAR(15) NOT NULL CONSTRAINT CK_donantes_preferencia CHECK
                             (preferencia_notificacion IN ('TODAS','IMPORTANTES','NINGUNA')),
    consentimiento_datos     BIT NOT NULL CONSTRAINT CK_donantes_consentimiento CHECK (consentimiento_datos = 1),
    acepta_terminos          BIT NOT NULL CONSTRAINT CK_donantes_terminos CHECK (acepta_terminos = 1),
    fecha_registro           DATETIME2(0) NOT NULL CONSTRAINT DF_donantes_fecha DEFAULT (SYSUTCDATETIME())
);
GO

/* AJUSTE DOCUMENTADO: actualizado_por_usuario_id admite NULL para las filas de
   configuración sembradas antes de que exista el primer usuario. Las
   actualizaciones posteriores deben registrar usuario desde el backend. */
CREATE TABLE dbo.parametros_sistema (
    parametro_id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_parametros_sistema PRIMARY KEY,
    clave                    VARCHAR(60) NOT NULL CONSTRAINT UQ_parametros_clave UNIQUE,
    valor                    VARCHAR(255) NOT NULL,
    descripcion              NVARCHAR(255) NULL,
    actualizado_en           DATETIME2(0) NOT NULL CONSTRAINT DF_parametros_actualizado DEFAULT (SYSUTCDATETIME()),
    actualizado_por_usuario_id INT NULL
);
GO

/* ---------------------------------------------------------------- Módulo 2: archivos e instituciones */

CREATE TABLE dbo.archivos (
    archivo_id          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_archivos PRIMARY KEY,
    propietario_usuario_id INT NULL,
    creado_por_usuario_id INT NOT NULL,
    nombre_original     NVARCHAR(255) NOT NULL,
    nombre_almacenado   VARCHAR(255) NOT NULL CONSTRAINT UQ_archivos_nombre UNIQUE,
    extension           VARCHAR(10) NOT NULL,
    content_type        VARCHAR(100) NOT NULL,
    tamano_bytes        BIGINT NOT NULL CONSTRAINT CK_archivos_tamano CHECK (tamano_bytes > 0),
    hash_sha256         VARBINARY(32) NOT NULL CONSTRAINT CK_archivos_hash CHECK (DATALENGTH(hash_sha256) = 32),
    ruta_almacenamiento NVARCHAR(512) NOT NULL,
    visibilidad         VARCHAR(10) NOT NULL CONSTRAINT CK_archivos_visibilidad CHECK
                        (visibilidad IN ('PUBLICO','PRIVADO')),
    tipo                VARCHAR(30) NOT NULL CONSTRAINT CK_archivos_tipo CHECK
                        (tipo IN ('DOCUMENTO_INSTITUCION','FOTO_INSTITUCION','FOTO_NECESIDAD',
                                  'EVIDENCIA_RECEPCION','ADJUNTO_CHAT')),
    creado_en           DATETIME2(0) NOT NULL CONSTRAINT DF_archivos_creado DEFAULT (SYSUTCDATETIME()),
    eliminado_en        DATETIME2(0) NULL
);
GO

CREATE TABLE dbo.tipos_institucion (
    tipo_id     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_tipos_institucion PRIMARY KEY,
    codigo      VARCHAR(30) NOT NULL CONSTRAINT UQ_tipos_institucion_codigo UNIQUE
                CONSTRAINT CK_tipos_institucion_codigo CHECK
                (codigo IN ('COMEDOR','ALBERGUE','REFUGIO_ANIMAL','ORGANIZACION_SOCIAL','OTRO')),
    nombre      NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(255) NULL
);
GO

CREATE TABLE dbo.instituciones (
    institucion_id        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_instituciones PRIMARY KEY,
    tipo_id               INT NOT NULL,
    distrito_id           INT NOT NULL,
    nombre                NVARCHAR(200) NOT NULL,
    slug                  VARCHAR(220) NOT NULL CONSTRAINT UQ_instituciones_slug UNIQUE,
    descripcion           NVARCHAR(MAX) NULL,
    direccion             NVARCHAR(300) NULL,
    telefono_publico      NVARCHAR(30) NULL,
    email_publico         NVARCHAR(256) NULL,
    latitud               DECIMAL(9,6) NULL CONSTRAINT CK_instituciones_lat CHECK (latitud BETWEEN -90 AND 90),
    longitud              DECIMAL(9,6) NULL CONSTRAINT CK_instituciones_lon CHECK (longitud BETWEEN -180 AND 180),
    foto_archivo_id       BIGINT NULL, /* UNIQUE filtrado en 004: SQL Server solo admite un NULL */
    estado_verificacion   VARCHAR(20) NOT NULL CONSTRAINT CK_instituciones_estado CHECK
                          (estado_verificacion IN ('PENDIENTE','EN_REVISION','VERIFICADA','RECHAZADA','SUSPENDIDA','BAJA')),
    fecha_registro        DATETIME2(0) NOT NULL CONSTRAINT DF_instituciones_registro DEFAULT (SYSUTCDATETIME()),
    fecha_verificacion    DATETIME2(0) NULL,
    verificado_por_usuario_id INT NULL,
    fila_version          ROWVERSION,
    CONSTRAINT CK_instituciones_verificacion CHECK
        (estado_verificacion <> 'VERIFICADA'
         OR (fecha_verificacion IS NOT NULL AND verificado_por_usuario_id IS NOT NULL))
);
GO

CREATE TABLE dbo.institucion_representantes (
    institucion_id       INT NOT NULL,
    usuario_id           INT NOT NULL,
    cargo                NVARCHAR(100) NULL,
    es_contacto_principal BIT NOT NULL CONSTRAINT DF_inst_rep_contacto DEFAULT (0),
    estado               VARCHAR(15) NOT NULL CONSTRAINT CK_inst_rep_estado CHECK
                         (estado IN ('PENDIENTE','ACTIVO','INACTIVO','RETIRADO')),
    fecha_inicio         DATETIME2(0) NOT NULL CONSTRAINT DF_inst_rep_inicio DEFAULT (SYSUTCDATETIME()),
    fecha_fin            DATETIME2(0) NULL,
    CONSTRAINT PK_institucion_representantes PRIMARY KEY (institucion_id, usuario_id),
    CONSTRAINT CK_inst_rep_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);
GO

CREATE TABLE dbo.institucion_documentos (
    documento_id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_institucion_documentos PRIMARY KEY,
    institucion_id          INT NOT NULL,
    archivo_id              BIGINT NOT NULL,
    tipo_documento          VARCHAR(30) NOT NULL CONSTRAINT CK_inst_doc_tipo CHECK
                            (tipo_documento IN ('RAZON_SOCIAL','AUTORIZACION_MUNICIPAL','OTRO')),
    numero_documento_cifrado VARBINARY(256) NULL,
    nonce                   VARBINARY(12) NULL,
    clave_version           SMALLINT NULL,
    estado_revision         VARCHAR(15) NOT NULL CONSTRAINT CK_inst_doc_revision CHECK
                            (estado_revision IN ('PENDIENTE','APROBADO','OBSERVADO','RECHAZADO')),
    revisado_por_usuario_id INT NULL,
    revisado_en             DATETIME2(0) NULL,
    CONSTRAINT CK_inst_doc_cifrado CHECK (
        (numero_documento_cifrado IS NULL AND nonce IS NULL AND clave_version IS NULL)
        OR (numero_documento_cifrado IS NOT NULL AND nonce IS NOT NULL
            AND clave_version IS NOT NULL AND DATALENGTH(nonce) = 12 AND clave_version > 0)
    )
);
GO

CREATE TABLE dbo.verificaciones_institucion (
    verificacion_id  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_verificaciones_institucion PRIMARY KEY,
    institucion_id   INT NOT NULL,
    revisor_usuario_id INT NOT NULL,
    estado_anterior  VARCHAR(20) NOT NULL CONSTRAINT CK_verif_estado_anterior CHECK
                     (estado_anterior IN ('PENDIENTE','EN_REVISION','VERIFICADA','RECHAZADA','SUSPENDIDA','BAJA')),
    estado_nuevo     VARCHAR(20) NOT NULL CONSTRAINT CK_verif_estado_nuevo CHECK
                     (estado_nuevo IN ('PENDIENTE','EN_REVISION','VERIFICADA','RECHAZADA','SUSPENDIDA','BAJA')),
    motivo           NVARCHAR(500) NULL,
    creado_en        DATETIME2(0) NOT NULL CONSTRAINT DF_verif_creado DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_verif_cambio CHECK (estado_anterior <> estado_nuevo)
);
GO

/* ---------------------------------------------------------------- Módulo 3: catálogo y necesidades */

CREATE TABLE dbo.categorias_bienes (
    categoria_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_categorias_bienes PRIMARY KEY,
    codigo       VARCHAR(30) NOT NULL CONSTRAINT UQ_categorias_codigo UNIQUE,
    nombre       NVARCHAR(100) NOT NULL,
    descripcion  NVARCHAR(255) NULL,
    orden        TINYINT NOT NULL,
    activo       BIT NOT NULL CONSTRAINT DF_categorias_activo DEFAULT (1)
);
GO

CREATE TABLE dbo.unidades_medida (
    unidad_id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_unidades_medida PRIMARY KEY,
    codigo             VARCHAR(20) NOT NULL CONSTRAINT UQ_unidades_codigo UNIQUE,
    nombre             NVARCHAR(60) NOT NULL,
    simbolo            VARCHAR(10) NOT NULL,
    permite_fracciones BIT NOT NULL,
    decimales          TINYINT NOT NULL CONSTRAINT CK_unidades_decimales CHECK (decimales BETWEEN 0 AND 3)
);
GO

CREATE TABLE dbo.productos (
    producto_id  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_productos PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre       NVARCHAR(120) NOT NULL,
    descripcion  NVARCHAR(255) NULL,
    activo       BIT NOT NULL CONSTRAINT DF_productos_activo DEFAULT (1),
    CONSTRAINT UQ_productos_categoria_nombre UNIQUE (categoria_id, nombre)
);
GO

CREATE TABLE dbo.producto_unidades (
    producto_id  INT NOT NULL,
    unidad_id    INT NOT NULL,
    es_preferida BIT NOT NULL CONSTRAINT DF_producto_unidades_preferida DEFAULT (0),
    CONSTRAINT PK_producto_unidades PRIMARY KEY (producto_id, unidad_id)
);
GO

CREATE TABLE dbo.necesidades (
    necesidad_id       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_necesidades PRIMARY KEY,
    institucion_id     INT NOT NULL,
    titulo             NVARCHAR(200) NOT NULL,
    descripcion        NVARCHAR(MAX) NOT NULL,
    prioridad          VARCHAR(10) NOT NULL CONSTRAINT CK_necesidades_prioridad CHECK
                       (prioridad IN ('ALTA','MEDIA','BAJA')),
    estado             VARCHAR(15) NOT NULL CONSTRAINT CK_necesidades_estado CHECK
                       (estado IN ('BORRADOR','PUBLICADA','PAUSADA','COMPLETADA','VENCIDA','CANCELADA')),
    fecha_publicacion  DATETIME2(0) NULL,
    fecha_limite       DATETIME2(0) NULL,
    punto_acopio_id    INT NULL,
    creado_por_usuario_id INT NOT NULL,
    creado_en          DATETIME2(0) NOT NULL CONSTRAINT DF_necesidades_creado DEFAULT (SYSUTCDATETIME()),
    actualizado_en     DATETIME2(0) NOT NULL CONSTRAINT DF_necesidades_actualizado DEFAULT (SYSUTCDATETIME()),
    motivo_cancelacion NVARCHAR(500) NULL,
    fila_version       ROWVERSION,
    CONSTRAINT CK_necesidades_publicacion CHECK
        (estado <> 'PUBLICADA' OR fecha_publicacion IS NOT NULL),
    CONSTRAINT CK_necesidades_cancelacion CHECK
        (estado <> 'CANCELADA' OR motivo_cancelacion IS NOT NULL),
    CONSTRAINT CK_necesidades_limite CHECK
        (fecha_limite IS NULL OR fecha_limite > creado_en)
);
GO

CREATE TABLE dbo.necesidad_productos (
    necesidad_id       INT NOT NULL,
    producto_id        INT NOT NULL,
    unidad_id          INT NOT NULL,
    cantidad_requerida DECIMAL(12,3) NOT NULL CONSTRAINT CK_necesidad_prod_cantidad CHECK (cantidad_requerida > 0),
    CONSTRAINT PK_necesidad_productos PRIMARY KEY (necesidad_id, producto_id, unidad_id)
);
GO

CREATE TABLE dbo.necesidad_fotos (
    necesidad_id INT NOT NULL,
    archivo_id   BIGINT NOT NULL,
    CONSTRAINT PK_necesidad_fotos PRIMARY KEY (necesidad_id, archivo_id)
);
GO

/* ---------------------------------------------------------------- Módulo 4: compromisos, entregas y recepciones */

CREATE TABLE dbo.compromisos (
    compromiso_id       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_compromisos PRIMARY KEY,
    necesidad_id        INT NOT NULL,
    donante_usuario_id  INT NOT NULL,
    estado              VARCHAR(15) NOT NULL CONSTRAINT CK_compromisos_estado CHECK
                        (estado IN ('PENDIENTE','ACEPTADO','RECHAZADO','CANCELADO','VENCIDO','COMPLETADO')),
    fecha_compromiso    DATETIME2(0) NOT NULL CONSTRAINT DF_compromisos_fecha DEFAULT (SYSUTCDATETIME()),
    expira_en           DATETIME2(0) NULL,
    observaciones       NVARCHAR(500) NULL,
    creado_en           DATETIME2(0) NOT NULL CONSTRAINT DF_compromisos_creado DEFAULT (SYSUTCDATETIME()),
    fila_version        ROWVERSION,
    CONSTRAINT UQ_compromisos_id_necesidad UNIQUE (compromiso_id, necesidad_id),
    CONSTRAINT CK_compromisos_expiracion CHECK (estado <> 'PENDIENTE' OR expira_en IS NOT NULL)
);
GO

CREATE TABLE dbo.compromiso_productos (
    compromiso_id        INT NOT NULL,
    necesidad_id         INT NOT NULL,
    producto_id          INT NOT NULL,
    unidad_id            INT NOT NULL,
    cantidad_comprometida DECIMAL(12,3) NOT NULL CONSTRAINT CK_compromiso_prod_cantidad CHECK (cantidad_comprometida > 0),
    CONSTRAINT PK_compromiso_productos PRIMARY KEY (compromiso_id, producto_id, unidad_id)
);
GO

CREATE TABLE dbo.compromiso_historial (
    historial_id   BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_compromiso_historial PRIMARY KEY,
    compromiso_id  INT NOT NULL,
    estado_anterior VARCHAR(15) NOT NULL CONSTRAINT CK_comp_hist_anterior CHECK
                   (estado_anterior IN ('PENDIENTE','ACEPTADO','RECHAZADO','CANCELADO','VENCIDO','COMPLETADO')),
    estado_nuevo   VARCHAR(15) NOT NULL CONSTRAINT CK_comp_hist_nuevo CHECK
                   (estado_nuevo IN ('PENDIENTE','ACEPTADO','RECHAZADO','CANCELADO','VENCIDO','COMPLETADO')),
    cambiado_en    DATETIME2(0) NOT NULL CONSTRAINT DF_comp_hist_cambiado DEFAULT (SYSUTCDATETIME()),
    usuario_id     INT NOT NULL,
    motivo         NVARCHAR(500) NULL,
    CONSTRAINT CK_comp_hist_cambio CHECK (estado_anterior <> estado_nuevo)
);
GO

CREATE TABLE dbo.entregas (
    entrega_id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_entregas PRIMARY KEY,
    compromiso_id       INT NOT NULL,
    punto_acopio_id     INT NULL,
    fecha_programada    DATETIME2(0) NOT NULL,
    fecha_real_inicio   DATETIME2(0) NULL,
    fecha_real_fin      DATETIME2(0) NULL,
    estado              VARCHAR(15) NOT NULL CONSTRAINT CK_entregas_estado CHECK
                        (estado IN ('PROGRAMADA','EN_CAMINO','ENTREGADA','INCIDENCIA','CANCELADA')),
    responsable_usuario_id INT NOT NULL,
    observaciones       NVARCHAR(500) NULL,
    fila_version        ROWVERSION,
    CONSTRAINT UQ_entregas_id_compromiso UNIQUE (entrega_id, compromiso_id),
    CONSTRAINT CK_entregas_fechas CHECK
        (fecha_real_fin IS NULL OR (fecha_real_inicio IS NOT NULL AND fecha_real_fin >= fecha_real_inicio))
);
GO

CREATE TABLE dbo.entrega_productos (
    entrega_id         INT NOT NULL,
    compromiso_id      INT NOT NULL,
    producto_id        INT NOT NULL,
    unidad_id          INT NOT NULL,
    cantidad_entregada DECIMAL(12,3) NOT NULL CONSTRAINT CK_entrega_prod_cantidad CHECK (cantidad_entregada > 0),
    CONSTRAINT PK_entrega_productos PRIMARY KEY (entrega_id, producto_id, unidad_id)
);
GO

CREATE TABLE dbo.entrega_historial (
    historial_id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_entrega_historial PRIMARY KEY,
    entrega_id      INT NOT NULL,
    estado_anterior VARCHAR(15) NOT NULL CONSTRAINT CK_ent_hist_anterior CHECK
                    (estado_anterior IN ('PROGRAMADA','EN_CAMINO','ENTREGADA','INCIDENCIA','CANCELADA')),
    estado_nuevo    VARCHAR(15) NOT NULL CONSTRAINT CK_ent_hist_nuevo CHECK
                    (estado_nuevo IN ('PROGRAMADA','EN_CAMINO','ENTREGADA','INCIDENCIA','CANCELADA')),
    cambiado_en     DATETIME2(0) NOT NULL CONSTRAINT DF_ent_hist_cambiado DEFAULT (SYSUTCDATETIME()),
    usuario_id      INT NOT NULL,
    motivo          NVARCHAR(500) NULL,
    CONSTRAINT CK_ent_hist_cambio CHECK (estado_anterior <> estado_nuevo),
    CONSTRAINT CK_ent_hist_incidencia CHECK (estado_nuevo <> 'INCIDENCIA' OR motivo IS NOT NULL)
);
GO

CREATE TABLE dbo.recepciones (
    recepcion_id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_recepciones PRIMARY KEY,
    entrega_id             INT NOT NULL CONSTRAINT UQ_recepciones_entrega UNIQUE,
    recibido_por_usuario_id INT NOT NULL,
    fecha_confirmacion     DATETIME2(0) NOT NULL CONSTRAINT DF_recepciones_fecha DEFAULT (SYSUTCDATETIME()),
    estado                 VARCHAR(15) NOT NULL CONSTRAINT CK_recepciones_estado CHECK
                           (estado IN ('PARCIAL','CONFIRMADA','OBSERVADA')),
    observaciones          NVARCHAR(500) NULL,
    fila_version           ROWVERSION,
    CONSTRAINT UQ_recepciones_id_entrega UNIQUE (recepcion_id, entrega_id),
    CONSTRAINT CK_recepciones_observacion CHECK (estado <> 'OBSERVADA' OR observaciones IS NOT NULL)
);
GO

CREATE TABLE dbo.recepcion_productos (
    recepcion_id      INT NOT NULL,
    entrega_id        INT NOT NULL,
    producto_id       INT NOT NULL,
    unidad_id         INT NOT NULL,
    cantidad_recibida DECIMAL(12,3) NOT NULL CONSTRAINT CK_recepcion_prod_cantidad CHECK (cantidad_recibida >= 0),
    CONSTRAINT PK_recepcion_productos PRIMARY KEY (recepcion_id, producto_id, unidad_id)
);
GO

CREATE TABLE dbo.recepcion_evidencias (
    recepcion_id INT NOT NULL,
    archivo_id   BIGINT NOT NULL,
    CONSTRAINT PK_recepcion_evidencias PRIMARY KEY (recepcion_id, archivo_id)
);
GO

/* ---------------------------------------------------------------- Módulo 5: ubicación y GPS */

CREATE TABLE dbo.puntos_acopio (
    punto_id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_puntos_acopio PRIMARY KEY,
    institucion_id      INT NOT NULL,
    distrito_id         INT NOT NULL,
    nombre              NVARCHAR(150) NOT NULL,
    direccion           NVARCHAR(300) NULL,
    referencias_entrega NVARCHAR(500) NULL,
    latitud             DECIMAL(9,6) NULL CONSTRAINT CK_puntos_lat CHECK (latitud BETWEEN -90 AND 90),
    longitud            DECIMAL(9,6) NULL CONSTRAINT CK_puntos_lon CHECK (longitud BETWEEN -180 AND 180),
    estado              VARCHAR(10) NOT NULL CONSTRAINT CK_puntos_estado CHECK (estado IN ('ACTIVO','INACTIVO')),
    creado_en           DATETIME2(0) NOT NULL CONSTRAINT DF_puntos_creado DEFAULT (SYSUTCDATETIME()),
    fila_version        ROWVERSION
);
GO

CREATE TABLE dbo.puntos_acopio_horarios (
    punto_id      INT NOT NULL,
    dia_semana    TINYINT NOT NULL CONSTRAINT CK_horarios_dia CHECK (dia_semana BETWEEN 1 AND 7),
    hora_apertura TIME(0) NOT NULL,
    hora_cierre   TIME(0) NOT NULL,
    activo        BIT NOT NULL CONSTRAINT DF_horarios_activo DEFAULT (1),
    CONSTRAINT PK_puntos_acopio_horarios PRIMARY KEY (punto_id, dia_semana, hora_apertura),
    CONSTRAINT CK_horarios_franja CHECK (hora_cierre > hora_apertura)
);
GO

CREATE TABLE dbo.sesiones_gps (
    sesion_id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_sesiones_gps PRIMARY KEY,
    entrega_id          INT NOT NULL,
    usuario_id          INT NOT NULL,
    consentimiento_dado BIT NOT NULL CONSTRAINT CK_gps_consentimiento CHECK (consentimiento_dado = 1),
    consentimiento_en   DATETIME2(0) NOT NULL,
    fecha_inicio        DATETIME2(0) NOT NULL CONSTRAINT DF_gps_inicio DEFAULT (SYSUTCDATETIME()),
    fecha_fin           DATETIME2(0) NULL,
    expira_en           DATETIME2(0) NOT NULL,
    estado              VARCHAR(12) NOT NULL CONSTRAINT CK_gps_estado CHECK
                        (estado IN ('ACTIVA','DETENIDA','EXPIRADA','CANCELADA')),
    CONSTRAINT CK_gps_expiracion CHECK (expira_en > fecha_inicio),
    CONSTRAINT CK_gps_fin CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);
GO

CREATE TABLE dbo.gps_ultima_ubicacion (
    sesion_id            BIGINT NOT NULL CONSTRAINT PK_gps_ultima_ubicacion PRIMARY KEY,
    coordenadas_cifradas VARBINARY(256) NOT NULL,
    nonce                VARBINARY(12) NOT NULL CONSTRAINT CK_gps_nonce CHECK (DATALENGTH(nonce) = 12),
    clave_version        SMALLINT NOT NULL CONSTRAINT CK_gps_clave_version CHECK (clave_version > 0),
    precision_metros     DECIMAL(8,2) NOT NULL CONSTRAINT CK_gps_precision CHECK (precision_metros >= 0),
    actualizado_en       DATETIME2(0) NOT NULL CONSTRAINT DF_gps_actualizado DEFAULT (SYSUTCDATETIME())
);
GO

/* ---------------------------------------------------------------- Módulo 6: conversaciones */

CREATE TABLE dbo.conversaciones (
    conversacion_id      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_conversaciones PRIMARY KEY,
    necesidad_id         INT NULL,
    compromiso_id        INT NULL,
    estado               VARCHAR(10) NOT NULL CONSTRAINT CK_conversaciones_estado CHECK
                         (estado IN ('ABIERTA','CERRADA')),
    creada_por_usuario_id INT NOT NULL,
    creada_en            DATETIME2(0) NOT NULL CONSTRAINT DF_conversaciones_creada DEFAULT (SYSUTCDATETIME()),
    cerrada_en           DATETIME2(0) NULL,
    CONSTRAINT CK_conversaciones_recurso CHECK
        ((necesidad_id IS NOT NULL AND compromiso_id IS NULL)
         OR (necesidad_id IS NULL AND compromiso_id IS NOT NULL)),
    CONSTRAINT CK_conversaciones_cierre CHECK (estado <> 'CERRADA' OR cerrada_en IS NOT NULL)
);
GO

CREATE TABLE dbo.mensajes (
    mensaje_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_mensajes PRIMARY KEY,
    conversacion_id    BIGINT NOT NULL,
    remitente_usuario_id INT NOT NULL,
    contenido          NVARCHAR(4000) NOT NULL,
    tipo               VARCHAR(10) NOT NULL CONSTRAINT CK_mensajes_tipo CHECK
                       (tipo IN ('TEXTO','ARCHIVO','SISTEMA')),
    client_message_id  UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_mensajes_client_id DEFAULT (NEWID()),
    creado_en          DATETIME2(0) NOT NULL CONSTRAINT DF_mensajes_creado DEFAULT (SYSUTCDATETIME()),
    eliminado_en       DATETIME2(0) NULL,
    CONSTRAINT UQ_mensajes_conversacion_id UNIQUE (conversacion_id, mensaje_id),
    CONSTRAINT UQ_mensajes_idempotencia UNIQUE (remitente_usuario_id, client_message_id)
);
GO

CREATE TABLE dbo.conversacion_participantes (
    conversacion_id        BIGINT NOT NULL,
    usuario_id             INT NOT NULL,
    tipo_participante      VARCHAR(20) NOT NULL CONSTRAINT CK_participantes_tipo CHECK
                           (tipo_participante IN ('DONANTE','REPRESENTANTE','ADMINISTRADOR')),
    estado                 VARCHAR(15) NOT NULL CONSTRAINT CK_participantes_estado CHECK
                           (estado IN ('ACTIVO','SUSPENDIDO','SALIO','RETIRADO')),
    fecha_union            DATETIME2(0) NOT NULL CONSTRAINT DF_participantes_union DEFAULT (SYSUTCDATETIME()),
    fecha_salida           DATETIME2(0) NULL,
    ultimo_mensaje_leido_id BIGINT NULL,
    CONSTRAINT PK_conversacion_participantes PRIMARY KEY (conversacion_id, usuario_id),
    CONSTRAINT CK_participantes_salida CHECK
        (estado NOT IN ('SALIO','RETIRADO') OR fecha_salida IS NOT NULL)
);
GO

CREATE TABLE dbo.mensaje_adjuntos (
    mensaje_id BIGINT NOT NULL,
    archivo_id BIGINT NOT NULL,
    CONSTRAINT PK_mensaje_adjuntos PRIMARY KEY (mensaje_id, archivo_id)
);
GO

CREATE TABLE dbo.reportes_mensaje (
    reporte_id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_reportes_mensaje PRIMARY KEY,
    mensaje_id             BIGINT NOT NULL,
    reportado_por_usuario_id INT NOT NULL,
    motivo                 VARCHAR(25) NOT NULL CONSTRAINT CK_reportes_motivo CHECK
                           (motivo IN ('ABUSO','SPAM','CONTENIDO_INAPROPIADO','OTRO')),
    descripcion            NVARCHAR(500) NULL,
    estado                 VARCHAR(15) NOT NULL CONSTRAINT CK_reportes_estado CHECK
                           (estado IN ('PENDIENTE','RESUELTO','DESESTIMADO')),
    creado_en              DATETIME2(0) NOT NULL CONSTRAINT DF_reportes_creado DEFAULT (SYSUTCDATETIME()),
    resuelto_por_usuario_id INT NULL,
    resuelto_en            DATETIME2(0) NULL,
    CONSTRAINT UQ_reportes_mensaje_usuario UNIQUE (mensaje_id, reportado_por_usuario_id),
    CONSTRAINT CK_reportes_resolucion CHECK
        (estado = 'PENDIENTE' OR (resuelto_por_usuario_id IS NOT NULL AND resuelto_en IS NOT NULL))
);
GO

/* ---------------------------------------------------------------- Módulo 7: soporte */

/* Conjunto cerrado de tipos derivado de los eventos de docs/contrato-api.md.
   Los cuatro tipos de cuenta/seguridad no requieren recurso de negocio;
   cada tipo de negocio exige exactamente la FK de su recurso. */
CREATE TABLE dbo.notificaciones (
    notificacion_id       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notificaciones PRIMARY KEY,
    destinatario_usuario_id INT NOT NULL,
    tipo                  VARCHAR(35) NOT NULL CONSTRAINT CK_notificaciones_tipo CHECK
                          (tipo IN ('ALERTA_SEGURIDAD','RECUPERACION_ACCESO','CAMBIO_CUENTA','VERIFICACION_EMAIL',
                                    'MENSAJE_NUEVO','COMPROMISO_ESTADO','ENTREGA_ESTADO','RECEPCION_CONFIRMADA',
                                    'INSTITUCION_ESTADO','VERIFICACION_ESTADO')),
    titulo                NVARCHAR(150) NOT NULL,
    cuerpo                NVARCHAR(500) NOT NULL,
    creado_en             DATETIME2(0) NOT NULL CONSTRAINT DF_notificaciones_creado DEFAULT (SYSUTCDATETIME()),
    leido_en              DATETIME2(0) NULL,
    archivado_en          DATETIME2(0) NULL,
    mensaje_id            BIGINT NULL,
    compromiso_id         INT NULL,
    entrega_id            INT NULL,
    recepcion_id          INT NULL,
    institucion_id        INT NULL,
    verificacion_id       BIGINT NULL,
    CONSTRAINT CK_notificaciones_recurso_unico CHECK (
        (CASE WHEN mensaje_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN compromiso_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN entrega_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN recepcion_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN institucion_id IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN verificacion_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
    ),
    CONSTRAINT CK_notificaciones_tipo_recurso CHECK (
        (tipo IN ('ALERTA_SEGURIDAD','RECUPERACION_ACCESO','CAMBIO_CUENTA','VERIFICACION_EMAIL')
         AND mensaje_id IS NULL AND compromiso_id IS NULL AND entrega_id IS NULL
         AND recepcion_id IS NULL AND institucion_id IS NULL AND verificacion_id IS NULL)
        OR (tipo = 'MENSAJE_NUEVO' AND mensaje_id IS NOT NULL
            AND compromiso_id IS NULL AND entrega_id IS NULL AND recepcion_id IS NULL
            AND institucion_id IS NULL AND verificacion_id IS NULL)
        OR (tipo = 'COMPROMISO_ESTADO' AND compromiso_id IS NOT NULL
            AND mensaje_id IS NULL AND entrega_id IS NULL AND recepcion_id IS NULL
            AND institucion_id IS NULL AND verificacion_id IS NULL)
        OR (tipo = 'ENTREGA_ESTADO' AND entrega_id IS NOT NULL
            AND mensaje_id IS NULL AND compromiso_id IS NULL AND recepcion_id IS NULL
            AND institucion_id IS NULL AND verificacion_id IS NULL)
        OR (tipo = 'RECEPCION_CONFIRMADA' AND recepcion_id IS NOT NULL
            AND mensaje_id IS NULL AND compromiso_id IS NULL AND entrega_id IS NULL
            AND institucion_id IS NULL AND verificacion_id IS NULL)
        OR (tipo = 'INSTITUCION_ESTADO' AND institucion_id IS NOT NULL
            AND mensaje_id IS NULL AND compromiso_id IS NULL AND entrega_id IS NULL
            AND recepcion_id IS NULL AND verificacion_id IS NULL)
        OR (tipo = 'VERIFICACION_ESTADO' AND verificacion_id IS NOT NULL
            AND mensaje_id IS NULL AND compromiso_id IS NULL AND entrega_id IS NULL
            AND recepcion_id IS NULL AND institucion_id IS NULL)
    )
);
GO

CREATE TABLE dbo.auditoria_eventos (
    evento_id     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_auditoria_eventos PRIMARY KEY,
    usuario_id    INT NULL,
    tipo_evento   VARCHAR(60) NOT NULL,
    modulo        VARCHAR(40) NOT NULL,
    recurso_tipo  VARCHAR(40) NOT NULL,
    recurso_id    VARCHAR(50) NULL,
    origen        VARCHAR(10) NOT NULL CONSTRAINT CK_auditoria_origen CHECK
                  (origen IN ('WEB','WS','SISTEMA')),
    resultado     VARCHAR(10) NOT NULL CONSTRAINT CK_auditoria_resultado CHECK
                  (resultado IN ('OK','DENEGADO','ERROR')),
    descripcion   NVARCHAR(500) NOT NULL,
    creado_en     DATETIME2(0) NOT NULL CONSTRAINT DF_auditoria_creado DEFAULT (SYSUTCDATETIME())
);
GO

SELECT COUNT(*) AS TablasCreadas
FROM sys.tables
WHERE schema_id = SCHEMA_ID(N'dbo');
GO
