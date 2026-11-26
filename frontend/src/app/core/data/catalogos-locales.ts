import {
  CategoriaInformativa,
  DistritoOpcion,
  TipoInstitucionOpcion,
} from '../interfaces/dona-conecta';

/**
 * Catálogos de apoyo para formularios y guías informativas. Los nombres de
 * distritos y tipos son los sembrados en `database/scripts/005_catalogos_iniciales.sql`.
 * No son datos de negocio ni sustituyen a las futuras consultas REST autorizadas.
 */
export const DISTRITOS_HUANCAYO: readonly DistritoOpcion[] = [
  { id: 1, nombre: 'Carhuacallanga' },
  { id: 2, nombre: 'Chacapampa' },
  { id: 3, nombre: 'Chicche' },
  { id: 4, nombre: 'Chilca' },
  { id: 5, nombre: 'Chongos Alto' },
  { id: 6, nombre: 'Chupuro' },
  { id: 7, nombre: 'Colca' },
  { id: 8, nombre: 'Cullhuas' },
  { id: 9, nombre: 'El Tambo' },
  { id: 10, nombre: 'Huacrapuquio' },
  { id: 11, nombre: 'Hualhuas' },
  { id: 12, nombre: 'Huancán' },
  { id: 13, nombre: 'Huancayo' },
  { id: 14, nombre: 'Huasicancha' },
  { id: 15, nombre: 'Huayucachi' },
  { id: 16, nombre: 'Ingenio' },
  { id: 17, nombre: 'Pariahuanca' },
  { id: 18, nombre: 'Pilcomayo' },
  { id: 19, nombre: 'Pucará' },
  { id: 20, nombre: 'Quichuay' },
  { id: 21, nombre: 'Quilcas' },
  { id: 22, nombre: 'San Agustín de Cajas' },
  { id: 23, nombre: 'San Jerónimo de Tunán' },
  { id: 24, nombre: 'San Pedro de Saño' },
  { id: 25, nombre: 'Santo Domingo de Acobamba' },
  { id: 26, nombre: 'Sapallanga' },
  { id: 27, nombre: 'Sicaya' },
  { id: 28, nombre: 'Viques' },
];

export const TIPOS_INSTITUCION: readonly TipoInstitucionOpcion[] = [
  { id: 1, codigo: 'COMEDOR', nombre: 'Comedor comunitario' },
  { id: 2, codigo: 'ALBERGUE', nombre: 'Albergue infantil' },
  { id: 3, codigo: 'REFUGIO_ANIMAL', nombre: 'Refugio de animales' },
  { id: 4, codigo: 'ORGANIZACION_SOCIAL', nombre: 'Organización social' },
  { id: 5, codigo: 'OTRO', nombre: 'Otro' },
];

/**
 * Guía pública de bienes materiales. Es contenido informativo centralizado:
 * no afirma necesidades activas, cantidades, instituciones registradas ni stock.
 */
