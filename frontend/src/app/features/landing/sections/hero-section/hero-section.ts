import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  // Al recibir una fotografía autorizada, reemplazar '' por su ruta en
  // public/assets/images/ (por ejemplo, 'assets/images/hero-comunidad.webp').
  protected readonly photoSrc = '';
}
