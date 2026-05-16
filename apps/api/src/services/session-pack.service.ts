import {
  NotificationType,
  SessionRedemptionStatus,
  UserSessionPackStatus,
} from '@prisma/client';
import { addMinutes, differenceInMinutes, isAfter } from 'date-fns';
import { CANCELATION_WINDOW_HOURS, isWithinOperatingHours } from '@atlas/shared';
import { prisma } from '../lib/prisma.js';

export class SessionPackError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

// =====================================================
// PACKS ACTIVOS DEL MIEMBRO
// =====================================================

export async function myActivePacks(userId: string) {
  return prisma.userSessionPack.findMany({
    where: {
      userId,
      status: UserSessionPackStatus.ACTIVE,
      expiresAt: { gte: new Date() },
    },
    orderBy: { expiresAt: 'asc' },
    include: { sessionPack: true },
  });
}

export async function myUpcomingSessions(userId: string) {
  return prisma.sessionPackRedemption.findMany({
    where: {
      userSessionPack: { userId },
      status: SessionRedemptionStatus.SCHEDULED,
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
    include: {
      trainer: { select: { id: true, fullName: true } },
      userSessionPack: { include: { sessionPack: true } },
      participants: true,
    },
  });
}

export async function myPastSessions(userId: string) {
  return prisma.sessionPackRedemption.findMany({
    where: {
      userSessionPack: { userId },
      OR: [
        { status: { not: SessionRedemptionStatus.SCHEDULED } },
        { scheduledAt: { lt: new Date() } },
      ],
    },
    orderBy: { scheduledAt: 'desc' },
    take: 20,
    include: {
      trainer: { select: { id: true, fullName: true } },
      userSessionPack: { include: { sessionPack: true } },
    },
  });
}

// =====================================================
// REDIMIR UNA SESIÓN
// =====================================================

type RedeemInput = {
  scheduledAt: Date;
  trainerId: string;
  /** Acompañantes adicionales (sin contar al dueño del pack). Solo Legión. */
  participants?: Array<{ userId?: string; guestName?: string }>;
};

export async function redeemSession(userId: string, packId: string, input: RedeemInput) {
  const pack = await prisma.userSessionPack.findUnique({
    where: { id: packId },
    include: { sessionPack: true },
  });
  if (!pack) throw new SessionPackError('PACK_NOT_FOUND', 'Pack no encontrado');
  if (pack.userId !== userId) throw new SessionPackError('FORBIDDEN', 'Este pack no es tuyo');
  if (pack.status !== UserSessionPackStatus.ACTIVE) {
    throw new SessionPackError('PACK_INACTIVE', 'El pack ya no está activo');
  }
  if (pack.expiresAt < new Date()) {
    throw new SessionPackError('PACK_EXPIRED', 'El pack está vencido');
  }
  if (pack.sessionsRemaining <= 0) {
    throw new SessionPackError('NO_SESSIONS_LEFT', 'No te quedan sesiones en este pack');
  }

  const durationMin = pack.sessionPack.sessionDurationMin;
  const slotEnd = addMinutes(input.scheduledAt, durationMin);

  if (!isAfter(input.scheduledAt, new Date())) {
    throw new SessionPackError('SLOT_IN_PAST', 'No puedes agendar en el pasado');
  }
  if (!isWithinOperatingHours(input.scheduledAt, slotEnd)) {
    throw new SessionPackError('OUTSIDE_HOURS', 'El horario está fuera del horario del centro');
  }

  const trainer = await prisma.user.findFirst({
    where: { id: input.trainerId, role: 'TRAINER', deletedAt: null },
  });
  if (!trainer) throw new SessionPackError('TRAINER_NOT_FOUND', 'Entrenador no disponible');

  // Validar tamaño de grupo: dueño + acompañantes
  const others = input.participants ?? [];
  const groupSize = 1 + others.length;
  if (groupSize < pack.sessionPack.groupSizeMin || groupSize > pack.sessionPack.groupSizeMax) {
    throw new SessionPackError(
      'INVALID_GROUP_SIZE',
      `Este pack requiere entre ${pack.sessionPack.groupSizeMin} y ${pack.sessionPack.groupSizeMax} personas`,
    );
  }

  // Conflicto: ¿el entrenador ya tiene una sesión a esa hora?
  const trainerConflict = await prisma.sessionPackRedemption.findFirst({
    where: {
      trainerId: input.trainerId,
      status: SessionRedemptionStatus.SCHEDULED,
      scheduledAt: { lt: slotEnd },
    },
  });
  if (trainerConflict) {
    const conflictEnd = addMinutes(trainerConflict.scheduledAt, trainerConflict.durationMin);
    if (conflictEnd > input.scheduledAt) {
      throw new SessionPackError('TRAINER_BUSY', 'El entrenador ya tiene una sesión a esa hora');
    }
  }

  return prisma.$transaction(async (tx) => {
    const redemption = await tx.sessionPackRedemption.create({
      data: {
        userSessionPackId: pack.id,
        trainerId: input.trainerId,
        scheduledAt: input.scheduledAt,
        durationMin,
        status: SessionRedemptionStatus.SCHEDULED,
        participants: {
          create: [
            { userId }, // dueño del pack
            ...others.map((p) => ({ userId: p.userId, guestName: p.guestName })),
          ],
        },
      },
      include: {
        trainer: { select: { fullName: true } },
        participants: true,
      },
    });

    const remaining = pack.sessionsRemaining - 1;
    await tx.userSessionPack.update({
      where: { id: pack.id },
      data: {
        sessionsRemaining: remaining,
        status: remaining <= 0 ? UserSessionPackStatus.EXHAUSTED : UserSessionPackStatus.ACTIVE,
      },
    });

    await tx.notification.create({
      data: {
        userId,
        type: NotificationType.SESSION_REMINDER,
        title: 'Sesión agendada',
        body: `Tu sesión con ${redemption.trainer.fullName} quedó agendada.`,
        deepLink: '/app/sesiones',
      },
    });

    return { redemption, sessionsRemaining: remaining };
  });
}

// =====================================================
// CANCELAR UNA SESIÓN (devuelve la sesión al pack)
// =====================================================

export async function cancelRedemption(userId: string, redemptionId: string) {
  const redemption = await prisma.sessionPackRedemption.findUnique({
    where: { id: redemptionId },
    include: { userSessionPack: true },
  });
  if (!redemption) throw new SessionPackError('REDEMPTION_NOT_FOUND', 'Sesión no encontrada');
  if (redemption.userSessionPack.userId !== userId) {
    throw new SessionPackError('FORBIDDEN', 'No puedes cancelar sesiones ajenas');
  }
  if (redemption.status !== SessionRedemptionStatus.SCHEDULED) {
    throw new SessionPackError('NOT_CANCELLABLE', 'Esta sesión no se puede cancelar');
  }
  const minutesUntil = differenceInMinutes(redemption.scheduledAt, new Date());
  if (minutesUntil < CANCELATION_WINDOW_HOURS * 60) {
    throw new SessionPackError(
      'CANCELATION_WINDOW_PASSED',
      `Puedes cancelar hasta ${CANCELATION_WINDOW_HOURS}h antes`,
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.sessionPackRedemption.update({
      where: { id: redemptionId },
      data: { status: SessionRedemptionStatus.CANCELLED },
    });
    // Devuelve la sesión al pack y reactiva si estaba agotado
    await tx.userSessionPack.update({
      where: { id: redemption.userSessionPackId },
      data: {
        sessionsRemaining: { increment: 1 },
        status: UserSessionPackStatus.ACTIVE,
      },
    });
    return { cancelled: true };
  });
}

// =====================================================
// ENTRENADORES disponibles para sesiones 1:1 / grupales
// =====================================================

export async function listTrainers() {
  return prisma.user.findMany({
    where: { role: 'TRAINER', deletedAt: null },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });
}
