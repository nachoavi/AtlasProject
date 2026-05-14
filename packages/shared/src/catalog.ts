/**
 * Catálogo público de productos Atlas — fuente única para landing y marketing.
 * Refleja los datos seedeados en apps/api/prisma/seed.ts (§3.1 del plan).
 */

import { PLAN_CODES, SESSION_PACK_CODES, WORKSHOP_CODES } from './constants.js';

export type PlanInfo = {
  code: string;
  name: string;
  shortName: string;
  priceClp: number;
  daysPerWeek: number;
  workshopDiscountPct: number;
  eventDiscountPct: number;
  segment: 'general' | 'estudiante';
  badge?: string;
  perks: string[];
};

export const PLANS_CATALOG: readonly PlanInfo[] = [
  {
    code: PLAN_CODES.ATLAS_INICIAL,
    name: 'Atlas Inicial',
    shortName: 'Inicial',
    priceClp: 43_000,
    daysPerWeek: 2,
    workshopDiscountPct: 10,
    eventDiscountPct: 0,
    segment: 'general',
    perks: [
      'Acceso a todas las zonas, 2 veces por semana',
      'Evaluación física inicial gratuita',
      'Semi-asistencia en sala',
      '10% de descuento en clases dirigidas',
    ],
  },
  {
    code: PLAN_CODES.ATLAS_AVANZADO,
    name: 'Atlas Avanzado',
    shortName: 'Avanzado',
    priceClp: 53_000,
    daysPerWeek: 3,
    workshopDiscountPct: 15,
    eventDiscountPct: 0,
    segment: 'general',
    perks: [
      'Acceso a todas las zonas, 3 veces por semana',
      'Evaluación física inicial gratuita',
      'Semi-asistencia en sala',
      '15% de descuento en clases dirigidas',
    ],
  },
  {
    code: PLAN_CODES.ATLAS_ASCENSO,
    name: 'Atlas Ascenso',
    shortName: 'Ascenso',
    priceClp: 59_500,
    daysPerWeek: 4,
    workshopDiscountPct: 15,
    eventDiscountPct: 0,
    segment: 'general',
    badge: 'Más elegido',
    perks: [
      'Acceso a todas las zonas, 4 veces por semana',
      'Evaluación física inicial gratuita',
      'Semi-asistencia en sala',
      '15% de descuento en clases dirigidas',
    ],
  },
  {
    code: PLAN_CODES.ATLAS_ELITE,
    name: 'Atlas Élite',
    shortName: 'Élite',
    priceClp: 65_000,
    daysPerWeek: 6,
    workshopDiscountPct: 20,
    eventDiscountPct: 20,
    segment: 'general',
    badge: 'Premium',
    perks: [
      'Acceso a todas las zonas, 6 veces por semana',
      'Evaluación física inicial gratuita',
      'Evaluación kinesiológica o nutricional gratuita',
      '20% de descuento en clases dirigidas',
      '20% de descuento en eventos especiales',
    ],
  },
  {
    code: PLAN_CODES.FORMACION_2D,
    name: 'Atlas En Formación · 2 días',
    shortName: 'En Formación 2d',
    priceClp: 35_000,
    daysPerWeek: 2,
    workshopDiscountPct: 5,
    eventDiscountPct: 0,
    segment: 'estudiante',
    perks: [
      'Plan para estudiantes y universitarios',
      'Acceso 2 veces por semana',
      'Evaluación física inicial gratuita',
      '5% de descuento en clases dirigidas',
    ],
  },
  {
    code: PLAN_CODES.FORMACION_3D,
    name: 'Atlas En Formación · 3 días',
    shortName: 'En Formación 3d',
    priceClp: 42_000,
    daysPerWeek: 3,
    workshopDiscountPct: 5,
    eventDiscountPct: 0,
    segment: 'estudiante',
    perks: [
      'Plan para estudiantes y universitarios',
      'Acceso 3 veces por semana',
      'Evaluación física inicial gratuita',
      '5% de descuento en clases dirigidas',
    ],
  },
  {
    code: PLAN_CODES.FORMACION_6D,
    name: 'Atlas En Formación · 6 días',
    shortName: 'En Formación 6d',
    priceClp: 49_000,
    daysPerWeek: 6,
    workshopDiscountPct: 5,
    eventDiscountPct: 0,
    segment: 'estudiante',
    perks: [
      'Plan para estudiantes y universitarios',
      'Acceso 6 veces por semana',
      'Evaluación nutricional o kinesiológica inicial gratuita',
      '5% de descuento en clases dirigidas',
    ],
  },
] as const;

