import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';

/** Bandeja sin registros inventados: espera a la API autorizada de conversaciones. */
@Component({
  selector: 'app-bandeja-conversaciones',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './bandeja-conversaciones.html',
  styleUrl: './bandeja-conversaciones.scss',
})
export class BandejaConversaciones {}
