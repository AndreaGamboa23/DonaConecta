import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly icono = input<string>('box');
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly accionPrincipal = input<string>('');
  readonly rutaPrincipal = input<string>('');
  readonly accionSecundaria = input<string>('');
  readonly rutaSecundaria = input<string>('');
}
