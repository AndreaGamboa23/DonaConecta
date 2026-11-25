-- ============================================================================
-- Fase 06: Esquema T-SQL Normalizado (3FN) - DonaConectaDB
-- Motor: Microsoft SQL Server 2022 Express (.\SQLEXPRESS)
-- ============================================================================

IF DB_ID(N'DonaConectaDB') IS NULL
BEGIN
    CREATE DATABASE DonaConectaDB;
END;
GO

USE DonaConectaDB;
GO

-- 1. Seguridad y Control de Acceso
CREATE TABLE roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(150) NOT NULL,
    CONSTRAINT CK_roles_nombre CHECK (nombre_rol IN ('DONANTE', 'REPRESENTANTE', 'ADMINISTRADOR'))
);

CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombres NVARCHAR(100) NOT NULL,
    apellidos NVARCHAR(100) NOT NULL,
    correo NVARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20) NULL,
    dni_cifrado VARBINARY(256) NULL,
    password_hash NVARCHAR(255) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    actualizado_en DATETIME2 NULL
);

CREATE TABLE usuario_roles (
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    asignado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_usuario_roles PRIMARY KEY (id_usuario, id_rol),
    CONSTRAINT FK_usuario_roles_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT FK_usuario_roles_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

CREATE TABLE tokens_recuperacion (
    id_token INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expira_en DATETIME2 NOT NULL,
    intentos INT NOT NULL DEFAULT 0,
    usado BIT NOT NULL DEFAULT 0,
    creado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_tokens_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT CK_tokens_intentos CHECK (intentos >= 0 AND intentos <= 5)
);

-- 2. Instituciones y Puntos de Acopio
CREATE TABLE instituciones (
    id_institucion INT IDENTITY(1,1) PRIMARY KEY,
    id_representante INT NOT NULL,
    ruc CHAR(11) NOT NULL UNIQUE,
    razon_social NVARCHAR(180) NOT NULL,
    nombre_comercial NVARCHAR(150) NOT NULL,
    tipo_institucion VARCHAR(40) NOT NULL,
    descripcion NVARCHAR(500) NULL,
    distrito NVARCHAR(80) NOT NULL,
    direccion NVARCHAR(200) NOT NULL,
    estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    verificada_por INT NULL,
    verificada_en DATETIME2 NULL,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_instituciones_representante FOREIGN KEY (id_representante) REFERENCES usuarios(id_usuario),
    CONSTRAINT FK_instituciones_verificador FOREIGN KEY (verificada_por) REFERENCES usuarios(id_usuario),
    CONSTRAINT CK_instituciones_tipo CHECK (tipo_institucion IN ('COMEDOR', 'ALBERGUE', 'REFUGIO_ANIMALES', 'ORGANIZACION_SOCIAL')),
    CONSTRAINT CK_instituciones_estado CHECK (estado_verificacion IN ('PENDIENTE', 'VERIFICADA', 'RECHAZADA'))
);

CREATE TABLE documentos_institucion (
    id_documento INT IDENTITY(1,1) PRIMARY KEY,
    id_institucion INT NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    nombre_archivo NVARCHAR(180) NOT NULL,
    ruta_privada NVARCHAR(300) NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    tamano_bytes INT NOT NULL,
    subido_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_documentos_institucion FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion),
    CONSTRAINT CK_documentos_tamano CHECK (tamano_bytes > 0)
);

CREATE TABLE puntos_acopio (
    id_punto_acopio INT IDENTITY(1,1) PRIMARY KEY,
    id_institucion INT NOT NULL,
    nombre_punto NVARCHAR(120) NOT NULL,
    distrito NVARCHAR(80) NOT NULL,
    direccion NVARCHAR(200) NOT NULL,
    referencia NVARCHAR(200) NULL,
    latitud DECIMAL(9,6) NULL,
    longitud DECIMAL(9,6) NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_puntos_institucion FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion)
);

CREATE TABLE horarios_acopio (
    id_horario INT IDENTITY(1,1) PRIMARY KEY,
    id_punto_acopio INT NOT NULL,
    dia_semana TINYINT NOT NULL,
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL,
    CONSTRAINT FK_horarios_punto FOREIGN KEY (id_punto_acopio) REFERENCES puntos_acopio(id_punto_acopio),
    CONSTRAINT CK_horarios_dia CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT CK_horarios_rango CHECK (hora_cierre > hora_apertura)
);

