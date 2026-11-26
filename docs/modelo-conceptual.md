# Modelo conceptual de DonaConecta

Documento aprobado en la Fase 05.1. Describe **qué datos existen y por qué**, sin DDL. La
implementación física se realizó en la Fase 06 con autorización explícita: las 42 tablas están en
`DonaConectaDB` y los scripts versionados en `database/scripts/`. La base real no contiene datos
de negocio; las pruebas sintéticas se ejecutaron solo en `DonaConectaDB_Pruebas`.

## 1. Alcance del modelo

DonaConecta gestiona **exclusivamente donaciones de bienes materiales**. No existen entidades
de precio, pago, moneda, transferencia, comisión ni billetera. Tampoco se modela al visitante:
un visitante es una petición sin sesión, no una fila en SQL Server.

El modelo cubre: identidad y acceso, registro diferenciado, instituciones verificables,
catálogo de bienes, necesidades, compromisos, entregas, recepciones, puntos de acopio, GPS
autorizado, chat privado, notificaciones, evidencias, dashboards y auditoría.

**Inventario corregido: 42 tablas.** La propuesta anterior declaró 41, pero su inventario
enumeraba 40. Se añaden `parametros_sistema` (políticas configurables de expiración y límites)
y `recepcion_evidencias` (evidencias de recepción sin relaciones ambiguas).

## 2. Dominios y finalidad de cada entidad

| Dominio | Entidades | Finalidad justificada |
|---|---|---|
| Identidad y acceso | `roles`, `permisos`, `rol_permisos`, `usuarios`, `usuario_roles`, `tokens_seguridad` | Una sola cuenta por persona con credenciales e identidad comunes. Los roles son múltiples; los permisos son el conjunto mínimo necesario. Los tokens cubren verificación, recuperación, renovación y rotación. |
| Perfil de donante | `donantes`, `distritos` | `donantes` guarda **solo** preferencias y consentimiento de quien eligió donar; no duplica nombre, correo ni contraseña. `distritos` es catálogo administrativo real de Huancayo. |
| Configuración | `parametros_sistema` | Un único lugar para expiración de reservas, duración máxima de GPS, tamaño máximo de archivo y retención de evidencias. Evita valores mágicos dispersos. |
| Archivos | `archivos` | Metadatos de archivos en almacenamiento protegido. No contiene binarios ni URL pública. |
| Instituciones | `tipos_institucion`, `instituciones`, `institucion_representantes`, `institucion_documentos`, `verificaciones_institucion` | Solicitud de incorporación, verificación administrativa, representantes autorizados y documentos privados con historial. |
| Catálogo de bienes | `categorias_bienes`, `unidades_medida`, `productos`, `producto_unidades` | Categorías reales, productos y unidades compatibles. La combinación producto-unidad evita sumar kilogramos con unidades. |
| Necesidades | `necesidades`, `necesidad_productos`, `necesidad_fotos` | Solicitudes publicadas por instituciones verificadas, con líneas atómicas y fotografías opcionales. |
| Compromisos y entregas | `compromisos`, `compromiso_productos`, `compromiso_historial`, `entregas`, `entrega_productos`, `entrega_historial`, `recepciones`, `recepcion_productos`, `recepcion_evidencias` | Reserva, entrega física parcial o total y confirmación de recepción. Tres ciclos de vida separados para no perder trazabilidad. |
| Ubicación | `puntos_acopio`, `puntos_acopio_horarios`, `sesiones_gps`, `gps_ultima_ubicacion` | Puntos públicos con horarios y sesiones privadas de GPS con una sola posición vigente. |
| Comunicación | `conversaciones`, `conversacion_participantes`, `mensajes`, `mensaje_adjuntos`, `reportes_mensaje` | Chat persistente en SQL Server con participantes explícitos, lecturas, adjuntos y reportes por abuso. |
| Notificaciones | `notificaciones` | Avisos con destinatario y recurso opcional; permite avisos de seguridad sin donación asociada. |
| Trazabilidad | `auditoria_eventos` | Registro inmutable de operaciones críticas, sin secretos ni coordenadas. |

## 3. Registro diferenciado (decisión aprobada)

Existen dos opciones independientes de registro, ambas resueltas con **una sola entidad
`usuarios`**:

1. **Quiero donar.** Crea `usuarios`, asigna rol `DONANTE`, crea `donantes` (preferencias y
   consentimiento) y emite token de verificación de correo.
2. **Represento una institución.** Crea `usuarios`, asigna rol `REPRESENTANTE` en estado
   `PENDIENTE`, crea la `instituciones` solicitada en estado `PENDIENTE` y el vínculo
   `institucion_representantes` en estado `PENDIENTE`. **No crea fila en `donantes`.**

Consecuencias aprobadas:

- El representante puede iniciar sesión después de verificar su correo y consultar/completar
  su solicitud, pero **no** publicar necesidades ni administrar donaciones.
- La activación del permiso institucional exige tres condiciones simultáneas: rol
  `REPRESENTANTE` en `ACTIVO`, vínculo `ACTIVO` e institución `VERIFICADA`.
- Un mismo usuario puede añadir después el rol `DONANTE` sin duplicar credenciales.
- El registro público nunca asigna `ADMINISTRADOR`.
- La estrategia de endpoints es única: `POST /api/v1/autenticacion/registro` con un campo
  `tipo` (`DONANTE` / `REPRESENTANTE`). `POST /api/v1/usuarios` **no es público**.

## 4. Reglas conceptuales principales

- Una cuenta tiene **uno o varios roles**; un rol puede pertenecer a muchas cuentas.
- Un usuario tiene **como máximo un perfil de donante**; el perfil es opcional.
- Una institución tiene **muchos representantes**; un representante puede estar autorizado en
  **varias instituciones**, pero solo ve las que tiene vínculo activo o pendiente propio.
- Una institución verificada publica **muchas necesidades**; una necesidad pertenece a una sola
  institución.
- Una necesidad incluye **muchas líneas producto-unidad**; una línea aparece en muchas
  necesidades.
- Una necesidad recibe **muchos compromisos**; un compromiso pertenece a una sola necesidad y
  a un solo donante.
- Un compromiso tiene **muchas entregas**; una entrega tiene **muchas líneas** y **como máximo
  una recepción final**.
- Una entrega puede compartir **una sesión GPS activa como máximo**; la sesión conserva una
  sola posición vigente.
- Una conversación tiene **participantes explícitos** y muchos mensajes. Los representantes no
  se incorporan automáticamente: se agrega solo quien necesita acceder al contenido.
- Un mensaje puede generar **muchos reportes** y tener muchos adjuntos.
- Una notificación pertenece siempre a un destinatario, pero su recurso relacionado es
  **opcional** para avisos de seguridad, recuperación o cambio de cuenta.

## 5. Principios de privacidad aplicados al modelo

- No hay tabla de beneficiarios ni de menores; no se publica información vulnerable.
- Los documentos institucionales, adjuntos de chat, evidencias y coordenadas GPS son privados.
  Las coordenadas de puntos de acopio son públicas y están separadas de las del GPS.
- Las cantidades derivadas (disponibilidad, progreso, pendiente de entrega, no leídos) se
  calculan desde registros reales; no se almacenan como columnas de estado.
- La baja lógica y `NO ACTION` protegen la trazabilidad; el borrado físico se limita a
  borradores sin compromisos ni historial.

La representación gráfica está en `docs/modelo-entidad-relacion.md`; la estructura exacta de
atributos y claves, en `docs/modelo-logico.md` y `docs/diccionario-datos.md`.
