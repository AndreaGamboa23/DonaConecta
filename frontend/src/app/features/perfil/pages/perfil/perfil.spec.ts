import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SesionService } from '../../../../core/services/sesion.service';
import { Perfil } from './perfil';

const PERFIL = {
  id_usuario: 7,
  nombres: 'Ana',
  apellidos: 'Pérez',
  correo: 'ana@ejemplo.com',
  roles: ['DONANTE'],
  estado_cuenta: 'ACTIVO',
  fecha_registro: '2026-11-26T10:00:00',
  email_verificado_en: null,
  ultimo_acceso_en: null,
  foto_url: null,
  telefono_enmascarado: '•••• 4321',
  telefono_guardado: true,
  donante: {
    distrito_id: 13,
    distrito: 'Huancayo',
    preferencia_notificacion: 'IMPORTANTES' as const,
    consentimiento_datos: true,
    acepta_terminos: true,
    fecha_registro: '2026-11-26T10:00:00',
  },
  institucion: null,
};

describe('Perfil', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(SesionService).iniciar('token-real', {
      id_usuario: 7,
      nombres: 'Ana',
      apellidos: 'Pérez',
      correo: 'ana@ejemplo.com',
      roles: ['DONANTE'],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function crearComponente(): { fixture: ComponentFixture<Perfil>; componente: Perfil } {
    const fixture = TestBed.createComponent(Perfil);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/usuarios/me').flush(PERFIL);
    http.expectOne('/api/v1/usuarios/me/actividad').flush({
      compromisos: 0,
      entregas: 0,
      recepciones: 0,
      conversaciones: 0,
      historial: 1,
    });
    fixture.detectChanges();
    return { fixture, componente: fixture.componentInstance };
  }

  it('muestra identidad, pestañas y actividad real sin IDs protagonistas', () => {
    const { fixture } = crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('h1')?.textContent).toContain('Tu perfil, tus conexiones');
    expect(raiz.querySelector('.dc-avatar')?.textContent?.trim()).toBe('AP');
    expect(raiz.textContent).toContain('Información personal');
    expect(raiz.textContent).toContain('Actividad');
    expect(raiz.textContent).toContain('Preferencias');
    expect(raiz.textContent).toContain('Seguridad y privacidad');
    expect(raiz.textContent).toContain('•••• 4321');

    (fixture.componentInstance as Perfil).seleccionar('actividad');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Explorar necesidades');
  });

  it('sincroniza navbar y sesión después de guardar con PUT', () => {
    const { componente } = crearComponente();
    const sesion = TestBed.inject(SesionService);
    const http = TestBed.inject(HttpTestingController);

    componente.alternarEdicion();
    componente.formPerfil.patchValue({ nombres: 'Ana María', telefono: '998877665' });
    componente.guardarPerfil();

    const peticion = http.expectOne('/api/v1/usuarios/me');
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({
      nombres: 'Ana María',
      apellidos: 'Pérez',
      telefono: '998877665',
      distritoId: 13,
      preferenciaNotificacion: 'IMPORTANTES',
    });
    peticion.flush({ ...PERFIL, nombres: 'Ana María', telefono_enmascarado: '•••• 7665' });

    expect(sesion.nombreCompleto()).toBe('Ana María Pérez');
    expect(componente.perfil()?.nombres).toBe('Ana María');
    expect(componente.aviso()).toContain('guardaron correctamente');
  });

  it('envía PATCH parcial para cambiar solo la preferencia', () => {
    const { componente } = crearComponente();
    const http = TestBed.inject(HttpTestingController);

    componente.seleccionar('preferencias');
    componente.formPreferencias.patchValue({ preferenciaNotificacion: 'NINGUNA' });
    componente.guardarPreferencias();

    const peticion = http.expectOne('/api/v1/usuarios/me');
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ preferenciaNotificacion: 'NINGUNA' });
    peticion.flush({ ...PERFIL, donante: { ...PERFIL.donante!, preferencia_notificacion: 'NINGUNA' } });
    expect(componente.perfil()?.donante?.preferencia_notificacion).toBe('NINGUNA');
  });
});
