import { Router } from 'express';
import { CheckInSource, UserRole } from '@prisma/client';
import { z } from 'zod';
import {
  StaffCreateMemberSchema,
  StaffCreateSessionPackSchema,
  StaffCreateSubscriptionSchema,
  StaffSearchSchema,
} from '@atlas/shared';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { prisma } from '../lib/prisma.js';
import {
  StaffError,
  createManualSessionPack,
  createManualSubscription,
  createMemberFromStaff,
  paymentsToday,
  searchMembers,
  staffDashboard,
} from '../services/staff.service.js';
import {
  CheckInError,
  consumeQrToken,
  createCheckIn,
} from '../services/checkin.service.js';
import {
  WorkshopError,
  createWorkshopSession,
  listInstructors,
} from '../services/workshop.service.js';
import { createEvent } from '../services/event.service.js';

export const staffRouter: Router = Router();

staffRouter.use(requireAuth, requireRole(UserRole.STAFF, UserRole.ADMIN));

staffRouter.get('/dashboard', async (_req, res, next) => {
  try {
    res.json(await staffDashboard());
  } catch (err) {
    next(err);
  }
});

staffRouter.get('/members/search', async (req, res, next) => {
  try {
    const parsed = StaffSearchSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.flatten() });
      return;
    }
    const members = await searchMembers(parsed.data.q, parsed.data.limit);
    res.json({ members });
  } catch (err) {
    next(err);
  }
});

staffRouter.post('/members', validateBody(StaffCreateMemberSchema), async (req, res, next) => {
  try {
    const { user, tempPassword } = await createMemberFromStaff(req.body);
    res.status(201).json({
      user: { id: user.id, email: user.email, fullName: user.fullName, rut: user.rut, phone: user.phone, role: user.role },
      tempPassword,
    });
  } catch (err) {
    if (err instanceof StaffError) {
      res.status(409).json({ error: err.code, message: err.message });
      return;
    }
    next(err);
  }
});

staffRouter.post(
  '/subscriptions',
  validateBody(StaffCreateSubscriptionSchema),
  async (req, res, next) => {
    try {
      const result = await createManualSubscription(req.user!.sub, req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof StaffError) {
        res.status(400).json({ error: err.code, message: err.message });
        return;
      }
      next(err);
    }
  },
);

staffRouter.post(
  '/session-packs',
  validateBody(StaffCreateSessionPackSchema),
  async (req, res, next) => {
    try {
      const result = await createManualSessionPack(req.user!.sub, req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof StaffError) {
        res.status(400).json({ error: err.code, message: err.message });
        return;
      }
      next(err);
    }
  },
);

staffRouter.get('/payments/today', async (_req, res, next) => {
  try {
    res.json({ payments: await paymentsToday() });
  } catch (err) {
    next(err);
  }
});

staffRouter.get('/catalog', async (_req, res, next) => {
  try {
    const [plans, sessionPacks] = await Promise.all([
      prisma.plan.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.sessionPack.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
    ]);
    res.json({ plans, sessionPacks });
  } catch (err) {
    next(err);
  }
});

// =====================================================
// CHECK-INS
// =====================================================

const ManualCheckInSchema = z.object({
  userId: z.string().cuid(),
  force: z.boolean().optional(),
  location: z.string().max(80).optional(),
});

staffRouter.post('/check-ins', validateBody(ManualCheckInSchema), async (req, res, next) => {
  try {
    const result = await createCheckIn({
      userId: req.body.userId,
      source: CheckInSource.STAFF_MANUAL,
      staffId: req.user!.sub,
      location: req.body.location,
      force: req.body.force,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof CheckInError) {
      const status = err.code === 'USER_NOT_FOUND' ? 404 : 400;
      res.status(status).json({ error: err.code, message: err.message });
      return;
    }
    next(err);
  }
});

const QrCheckInSchema = z.object({
  token: z.string().min(8),
  location: z.string().max(80).optional(),
});

staffRouter.post('/check-ins/scan', validateBody(QrCheckInSchema), async (req, res, next) => {
  try {
    const userId = await consumeQrToken(req.body.token);
    if (!userId) {
      res.status(400).json({ error: 'INVALID_OR_EXPIRED_QR', message: 'QR inválido o expirado' });
      return;
    }
    const result = await createCheckIn({
      userId,
      source: CheckInSource.STAFF_SCAN,
      staffId: req.user!.sub,
      location: req.body.location,
    });
    const member = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, rut: true },
    });
    res.status(201).json({ ...result, member });
  } catch (err) {
    if (err instanceof CheckInError) {
      const status = err.code === 'USER_NOT_FOUND' ? 404 : 400;
      res.status(status).json({ error: err.code, message: err.message });
      return;
    }
    next(err);
  }
});

staffRouter.get('/check-ins/today', async (_req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const checkIns = await prisma.checkIn.findMany({
      where: { occurredAt: { gte: todayStart } },
      orderBy: { occurredAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      take: 100,
    });
    res.json({ checkIns });
  } catch (err) {
    next(err);
  }
});

// =====================================================
// TALLERES Y EVENTOS — gestión de staff
// =====================================================

staffRouter.get('/instructors', async (_req, res, next) => {
  try {
    res.json({ instructors: await listInstructors() });
  } catch (err) {
    next(err);
  }
});

const CreateWorkshopSessionSchema = z.object({
  workshopCode: z.string().min(1),
  instructorId: z.string().cuid(),
  startsAt: z.coerce.date(),
  durationMin: z.number().int().positive().max(240).optional(),
  capacity: z.number().int().positive().max(100),
});

staffRouter.post(
  '/workshop-sessions',
  validateBody(CreateWorkshopSessionSchema),
  async (req, res, next) => {
    try {
      const session = await createWorkshopSession(req.body);
      res.status(201).json({ session });
    } catch (err) {
      if (err instanceof WorkshopError) {
        res.status(400).json({ error: err.code, message: err.message });
        return;
      }
      next(err);
    }
  },
);

const CreateEventSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  capacity: z.number().int().positive().max(1000).optional(),
  priceClp: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().optional(),
});

staffRouter.post('/events', validateBody(CreateEventSchema), async (req, res, next) => {
  try {
    const event = await createEvent(req.body);
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});
