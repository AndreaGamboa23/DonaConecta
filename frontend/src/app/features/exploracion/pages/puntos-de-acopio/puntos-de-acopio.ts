import { Component } from '@angular/core';
import { ServicePage } from '../../../../shared/components/service-page/service-page';

@Component({
  selector: 'app-puntos-de-acopio',
  standalone: true,
  imports: [ServicePage],
  templateUrl: './puntos-de-acopio.html',
  styleUrl: './puntos-de-acopio.scss',
})
export class PuntosDeAcopio {}
