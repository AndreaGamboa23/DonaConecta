import { Component } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [Icon],
  templateUrl: './categories-section.html',
  styleUrl: './categories-section.scss',
})
export class CategoriesSection {
  // Colocar las fotografías autorizadas en public/assets/images/ y asignar aquí su ruta.
  protected readonly categories = [
    {
      icon: 'food',
      name: 'Alimentos no perecibles',
      description: 'Soporte alimentario para comedores comunitarios y albergues.',
      examples: 'Arroz, frijoles, leche en polvo, aceite y conservas.',
      image: '',
      tone: 'blue',
    },
    {
      icon: 'clothing',
      name: 'Ropa de abrigo y frazadas',
      description: 'Protección frente al frío de la sierra para familias y albergues.',
      examples: 'Chompas, frazadas, calcetines y gorros.',
      image: '',
      tone: 'green',
    },
    {
      icon: 'hygiene',
      name: 'Higiene y limpieza',
      description: 'Bienes esenciales para el cuidado personal y espacios seguros.',
      examples: 'Jabón, pasta de dientes, detergente y papel higiénico.',
      image: '',
      tone: 'amber',
    },
    {
      icon: 'animals',
      name: 'Productos para animales',
      description: 'Alimento y cuidados básicos para refugios de animales rescatados.',
      examples: 'Concentrado, mantas, correas y utensilios de limpieza.',
      image: '',
      tone: 'blue',
    },
    {
      icon: 'school',
      name: 'Útiles escolares',
      description: 'Herramientas para que niños y niñas continúen aprendiendo.',
      examples: 'Cuadernos, lápices, mochilas y libros.',
      image: '',
      tone: 'green',
    },
  ];
}