export type SessionPackInfo = {
  code: string;
  variant: 'LEGION' | 'TRANSFORMA';
  sessionsTotal: number;
  priceClp: number;
};

export const SESSION_PACKS_CATALOG: readonly SessionPackInfo[] = [
  { code: SESSION_PACK_CODES.LEGION_4, variant: 'LEGION', sessionsTotal: 4, priceClp: 35_000 },
  { code: SESSION_PACK_CODES.LEGION_8, variant: 'LEGION', sessionsTotal: 8, priceClp: 60_000 },
  { code: SESSION_PACK_CODES.LEGION_12, variant: 'LEGION', sessionsTotal: 12, priceClp: 80_000 },
  { code: SESSION_PACK_CODES.LEGION_16, variant: 'LEGION', sessionsTotal: 16, priceClp: 100_000 },
  { code: SESSION_PACK_CODES.TRANSFORMA_4, variant: 'TRANSFORMA', sessionsTotal: 4, priceClp: 55_000 },
  { code: SESSION_PACK_CODES.TRANSFORMA_8, variant: 'TRANSFORMA', sessionsTotal: 8, priceClp: 95_000 },
  { code: SESSION_PACK_CODES.TRANSFORMA_12, variant: 'TRANSFORMA', sessionsTotal: 12, priceClp: 130_000 },
  { code: SESSION_PACK_CODES.TRANSFORMA_16, variant: 'TRANSFORMA', sessionsTotal: 16, priceClp: 160_000 },
] as const;

export const LEGION_PERKS = [
  'Planificación de entrenamiento por objetivos',
  'Grupos de 2 a 3 personas',
  'Evaluación nutricional o kinesiológica inicial gratuita',
  '10% de descuento en clases dirigidas y eventos',
];

export const TRANSFORMA_PERKS = [
  'Sesiones personalizadas 1:1 de 1 hora',
  'Planificación de entrenamiento por objetivos',
  'Evaluación nutricional o kinesiológica inicial gratuita',
  '10% de descuento en clases dirigidas y eventos',
];

export type WorkshopInfo = {
  code: string;
  name: string;
  description: string;
  durationLabel: string;
};

export const WORKSHOPS_CATALOG: readonly WorkshopInfo[] = [
  {
    code: WORKSHOP_CODES.CALISTENIA,
    name: 'Calistenia',
    description: 'Domina tu peso corporal con instructor especializado.',
    durationLabel: '60 min',
  },
  {
    code: WORKSHOP_CODES.ESCALADA,
    name: 'Escalada',
    description: 'Técnica y progresión en muro, todos los niveles.',
    durationLabel: '90 min',
  },
] as const;

export const HEALTH_SERVICES = [
  {
    code: 'KINESIOLOGIA',
    name: 'Kinesiología',
    description: 'Recuperación, prevención y mejora del rendimiento físico.',
  },
  {
    code: 'PODOLOGIA',
    name: 'Podología',
    description: 'Cuidado integral del pie deportivo.',
  },
  {
    code: 'NUTRICION',
    name: 'Nutrición',
    description: 'Planes alimenticios ajustados a tus objetivos de entrenamiento.',
  },
] as const;

export const TRAINING_ZONES = [
  { code: 'GYM', label: 'Sala de pesas' },
  { code: 'CALISTENIA', label: 'Calistenia' },
  { code: 'ESCALADA', label: 'Muro de escalada' },
  { code: 'HIIT', label: 'Zona HIIT' },
  { code: 'TIRO_ARCO', label: 'Tiro al arco' },
] as const;

export const FACILITY_AMENITIES = [
  { code: 'SHOWERS', label: 'Duchas' },
  { code: 'LOCKERS', label: 'Lockers' },
  { code: 'PARKING', label: 'Parking de autos' },
  { code: 'BREAK_ROOM', label: 'Break room' },
] as const;
