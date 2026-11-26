import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';

describe('Navbar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('abre y cierra el menú móvil', () => {
    const fixture = TestBed.createComponent(Navbar);
    const navbar = fixture.componentInstance;

    expect(navbar.menuOpen()).toBeFalsy();
    navbar.toggleMenu();
    expect(navbar.menuOpen()).toBeTruthy();
    navbar.closeMenu();
    expect(navbar.menuOpen()).toBeFalsy();
  });

  it('enlaza únicamente páginas públicas implementadas', () => {
    const fixture = TestBed.createComponent(Navbar);
    const rutas = fixture.componentInstance.links.map((link) => link.route);

    expect(rutas).toEqual([
      '/',
      '/necesidades',
      '/instituciones',
      '/como-donar',
      '/mensajes',
    ]);
  });
});
