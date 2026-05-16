import { Router } from 'express';
import { listPublishedEvents } from '../services/event.service.js';

export const eventsRouter: Router = Router();

eventsRouter.get('/', async (_req, res, next) => {
  try {
    const events = await listPublishedEvents();
    res.json({
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        coverUrl: e.coverUrl,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        capacity: e.capacity,
        priceClp: e.priceClp,
        rsvpCount: e._count.rsvps,
      })),
    });
  } catch (err) {
    next(err);
  }
});
