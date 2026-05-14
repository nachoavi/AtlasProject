import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';

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
