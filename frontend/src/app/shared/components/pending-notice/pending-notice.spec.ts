import { TestBed } from '@angular/core/testing';
import { EstadoServicio } from '../../../core/interfaces/dona-conecta';
import { PendingNotice } from './pending-notice';

describe('PendingNotice', () => {
  it('informa el estado sin exponer endpoints ni tecnología al visitante', async () => {
    await TestBed.configureTestingModule({ imports: [PendingNotice] }).compileComponents();

    const fixture = TestBed.createComponent(PendingNotice);
    const estado: EstadoServicio = {
      disponible: false,
      endpoint: '/api/v1/mensajes',
      mensaje: 'El servicio no está disponible en este momento.',
    };
    fixture.componentRef.setInput('estado', estado);
    fixture.componentRef.setInput('titulo', 'Acceso no disponible');
    await fixture.whenStable();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Acceso no disponible');
    expect(texto).toContain('Sin conexión');
    expect(texto).not.toContain('/api/v1');
    expect(texto).not.toContain('FastAPI');
  });
});
