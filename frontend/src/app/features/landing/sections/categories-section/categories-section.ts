import { Component } from '@angular/core';
import { CategoriasDestacadas } from '../../../../shared/components/categorias-destacadas/categorias-destacadas';

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [CategoriasDestacadas],
  templateUrl: './categories-section.html',
  styleUrl: './categories-section.scss',
})
export class CategoriesSection {}
