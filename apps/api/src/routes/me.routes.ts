import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  generateQrToken,
  getStreakSnapshot,
  recentCheckIns,
} from '../services/checkin.service.js';
import {
  BookingError,
  cancelBooking,
  createBooking,
  myBookings,
} from '../services/booking.service.js';
import { validateBody } from '../middlewares/validate.js';

export const meRouter: Router = Router();

meRouter.use(requireAuth);

meRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endsAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });
    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND' });
      return;
    }
    const { passwordHash: _ignore, ...rest } = user;
    res.json({
      user: rest,
      activeSubscription: user.subscriptions[0] ?? null,
    });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/streak', async (req, res, next) => {
  try {
    res.json(await getStreakSnapshot(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

meRouter.get('/check-ins', async (req, res, next) => {
  try {
    const limit = Math.min(50, Number(req.query.limit ?? 10));
    res.json({ checkIns: await recentCheckIns(req.user!.sub, limit) });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/badges', async (req, res, next) => {
  try {
    const owned = await prisma.userBadge.findMany({
      where: { userId: req.user!.sub },
      orderBy: { unlockedAt: 'desc' },
      include: { badge: true },
    });
    res.json({ badges: owned });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/notifications', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

meRouter.post('/notifications/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.sub },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/qr-token', async (req, res, next) => {
  try {
    const { token, expiresAt } = await generateQrToken(req.user!.sub);
    res.json({ token, expiresAt });
  } catch (err) {
    next(err);
  }
});

// =====================================================
// RESERVAS DE SERVICIOS
// =====================================================

const CreateBookingSchema = z.object({
  professionalId: z.string().cuid(),
  slotStart: z.coerce.date(),
  durationMin: z.number().int().positive().max(180).optional(),
  notes: z.string().max(500).optional(),
});

meRouter.get('/bookings', async (req, res, next) => {
  try {
    const scope = (req.query.scope as 'upcoming' | 'past' | 'all') ?? 'all';
    const bookings = await myBookings(req.user!.sub, scope);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

meRouter.post('/bookings', validateBody(CreateBookingSchema), async (req, res, next) => {
  try {
    const booking = await createBooking({ userId: req.user!.sub, ...req.body });
    res.status(201).json({ booking });
  } catch (err) {
    if (err instanceof BookingError) {
      const status = err.code === 'SLOT_TAKEN' ? 409 : err.code === 'PROFESSIONAL_NOT_FOUND' ? 404 : 400;
      res.status(status).json({ error: err.code, message: err.message });
      return;
    }
    next(err);
  }
});

meRouter.delete('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await cancelBooking(req.user!.sub, req.params.id!);
    res.json({ booking });
  } catch (err) {
    if (err instanceof BookingError) {
      const status =
        err.code === 'BOOKING_NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 400;
      res.status(status).json({ error: err.code, message: err.message });
      return;
    }
    next(err);
  }
});
