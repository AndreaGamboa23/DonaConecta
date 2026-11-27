# Informe de implementación final — Agente D

Alcance ejecutado exclusivamente en la rama `Andrea`, sin commits, push, merges ni
cambios de rama. Base de datos utilizada: **`DonaConectaDB_Pruebas`** en
`.\SQLEXPRESS`. No se modificaron `backend/`, `frontend/` ni
`docs/contrato-integracion-final.md`. No se ejecutó DDL ni se escribió en
`DonaConectaDB`.

## 1. Corrección de codificación

Archivo: `database/scripts/011_correcion_codificacion_fase091.sql`.

Cambios respecto de la propuesta de Fase 09.1:

- La tabla de respaldo permanente `dbo.dc_f091_respaldo_codificacion` se sustituyó
  por las tablas temporales de sesión `#dc_pares_codificacion` y
  `#dc_datos_codificacion`. No quedan objetos nuevos en la base.
- Los valores originales y corregidos se exportan con `sqlcmd -o` a
  `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-011-correcion-despues.txt`, fuera
  del repositorio.
- Guarda de `DB_NAME() = DonaConectaDB_Pruebas`, una sola transacción,
  `QUOTED_IDENTIFIER ON`, `XACT_ABORT ON` y rollback en `CATCH`.
- Pares exactos, sin reemplazo genérico de `Ã`. Se detectaron 7 pares: `Ã¡→á`,
  `Ã©→é`, `Ã­→í`, `Ã±→ñ`, `Ã³→ó`, `Ãº→ú` y la variante Windows-1252 `Ãš→Ú`.
- Se amplió el alcance a tres columnas que la propuesta anterior omitía:
  `categorias_bienes.nombre`, `distritos.departamento` y
  `productos.descripcion`. En total se revisaron 16 columnas NVARCHAR.

Comando ejecutado:

```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -d DonaConectaDB_Pruebas -i database/scripts/011_correcion_codificacion_fase091.sql -o "C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-011-correcion-despues.txt"
```

Resultado real: `EXIT=0`; **83 filas afectadas** en 16 columnas, **87 aplicaciones**
de los 7 pares; `RestosMojibakeEnColumnasRevisadas = 0`. Una segunda ejecución del
mismo script terminó con `EXIT=0`, 0 filas afectadas y 0 restos, sin advertencias.
Ejemplos verificados en SQL: `Institución sintética de prueba`,
`Útiles escolares`, `Junín`, `Necesidad sintética concurrencia`.

Evidencia previa guardada en
`C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-final-mojibake-antes.txt`.

### Verificación desde FastAPI

El servicio ya estaba en ejecución en `127.0.0.1:8000`. Se obtuvieron respuestas
`200` de `/openapi.json`, `/api/v1/necesidades` y `/api/v1/instituciones`. Los
cuerpos se descargaron a:

- `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-final-api-necesidades.json`
- `C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-final-api-instituciones.json`

Leídos como UTF-8, ambos contienen `sintética` e `Institución sintética de prueba`,
con **0** caracteres `Ã`. No se probaron otros endpoints ni se imprimieron secretos.

## 2. Datos sintéticos de demostración

Archivo: `database/scripts/012_datos_demo_final.sql`. Ejecutado dos veces con
`sqlcmd -S ".\SQLEXPRESS" -E -C -b -f 65001 -d DonaConectaDB_Pruebas -i ... -o ...`;
ambas con `EXIT=0` y recuentos idénticos.

| Elemento | Recuento real | Observación |
|---|---:|---|
| Instituciones `DEMO-FINAL-` | 3 | Comedor, albergue infantil y refugio de animales; todas `PENDIENTE`. |
| Representantes vinculados | 3 | Cuentas sintéticas existentes, rol `REPRESENTANTE` `ACTIVO`; sin nuevas contraseñas. |
| Donante | 1 reutilizado | `donante.fase09@ejemplo.com`, ya registrado como donante. |
| Necesidades | 3 | `PUBLICADA`, cada una con 3 productos y unidad `UN` del catálogo. |
| Líneas de necesidad | 9 | Arroz/Fideos/Aceite, Frazadas/Cuadernos/Mochilas, Alimento/Mantas/Comederos. |
| Puntos de acopio | 3 | Uno por institución, `ACTIVO`, sin coordenadas inventadas. |
| Horarios | 18 | Lunes a viernes 09:00–13:00 y sábado 10:00–12:00. |