export const CATEGORIAS_INFORMATIVAS: readonly CategoriaInformativa[] = [
  {
    id: 1,
    codigo: 'ALIMENTOS',
    slug: 'alimentos',
    nombre: 'Alimentos',
    descripcion: 'Alimentos no perecibles que puedan almacenarse y distribuirse con seguridad.',
    ejemplos: 'Arroz, fideos, lentejas, frejoles, avena, aceite, conservas y leche.',
    icono: 'food',
    tono: 'blue',
    imagen: '/assets/images/categoria-alimentos.webp',
    altImagen: 'Alimentos no perecibles preparados para una donación comunitaria',
    beneficio: 'Ayudan a sostener comidas calientes y regular en comedores y albergues.',
    condiciones: [
      'Revisa la fecha de vencimiento y evita productos caducados o próximos a vencer.',
      'Entrega envases cerrados, sin abolladuras, humedad ni etiquetas ilegibles.',
      'Mantén los alimentos en un lugar seco y limpio hasta la coordinación de la entrega.',
    ],
    noRecomendados: [
      'Alimentos perecibles o preparados que requieran refrigeración.',
      'Envases abiertos, inflados, con fugas o sin identificación.',
    ],
    tiposInstitucion: ['Comedores comunitarios', 'Albergues infantiles', 'Organizaciones sociales'],
  },
  {
    id: 2,
    codigo: 'ROPA',
    slug: 'ropa',
    nombre: 'Ropa y abrigo',
    descripcion: 'Prendas limpias y frazadas que ayudan a enfrentar el frío de la sierra.',
    ejemplos: 'Chompas, casacas, frazadas, mantas, pantalones, polos, medias y calzado.',
    icono: 'clothing',
    tono: 'cream',
    imagen: '/assets/images/categoria-ropa.webp',
    altImagen: 'Ropa de abrigo y frazadas listas para donar',
    beneficio: 'Aportan protección térmica y dignidad a personas que viven en condición de vulnerabilidad.',
    condiciones: [
      'Lava y seca completamente cada prenda antes de separarla para la donación.',
      'Revisa costuras, cierres y elasticidad; evita artículos rotos o con manchas difíciles.',
      'Separa por tipo y talla cuando sea posible para facilitar una distribución ordenada.',
    ],
    noRecomendados: [
      'Ropa sucia, húmeda, con olores fuertes o en mal estado.',
      'Calzado muy desgastado, frazadas incompletas o artículos de cama usados sin higiene.',
    ],
    tiposInstitucion: ['Comedores comunitarios', 'Albergues infantiles', 'Organizaciones sociales'],
  },
  {
    id: 3,
    codigo: 'HIGIENE',
    slug: 'higiene',
    nombre: 'Higiene',
    descripcion: 'Productos de cuidado personal y limpieza para espacios seguros y saludables.',
    ejemplos: 'Jabón, champú, pasta dental, cepillos nuevos, papel higiénico y detergente.',
    icono: 'hygiene',
    tono: 'green',
    imagen: '/assets/images/categoria-higiene.webp',
    altImagen: 'Productos de higiene y limpieza para donación',
    beneficio: 'Contribuyen a la higiene diaria y a mantener condiciones básicas en espacios compartidos.',
    condiciones: [
      'Verifica que el envase esté sellado, sin uso y con fecha de vencimiento vigente.',
      'Guarda los productos lejos de humedad y fuentes de calor antes de la entrega.',
      'Transporta líquidos y detergentes en bolsas resistentes para evitar derrames.',
    ],
    noRecomendados: [
      'Productos abiertos, usados o sin fecha de vencimiento legible.',
      'Medicamentos sin prescripción o productos ofrecidos como tratamiento sin profesional.',
    ],
    tiposInstitucion: ['Comedores comunitarios', 'Albergues infantiles', 'Organizaciones sociales'],
  },
  {
    id: 4,
    codigo: 'ANIMALES',
    slug: 'animales',
    nombre: 'Animales',
    descripcion: 'Alimento y cuidados básicos compatibles con refugios de animales rescatados.',
    ejemplos: 'Croquetas, mantas, correas, comederos, bebederos y accesorios de limpieza.',
    icono: 'animals',
    tono: 'amber',
    imagen: '/assets/images/categoria-animales.webp',
    altImagen: 'Productos de cuidado animal preparados para una donación',
    beneficio: 'Apoyan la alimentación, abrigo y manejo responsable de animales bajo cuidado de refugios.',
    condiciones: [
      'Conserva el alimento en su empaque original, seco y cerrado.',
      'Lava y seca comederos, bebederos y accesorios antes de entregarlos.',
      'Coordina con el refugio qué tipos, presentaciones y cantidades son útiles.',
    ],
    noRecomendados: [
      'Medicamentos, vacunas o suplementos sin indicación de un profesional.',
      'Alimento a granel sin identificación, húmedo o con signos de contaminación.',
    ],
    tiposInstitucion: ['Refugios de animales', 'Organizaciones sociales'],
  },
  {
    id: 5,
    codigo: 'ESCOLARES',
    slug: 'utiles-escolares',
    nombre: 'Útiles escolares',
    descripcion: 'Materiales para que niños y niñas puedan estudiar y crear con confianza.',
    ejemplos: 'Cuadernos, mochilas, lápices, colores, lapiceros, borradores, libros y reglas.',
    icono: 'school',
    tono: 'navy',
    imagen: '/assets/images/categoria-utiles.webp',
    altImagen: 'Útiles escolares organizados para donar',
    beneficio: 'Facilitan la asistencia, la práctica diaria y la expresión creativa en espacios de aprendizaje.',
    condiciones: [
      'Entrega materiales nuevos o en excelente estado, completos y sin páginas sueltas.',
      'Revisa que lápices, colores y lapiceros estén en buen estado y empaquetados por tipo.',
      'Si incluyes libros, verifica que sean aptos para uso escolar y que estén limpios.',
    ],
    noRecomendados: [
      'Cuadernos usados, hojas sueltas o materiales incompletos.',
      'Mochilas rotas, instrumentos sin funcionar o publicaciones con contenido inadecuado.',
    ],
    tiposInstitucion: ['Albergues infantiles', 'Organizaciones sociales', 'Comedores comunitarios'],
  },
];
