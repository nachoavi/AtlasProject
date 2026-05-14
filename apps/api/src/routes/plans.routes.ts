import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const plansRouter: Router = Router();

plansRouter.get('/', async (_req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});
