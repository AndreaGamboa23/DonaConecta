import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './brand.html',
  styleUrl: './brand.scss',
})
export class Brand {
  readonly inverted = input(false);
}
