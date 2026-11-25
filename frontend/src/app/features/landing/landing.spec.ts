import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Landing } from './landing';

describe('Landing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renderiza las secciones públicas principales', async () => {
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;

    expect(html).toContain('id="inicio"');
    expect(html).toContain('id="donar"');
    expect(html).toContain('id="como-funciona"');
    expect(html).toContain('id="nosotros"');
    expect(html).toContain('id="participa"');
  });
});
