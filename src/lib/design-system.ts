export const entities = {
  orchideeNature: {
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryLight: '#EDE9FE',
    accent: '#EC4899',
    accentLight: '#FCE7F3',
    slug: 'orchidee-nature',
  },
  antigravityMom: {
    primary: '#EA580C',
    primaryHover: '#C2410C',
    primaryLight: '#FFF7ED',
    accent: '#F59E0B',
    accentLight: '#FFFBEB',
    slug: 'antigravity-mom',
  },
} as const

export const colors = {
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
  status: {
    success: '#16A34A',
    successLight: '#DCFCE7',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#2563EB',
    infoLight: '#DBEAFE',
  },
} as const

export const typography = {
  fonts: {
    body: "'Inter', system-ui, sans-serif",
    heading: "'Syne', 'Inter', system-ui, sans-serif",
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

export const radii = {
  none: '0px',
  sm: '4px',
  DEFAULT: '4px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
} as const

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const

export type EntityTheme = typeof entities.orchideeNature | typeof entities.antigravityMom

export function getEntityTheme(slug: string): EntityTheme {
  if (slug === 'orchidee-nature') return entities.orchideeNature
  return entities.antigravityMom
}

export const roles = ['super_admin', 'admin', 'manager', 'vendeur', 'caissier', 'readonly'] as const
export type UserRole = typeof roles[number]

export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  manager: 'Manager',
  vendeur: 'Vendeur',
  caissier: 'Caissier',
  readonly: 'Lecture seule',
}
