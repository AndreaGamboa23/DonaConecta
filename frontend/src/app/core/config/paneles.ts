export interface EnlacePanel {
  readonly etiqueta: string;
  readonly ruta: string;
  readonly icono: string;
  readonly exacto?: boolean;
}

export const ENLACES_ADMIN: readonly EnlacePanel[] = [
  { etiqueta: 'Resumen', ruta: '/admin', icono: 'spark', exacto: true },
  { etiqueta: 'Instituciones', ruta: '/admin/instituciones', icono: 'building' },
  { etiqueta: 'Usuarios', ruta: '/admin/usuarios', icono: 'people' },
  { etiqueta: 'Auditoría', ruta: '/admin/auditoria', icono: 'shield' },
];

export const ENLACES_INSTITUCION: readonly EnlacePanel[] = [
  { etiqueta: 'Resumen', ruta: '/institucional', icono: 'spark', exacto: true },
  { etiqueta: 'Mi institución', ruta: '/institucional/perfil', icono: 'building' },
  { etiqueta: 'Verificación', ruta: '/institucional/verificacion', icono: 'shield' },
  { etiqueta: 'Necesidades', ruta: '/institucional/necesidades', icono: 'box' },
];
