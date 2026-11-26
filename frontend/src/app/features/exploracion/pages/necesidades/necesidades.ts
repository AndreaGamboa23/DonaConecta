import { Component } from '@angular/core';
import { ServicePage } from '../../../../shared/components/service-page/service-page';

@Component({
  selector: 'app-necesidades',
  standalone: true,
  imports: [ServicePage],
  templateUrl: './necesidades.html',
  styleUrl: './necesidades.scss',
})
export class Necesidades {}