-- 3. Necesidades de Bienes Materiales
CREATE TABLE categorias_bien (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(80) NOT NULL UNIQUE,
    descripcion NVARCHAR(250) NULL,
    unidad_medida_base VARCHAR(30) NOT NULL,
    activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE necesidades (
    id_necesidad INT IDENTITY(1,1) PRIMARY KEY,
    id_institucion INT NOT NULL,
    id_categoria INT NOT NULL,
    id_punto_acopio INT NOT NULL,
    titulo NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(600) NOT NULL,
    cantidad_requerida DECIMAL(10,2) NOT NULL,
    prioridad VARCHAR(15) NOT NULL DEFAULT 'MEDIA',
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    fecha_limite DATE NULL,
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_necesidades_institucion FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion),
    CONSTRAINT FK_necesidades_categoria FOREIGN KEY (id_categoria) REFERENCES categorias_bien(id_categoria),
    CONSTRAINT FK_necesidades_punto FOREIGN KEY (id_punto_acopio) REFERENCES puntos_acopio(id_punto_acopio),
    CONSTRAINT CK_necesidades_cantidad CHECK (cantidad_requerida > 0),
    CONSTRAINT CK_necesidades_prioridad CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
    CONSTRAINT CK_necesidades_estado CHECK (estado IN ('ACTIVA', 'CUBIERTA', 'CANCELADA'))
);

-- 4. Compromisos, Entregas y Evidencias
CREATE TABLE compromisos_donacion (
    id_compromiso INT IDENTITY(1,1) PRIMARY KEY,
    id_necesidad INT NOT NULL,
    id_donante INT NOT NULL,
    cantidad_comprometida DECIMAL(10,2) NOT NULL,
    comentario NVARCHAR(300) NULL,
    estado VARCHAR(25) NOT NULL DEFAULT 'PENDIENTE',
    creado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    actualizado_en DATETIME2 NULL,
    CONSTRAINT FK_compromisos_necesidad FOREIGN KEY (id_necesidad) REFERENCES necesidades(id_necesidad),
    CONSTRAINT FK_compromisos_donante FOREIGN KEY (id_donante) REFERENCES usuarios(id_usuario),
    CONSTRAINT CK_compromisos_cantidad CHECK (cantidad_comprometida > 0),
    CONSTRAINT CK_compromisos_estado CHECK (estado IN ('PENDIENTE', 'EN_CAMINO', 'ENTREGADO_PARCIAL', 'COMPLETADO', 'CANCELADO'))
);

CREATE TABLE entregas (
    id_entrega INT IDENTITY(1,1) PRIMARY KEY,
    id_compromiso INT NOT NULL,
    cantidad_entregada DECIMAL(10,2) NOT NULL,
    fecha_programada DATETIME2 NULL,
    fecha_recepcion DATETIME2 NULL,
    confirmada_por INT NULL,
    observaciones NVARCHAR(300) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
    CONSTRAINT FK_entregas_compromiso FOREIGN KEY (id_compromiso) REFERENCES compromisos_donacion(id_compromiso),
    CONSTRAINT FK_entregas_confirmador FOREIGN KEY (confirmada_por) REFERENCES usuarios(id_usuario),
    CONSTRAINT CK_entregas_cantidad CHECK (cantidad_entregada > 0),
    CONSTRAINT CK_entregas_estado CHECK (estado IN ('PROGRAMADA', 'CONFIRMADA', 'OBSERVADA'))
);

CREATE TABLE evidencias_entrega (
    id_evidencia INT IDENTITY(1,1) PRIMARY KEY,
    id_entrega INT NOT NULL,
    subida_por INT NOT NULL,
    ruta_archivo NVARCHAR(300) NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    tamano_bytes INT NOT NULL,
    sin_exif BIT NOT NULL DEFAULT 1,
    proteccion_privacidad BIT NOT NULL DEFAULT 1,
    subido_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_evidencias_entrega FOREIGN KEY (id_entrega) REFERENCES entregas(id_entrega),
    CONSTRAINT FK_evidencias_usuario FOREIGN KEY (subida_por) REFERENCES usuarios(id_usuario),
    CONSTRAINT CK_evidencias_tamano CHECK (tamano_bytes > 0)
);

