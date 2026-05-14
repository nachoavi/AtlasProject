import crypto from 'node:crypto';
import {
  PaymentProvider,
  PaymentStatus,
  PaymentTarget,
  Prisma,
  SubscriptionStatus,
  UserRole,
  UserSessionPackStatus,
} from '@prisma/client';
import { addDays, addMonths, endOfDay, startOfDay } from 'date-fns';
import type {
  StaffCreateMemberInput,
  StaffCreateSessionPackInput,
  StaffCreateSubscriptionInput,
} from '@atlas/shared';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';

export class StaffError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

/** Búsqueda libre: email, RUT (con o sin formato) o partes del nombre. */
export async function searchMembers(q: string, limit: number) {
  const cleanQ = q.trim();
  const cleanRutCandidate = cleanQ.replace(/[.\s-]/g, '').toUpperCase();

  return prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { email: { contains: cleanQ, mode: 'insensitive' } },
        { fullName: { contains: cleanQ, mode: 'insensitive' } },
        { rut: cleanRutCandidate },
      ],
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      fullName: true,
      rut: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      subscriptions: {
        where: { status: SubscriptionStatus.ACTIVE },
        orderBy: { endsAt: 'desc' },
        take: 1,
        select: { id: true, endsAt: true, plan: { select: { code: true, name: true } } },
      },
    },
  });
}

/** Crea un miembro desde recepción y retorna una contraseña temporal de un solo uso. */
export async function createMemberFromStaff(input: StaffCreateMemberInput) {
  const tempPassword = generateReadablePassword();
  const passwordHash = await hashPassword(tempPassword);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        rut: input.rut,
        phone: input.phone,
        role: UserRole.MEMBER,
        profile: { create: {} },
      },
    });
    return { user, tempPassword };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[]) ?? [];
      if (target.includes('email')) throw new StaffError('EMAIL_TAKEN', 'Email ya registrado');
      if (target.includes('rut')) throw new StaffError('RUT_TAKEN', 'RUT ya registrado');
    }
    throw err;
  }
}

/** Inscribe a un miembro en un plan mensual con pago manual procesado en recepción. */
export async function createManualSubscription(
  staffId: string,
  input: StaffCreateSubscriptionInput,
) {
  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.plan.findUnique({ where: { code: input.planCode } }),
  ]);
  if (!user) throw new StaffError('USER_NOT_FOUND', 'Miembro no encontrado');
  if (!plan || !plan.isActive) throw new StaffError('PLAN_NOT_FOUND', 'Plan no disponible');

  const startsAt = input.startsAt ?? new Date();
  const endsAt = addMonths(startsAt, 1);
  const amountClp = input.amountClp ?? plan.priceClp;

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        provider: PaymentProvider.MANUAL,
        method: input.paymentMethod,
        providerTxId: `manual-${crypto.randomUUID()}`,
        amountClp,
        status: PaymentStatus.COMPLETED,
        target: PaymentTarget.SUBSCRIPTION,
        notes: input.notes,
        collectedById: staffId,
        completedAt: new Date(),
      },
    });

    const subscription = await tx.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startsAt,
        endsAt,
        autoRenew: input.autoRenew ?? false,
        paymentId: payment.id,
      },
      include: { plan: true },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { targetRef: subscription.id },
    });

    return { subscription, payment };
  });
}

/** Inscribe a un miembro en un session pack (Legión o Transforma) con pago manual. */
export async function createManualSessionPack(
  staffId: string,
  input: StaffCreateSessionPackInput,
) {
  const [user, pack] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.sessionPack.findUnique({ where: { code: input.packCode } }),
  ]);
  if (!user) throw new StaffError('USER_NOT_FOUND', 'Miembro no encontrado');
  if (!pack || !pack.isActive) throw new StaffError('PACK_NOT_FOUND', 'Pack no disponible');

  const startsAt = new Date();
  const expiresAt = addDays(startsAt, pack.validityDays);
  const amountClp = input.amountClp ?? pack.priceClp;

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        provider: PaymentProvider.MANUAL,
        method: input.paymentMethod,
        providerTxId: `manual-${crypto.randomUUID()}`,
        amountClp,
        status: PaymentStatus.COMPLETED,
        target: PaymentTarget.SESSION_PACK,
        notes: input.notes,
        collectedById: staffId,
        completedAt: new Date(),
      },
    });

    const userPack = await tx.userSessionPack.create({
      data: {
        userId: user.id,
        sessionPackId: pack.id,
        paymentId: payment.id,
        sessionsRemaining: pack.sessionsTotal,
        sessionsTotal: pack.sessionsTotal,
        startsAt,
        expiresAt,
        status: UserSessionPackStatus.ACTIVE,
      },
      include: { sessionPack: true },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { targetRef: userPack.id },
    });

    return { userSessionPack: userPack, payment };
  });
}

/** Métricas del día para el dashboard de recepción. */
export async function staffDashboard() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const weekFromNow = addDays(new Date(), 7);

  const [paymentsToday, subscriptionsToday, expiringSoon, paymentsByMethod] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        provider: PaymentProvider.MANUAL,
        status: PaymentStatus.COMPLETED,
        completedAt: { gte: todayStart, lte: todayEnd },
      },
      _sum: { amountClp: true },
      _count: true,
    }),
    prisma.subscription.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endsAt: { gte: new Date(), lte: weekFromNow },
      },
    }),
    prisma.payment.groupBy({
      by: ['method'],
      where: {
        provider: PaymentProvider.MANUAL,
        status: PaymentStatus.COMPLETED,
        completedAt: { gte: todayStart, lte: todayEnd },
      },
      _sum: { amountClp: true },
      _count: true,
    }),
  ]);

  return {
    today: {
      revenueClp: paymentsToday._sum.amountClp ?? 0,
      paymentsCount: paymentsToday._count,
      subscriptionsCount: subscriptionsToday,
      byMethod: paymentsByMethod.map((r) => ({
        method: r.method,
        amountClp: r._sum.amountClp ?? 0,
        count: r._count,
      })),
    },
    expiringWithin7Days: expiringSoon,
  };
}

/** Devuelve los pagos manuales del día (para conciliación de caja). */
export async function paymentsToday() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  return prisma.payment.findMany({
    where: {
      provider: PaymentProvider.MANUAL,
      status: PaymentStatus.COMPLETED,
      completedAt: { gte: todayStart, lte: todayEnd },
    },
    orderBy: { completedAt: 'desc' },
    include: {
      collectedBy: { select: { id: true, fullName: true } },
    },
  });
}

/** Genera password legible (mayúsculas + minúsculas + dígitos, sin caracteres confusos). */
function generateReadablePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
  const buf = crypto.randomBytes(10);
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    out += chars[buf[i]! % chars.length];
  }
  return out;
}
