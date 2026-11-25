# Requisitos funcionales de DonaConecta

Documento de referencia de la Fase 04.2. Registra qué puede hacer el sistema y en qué estado
real se encuentra cada capacidad. **Implementado** significa que existe código verificable;
**Planificado** significa que está diseñado pero aún no debe enlazarse ni simularse.

## 1. Perfiles del sistema

| Perfil | Descripción | Estado |
|---|---|---|
| Visitante | Persona que consulta información pública sin iniciar sesión. | Implementado |
| Donante | Ciudadano registrado que ofrece bienes materiales. | Planificado (Fase 09) |
| Representante institucional | Responsable de una organización que publica necesidades y confirma recepciones. | Planificado (Fase 09/10) |
| Administrador | Gestiona verificación y operación del sistema. | Planificado (Fase 09). **El registro público nunca crea este perfil.** |

## 2. Requisitos implementados

| ID | Requisito | Perfil | Evidencia | Estado |
|---|---|---|---|---|
| RF-01 | Mostrar una portada pública que oriente sin exigir registro. | Visitante | `/` | Implementado |
| RF-02 | Navegar entre páginas mediante Angular Router con enlace activo visible. | Visitante | Navbar con `RouterLinkActive` y `aria-current="page"` | Implementado |
| RF-03 | Consultar una guía de donación de bienes materiales con categorías, estado recomendado y proceso previsto. | Visitante | `/como-donar` | Implementado |
| RF-04 | Conocer el propósito académico y social del proyecto sin testimonios ni datos inventados. | Visitante | `/nosotros` | Implementado |
| RF-05 | Resolver dudas frecuentes sobre donaciones, privacidad y funciones futuras. | Visitante | `/preguntas-frecuentes` | Implementado |
| RF-06 | Mostrar una página 404 propia con acciones reales de retorno. | Visitante | Ruta comodín `**` | Implementado |
| RF-07 | Asignar título y descripción meta distintos a cada página. | Visitante | `DonaTitleStrategy` | Implementado |
| RF-08 | Desplazarse a fragmentos internos y conservar la posición al usar el botón de retroceso. | Visitante | `withInMemoryScrolling` | Implementado |
| RF-09 | Abrir y cerrar el menú en pantallas pequeñas desde un control accesible. | Visitante | Navbar con `signal` | Implementado |
| RF-10 | Acceder a las mismas páginas públicas desde el pie de página. | Visitante | Footer con `RouterLink` | Implementado |
| RF-11 | Llevar a una acción existente desde los CTA de la portada. | Visitante | Hero, proceso y participación | Implementado |
| RF-12 | Indicar explícitamente qué módulos están planificados y cuáles no existen todavía. | Visitante | `/nosotros` y `/preguntas-frecuentes` | Implementado |

## 3. Requisitos planificados

| ID | Requisito | Perfil | Fase | Estado |
|---|---|---|---|---|
| RF-13 | Publicar y consultar necesidades concretas de bienes materiales. | Representante, visitante | 11 | Planificado |
| RF-14 | Ver el detalle de una necesidad y su progreso calculado desde registros reales. | Todos | 11 | Planificado |
| RF-15 | Registrar y verificar instituciones sociales. | Representante, administrador | 10 | Planificado |
| RF-16 | Consultar el directorio de instituciones y su detalle. | Visitante, donante | 10 | Planificado |
| RF-17 | Consultar puntos de acopio autorizados y horarios. | Visitante, donante | 13 | Planificado |
| RF-18 | Registrar una cuenta de donante. | Visitante | 09 | Planificado |
| RF-19 | Registrar una cuenta de representante sujeta a verificación. | Visitante | 10 | Planificado |
| RF-20 | Iniciar y cerrar sesión con sesión segura. | Donante, representante, administrador | 09 | Planificado |
| RF-21 | Recuperar contraseña mediante token temporal con límite de intentos. | Todos | 09 | Planificado |
| RF-22 | Verificar permisos por rol **y** propiedad del recurso en backend. | Todos | 09 en adelante | Planificado |
| RF-23 | Registrar compromisos de donación sin superar las cantidades disponibles. | Donante | 12 | Planificado |
| RF-24 | Coordinar y registrar entregas. | Donante, representante | 12 | Planificado |
| RF-25 | Confirmar recepción y consultar el histórico real de la donación. | Representante, donante | 12/16 | Planificado |
| RF-26 | Compartir ubicación GPS de forma voluntaria y por tiempo limitado. | Donante | 14 | Planificado |
| RF-27 | Enviar mensajes privados con persistencia en SQL Server. | Donante, representante | 15 | Planificado |
| RF-28 | Recibir notificaciones sin exponer datos en pantallas bloqueadas. | Todos | 16 | Planificado |
| RF-29 | Adjuntar evidencias validadas y proteger imágenes de personas vulnerables. | Representante | 16 | Planificado |
| RF-30 | Consultar dashboards con estadísticas calculadas desde datos reales. | Representante, administrador | 17 | Planificado |
| RF-31 | Instalar la aplicación como PWA. | Todos | 18 | Planificado |
| RF-32 | Publicar políticas de privacidad y términos de uso. | Visitante | 20 | Planificado |

## 4. Reglas de funcionalidad real

- Toda operación de negocio pasa por una API REST real y persiste en SQL Server; el frontend
  nunca accede a la base de datos ni usa `localStorage` como sustituto.
- No se crean botones decorativos, formularios que no envían datos ni pantallas falsas de
  módulos futuros.
- No se inventan estadísticas, testimonios, organizaciones verificadas, necesidades activas ni
  donaciones.
- Los datos de prueba, cuando existan, se identifican claramente como tales.
- Solo se enlazan en la interfaz las rutas implementadas; las demás se documentan en
  `docs/mapa-navegacion.md` y se activan en su fase correspondiente.
- Las acciones sensibles se autorizan en backend aunque el frontend oculte rutas por rol.

## 5. Trazabilidad

Los requisitos implementados se verifican con `npm run build`, `npm test -- --watch=false` y la
comprobación de navegación descrita en `docs/sistema-diseno.md`. La correspondencia entre ruta,
título y metadescripción está en `docs/mapa-navegacion.md`.
