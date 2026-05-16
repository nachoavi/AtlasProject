import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { listUpcomingWorkshopSessions } from '../services/workshop.service.js';

export const workshopsRouter: Router = Router();

workshopsRouter.get('/', async (_req, res, next) => {
  try {
    const workshops = await prisma.workshop.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ workshops });
  } catch (err) {
    next(err);
  }
});

workshopsRouter.get('/sessions', async (_req, res, next) => {
  try {
    const sessions = await listUpcomingWorkshopSessions();
    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        startsAt: s.startsAt,
        durationMin: s.durationMin,
        capacity: s.capacity,
        enrolledCount: s._count.enrollments,
        workshop: { code: s.workshop.code, name: s.workshop.name, basePriceClp: s.workshop.basePriceClp },
        instructor: s.instructor,
      })),
    });
  } catch (err) {
    next(err);
  }
});
