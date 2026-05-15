import crypto from 'node:crypto';
import {
  CheckInSource,
  NotificationType,
  Prisma,
  SubscriptionStatus,
  type Badge,
  type CheckIn,
} from '@prisma/client';
import { differenceInCalendarDays, startOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CENTER_TIMEZONE, QR_CHECKIN_TTL_SECONDS } from '@atlas/shared';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

export class CheckInError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const STREAK_CACHE_PREFIX = 'streak:';

// =====================================================
// CREATE CHECK-IN
// =====================================================

type CreateCheckInOpts = {
  userId: string;
  source: CheckInSource;
  staffId?: string;
  location?: string;
  /** Si true, ignora el límite de días/semana del plan (uso de staff). */
  force?: boolean;
};

export async function createCheckIn(opts: CreateCheckInOpts) {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    include: {
      subscriptions: {
        where: { status: SubscriptionStatus.ACTIVE },
        orderBy: { endsAt: 'desc' },
        take: 1,
        include: { plan: true },
      },
    },
  });
  if (!user) throw new CheckInError('USER_NOT_FOUND', 'Miembro no encontrado');

  const subscription = user.subscriptions[0];

  if (!opts.force) {
    if (!subscription) {
      throw new CheckInError('NO_ACTIVE_SUBSCRIPTION', 'El miembro no tiene una suscripción activa');
    }
    if (subscription.endsAt < new Date()) {
      throw new CheckInError('SUBSCRIPTION_EXPIRED', 'La suscripción está vencida');
    }
    const usedThisWeek = await countCheckInsThisWeek(opts.userId);
    if (usedThisWeek >= subscription.plan.daysPerWeek) {
      throw new CheckInError(
        'WEEKLY_QUOTA_REACHED',
        `Cupo semanal alcanzado (${subscription.plan.daysPerWeek} días/semana en plan ${subscription.plan.name})`,
      );
    }
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      userId: opts.userId,
      source: opts.source,
      staffId: opts.staffId,
      location: opts.location,
    },
  });

  // Invalida cache de racha
  await redis.del(`${STREAK_CACHE_PREFIX}${opts.userId}`);

  // Evalúa badges nuevos
  const newBadges = await evaluateBadgesAfterCheckIn(opts.userId);

  return {
    checkIn,
    newBadges,
    weeklyUsage: !opts.force && subscription
      ? { used: (await countCheckInsThisWeek(opts.userId)), allowed: subscription.plan.daysPerWeek }
      : null,
  };
}

async function countCheckInsThisWeek(userId: string): Promise<number> {
  const now = toZonedTime(new Date(), CENTER_TIMEZONE);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // lunes ISO
  // Cuenta días distintos (no check-ins totales) para evitar contar 2 entradas el mismo día
  const rows = await prisma.$queryRaw<Array<{ day: Date }>>`
    SELECT DISTINCT DATE(("occurredAt" AT TIME ZONE 'America/Santiago')) AS day
    FROM "CheckIn"
    WHERE "userId" = ${userId}
      AND "occurredAt" >= ${weekStart}
  `;
  return rows.length;
}

// =====================================================
// STREAK (racha)
// =====================================================

export type StreakSnapshot = {
  current: number;
  longest: number;
  lastCheckInAt: string | null;
  thisWeek: { used: number; allowed: number | null };
  recent7Days: Array<{ date: string; checkedIn: boolean }>;
  total: number;
};

