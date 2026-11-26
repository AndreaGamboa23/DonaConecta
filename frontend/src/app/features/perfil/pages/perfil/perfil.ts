import { Component } from '@angular/core';
import { ServicePage } from '../../../../shared/components/service-page/service-page';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ServicePage],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {}
