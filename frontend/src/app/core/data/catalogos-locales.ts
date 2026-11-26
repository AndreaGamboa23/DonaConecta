import {
  CategoriaInformativa,
  DistritoOpcion,
  TipoInstitucionOpcion,
} from '../interfaces/dona-conecta';

/**
 * Catálogos de apoyo para los formularios. Los nombres son los sembrados en
 * database/scripts/005_catalogos_iniciales.sql. No son datos de negocio ni sustituyen
 * a las futuras consultas REST autorizadas.
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

export const CATEGORIAS_INFORMATIVAS: readonly CategoriaInformativa[] = [
  {
    codigo: 'ALIMENTOS',
    nombre: 'Alimentos no perecibles',
    descripcion: 'Soporte alimentario para comedores comunitarios y albergues.',
    ejemplos: 'Arroz, frijoles, leche en polvo, aceite y conservas.',
    icono: 'food',
    tono: 'blue',
  },
  {
    codigo: 'ROPA',
    nombre: 'Ropa de abrigo y frazadas',
    descripcion: 'Protección frente al frío de la sierra para familias y albergues.',
    ejemplos: 'Chompas, frazadas, calcetines y gorros.',
    icono: 'clothing',
    tono: 'cream',
  },
  {
    codigo: 'HIGIENE',
    nombre: 'Higiene y limpieza',
    descripcion: 'Bienes esenciales para el cuidado personal y espacios seguros.',
    ejemplos: 'Jabón, pasta de dientes, detergente y papel higiénico.',
    icono: 'hygiene',
    tono: 'green',
  },
  {
    codigo: 'ANIMALES',
    nombre: 'Productos para animales',
    descripcion: 'Alimento y cuidados básicos para refugios de animales rescatados.',
    ejemplos: 'Concentrado, mantas, correas y utensilios de limpieza.',
    icono: 'animals',
    tono: 'amber',
  },
  {
    codigo: 'ESCOLARES',
    nombre: 'Útiles escolares',
    descripcion: 'Herramientas para que niños y niñas continúen aprendiendo.',
    ejemplos: 'Cuadernos, lápices, mochilas y libros.',
    icono: 'school',
    tono: 'navy',
  },
];
