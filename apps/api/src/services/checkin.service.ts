import crypto from 'node:crypto';
import {
  CheckInSource,
  NotificationType,
  Prisma,
  SubscriptionStatus,
  type Badge,
  type CheckIn,
} from '@prisma/client';
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

/** Días distintos (en zona Chile) con al menos un check-in dentro de la semana ISO actual. */
async function countCheckInsThisWeek(userId: string): Promise<number> {
  const dayKeys = await distinctCheckInDayKeys(userId, 14);
  const weekKeys = new Set(currentWeekKeys());
  return dayKeys.filter((k) => weekKeys.has(k)).length;
}

/**
 * Devuelve los días distintos (YYYY-MM-DD en zona Chile) con check-in,
 * ordenados descendente. Computa en JS desde los timestamps reales para
 * evitar el desfase de zona horaria del SQL DATE().
 */
async function distinctCheckInDayKeys(userId: string, maxDays: number): Promise<string[]> {
  const rows = await prisma.checkIn.findMany({
    where: { userId },
    select: { occurredAt: true },
    orderBy: { occurredAt: 'desc' },
    take: 600,
  });
  const set = new Set(rows.map((r) => formatLocalDateKey(r.occurredAt)));
  return [...set].sort().reverse().slice(0, maxDays);
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

  const [rows, subscription, total] = await Promise.all([
    prisma.checkIn.findMany({
      where: { userId },
      select: { occurredAt: true },
      orderBy: { occurredAt: 'desc' },
      take: 600,
    }),
    prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      orderBy: { endsAt: 'desc' },
      include: { plan: true },
    }),
    prisma.checkIn.count({ where: { userId } }),
  ]);

  const daySet = new Set(rows.map((r) => formatLocalDateKey(r.occurredAt)));
  const dayKeys = [...daySet].sort().reverse(); // descendente: hoy primero
  const todayKey = formatLocalDateKey(new Date());

  // Racha actual: días consecutivos hacia atrás desde hoy (o ayer si aún no entrena hoy)
  let current = 0;
  let cursorKey = todayKey;
  if (dayKeys[0] !== todayKey) {
    cursorKey = shiftDayKey(todayKey, -1);
  }
  let idx = 0;
  while (idx < dayKeys.length && dayKeys[idx] === cursorKey) {
    current++;
    idx++;
    cursorKey = shiftDayKey(cursorKey, -1);
  }

  // Racha más larga: corrida máxima de días consecutivos
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of [...dayKeys].reverse()) {
    run = prev && shiftDayKey(prev, 1) === key ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = key;
  }

  // Últimos 7 días para el gráfico de racha
  const recent7Days = [6, 5, 4, 3, 2, 1, 0].map((back) => {
    const key = shiftDayKey(todayKey, -back);
    return { date: key, checkedIn: daySet.has(key) };
  });

  const weekKeys = new Set(currentWeekKeys());
  const usedThisWeek = dayKeys.filter((k) => weekKeys.has(k)).length;

  const snapshot: StreakSnapshot = {
    current,
    longest,
    lastCheckInAt: rows[0] ? rows[0].occurredAt.toISOString() : null,
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

/** Desplaza una clave de día YYYY-MM-DD por N días (usando UTC para evitar DST). */
function shiftDayKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Las 7 claves de día (lunes a domingo) de la semana ISO actual en zona Chile. */
function currentWeekKeys(): string[] {
  const todayKey = formatLocalDateKey(new Date());
  const local = toZonedTime(new Date(), CENTER_TIMEZONE);
  const sinceMonday = (local.getDay() + 6) % 7; // 0 = lunes
  const mondayKey = shiftDayKey(todayKey, -sinceMonday);
  return [0, 1, 2, 3, 4, 5, 6].map((i) => shiftDayKey(mondayKey, i));
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
