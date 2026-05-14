import { Router } from 'express';
import { UserRole } from '@prisma/client';
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
