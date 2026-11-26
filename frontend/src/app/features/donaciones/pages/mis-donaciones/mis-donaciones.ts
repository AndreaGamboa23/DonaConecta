import { Component } from '@angular/core';
import { ServicePage } from '../../../../shared/components/service-page/service-page';

@Component({
  selector: 'app-mis-donaciones',
  standalone: true,
  imports: [ServicePage],
  templateUrl: './mis-donaciones.html',
  styleUrl: './mis-donaciones.scss',
})
export class MisDonaciones {}
