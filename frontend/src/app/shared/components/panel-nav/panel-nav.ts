import { Component, HostListener, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SesionApiService } from '../../../core/services/sesion-api.service';
import { SesionService } from '../../../core/services/sesion.service';
import { EnlacePanel } from '../../../core/config/paneles';
import { Brand } from '../brand/brand';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-panel-nav',
  standalone: true,
  imports: [Brand, Icon, RouterLink, RouterLinkActive],
  templateUrl: './panel-nav.html',
  styleUrl: './panel-nav.scss',
})
export class PanelNav {
  private readonly router = inject(Router);
  private readonly sesionApi = inject(SesionApiService);
  readonly sesion = inject(SesionService);

  readonly rol = input.required<string>();
  readonly enlaces = input.required<readonly EnlacePanel[]>();
  readonly salir = output<void>();
  readonly menuAbierto = signal(false);

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  cerrarSesion(): void {
    this.cerrarMenu();
    this.sesionApi.cerrar().subscribe({
      next: () => this.finalizar(),
      error: () => this.finalizar(),
    });
  }

  @HostListener('document:keydown.escape')
  alEscape(): void {
    this.cerrarMenu();
  }

  private finalizar(): void {
    this.salir.emit();
    void this.router.navigateByUrl('/iniciar-sesion');
  }
}
