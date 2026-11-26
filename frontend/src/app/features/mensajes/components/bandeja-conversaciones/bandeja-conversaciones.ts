import { Component, computed, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../shared/components/icon/icon';

/** Bandeja sin registros inventados: espera a la API autorizada de conversaciones. */
@Component({
  selector: 'app-bandeja-conversaciones',
  standalone: true,
  imports: [FormsModule, Icon],
  templateUrl: './bandeja-conversaciones.html',
  styleUrl: './bandeja-conversaciones.scss',
})
export class BandejaConversaciones {
  readonly abrir = output<number>();
  readonly termino = signal('');
  readonly sinResultados = computed(() => this.termino().trim().length > 0);
}
