import { BookingStatus, NotificationType, Prisma, ServiceType } from '@prisma/client';
import { addMinutes, differenceInMinutes, isAfter } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import {
  CENTER_TIMEZONE,
  CANCELATION_WINDOW_HOURS,
  isWithinOperatingHours,
} from '@atlas/shared';
import { prisma } from '../lib/prisma.js';

export class BookingError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const DEFAULT_SLOT_MINUTES = 30;

// =====================================================
// LISTAR PROFESIONALES POR SERVICIO
// =====================================================

export async function listProfessionals(serviceType: ServiceType) {
  return prisma.professional.findMany({
    where: { serviceType, isActive: true },
    include: { user: { select: { id: true, fullName: true } } },
  });
}

// =====================================================
// DISPONIBILIDAD: cruza availability + operating hours + bookings existentes
// =====================================================

export type AvailableSlot = { start: Date; end: Date };

export async function availabilityFor(
  serviceType: ServiceType,
  date: Date,
  options: { professionalId?: string; slotMinutes?: number } = {},
): Promise<Array<{ professional: { id: string; fullName: string }; slots: AvailableSlot[] }>> {
  const localDate = toZonedTime(date, CENTER_TIMEZONE);
  const weekday = localDate.getDay();
  const slotMin = options.slotMinutes ?? DEFAULT_SLOT_MINUTES;

  const professionals = await prisma.professional.findMany({
    where: {
      serviceType,
      isActive: true,
      ...(options.professionalId ? { id: options.professionalId } : {}),
    },
    include: {
      user: { select: { id: true, fullName: true } },
      availabilitySlots: { where: { weekday, isActive: true } },
    },
  });

  // Día completo en zona local del centro
  const dayStart = new Date(localDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(localDate);
  dayEnd.setHours(23, 59, 59, 999);

  const utcDayStart = fromZonedTime(dayStart, CENTER_TIMEZONE);
  const utcDayEnd = fromZonedTime(dayEnd, CENTER_TIMEZONE);

  // Bookings existentes ese día (de cualquier profesional del servicio)
  const profIds = professionals.map((p) => p.id);
  const existingBookings = await prisma.booking.findMany({
    where: {
      professionalId: { in: profIds },
      slotStart: { gte: utcDayStart, lte: utcDayEnd },
      status: { in: [BookingStatus.BOOKED, BookingStatus.CONFIRMED, BookingStatus.ATTENDED] },
    },
    select: { professionalId: true, slotStart: true, slotEnd: true },
  });

  const bookingsByProf = new Map<string, Array<{ start: Date; end: Date }>>();
  for (const b of existingBookings) {
    const arr = bookingsByProf.get(b.professionalId) ?? [];
    arr.push({ start: b.slotStart, end: b.slotEnd });
    bookingsByProf.set(b.professionalId, arr);
  }

  const now = new Date();
  const result: Array<{ professional: { id: string; fullName: string }; slots: AvailableSlot[] }> = [];

  for (const prof of professionals) {
    const slots: AvailableSlot[] = [];
    const booked = bookingsByProf.get(prof.id) ?? [];

    for (const avail of prof.availabilitySlots) {
      const [sh, sm] = avail.startTime.split(':').map((n) => parseInt(n, 10));
      const [eh, em] = avail.endTime.split(':').map((n) => parseInt(n, 10));

      const blockStartLocal = new Date(localDate);
      blockStartLocal.setHours(sh ?? 0, sm ?? 0, 0, 0);
      const blockEndLocal = new Date(localDate);
      blockEndLocal.setHours(eh ?? 0, em ?? 0, 0, 0);

      let cursor = fromZonedTime(blockStartLocal, CENTER_TIMEZONE);
      const blockEnd = fromZonedTime(blockEndLocal, CENTER_TIMEZONE);

      while (true) {
        const slotEnd = addMinutes(cursor, slotMin);
        if (slotEnd > blockEnd) break;

        const conflictsBooking = booked.some(
          (b) => cursor < b.end && slotEnd > b.start,
        );
        const inPast = !isAfter(cursor, now);
        const inOperatingHours = isWithinOperatingHours(cursor, slotEnd);

        if (!conflictsBooking && !inPast && inOperatingHours) {
          slots.push({ start: new Date(cursor), end: slotEnd });
        }
        cursor = slotEnd;
      }
    }

    result.push({ professional: prof.user, slots });
  }

  return result;
}

// =====================================================
// CREAR BOOKING
// =====================================================

type CreateBookingInput = {
  userId: string;
  professionalId: string;
  slotStart: Date;
  durationMin?: number;
  notes?: string;
};

export async function createBooking(input: CreateBookingInput) {
  const dur = input.durationMin ?? DEFAULT_SLOT_MINUTES;
  const slotEnd = addMinutes(input.slotStart, dur);

  if (!isAfter(input.slotStart, new Date())) {
    throw new BookingError('SLOT_IN_PAST', 'No puedes reservar en el pasado');
  }

  if (!isWithinOperatingHours(input.slotStart, slotEnd)) {
    throw new BookingError('OUTSIDE_HOURS', 'El horario está fuera del horario del centro');
  }

  const professional = await prisma.professional.findUnique({
    where: { id: input.professionalId },
    include: { availabilitySlots: true },
  });
  if (!professional || !professional.isActive) {
    throw new BookingError('PROFESSIONAL_NOT_FOUND', 'Profesional no disponible');
  }

  // ¿Está dentro de algún slot semanal del profesional?
  const localStart = toZonedTime(input.slotStart, CENTER_TIMEZONE);
  const localEnd = toZonedTime(slotEnd, CENTER_TIMEZONE);
  const weekday = localStart.getDay();
  const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
  const fitsAvailability = professional.availabilitySlots
    .filter((a) => a.weekday === weekday && a.isActive)
    .some((a) => {
      const [sh, sm] = a.startTime.split(':').map((n) => parseInt(n, 10));
      const [eh, em] = a.endTime.split(':').map((n) => parseInt(n, 10));
      const startMin = (sh ?? 0) * 60 + (sm ?? 0);
      const endMin = (eh ?? 0) * 60 + (em ?? 0);
      return minutesOfDay(localStart) >= startMin && minutesOfDay(localEnd) <= endMin;
    });
  if (!fitsAvailability) {
    throw new BookingError('NOT_AVAILABLE', 'El horario seleccionado no está disponible');
  }

  // ¿Conflicto con otra reserva?
  const conflict = await prisma.booking.findFirst({
    where: {
      professionalId: input.professionalId,
      status: { in: [BookingStatus.BOOKED, BookingStatus.CONFIRMED] },
      OR: [
        { slotStart: { lt: slotEnd }, slotEnd: { gt: input.slotStart } },
      ],
    },
  });
  if (conflict) {
    throw new BookingError('SLOT_TAKEN', 'Otro miembro tomó este horario justo antes que tú');
  }

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        userId: input.userId,
        professionalId: input.professionalId,
        serviceType: professional.serviceType,
        slotStart: input.slotStart,
        slotEnd,
        status: BookingStatus.BOOKED,
        priceClp: 0, // v1: gratuito o cubierto por plan; precios reales en v2
        notes: input.notes,
      },
      include: {
        professional: { include: { user: { select: { fullName: true } } } },
      },
    });

    await tx.notification.create({
      data: {
        userId: input.userId,
        type: NotificationType.BOOKING_REMINDER,
        title: 'Hora reservada',
        body: `Tu hora con ${booking.professional.user.fullName} está agendada.`,
        deepLink: '/app/reservas',
      },
    });

    return booking;
  });
}

