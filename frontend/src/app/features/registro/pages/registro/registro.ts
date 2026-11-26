import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { ServiceCard } from '../../../../shared/components/service-card/service-card';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, Icon, PageHero, ServiceCard],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {}
