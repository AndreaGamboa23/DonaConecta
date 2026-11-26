import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MobileTabbar } from './mobile-tabbar';

describe('MobileTabbar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileTabbar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra cinco accesos reales y sin contadores falsos', () => {
    const fixture = TestBed.createComponent(MobileTabbar);
    const rutas = fixture.componentInstance.items.map((item) => item.route);

    expect(rutas).toEqual(['/', '/necesidades', '/mis-donaciones', '/mensajes', '/perfil']);
    expect((fixture.nativeElement as HTMLElement).querySelector('.badge')).toBeNull();
  });
});
