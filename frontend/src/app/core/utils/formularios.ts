import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Validadores y helpers compartidos por los formularios públicos. */

export function contraseniasCoinciden(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmacion = control.get('confirmacion')?.value;
  return password === confirmacion ? null : { noCoinciden: true };
}

export function telefonoPeruano(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '').trim();
  return !valor || /^9\d{8}$/.test(valor) ? null : { telefono: true };
}

/** Indicador orientativo del navegador; nunca sustituye la validación del backend. */
export function resolverFuerzaPassword(valor: string): number {
  if (!valor) return 0;
  let puntos = 0;
  if (valor.length >= 8) puntos++;
  if (valor.length >= 12) puntos++;
  if (/[a-z]/.test(valor) && /[A-Z]/.test(valor)) puntos++;
  if (/\d/.test(valor)) puntos++;
  if (/[^A-Za-z0-9]/.test(valor)) puntos++;
  return Math.min(4, puntos);
}

export function etiquetaFuerzaPassword(puntos: number): string {
  if (puntos === 0) return 'Sin evaluar';
  if (puntos === 1) return 'Baja';
  if (puntos === 2) return 'Regular';
  if (puntos === 3) return 'Buena';
  return 'Fuerte';
}