export async function getStreakSnapshot(userId: string): Promise<StreakSnapshot> {
  const cached = await redis.get(`${STREAK_CACHE_PREFIX}${userId}`);
  if (cached) return JSON.parse(cached) as StreakSnapshot;

  const [checkIns, subscription, total] = await Promise.all([
    prisma.$queryRaw<Array<{ day: Date }>>`
      SELECT DISTINCT DATE(("occurredAt" AT TIME ZONE 'America/Santiago')) AS day
      FROM "CheckIn"
      WHERE "userId" = ${userId}
      ORDER BY day DESC
      LIMIT 90
    `,
    prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      orderBy: { endsAt: 'desc' },
      include: { plan: true },
    }),
    prisma.checkIn.count({ where: { userId } }),
  ]);

  const dayKeys = checkIns.map((r) => formatLocalDateKey(r.day));
  const todayKey = formatLocalDateKey(new Date());

  // Racha actual: días consecutivos terminando hoy o ayer
  let current = 0;
  let cursor = new Date();
  for (let i = 0; i < dayKeys.length; i++) {
    const cursorKey = formatLocalDateKey(cursor);
    const wantsToday = cursorKey === todayKey;
    if (dayKeys[i] === cursorKey) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (wantsToday) {
      // permite que la racha siga viva si todavía no entrenó hoy pero sí ayer
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Racha más larga (en los últimos 90 días, suficiente para v1)
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of dayKeys.slice().reverse()) {
    if (prev) {
      const gap = daysBetween(prev, key);
      if (gap === 1) run++;
      else run = 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = key;
  }

  // Últimos 7 días para el gráfico de racha
  const recent7Days: Array<{ date: string; checkedIn: boolean }> = [];
  const setKeys = new Set(dayKeys);
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = formatLocalDateKey(d);
    recent7Days.push({ date: key, checkedIn: setKeys.has(key) });
  }

  const usedThisWeek = await countCheckInsThisWeek(userId);

  const snapshot: StreakSnapshot = {
    current,
    longest,
    lastCheckInAt: checkIns[0] ? new Date(checkIns[0].day).toISOString() : null,
    thisWeek: { used: usedThisWeek, allowed: subscription?.plan.daysPerWeek ?? null },
    recent7Days,
    total,
  };

  await redis.set(`${STREAK_CACHE_PREFIX}${userId}`, JSON.stringify(snapshot), 'EX', 600);
  return snapshot;
}

function formatLocalDateKey(d: Date): string {
  const z = toZonedTime(d, CENTER_TIMEZONE);
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, '0');
  const dd = String(z.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(new Date(b), new Date(a));
}

// =====================================================
// BADGES — evaluación post check-in
// =====================================================

export async function evaluateBadgesAfterCheckIn(userId: string): Promise<Badge[]> {
  const [allBadges, owned, totalCheckIns, snapshot] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    prisma.checkIn.count({ where: { userId } }),
    getStreakSnapshot(userId),
  ]);

  const ownedSet = new Set(owned.map((b) => b.badgeId));
  const newlyUnlocked: Badge[] = [];

  for (const badge of allBadges) {
    if (ownedSet.has(badge.id)) continue;
    const criteria = badge.criteria as { type: string; threshold?: number };
    let unlock = false;

    switch (criteria.type) {
      case 'checkins':
        unlock = totalCheckIns >= (criteria.threshold ?? 1);
        break;
      case 'streak':
        unlock = snapshot.current >= (criteria.threshold ?? 1);
        break;
      case 'membership_months':
      case 'workshops_attended':
      case 'workshop_count':
        // Estos se evalúan en otros flujos (suscripción/taller); aquí no aplica
        unlock = false;
        break;
    }

    if (unlock) newlyUnlocked.push(badge);
  }

  // Persiste los desbloqueos en una transacción
  if (newlyUnlocked.length > 0) {
    await prisma.$transaction([
      ...newlyUnlocked.map((badge) =>
        prisma.userBadge.create({ data: { userId, badgeId: badge.id } }),
      ),
      ...newlyUnlocked.map((badge) =>
        prisma.notification.create({
          data: {
            userId,
            type: NotificationType.BADGE_UNLOCKED,
            title: `¡Desbloqueaste un logro!`,
            body: badge.name,
            deepLink: '/app/progreso',
          },
        }),
      ),
    ]);
  }

  return newlyUnlocked;
}

// =====================================================
// QR TOKEN — generación rotativa
// =====================================================

const QR_PREFIX = 'qr:';

export async function generateQrToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(18).toString('base64url');
  const expiresAt = new Date(Date.now() + QR_CHECKIN_TTL_SECONDS * 1000);
  await redis.set(`${QR_PREFIX}${token}`, userId, 'EX', QR_CHECKIN_TTL_SECONDS);
  return { token, expiresAt };
}

export async function consumeQrToken(token: string): Promise<string | null> {
  const userId = await redis.get(`${QR_PREFIX}${token}`);
  if (!userId) return null;
  await redis.del(`${QR_PREFIX}${token}`);
  return userId;
}

// =====================================================
// HISTORIAL para frontend
// =====================================================

export async function recentCheckIns(userId: string, limit = 10): Promise<CheckIn[]> {
  return prisma.checkIn.findMany({
    where: { userId },
    orderBy: { occurredAt: 'desc' },
    take: limit,
  });
}
