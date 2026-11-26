import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PendingNotice } from '../../../../shared/components/pending-notice/pending-notice';

@Component({
  selector: 'app-needs-preview',
  standalone: true,
  imports: [RouterLink, EmptyState, PendingNotice],
  templateUrl: './needs-preview.html',
  styleUrl: './needs-preview.scss',
})
export class NeedsPreview {
  readonly estado = inject(BackendEstadoService).estado('necesidades');
}
