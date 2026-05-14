export const CENTER_TIMEZONE = 'America/Santiago';
export const CENTER_LOCALE = 'es-CL';

export const CENTER_INFO = {
  name: 'Atlas Training Center',
  address: 'Angamos 338, La Unión, Región de los Ríos, Chile',
  comuna: 'La Unión',
  region: 'Los Ríos',
  country: 'CL',
  instagram: '@atlas.trainingcenter',
} as const;

export const PLAN_CODES = {
  ATLAS_INICIAL: 'ATLAS_INICIAL',
  ATLAS_AVANZADO: 'ATLAS_AVANZADO',
  ATLAS_ASCENSO: 'ATLAS_ASCENSO',
  ATLAS_ELITE: 'ATLAS_ELITE',
  FORMACION_2D: 'FORMACION_2D',
  FORMACION_3D: 'FORMACION_3D',
  FORMACION_6D: 'FORMACION_6D',
} as const;

export const SESSION_PACK_CODES = {
  LEGION_4: 'LEGION_4',
  LEGION_8: 'LEGION_8',
  LEGION_12: 'LEGION_12',
  LEGION_16: 'LEGION_16',
  TRANSFORMA_4: 'TRANSFORMA_4',
  TRANSFORMA_8: 'TRANSFORMA_8',
  TRANSFORMA_12: 'TRANSFORMA_12',
  TRANSFORMA_16: 'TRANSFORMA_16',
} as const;

export const WORKSHOP_CODES = {
  CALISTENIA: 'CALISTENIA',
  ESCALADA: 'ESCALADA',
} as const;

export const SESSION_PACK_VALIDITY_DAYS = 90;
export const CANCELATION_WINDOW_HOURS = 12;
export const QR_CHECKIN_TTL_SECONDS = 30;
export const STREAK_CACHE_TTL_SECONDS = 600;

export const ROLES = {
  GUEST: 'guest',
  MEMBER: 'member',
  TRAINER: 'trainer',
  PROFESSIONAL: 'professional',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
