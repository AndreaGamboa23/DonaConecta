# Informe de correcciones finales de experiencia (Avance 02)

Este documento resume las correcciones funcionales cerradas después de la entrega del Avance 02.
Todo el trabajo se realizó en la rama `Andrea`, usando exclusivamente `DonaConectaDB_Pruebas`.
No se ejecutaron DDL, commits ni push. `DonaConectaDB` permaneció intacta y
`ALLOW_MAIN_DB_WRITES=no` sigue vigente.

## 1. Mensajería: causa y solución

**Causa exacta.** El elemento `<form>` de `panel-conversacion.html` utilizaba
`(ngSubmit)` sin tener `[formGroup]`, mientras el componente sólo importa
`ReactiveFormsModule`. Angular no interceptaba el envío: ocurría un `submit` nativo,
la página se recargaba y nunca se emitía `POST /api/v1/conversaciones/{id}/mensajes`.
Además, el historial y la bandeja no se actualizaban de forma inmediata.

**Solución.** El formulario usa `(submit)="enviar($event)"`; `enviar()` invoca
`event.preventDefault()` y sólo limpia el borrador dentro del callback de éxito,
cuando el backend responde `201`. El mensaje confirmado se agrega de inmediato al
historial y a la bandeja. Si la petición falla, el borrador permanece y la
conversación sigue abierta. Se añadió una prueba unitaria que verifica esos tres
comportamientos.

**Evidencia.** Reproducción previa: sin petición HTTP y con recarga. Después del
cambio: `POST /api/v1/conversaciones/2/mensajes` → `201`, mensajes visibles al
instante y persistentes tras recargar ambas sesiones; borrador conservado al forzar
un fallo de red. Sin errores de consola del donante.

## 2. Punto de entrega y mapa

- `DetalleCompromisoResponse` expone el punto raíz de la necesidad:
  `id_punto_acopio`, `nombre_punto`, `direccion_acopio`, `referencias_entrega`,
  `latitud` y `longitud`. El repositorio prioriza el punto de la necesidad y usa
  la primera entrega sólo como respaldo.
- Las coordenadas se publican únicamente si existe autorización registrada
  (`PUNTO_COORDENADAS_PUBLICADAS`). Sin esa autorización no hay marcador ni mapa
  de destino; se indica la limitación.
- Las páginas `mis-donaciones` y `donacion-detalle` leen primero los campos raíz,
  muestran el nombre, la dirección, las referencias y el horario reales, y enlazan
  con `/puntos-de-acopio` pasando el punto y el compromiso.
- El mapa centra el destino con marcador propio, ofrece «Consultar mi ubicación»
  sólo por consentimiento, «Cómo llegar» mediante un enlace externo a Google Maps
  y «Volver a mi donación». No calcula rutas, distancias ni ETAs inventadas.
- Se corrigió el enlace de seguimiento: la ruta `/seguimiento/:id` identifica la
  **entrega**, por lo que ahora se pasa `entregaId` y el compromiso como parámetro
  `?compromiso=`.

## 3. Coordinación y seguimiento

- La bandeja institucional lista entregas propias, con sus líneas, cantidades
  comprometidas, recibidas y pendientes.
- Se pueden programar entregas reales para compromisos propios y puntos de la
  misma institución; las líneas se copian del compromiso y la transacción queda
  registrada en el historial.
- Las acciones de cambiar estado (`EN_CAMINO`, `ENTREGADA`) y de recepción se
  muestran según el rol y el estado real. La ubicación compartida es voluntaria,
  temporal y nunca sustituye la confirmación de recepción.
- La línea de seguimiento deriva etapas de compromiso, entregas, historial y
  recepciones: `realizada`, `actual` y `pendiente`, sin porcentajes ni eventos
  simulados.

## 4. Recepción institucional

El formulario por producto envía `POST /api/v1/entregas/{id}/recepciones`, que
delega la transacción a `dbo.usp_ConfirmarRecepcion`. El procedimiento impide
duplicados, valida que cada producto pertenezca a la entrega y que la cantidad no
supere lo entregado, actualiza el estado de la entrega y del compromiso, recalcula
la disponibilidad desde los registros reales, notifica al donante y escribe la
auditoría. La opción «Confirmada» sólo se habilita en la interfaz cuando lo que se
registra cubre el pendiente de todos los bienes.

## 5. Rutas verificadas

- `/mensajes`
- `/mis-donaciones`
- `/donaciones/12`
- `/puntos-de-acopio?punto=6&compromiso=12&…`
- `/seguimiento/5?compromiso=12`
- `/institucional/compromisos?compromiso=12`
- `/institucional/puntos-de-acopio`

## 6. Cuentas sintéticas

- Donante: `donante.fase09@ejemplo.com`
- Representante: `rep.final.59d0d029@ejemplo.com`
- Administrador: `admin.sintetico@ejemplo.com`

Las contraseñas se mantienen fuera del repositorio y de este informe.

## 7. Evidencia

Pendiente de consolidar con el resultado final de la prueba de aceptación.

## 8. Pendientes declarados

- Transporte WebSocket para mensajería y GPS; se conserva polling HTTP.
- Corrección concurrente verdadera del procedimiento de compromisos.
- Valoración estética final por revisión humana.
