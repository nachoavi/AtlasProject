import { Router } from 'express';
import { ServiceType } from '@prisma/client';
import { z } from 'zod';
import { availabilityFor, listProfessionals } from '../services/booking.service.js';

export const servicesRouter: Router = Router();

const ServiceTypeSchema = z.enum([
  ServiceType.KINESIOLOGIA,
  ServiceType.PODOLOGIA,
  ServiceType.NUTRICION,
]);

servicesRouter.get('/', (_req, res) => {
  res.json({ services: Object.values(ServiceType) });
});

servicesRouter.get('/:type/professionals', async (req, res, next) => {
  try {
    const parsed = ServiceTypeSchema.safeParse(req.params.type);
    if (!parsed.success) {
      res.status(400).json({ error: 'INVALID_SERVICE_TYPE' });
      return;
    }
    const profs = await listProfessionals(parsed.data);
    res.json({
      professionals: profs.map((p) => ({
        id: p.id,
        bio: p.bio,
        user: p.user,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const AvailabilityQuery = z.object({
  date: z.coerce.date(),
  professionalId: z.string().cuid().optional(),
});

servicesRouter.get('/:type/availability', async (req, res, next) => {
  try {
    const typeParsed = ServiceTypeSchema.safeParse(req.params.type);
    const qParsed = AvailabilityQuery.safeParse(req.query);
    if (!typeParsed.success || !qParsed.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR' });
      return;
    }
    const result = await availabilityFor(typeParsed.data, qParsed.data.date, {
      professionalId: qParsed.data.professionalId,
    });
    res.json({ availability: result });
  } catch (err) {
    next(err);
  }
});
