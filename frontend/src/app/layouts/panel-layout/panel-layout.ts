import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { ENLACES_ADMIN, ENLACES_INSTITUCION } from '../../core/config/paneles';
import { PanelNav } from '../../shared/components/panel-nav/panel-nav';

/** Layout compartido por los paneles administrativo e institucional. */
@Component({
  selector: 'app-panel-layout',
  standalone: true,
  imports: [PanelNav, RouterLink, RouterOutlet],
  templateUrl: './panel-layout.html',
  styleUrl: './panel-layout.scss',
})
export class PanelLayout {
  private readonly ruta = inject(ActivatedRoute);

  /** Permite usar el layout con un rol explícito o leerlo de `data` de la ruta. */
  readonly rolInput = input('');
  readonly anio = new Date().getFullYear();

  readonly rol = computed(
    () => this.rolInput() || String(this.ruta.snapshot.data['rol'] ?? ''),
  );
  readonly esAdmin = computed(
    () => this.rol().toLocaleUpperCase('es') === 'ADMINISTRADOR',
  );
  readonly etiquetaRol = computed(() =>
    this.esAdmin() ? 'Panel de administración' : 'Panel institucional',
  );
  readonly enlaces = computed(() =>
    this.esAdmin() ? ENLACES_ADMIN : ENLACES_INSTITUCION,
  );
}
