import { TestBed } from '@angular/core/testing';
import { PanelConversacion } from './panel-conversacion';

describe('PanelConversacion', () => {
  it('identifica al remitente real y deriva el estado de lectura del backend', async () => {
    await TestBed.configureTestingModule({ imports: [PanelConversacion] }).compileComponents();
    const fixture = TestBed.createComponent(PanelConversacion);
    fixture.componentRef.setInput('usuarioId', 9);
    fixture.componentRef.setInput('ultimoLeidoId', 12);
    await fixture.whenStable();
    const componente = fixture.componentInstance;

    expect(componente.esMio({ remitente_usuario_id: 9, contenido: 'Hola' })).toBe(true);
    expect(componente.esMio({ remitente_usuario_id: 10, contenido: 'Hola' })).toBe(false);
    expect(
      componente.estadoLectura({ mensaje_id: 12, mensajeId: 12, contenido: 'Hola' }),
    ).toBe('Visto');
    expect(
      componente.estadoLectura({ mensaje_id: 13, mensajeId: 13, contenido: 'Hola' }),
    ).toBe('Enviado');
  });

  it('impide el submit nativo y sólo limpia el borrador cuando se confirma', async () => {
    await TestBed.configureTestingModule({ imports: [PanelConversacion] }).compileComponents();
    const fixture = TestBed.createComponent(PanelConversacion);
    await fixture.whenStable();
    const componente = fixture.componentInstance;
    const evento = new Event('submit', { cancelable: true });
    let enviado: { texto: string; limpiar: () => void } | null = null;
    componente.enviarMensaje.subscribe((valor) => (enviado = valor));

    componente.contenido.setValue('  Mensaje de prueba  ');
    componente.enviar(evento);

    expect(evento.defaultPrevented).toBe(true);
    expect(enviado).not.toBeNull();
    expect(enviado!.texto).toBe('Mensaje de prueba');
    expect(componente.contenido.value).toBe('  Mensaje de prueba  ');

    enviado!.limpiar();
    expect(componente.contenido.value).toBe('');
  });
});
