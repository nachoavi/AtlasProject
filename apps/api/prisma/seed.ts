import { PrismaClient, PlanSegment, SessionPackVariant, ServiceType, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =====================================================
// PLANES MENSUALES — fuente: plan §3.1
// =====================================================
const PLANS = [
  {
    code: 'ATLAS_INICIAL',
    name: 'Atlas Inicial',
    priceClp: 43_000,
    daysPerWeek: 2,
    workshopDiscountPct: 10,
    eventDiscountPct: 0,
    segment: PlanSegment.GENERAL,
    displayOrder: 1,
    perks: [
      'Acceso a todas las zonas de entrenamiento 2 veces por semana',
      'Evaluación física inicial gratuita',
      'Semi-asistencia en sala',
      '10% de descuento en clases dirigidas',
    ],
  },
  {
    code: 'ATLAS_AVANZADO',
    name: 'Atlas Avanzado',
    priceClp: 53_000,
    daysPerWeek: 3,
    workshopDiscountPct: 15,
    eventDiscountPct: 0,
    segment: PlanSegment.GENERAL,
    displayOrder: 2,
    perks: [
      'Acceso a todas las zonas de entrenamiento 3 veces por semana',
      'Evaluación física inicial gratuita',
      'Semi-asistencia en sala',
      '15% de descuento en clases dirigidas',
    ],
  },
  {
    code: 'ATLAS_ASCENSO',
    name: 'Atlas Ascenso',
    priceClp: 59_500,
    daysPerWeek: 4,
    workshopDiscountPct: 15,
    eventDiscountPct: 0,
    segment: PlanSegment.GENERAL,
    displayOrder: 3,
    perks: [
      'Acceso a todas las zonas de entrenamiento 4 veces por semana',
      'Evaluación física inicial gratuita',
      'Semi-asistencia en sala',
      '15% de descuento en clases dirigidas',
    ],
  },
  {
    code: 'ATLAS_ELITE',
    name: 'Atlas Élite',
    priceClp: 65_000,
    daysPerWeek: 6,
    workshopDiscountPct: 20,
    eventDiscountPct: 20,
    segment: PlanSegment.GENERAL,
    displayOrder: 4,
    perks: [
      'Acceso a todas las zonas de entrenamiento 6 veces por semana',
      'Evaluación física inicial gratuita',
      'Evaluación kinesiológica o nutricional gratuita',
      'Semi-asistencia en sala',
      '20% de descuento en clases dirigidas',
      '20% de descuento en eventos especiales',
    ],
  },
  {
    code: 'FORMACION_2D',
    name: 'Atlas En Formación · 2 días',
    priceClp: 35_000,
    daysPerWeek: 2,
    workshopDiscountPct: 5,
    eventDiscountPct: 0,
    segment: PlanSegment.ESTUDIANTE,
    displayOrder: 5,
    perks: [
      'Acceso a todas las zonas de entrenamiento 2 veces por semana',
      'Evaluación física inicial gratuita',
      'Semi-asistencia en sala',
      '5% de descuento en clases dirigidas',
    ],
  },
  {
    code: 'FORMACION_3D',
    name: 'Atlas En Formación · 3 días',
    priceClp: 42_000,
    daysPerWeek: 3,
    workshopDiscountPct: 5,
    eventDiscountPct: 0,
    segment: PlanSegment.ESTUDIANTE,
    displayOrder: 6,
    perks: [
      'Acceso a todas las zonas de entrenamiento 3 veces por semana',
      'Evaluación física inicial gratuita',
      'Semi-asistencia en sala',
      '5% de descuento en clases dirigidas',
    ],
  },
  {
    code: 'FORMACION_6D',
    name: 'Atlas En Formación · 6 días',
    priceClp: 49_000,
    daysPerWeek: 6,
    workshopDiscountPct: 5,
    eventDiscountPct: 0,
    segment: PlanSegment.ESTUDIANTE,
    displayOrder: 7,
    perks: [
      'Acceso a todas las zonas de entrenamiento 6 veces por semana',
      'Evaluación física inicial gratuita',
      'Evaluación nutricional o kinesiológica inicial gratuita',
      'Semi-asistencia en sala',
      '5% de descuento en clases dirigidas',
    ],
  },
] as const;

// =====================================================
// SESSION PACKS — Atlas Legión y Atlas Transforma
// =====================================================
const LEGION_PERKS = [
  'Planificación de entrenamiento por objetivos',
  'Grupos de 2 a 3 personas',
  'Evaluación nutricional o kinesiológica inicial gratuita',
  '10% de descuento en clases dirigidas y eventos especiales',
];

const TRANSFORMA_PERKS = [
  'Sesiones personalizadas 1:1 de 1 hora',
  'Planificación de entrenamiento por objetivos',
  'Evaluación nutricional o kinesiológica inicial gratuita',
  '10% de descuento en clases dirigidas y eventos especiales',
];

const SESSION_PACKS = [
  { code: 'LEGION_4', sessionsTotal: 4, priceClp: 35_000, displayOrder: 1 },
  { code: 'LEGION_8', sessionsTotal: 8, priceClp: 60_000, displayOrder: 2 },
  { code: 'LEGION_12', sessionsTotal: 12, priceClp: 80_000, displayOrder: 3 },
  { code: 'LEGION_16', sessionsTotal: 16, priceClp: 100_000, displayOrder: 4 },
].map((p) => ({
  ...p,
  name: `Atlas Legión — ${p.sessionsTotal} sesiones`,
  variant: SessionPackVariant.LEGION,
  groupSizeMin: 2,
  groupSizeMax: 3,
  perks: LEGION_PERKS,
}));

const TRANSFORMA_PACKS = [
  { code: 'TRANSFORMA_4', sessionsTotal: 4, priceClp: 55_000, displayOrder: 5 },
  { code: 'TRANSFORMA_8', sessionsTotal: 8, priceClp: 95_000, displayOrder: 6 },
  { code: 'TRANSFORMA_12', sessionsTotal: 12, priceClp: 130_000, displayOrder: 7 },
  { code: 'TRANSFORMA_16', sessionsTotal: 16, priceClp: 160_000, displayOrder: 8 },
].map((p) => ({
  ...p,
  name: `Atlas Transforma — ${p.sessionsTotal} sesiones`,
  variant: SessionPackVariant.TRANSFORMA,
  groupSizeMin: 1,
  groupSizeMax: 1,
  perks: TRANSFORMA_PERKS,
}));

// =====================================================
// TALLERES (clases dirigidas v1)
// =====================================================
const WORKSHOPS = [
  {
    code: 'CALISTENIA',
    name: 'Taller de Calistenia',
    description: 'Entrenamiento de peso corporal con instructor especializado.',
    defaultDurationMin: 60,
    basePriceClp: 8_000,
    displayOrder: 1,
  },
  {
    code: 'ESCALADA',
    name: 'Taller de Escalada',
    description: 'Técnica y progresión en muro de escalada.',
    defaultDurationMin: 90,
    basePriceClp: 12_000,
    displayOrder: 2,
  },
];

// =====================================================
// HORARIOS DE OPERACIÓN — La Unión
// =====================================================
const OPERATING_HOURS = [
  // Lunes a viernes (1..5)
  ...[1, 2, 3, 4, 5].flatMap((w) => [
    { weekday: w, blockStart: '06:00', blockEnd: '13:00', label: 'Mañana' },
    { weekday: w, blockStart: '15:00', blockEnd: '22:30', label: 'Tarde' },
  ]),
  // Sábado
  { weekday: 6, blockStart: '08:00', blockEnd: '13:00', label: 'Mañana' },
  { weekday: 6, blockStart: '15:00', blockEnd: '22:00', label: 'Tarde' },
];

// =====================================================
// BADGES INICIALES
// =====================================================
const BADGES = [
  {
    code: 'FIRST_CHECKIN',
    name: 'Primer entrenamiento',
    description: 'Marcaste tu primera entrada al centro.',
    criteria: { type: 'checkins', threshold: 1 },
  },
  {
    code: 'STREAK_7',
    name: 'Racha de 7 días',
    description: 'Entrenaste 7 días seguidos.',
    criteria: { type: 'streak', threshold: 7 },
  },
  {
    code: 'STREAK_30',
    name: 'Racha de 30 días',
    description: 'Un mes entero sin perder un día.',
    criteria: { type: 'streak', threshold: 30 },
  },
  {
    code: 'FIRST_MONTH',
    name: 'Primer mes',
    description: 'Completaste tu primer mes en Atlas.',
    criteria: { type: 'membership_months', threshold: 1 },
  },
  {
    code: 'FIRST_WORKSHOP',
    name: 'Primer taller',
    description: 'Asististe a tu primer taller dirigido.',
    criteria: { type: 'workshops_attended', threshold: 1 },
  },
  {
    code: 'CLIMBER',
    name: 'Escalador',
    description: 'Asististe a 5 talleres de escalada.',
    criteria: { type: 'workshop_count', workshopCode: 'ESCALADA', threshold: 5 },
  },
];

async function main() {
  console.log('🌱 Seeding Atlas database...');

  // Planes
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: plan,
    });
  }
  console.log(`  ✓ ${PLANS.length} planes`);

  // Session packs
  const allPacks = [...SESSION_PACKS, ...TRANSFORMA_PACKS];
  for (const pack of allPacks) {
    await prisma.sessionPack.upsert({
      where: { code: pack.code },
      create: pack,
      update: pack,
    });
  }
  console.log(`  ✓ ${allPacks.length} session packs`);

  // Talleres
  for (const w of WORKSHOPS) {
    await prisma.workshop.upsert({
      where: { code: w.code },
      create: w,
      update: w,
    });
  }
  console.log(`  ✓ ${WORKSHOPS.length} talleres`);

  // Horarios
  await prisma.operatingHours.deleteMany();
  await prisma.operatingHours.createMany({ data: OPERATING_HOURS });
  console.log(`  ✓ ${OPERATING_HOURS.length} bloques horarios`);

  // Badges
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { code: b.code },
      create: b,
      update: b,
    });
  }
  console.log(`  ✓ ${BADGES.length} badges`);

  // ServiceTypes ya están en enum — no requieren seed
  // Pero podemos seedear profesionales placeholders si admin lo requiere después
  console.log(
    `  ℹ ServiceTypes disponibles: ${Object.values(ServiceType).join(', ')} (se asignan via Professional)`,
  );

  // Usuario STAFF para que recepción pueda hacer login en /staff
  const staffEmail = 'recepcion@atlas.local';
  const staffPassword = 'AtlasRecepcion2026';
  const staffHash = await bcrypt.hash(staffPassword, 12);
  await prisma.user.upsert({
    where: { email: staffEmail },
    create: {
      email: staffEmail,
      passwordHash: staffHash,
      fullName: 'Recepción Atlas',
      role: UserRole.STAFF,
      profile: { create: {} },
    },
    update: { passwordHash: staffHash, role: UserRole.STAFF },
  });
  console.log(`  ✓ Usuario STAFF: ${staffEmail} / ${staffPassword}`);

  // Profesionales con disponibilidad semanal
  const professionalsSeed = [
    {
      email: 'kine@atlas.local',
      password: 'AtlasKine2026',
      fullName: 'Dra. Camila Soto',
      bio: 'Kinesióloga, especialidad en deporte y rehabilitación.',
      service: ServiceType.KINESIOLOGIA,
      slots: [
        ...[1, 2, 3, 4, 5].flatMap((w) => [
          { weekday: w, startTime: '10:00', endTime: '13:00' },
          { weekday: w, startTime: '16:00', endTime: '20:00' },
        ]),
      ],
    },
    {
      email: 'podologia@atlas.local',
      password: 'AtlasPodologia2026',
      fullName: 'Pdgo. Rodrigo Vera',
      bio: 'Podología deportiva y biomecánica.',
      service: ServiceType.PODOLOGIA,
      slots: [
        { weekday: 2, startTime: '09:00', endTime: '13:00' },
        { weekday: 3, startTime: '09:00', endTime: '13:00' },
        { weekday: 4, startTime: '09:00', endTime: '13:00' },
        { weekday: 6, startTime: '09:00', endTime: '12:00' },
      ],
    },
    {
      email: 'nutricion@atlas.local',
      password: 'AtlasNutricion2026',
      fullName: 'Nut. Valentina Pérez',
      bio: 'Nutrición clínica y deportiva.',
      service: ServiceType.NUTRICION,
      slots: [
        ...[1, 2, 3, 4, 5].flatMap((w) => [
          { weekday: w, startTime: '11:00', endTime: '13:00' },
          { weekday: w, startTime: '17:00', endTime: '21:00' },
        ]),
      ],
    },
  ];

  for (const p of professionalsSeed) {
    const hash = await bcrypt.hash(p.password, 12);
    const user = await prisma.user.upsert({
      where: { email: p.email },
      create: {
        email: p.email,
        passwordHash: hash,
        fullName: p.fullName,
        role: UserRole.PROFESSIONAL,
        profile: { create: {} },
      },
      update: { passwordHash: hash, role: UserRole.PROFESSIONAL, fullName: p.fullName },
    });
    const prof = await prisma.professional.upsert({
      where: { userId: user.id },
      create: { userId: user.id, serviceType: p.service, bio: p.bio, isActive: true },
      update: { serviceType: p.service, bio: p.bio, isActive: true },
    });
    await prisma.availabilitySlot.deleteMany({ where: { professionalId: prof.id } });
    await prisma.availabilitySlot.createMany({
      data: p.slots.map((s) => ({ ...s, professionalId: prof.id, isActive: true })),
    });
  }
  console.log(`  ✓ ${professionalsSeed.length} profesionales con disponibilidad semanal`);

  // Instructores de talleres (rol TRAINER)
  const instructorsSeed = [
    {
      email: 'instructor.calistenia@atlas.local',
      password: 'AtlasCalistenia2026',
      fullName: 'Coach Matías Rivas',
    },
    {
      email: 'instructor.escalada@atlas.local',
      password: 'AtlasEscalada2026',
      fullName: 'Coach Daniela Lagos',
    },
  ];
  const instructorIds: Record<string, string> = {};
  for (const ins of instructorsSeed) {
    const hash = await bcrypt.hash(ins.password, 12);
    const user = await prisma.user.upsert({
      where: { email: ins.email },
      create: {
        email: ins.email,
        passwordHash: hash,
        fullName: ins.fullName,
        role: UserRole.TRAINER,
        profile: { create: {} },
      },
      update: { passwordHash: hash, role: UserRole.TRAINER, fullName: ins.fullName },
    });
    instructorIds[ins.email] = user.id;
  }
  console.log(`  ✓ ${instructorsSeed.length} instructores de talleres`);

  // Sesiones de talleres — próximos 14 días
  const calistenia = await prisma.workshop.findUnique({ where: { code: 'CALISTENIA' } });
  const escalada = await prisma.workshop.findUnique({ where: { code: 'ESCALADA' } });

  function atDay(daysFromNow: number, hour: number, minute = 0): Date {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  if (calistenia && escalada) {
    await prisma.workshopSession.deleteMany({
      where: { startsAt: { gte: new Date() } },
    });
    const sessions = [
      { workshopId: calistenia.id, instructor: 'instructor.calistenia@atlas.local', startsAt: atDay(2, 19), durationMin: 60, capacity: 12 },
      { workshopId: calistenia.id, instructor: 'instructor.calistenia@atlas.local', startsAt: atDay(5, 19), durationMin: 60, capacity: 12 },
      { workshopId: calistenia.id, instructor: 'instructor.calistenia@atlas.local', startsAt: atDay(9, 18), durationMin: 60, capacity: 12 },
      { workshopId: escalada.id, instructor: 'instructor.escalada@atlas.local', startsAt: atDay(3, 18), durationMin: 90, capacity: 8 },
      { workshopId: escalada.id, instructor: 'instructor.escalada@atlas.local', startsAt: atDay(6, 11), durationMin: 90, capacity: 8 },
      { workshopId: escalada.id, instructor: 'instructor.escalada@atlas.local', startsAt: atDay(10, 18), durationMin: 90, capacity: 8 },
    ];
    await prisma.workshopSession.createMany({
      data: sessions.map((s) => ({
        workshopId: s.workshopId,
        instructorId: instructorIds[s.instructor]!,
        startsAt: s.startsAt,
        durationMin: s.durationMin,
        capacity: s.capacity,
      })),
    });
    console.log(`  ✓ ${sessions.length} sesiones de talleres agendadas`);
  }

  // Eventos especiales
  await prisma.event.deleteMany({ where: { startsAt: { gte: new Date() } } });
  await prisma.event.createMany({
    data: [
      {
        title: 'Atlas Open Day',
        description:
          'Jornada de puertas abiertas: prueba todas las zonas, conoce a los coaches y participa en clases demo gratis.',
        startsAt: atDay(7, 10),
        endsAt: atDay(7, 18),
        capacity: 80,
        priceClp: 0,
        isPublished: true,
      },
      {
        title: 'Competencia interna de Calistenia',
        description:
          'Torneo amistoso de calistenia entre miembros Atlas. Categorías principiante y avanzado, premios para los podios.',
        startsAt: atDay(14, 16),
        endsAt: atDay(14, 20),
        capacity: 40,
        priceClp: 5000,
        isPublished: true,
      },
    ],
  });
  console.log('  ✓ 2 eventos especiales');

  console.log('✨ Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
