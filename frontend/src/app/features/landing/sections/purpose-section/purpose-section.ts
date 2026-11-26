import { Component } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-purpose-section',
  standalone: true,
  imports: [Icon],
  templateUrl: './purpose-section.html',
  styleUrl: './purpose-section.scss',
})
export class PurposeSection {
  protected readonly commitments = [
    'Gestionamos exclusivamente bienes materiales.',
    'No realizamos pagos ni procesamos dinero.',
    'No realizamos transferencias bancarias.',
    'Facilitamos la colaboración entre ciudadanos y organizaciones.',
  ];
}