-- 5. Comunicación y Seguimiento GPS Autorizado
CREATE TABLE sesiones_gps (
    id_sesion_gps INT IDENTITY(1,1) PRIMARY KEY,
    id_compromiso INT NOT NULL,
    id_donante INT NOT NULL,
    consentimiento_otorgado BIT NOT NULL DEFAULT 0,
    latitud_actual DECIMAL(9,6) NULL,
    longitud_actual DECIMAL(9,6) NULL,
    iniciada_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    expira_en DATETIME2 NOT NULL,
    detenida_en DATETIME2 NULL,
    activa BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_gps_compromiso FOREIGN KEY (id_compromiso) REFERENCES compromisos_donacion(id_compromiso),
    CONSTRAINT FK_gps_donante FOREIGN KEY (id_donante) REFERENCES usuarios(id_usuario)
);

CREATE TABLE conversaciones (
    id_conversacion INT IDENTITY(1,1) PRIMARY KEY,
    id_compromiso INT NOT NULL UNIQUE,
    id_donante INT NOT NULL,
    id_representante INT NOT NULL,
    creada_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_conv_compromiso FOREIGN KEY (id_compromiso) REFERENCES compromisos_donacion(id_compromiso),
    CONSTRAINT FK_conv_donante FOREIGN KEY (id_donante) REFERENCES usuarios(id_usuario),
    CONSTRAINT FK_conv_representante FOREIGN KEY (id_representante) REFERENCES usuarios(id_usuario)
);

CREATE TABLE mensajes (
    id_mensaje INT IDENTITY(1,1) PRIMARY KEY,
    id_conversacion INT NOT NULL,
    id_remitente INT NOT NULL,
    contenido NVARCHAR(1000) NOT NULL,
    leido BIT NOT NULL DEFAULT 0,
    enviado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_mensajes_conv FOREIGN KEY (id_conversacion) REFERENCES conversaciones(id_conversacion),
    CONSTRAINT FK_mensajes_remitente FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario)
);

-- 6. Notificaciones y Auditoría
CREATE TABLE notificaciones (
    id_notificacion INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo_generico NVARCHAR(150) NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    referencia_id INT NULL,
    leida BIT NOT NULL DEFAULT 0,
    creada_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_notif_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE auditoria_eventos (
    id_auditoria INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NULL,
    entidad VARCHAR(60) NOT NULL,
    id_registro INT NULL,
    accion VARCHAR(30) NOT NULL,
    detalle_resumido NVARCHAR(300) NOT NULL,
    fecha_evento DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
GO

-- Vista 3FN: Progreso calculado dinámicamente sin columnas redundantes
CREATE VIEW vw_necesidades_progreso AS
SELECT
    n.id_necesidad,
    n.id_institucion,
    n.titulo,
    n.cantidad_requerida,
    ISNULL((
        SELECT SUM(c.cantidad_comprometida)
        FROM compromisos_donacion c
        WHERE c.id_necesidad = n.id_necesidad AND c.estado <> 'CANCELADO'
    ), 0) AS cantidad_comprometida,
    ISNULL((
        SELECT SUM(e.cantidad_entregada)
        FROM entregas e
        INNER JOIN compromisos_donacion c ON c.id_compromiso = e.id_compromiso
        WHERE c.id_necesidad = n.id_necesidad AND e.estado = 'CONFIRMADA'
    ), 0) AS cantidad_recibida
FROM necesidades n
WHERE n.activo = 1;
GO

-- Catálogos iniciales obligatorios
INSERT INTO roles (nombre_rol, descripcion) VALUES
('DONANTE', 'Ciudadano que registra compromisos y entregas de bienes materiales'),
('REPRESENTANTE', 'Responsable de institucion social verificada'),
('ADMINISTRADOR', 'Gestor del sistema y verificacion institucional');

INSERT INTO categorias_bien (nombre, descripcion, unidad_medida_base) VALUES
('Alimentos no perecibles', 'Arroz, menestras, aceite, conservas y abarrotes sellados', 'kg'),
('Ropa y abrigo', 'Prendas limpias y en buen estado para ninos y adultos', 'unidad'),
('Utiles escolares', 'Cuadernos, mochilas, lapiceros y material educativo', 'kit'),
('Articulos de higiene', 'Jabon, pasta dental, panales y productos de aseo', 'unidad'),
('Alimento y cuidado animal', 'Alimento balanceado, mantas y articulos para refugios', 'kg');
GO
