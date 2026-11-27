import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BackendEstadoService } from '../../../../core/services/backend-estado.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { NecesidadCard } from '../../../../shared/components/necesidad-card/necesidad-card';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { ExploracionApiService, InstitucionDetalle } from '../../services/exploracion-api.service';

type EstadoPerfil = 'servicio-no-disponible' | 'cargando' | 'error' | 'no-encontrada' | 'datos';

/** Perfil público con campos autorizados por el backend; nada se inventa en la interfaz. */
@Component({
  selector: 'app-institucion-perfil',
  standalone: true,
  imports: [RouterLink, Icon, NecesidadCard, PageHero],
  templateUrl: './institucion-perfil.html',
  styleUrl: './institucion-perfil.scss',
})
export class InstitucionPerfil implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly estadoServicio = inject(BackendEstadoService);
  private readonly api = inject(ExploracionApiService);

  readonly estado = signal<EstadoPerfil>(
    this.estadoServicio.estado('instituciones').disponible
      ? 'cargando'
      : 'servicio-no-disponible',
  );
  readonly institucion = signal<InstitucionDetalle | null>(null);

  ngOnInit(): void {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.estado.set('no-encontrada');
      return;
    }
    this.api.obtenerInstitucion(id).subscribe({
      next: (institucion) => {
        this.institucion.set(institucion);
        this.estado.set('datos');
      },
      error: (error) => {
        const codigo = error?.error?.error?.codigo ?? error?.error?.detail?.codigo;
        this.estado.set(codigo === 'RECURSO_NO_PUBLICO' ? 'no-encontrada' : 'error');
      },
    });
  }

  horariosDelPunto(puntoId: number): readonly { readonly dia: string; readonly horas: string }[] {
    return (this.institucion()?.horarios ?? [])
      .filter((horario) => horario.punto_id === puntoId)
      .map((horario) => ({
        dia: this.diaTexto(horario.dia_semana),
        horas: `${this.horaTexto(horario.hora_apertura)} – ${this.horaTexto(horario.hora_cierre)}`,
      }));
  }

  fechaTexto(valor: string | null): string {
    if (!valor) return 'Sin fecha registrada';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Sin fecha registrada';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(fecha);
  }

  private diaTexto(dia: number): string {
    const nombres = [
      '',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ];
    return nombres[dia] ?? `Día ${dia}`;
  }

  private horaTexto(valor: string): string {
    return valor.slice(0, 5);
  }
}
