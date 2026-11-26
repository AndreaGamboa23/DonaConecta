import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-needs-preview',
  standalone: true,
  imports: [RouterLink, EmptyState],
  templateUrl: './needs-preview.html',
  styleUrl: './needs-preview.scss',
})
export class NeedsPreview {}
