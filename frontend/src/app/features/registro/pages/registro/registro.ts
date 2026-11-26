import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, PageHero],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {}
