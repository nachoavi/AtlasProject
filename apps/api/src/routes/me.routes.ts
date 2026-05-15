import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  generateQrToken,
  getStreakSnapshot,
  recentCheckIns,
} from '../services/checkin.service.js';

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
