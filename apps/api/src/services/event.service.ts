import { EventRsvpStatus, NotificationType, SubscriptionStatus } from '@prisma/client';
import { applyDiscount } from '@atlas/shared';
import { prisma } from '../lib/prisma.js';

export class EventError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function listPublishedEvents() {
  return prisma.event.findMany({
    where: { isPublished: true, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    include: {
      _count: { select: { rsvps: { where: { status: { not: EventRsvpStatus.CANCELLED } } } } },
    },
  });
}

export async function rsvpEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      rsvps: { where: { status: { not: EventRsvpStatus.CANCELLED } } },
    },
  });
  if (!event || !event.isPublished) throw new EventError('EVENT_NOT_FOUND', 'Evento no disponible');
  if (event.startsAt < new Date()) throw new EventError('EVENT_PAST', 'Este evento ya ocurrió');
  if (event.capacity != null && event.rsvps.length >= event.capacity) {
    throw new EventError('EVENT_FULL', 'No quedan cupos para este evento');
  }
  if (event.rsvps.find((r) => r.userId === userId)) {
    throw new EventError('ALREADY_RSVPED', 'Ya confirmaste asistencia');
  }

  // Descuento de eventos: solo Atlas Élite (eventDiscountPct) en v1
  let priceChargedClp = event.priceClp;
  if (event.priceClp > 0) {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE, endsAt: { gte: new Date() } },
      include: { plan: true },
    });
    if (sub && sub.plan.eventDiscountPct > 0) {
      priceChargedClp = applyDiscount(event.priceClp, sub.plan.eventDiscountPct);
    }
  }

  return prisma.$transaction(async (tx) => {
    const rsvp = await tx.eventRsvp.create({
      data: { userId, eventId, priceChargedClp, status: EventRsvpStatus.CONFIRMED },
      include: { event: true },
    });
    await tx.notification.create({
      data: {
        userId,
        type: NotificationType.GENERIC,
        title: 'Asistencia confirmada',
        body: `Confirmaste tu lugar en "${event.title}".`,
        deepLink: '/app/eventos',
      },
    });
    return rsvp;
  });
}

export async function cancelRsvp(userId: string, rsvpId: string) {
  const rsvp = await prisma.eventRsvp.findUnique({ where: { id: rsvpId } });
  if (!rsvp) throw new EventError('RSVP_NOT_FOUND', 'Confirmación no encontrada');
  if (rsvp.userId !== userId) throw new EventError('FORBIDDEN', 'No puedes cancelar confirmaciones ajenas');
  return prisma.eventRsvp.update({
    where: { id: rsvpId },
    data: { status: EventRsvpStatus.CANCELLED },
  });
}

export async function myRsvps(userId: string) {
  return prisma.eventRsvp.findMany({
    where: { userId, status: { not: EventRsvpStatus.CANCELLED } },
    include: { event: true },
    orderBy: { event: { startsAt: 'asc' } },
  });
}

// =====================================================
// STAFF: crear evento
// =====================================================

export async function createEvent(input: {
  title: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date;
  capacity?: number;
  priceClp?: number;
  isPublished?: boolean;
}) {
  return prisma.event.create({
    data: {
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      capacity: input.capacity,
      priceClp: input.priceClp ?? 0,
      isPublished: input.isPublished ?? true,
    },
  });
}
