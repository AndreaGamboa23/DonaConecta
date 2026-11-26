import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Historias } from './historias';

describe('Historias', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Historias],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra las ilustraciones y los accesos reales', async () => {
    const fixture = TestBed.createComponent(Historias);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('h1').length).toBe(1);
    expect(root.querySelector('img[src="/assets/images/experiencias-solidarias.webp"]')).not.toBeNull();
    expect(root.querySelector('img[src="/assets/images/comunidad-solidaria.webp"]')).not.toBeNull();
    expect(root.querySelector('a[href="/necesidades"]')).not.toBeNull();
    expect(root.querySelector('a[href="/como-donar"]')).not.toBeNull();
    expect(root.querySelector('form')).toBeNull();
  });
});
