import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriasDestacadas } from '../../shared/components/categorias-destacadas/categorias-destacadas';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-como-donar',
  standalone: true,
  imports: [RouterLink, Icon, CategoriasDestacadas],
  templateUrl: './como-donar.html',
  styleUrl: './como-donar.scss',
})
export class ComoDonar {
  protected readonly recommendations = [
    'Entrega productos nuevos o en buen estado, limpios y completos.',
    'Revisa fechas de caducidad y envases sellados en alimentos.',
    'Agrupa los bienes por categoría para facilitar la recepción.',
    'Evita objetos peligrosos, rotos o que puedan afectar a quienes los reciben.',
  ];

  protected readonly steps = [
    {
      number: '01',
      icon: 'box',
      title: 'Explorar una necesidad',
      text: 'El catálogo de solicitudes permitirá conocer qué bienes requiere cada institución.',
      available: false,
    },
    {
      number: '02',
      icon: 'food',
      title: 'Elegir los productos que puedes donar',
      text: 'Revisa las categorías y recomendaciones de esta guía antes de preparar tu donación.',
      available: true,
    },
    {
      number: '03',
      icon: 'people',
      title: 'Registrarse o iniciar sesión',
      text: 'Solo se solicitará una cuenta cuando sea necesario para registrar un compromiso.',
      available: false,
    },
    {
      number: '04',
      icon: 'hand',
      title: 'Registrar el compromiso',
      text: 'Se indicará la cantidad ofrecida y se validará que no supere lo solicitado.',
      available: false,
    },
    {
      number: '05',
      icon: 'route',
      title: 'Coordinar la entrega',
      text: 'Donante e institución acordarán horario y punto de entrega.',
      available: false,
    },
    {
      number: '06',
      icon: 'shield',
      title: 'Consultar el punto de acopio',
      text: 'El directorio mostrará ubicaciones autorizadas y horarios de atención.',
      available: false,
    },
    {
      number: '07',
      icon: 'spark',
      title: 'Compartir ubicación GPS',
      text: 'Será voluntario, limitado a una entrega y siempre podrá detenerse.',
      available: false,
    },
    {
      number: '08',
      icon: 'truck',
      title: 'Entregar los bienes',
      text: 'La entrega se realizará en el punto acordado con la institución.',
      available: false,
    },
    {
      number: '09',
      icon: 'check',
      title: 'Recibir la confirmación',
      text: 'La institución confirmará la recepción real; la ubicación no será una prueba.',
      available: false,
    },
  ];

  protected readonly deliveryStates = [
    'Compromiso registrado',
    'Compromiso aceptado',
    'Entrega coordinada',
    'En camino',
    'Donación entregada',
    'Recepción confirmada',
  ];
}
