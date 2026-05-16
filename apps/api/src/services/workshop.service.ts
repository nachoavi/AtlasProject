import { NotificationType, SubscriptionStatus, UserSessionPackStatus, WorkshopEnrollmentStatus } from '@prisma/client';
import { differenceInMinutes } from 'date-fns';
import { applyDiscount, CANCELATION_WINDOW_HOURS, pickBestDiscount, type DiscountSource } from '@atlas/shared';
import { prisma } from '../lib/prisma.js';

export class WorkshopError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

/**
 * Calcula el mejor descuento aplicable a talleres/eventos para un usuario:
 * el mayor entre el descuento de su suscripción activa y el de sus session packs.
 */
async function bestWorkshopDiscount(userId: string): Promise<number> {
  const [subscription, packs] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE, endsAt: { gte: new Date() } },
      include: { plan: true },
    }),
    prisma.userSessionPack.findMany({
      where: { userId, status: UserSessionPackStatus.ACTIVE, expiresAt: { gte: new Date() } },
      include: { sessionPack: true },
    }),
  ]);

  const sources: DiscountSource[] = [];
  if (subscription) {
    sources.push({
      kind: 'subscription',
      code: subscription.plan.code,
      pct: subscription.plan.workshopDiscountPct,
    });
  }
  for (const p of packs) {
    sources.push({ kind: 'session_pack', code: p.sessionPack.code, pct: 10 });
  }
  return pickBestDiscount(sources)?.pct ?? 0;
}

// =====================================================
// SESIONES DE TALLERES
// =====================================================

export async function listUpcomingWorkshopSessions() {
  return prisma.workshopSession.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    include: {
      workshop: true,
      instructor: { select: { id: true, fullName: true } },
      _count: { select: { enrollments: { where: { status: { not: WorkshopEnrollmentStatus.CANCELLED } } } } },
    },
  });
}

export async function enrollInWorkshop(userId: string, sessionId: string) {
  const session = await prisma.workshopSession.findUnique({
    where: { id: sessionId },
    include: {
      workshop: true,
      enrollments: { where: { status: { not: WorkshopEnrollmentStatus.CANCELLED } } },
    },
  });
  if (!session) throw new WorkshopError('SESSION_NOT_FOUND', 'Sesión no encontrada');
  if (session.startsAt < new Date()) {
    throw new WorkshopError('SESSION_PAST', 'Esta sesión ya ocurrió');
  }
  if (session.enrollments.length >= session.capacity) {
    throw new WorkshopError('SESSION_FULL', 'No quedan cupos para esta sesión');
  }
  const already = session.enrollments.find((e) => e.userId === userId);
  if (already) throw new WorkshopError('ALREADY_ENROLLED', 'Ya estás inscrito en esta sesión');

  const discountPct = await bestWorkshopDiscount(userId);
  const priceChargedClp = applyDiscount(session.workshop.basePriceClp, discountPct);

  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.workshopEnrollment.create({
      data: {
        userId,
        sessionId,
        priceChargedClp,
        status: WorkshopEnrollmentStatus.BOOKED,
      },
      include: {
        session: { include: { workshop: true, instructor: { select: { fullName: true } } } },
      },
    });
    await tx.notification.create({
      data: {
        userId,
        type: NotificationType.GENERIC,
        title: 'Inscrito en taller',
        body: `Te inscribiste en ${session.workshop.name}.`,
        deepLink: '/app/talleres',
      },
    });
    return { enrollment, discountPct };
  });
}

export async function cancelWorkshopEnrollment(userId: string, enrollmentId: string) {
  const enrollment = await prisma.workshopEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { session: true },
  });
  if (!enrollment) throw new WorkshopError('ENROLLMENT_NOT_FOUND', 'Inscripción no encontrada');
  if (enrollment.userId !== userId) throw new WorkshopError('FORBIDDEN', 'No puedes cancelar inscripciones ajenas');
  if (enrollment.status === WorkshopEnrollmentStatus.CANCELLED) {
    throw new WorkshopError('ALREADY_CANCELLED', 'Ya está cancelada');
  }
  const minutesUntil = differenceInMinutes(enrollment.session.startsAt, new Date());
  if (minutesUntil < CANCELATION_WINDOW_HOURS * 60) {
    throw new WorkshopError(
      'CANCELATION_WINDOW_PASSED',
      `Puedes cancelar hasta ${CANCELATION_WINDOW_HOURS}h antes`,
    );
  }
  return prisma.workshopEnrollment.update({
    where: { id: enrollmentId },
    data: { status: WorkshopEnrollmentStatus.CANCELLED },
  });
}

export async function myWorkshopEnrollments(userId: string) {
  return prisma.workshopEnrollment.findMany({
    where: { userId },
    orderBy: { session: { startsAt: 'asc' } },
    include: {
      session: {
        include: { workshop: true, instructor: { select: { fullName: true } } },
      },
    },
  });
}

// =====================================================
// STAFF: crear sesión de taller
// =====================================================

export async function createWorkshopSession(input: {
  workshopCode: string;
  instructorId: string;
  startsAt: Date;
  durationMin?: number;
  capacity: number;
}) {
  const workshop = await prisma.workshop.findUnique({ where: { code: input.workshopCode } });
  if (!workshop) throw new WorkshopError('WORKSHOP_NOT_FOUND', 'Taller no encontrado');

  const instructor = await prisma.user.findUnique({ where: { id: input.instructorId } });
  if (!instructor) throw new WorkshopError('INSTRUCTOR_NOT_FOUND', 'Instructor no encontrado');

  return prisma.workshopSession.create({
    data: {
      workshopId: workshop.id,
      instructorId: input.instructorId,
      startsAt: input.startsAt,
      durationMin: input.durationMin ?? workshop.defaultDurationMin,
      capacity: input.capacity,
    },
    include: { workshop: true, instructor: { select: { fullName: true } } },
  });
}

export async function listInstructors() {
  return prisma.user.findMany({
    where: { role: 'TRAINER', deletedAt: null },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: 'asc' },
  });
}
