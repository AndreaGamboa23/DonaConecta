import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NecesidadReal, ExploracionApiService } from '../../../exploracion/services/exploracion-api.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { NecesidadCard } from '../../../../shared/components/necesidad-card/necesidad-card';

type EstadoDestacados = 'cargando' | 'error' | 'vacio' | 'datos';

/** Destacados reales: el backend ya ordena por prioridad, fecha e identificador. */
@Component({
  selector: 'app-needs-preview',
  standalone: true,
  imports: [RouterLink, EmptyState, NecesidadCard],
  templateUrl: './needs-preview.html',
  styleUrl: './needs-preview.scss',
})
export class NeedsPreview implements OnInit {
  private readonly api = inject(ExploracionApiService);

  readonly estado = signal<EstadoDestacados>('cargando');
  readonly necesidades = signal<readonly NecesidadReal[]>([]);

  ngOnInit(): void {
    this.api.listarNecesidades({ limit: 3 }).subscribe({
      next: (lista) => {
        this.necesidades.set(lista);
        this.estado.set(lista.length > 0 ? 'datos' : 'vacio');
      },
      error: () => this.estado.set('error'),
    });
  }
}
