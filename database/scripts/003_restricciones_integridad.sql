/* ============================================================================
   DonaConecta — Fase 06
   003_restricciones_integridad.sql
   Agrega todas las FOREIGN KEY del modelo Fase 05.1. No hay cascadas:
   ON DELETE NO ACTION, ON UPDATE NO ACTION en todas.
   Ejecutar: sqlcmd -S ".\SQLEXPRESS" -E -C -b -i database/scripts/003_restricciones_integridad.sql
   ============================================================================ */

USE [DonaConectaDB];
GO
SET NOCOUNT ON;
GO

/* ---------------------------------------------------------------- Identidad */

ALTER TABLE dbo.rol_permisos
    ADD CONSTRAINT FK_rol_permisos_rol FOREIGN KEY (rol_id)
        REFERENCES dbo.roles(rol_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_rol_permisos_permiso FOREIGN KEY (permiso_id)
        REFERENCES dbo.permisos(permiso_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.usuario_roles
    ADD CONSTRAINT FK_usuario_roles_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_usuario_roles_rol FOREIGN KEY (rol_id)
            REFERENCES dbo.roles(rol_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_usuario_roles_asignado_por FOREIGN KEY (asignado_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.tokens_seguridad
    ADD CONSTRAINT FK_tokens_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_tokens_sucede_a FOREIGN KEY (sucede_a_token_id)
            REFERENCES dbo.tokens_seguridad(token_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.donantes
    ADD CONSTRAINT FK_donantes_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_donantes_distrito FOREIGN KEY (distrito_id)
            REFERENCES dbo.distritos(distrito_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* AJUSTE DOCUMENTADO: la FK admite NULL porque la configuración puede sembrarse
   antes de que exista un usuario administrador. */
ALTER TABLE dbo.parametros_sistema
    ADD CONSTRAINT FK_parametros_actualizado_por FOREIGN KEY (actualizado_por_usuario_id)
        REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* ------------------------------------------------------- Archivos e instituciones */

ALTER TABLE dbo.archivos
    ADD CONSTRAINT FK_archivos_propietario FOREIGN KEY (propietario_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_archivos_creado_por FOREIGN KEY (creado_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.instituciones
    ADD CONSTRAINT FK_instituciones_tipo FOREIGN KEY (tipo_id)
            REFERENCES dbo.tipos_institucion(tipo_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_instituciones_distrito FOREIGN KEY (distrito_id)
            REFERENCES dbo.distritos(distrito_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_instituciones_foto FOREIGN KEY (foto_archivo_id)
            REFERENCES dbo.archivos(archivo_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_instituciones_verificado_por FOREIGN KEY (verificado_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.institucion_representantes
    ADD CONSTRAINT FK_inst_rep_institucion FOREIGN KEY (institucion_id)
            REFERENCES dbo.instituciones(institucion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_inst_rep_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.institucion_documentos
    ADD CONSTRAINT FK_inst_doc_institucion FOREIGN KEY (institucion_id)
            REFERENCES dbo.instituciones(institucion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_inst_doc_archivo FOREIGN KEY (archivo_id)
            REFERENCES dbo.archivos(archivo_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_inst_doc_revisado_por FOREIGN KEY (revisado_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.verificaciones_institucion
    ADD CONSTRAINT FK_verificaciones_institucion FOREIGN KEY (institucion_id)
            REFERENCES dbo.instituciones(institucion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_verificaciones_revisor FOREIGN KEY (revisor_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* -------------------------------------------------------- Catálogo y necesidades */

ALTER TABLE dbo.productos
    ADD CONSTRAINT FK_productos_categoria FOREIGN KEY (categoria_id)
        REFERENCES dbo.categorias_bienes(categoria_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.producto_unidades
    ADD CONSTRAINT FK_producto_unidades_producto FOREIGN KEY (producto_id)
            REFERENCES dbo.productos(producto_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_producto_unidades_unidad FOREIGN KEY (unidad_id)
            REFERENCES dbo.unidades_medida(unidad_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.necesidades
    ADD CONSTRAINT FK_necesidades_institucion FOREIGN KEY (institucion_id)
            REFERENCES dbo.instituciones(institucion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_necesidades_punto FOREIGN KEY (punto_acopio_id)
            REFERENCES dbo.puntos_acopio(punto_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_necesidades_creado_por FOREIGN KEY (creado_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.necesidad_productos
    ADD CONSTRAINT FK_necesidad_productos_necesidad FOREIGN KEY (necesidad_id)
            REFERENCES dbo.necesidades(necesidad_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_necesidad_productos_producto_unidad FOREIGN KEY (producto_id, unidad_id)
            REFERENCES dbo.producto_unidades(producto_id, unidad_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.necesidad_fotos
    ADD CONSTRAINT FK_necesidad_fotos_necesidad FOREIGN KEY (necesidad_id)
            REFERENCES dbo.necesidades(necesidad_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_necesidad_fotos_archivo FOREIGN KEY (archivo_id)
            REFERENCES dbo.archivos(archivo_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* --------------------------------------------- Compromisos, entregas y recepciones */

ALTER TABLE dbo.compromisos
    ADD CONSTRAINT FK_compromisos_necesidad FOREIGN KEY (necesidad_id)
            REFERENCES dbo.necesidades(necesidad_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_compromisos_donante FOREIGN KEY (donante_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* FK compuestos anti asociaciones cruzadas. */
ALTER TABLE dbo.compromiso_productos
    ADD CONSTRAINT FK_compromiso_productos_cabecera FOREIGN KEY (compromiso_id, necesidad_id)
            REFERENCES dbo.compromisos(compromiso_id, necesidad_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_compromiso_productos_linea_necesidad FOREIGN KEY (necesidad_id, producto_id, unidad_id)
            REFERENCES dbo.necesidad_productos(necesidad_id, producto_id, unidad_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.compromiso_historial
    ADD CONSTRAINT FK_comp_hist_compromiso FOREIGN KEY (compromiso_id)
            REFERENCES dbo.compromisos(compromiso_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_comp_hist_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.entregas
    ADD CONSTRAINT FK_entregas_compromiso FOREIGN KEY (compromiso_id)
            REFERENCES dbo.compromisos(compromiso_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_entregas_punto FOREIGN KEY (punto_acopio_id)
            REFERENCES dbo.puntos_acopio(punto_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_entregas_responsable FOREIGN KEY (responsable_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.entrega_productos
    ADD CONSTRAINT FK_entrega_productos_cabecera FOREIGN KEY (entrega_id, compromiso_id)
            REFERENCES dbo.entregas(entrega_id, compromiso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_entrega_productos_linea_compromiso FOREIGN KEY (compromiso_id, producto_id, unidad_id)
            REFERENCES dbo.compromiso_productos(compromiso_id, producto_id, unidad_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.entrega_historial
    ADD CONSTRAINT FK_ent_hist_entrega FOREIGN KEY (entrega_id)
            REFERENCES dbo.entregas(entrega_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_ent_hist_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.recepciones
    ADD CONSTRAINT FK_recepciones_entrega FOREIGN KEY (entrega_id)
            REFERENCES dbo.entregas(entrega_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_recepciones_recibido_por FOREIGN KEY (recibido_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.recepcion_productos
    ADD CONSTRAINT FK_recepcion_productos_cabecera FOREIGN KEY (recepcion_id, entrega_id)
            REFERENCES dbo.recepciones(recepcion_id, entrega_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_recepcion_productos_linea_entrega FOREIGN KEY (entrega_id, producto_id, unidad_id)
            REFERENCES dbo.entrega_productos(entrega_id, producto_id, unidad_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.recepcion_evidencias
    ADD CONSTRAINT FK_recepcion_evidencias_recepcion FOREIGN KEY (recepcion_id)
            REFERENCES dbo.recepciones(recepcion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_recepcion_evidencias_archivo FOREIGN KEY (archivo_id)
            REFERENCES dbo.archivos(archivo_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* ------------------------------------------------------------- Ubicación y GPS */

ALTER TABLE dbo.puntos_acopio
    ADD CONSTRAINT FK_puntos_acopio_institucion FOREIGN KEY (institucion_id)
            REFERENCES dbo.instituciones(institucion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_puntos_acopio_distrito FOREIGN KEY (distrito_id)
            REFERENCES dbo.distritos(distrito_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.puntos_acopio_horarios
    ADD CONSTRAINT FK_horarios_punto FOREIGN KEY (punto_id)
        REFERENCES dbo.puntos_acopio(punto_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.sesiones_gps
    ADD CONSTRAINT FK_sesiones_gps_entrega FOREIGN KEY (entrega_id)
            REFERENCES dbo.entregas(entrega_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_sesiones_gps_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.gps_ultima_ubicacion
    ADD CONSTRAINT FK_gps_ultima_sesion FOREIGN KEY (sesion_id)
        REFERENCES dbo.sesiones_gps(sesion_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* ------------------------------------------------------------------ Conversaciones */

ALTER TABLE dbo.conversaciones
    ADD CONSTRAINT FK_conversaciones_necesidad FOREIGN KEY (necesidad_id)
            REFERENCES dbo.necesidades(necesidad_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_conversaciones_compromiso FOREIGN KEY (compromiso_id)
            REFERENCES dbo.compromisos(compromiso_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_conversaciones_creada_por FOREIGN KEY (creada_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.mensajes
    ADD CONSTRAINT FK_mensajes_conversacion FOREIGN KEY (conversacion_id)
            REFERENCES dbo.conversaciones(conversacion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_mensajes_remitente FOREIGN KEY (remitente_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* La marca de lectura no puede apuntar a un mensaje de otra conversación. */
ALTER TABLE dbo.conversacion_participantes
    ADD CONSTRAINT FK_participantes_conversacion FOREIGN KEY (conversacion_id)
            REFERENCES dbo.conversaciones(conversacion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_participantes_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_participantes_ultimo_leido FOREIGN KEY (conversacion_id, ultimo_mensaje_leido_id)
            REFERENCES dbo.mensajes(conversacion_id, mensaje_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.mensaje_adjuntos
    ADD CONSTRAINT FK_mensaje_adjuntos_mensaje FOREIGN KEY (mensaje_id)
            REFERENCES dbo.mensajes(mensaje_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_mensaje_adjuntos_archivo FOREIGN KEY (archivo_id)
            REFERENCES dbo.archivos(archivo_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.reportes_mensaje
    ADD CONSTRAINT FK_reportes_mensaje FOREIGN KEY (mensaje_id)
            REFERENCES dbo.mensajes(mensaje_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_reportes_reportado_por FOREIGN KEY (reportado_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_reportes_resuelto_por FOREIGN KEY (resuelto_por_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* ------------------------------------------------------------- Soporte y auditoría */

ALTER TABLE dbo.notificaciones
    ADD CONSTRAINT FK_notificaciones_destinatario FOREIGN KEY (destinatario_usuario_id)
            REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_notificaciones_mensaje FOREIGN KEY (mensaje_id)
            REFERENCES dbo.mensajes(mensaje_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_notificaciones_compromiso FOREIGN KEY (compromiso_id)
            REFERENCES dbo.compromisos(compromiso_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_notificaciones_entrega FOREIGN KEY (entrega_id)
            REFERENCES dbo.entregas(entrega_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_notificaciones_recepcion FOREIGN KEY (recepcion_id)
            REFERENCES dbo.recepciones(recepcion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_notificaciones_institucion FOREIGN KEY (institucion_id)
            REFERENCES dbo.instituciones(institucion_id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_notificaciones_verificacion FOREIGN KEY (verificacion_id)
            REFERENCES dbo.verificaciones_institucion(verificacion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.auditoria_eventos
    ADD CONSTRAINT FK_auditoria_usuario FOREIGN KEY (usuario_id)
        REFERENCES dbo.usuarios(usuario_id) ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

SELECT COUNT(*) AS ForeignKeys
FROM sys.foreign_keys
WHERE schema_id = SCHEMA_ID(N'dbo');
GO