Las direcciones son texto explícitamente sintético
(`DEMO-DIRECCION-SINTETICA-SIN-VALOR-REAL-*`). No se crearon usuarios, contraseñas,
hashes ni claves; no se eliminaron registros técnicos; no se cambiaron unidades
históricas. Las vistas `vw_disponibilidad_necesidad` y `vw_progreso_necesidad`
devuelven las 9 líneas con `cantidad_disponible` igual a la requerida y avance `0`.

Recuentos finales comprobados en `DonaConectaDB_Pruebas`: `usuarios = 26` (sin
altas), `instituciones = 7`, `necesidades = 10`, `necesidad_productos = 15`,
`puntos_acopio = 3`, `puntos_acopio_horarios = 18`. En `DonaConectaDB`: 0 usuarios,
0 instituciones y 0 necesidades.

## 3. Integración ejecutada por el agente principal

El backend se integró en `backend/app/main.py` con los routers de puntos de acopio,
entregas/recepciones, mensajería/notificaciones y GPS autorizado. OpenAPI quedó en
**47 rutas, 59 operaciones y 89 esquemas**. `uv run pytest -q`: **75/75** pruebas
Python aprobadas.

Se ejecutó un flujo real de extremo a extremo en `DonaConectaDB_Pruebas` con cuentas
sintéticas: verificación administrativa de una institución, alta de punto con
coordenadas autorizadas y horario, publicación de necesidad, compromiso del donante,
chat persistente bidireccional, programación y cambio de estado de entrega, sesión
GPS consentida con coordenada cifrada, recepción parcial por el representante,
cantidades recibidas/pendientes y notificaciones. Resultado: **12/12**
comprobaciones correctas. Evidencia:
`C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-final-flow.log`.

Comprobación SQL posterior en la misma base: `0` restos de mojibake en las columnas
revisadas, compromiso `ACEPTADO`, entrega `INCIDENCIA` tras recepción parcial,
recepción con `0,5` recibidos y disponibilidad coherente en
`dbo.vw_disponibilidad_necesidad`. Evidencia:
`C:\Users\ANDREA\AppData\Local\Temp\opencode\dc-final-sql-verificar.log`.
Los dos mensajes persistidos no contienen texto plano consultable (`0` coincidencias
con las frases enviadas) y su contenido empieza con Base64, coherente con el
paquete AES-256-GCM.

Correcciones de integración necesarias y ejecutadas:

- registro ordenado de routers en `main.py` (`donaciones` antes que `entregas`);
- `_fila_compromiso` ajustado a los nombres físicos `compromiso_id`/`necesidad_id`;
- `SCOPE_IDENTITY()` reemplazado por `OUTPUT INSERTED.*` en mensajes, conversaciones
  y sesiones GPS, porque la consulta separada devolvía `NULL` y provocaba una
  violación de FOREIGN KEY.

## 4. Estado posterior de los datos demo y pendientes

Las tres instituciones `DEMO-FINAL-` de este informe (`11`, `12` y `13`) fueron
verificadas después mediante el endpoint administrativo real (`200` en las tres),
por lo que ya aparecen en el directorio público junto con las tres instituciones
creadas durante el flujo final (`14`, `15` y `16`). No se inventaron datos nuevos.

Sigue pendiente únicamente lo que no corresponde a esta entrega:

- El transporte WebSocket de mensajería y GPS no se implementó: la primera versión
  usa polling HTTP y queda documentado como mejora futura.
- La valoración estética final sigue pendiente de revisión humana.
- El cierre general registró **88/88** pruebas Angular en 33 archivos y un build de
  **590,83 kB** iniciales y **114,74 kB** transferidos. No se repitieron las comprobaciones
  CDP de Fase 09.1; estas cifras no forman parte de la parte ejecutada por el Agente D.
