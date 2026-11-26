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
    const navbar = fixture.componentInstance;

    expect(navbar.links.map((link) => link.route)).toEqual([
      '/',
      '/explorar',
      '/instituciones',
    ]);
    expect(navbar.personalLink.route).toBe('/mensajes');
    expect(navbar.secondaryLinks.map((link) => link.route)).toEqual([
      '/puntos-de-acopio',
      '/mis-donaciones',
      '/como-donar',
      '/historias',
      '/nosotros',
      '/preguntas-frecuentes',
    ]);
  });

  it('abre y cierra el menú Más por interacción, Escape y selección', () => {
    const navbar = TestBed.createComponent(Navbar).componentInstance;

    expect(navbar.masAbierto()).toBeFalsy();
    navbar.toggleMas();
    expect(navbar.masAbierto()).toBeTruthy();
    navbar.alEscape();
    expect(navbar.masAbierto()).toBeFalsy();
    navbar.toggleMas();
    navbar.seleccionarMas();
    expect(navbar.masAbierto()).toBeFalsy();
  });
});