// =====================================================
// CANCELAR BOOKING
// =====================================================

export async function cancelBooking(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new BookingError('BOOKING_NOT_FOUND', 'Reserva no encontrada');
  if (booking.userId !== userId) throw new BookingError('FORBIDDEN', 'No puedes cancelar reservas ajenas');
  if (booking.status === BookingStatus.CANCELLED) {
    throw new BookingError('ALREADY_CANCELLED', 'La reserva ya está cancelada');
  }
  if (booking.status === BookingStatus.ATTENDED) {
    throw new BookingError('ALREADY_ATTENDED', 'La reserva ya fue atendida');
  }

  const minutesUntil = differenceInMinutes(booking.slotStart, new Date());
  if (minutesUntil < CANCELATION_WINDOW_HOURS * 60) {
    throw new BookingError(
      'CANCELATION_WINDOW_PASSED',
      `Puedes cancelar hasta ${CANCELATION_WINDOW_HOURS}h antes de la hora`,
    );
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });
}

// =====================================================
// LISTAR RESERVAS DEL MIEMBRO
// =====================================================

export async function myBookings(userId: string, scope: 'upcoming' | 'past' | 'all' = 'all') {
  const where: Prisma.BookingWhereInput = { userId };
  const now = new Date();

  if (scope === 'upcoming') {
    where.slotStart = { gte: now };
    where.status = { in: [BookingStatus.BOOKED, BookingStatus.CONFIRMED] };
  } else if (scope === 'past') {
    where.slotStart = { lt: now };
  }

  return prisma.booking.findMany({
    where,
    orderBy: { slotStart: scope === 'past' ? 'desc' : 'asc' },
    include: {
      professional: {
        include: { user: { select: { fullName: true } } },
      },
    },
  });
}
