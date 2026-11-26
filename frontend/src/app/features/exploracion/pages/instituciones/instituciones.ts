import { Component } from '@angular/core';
import { ServicePage } from '../../../../shared/components/service-page/service-page';

@Component({
  selector: 'app-instituciones',
  standalone: true,
  imports: [ServicePage],
  templateUrl: './instituciones.html',
  styleUrl: './instituciones.scss',
})
export class Instituciones {}
