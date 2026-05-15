import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { ZodError } from 'zod';

import { env } from './env.js';
import { logger } from './lib/logger.js';
import { CENTER_INFO, DEFAULT_OPERATING_HOURS } from '@atlas/shared';
import { authRouter } from './routes/auth.routes.js';
import { meRouter } from './routes/me.routes.js';
import { plansRouter } from './routes/plans.routes.js';
import { servicesRouter } from './routes/services.routes.js';
import { staffRouter } from './routes/staff.routes.js';
import { apiLimiter } from './middlewares/rateLimit.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/center/info', (_req, res) => {
    res.json({
      ...CENTER_INFO,
      operatingHours: DEFAULT_OPERATING_HOURS,
    });
  });

  // Rutas con rate-limit general
  app.use(apiLimiter);

  app.use('/auth', authRouter);
  app.use('/me', meRouter);
  app.use('/plans', plansRouter);
  app.use('/services', servicesRouter);
  app.use('/staff', staffRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND' });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: err.flatten() });
      return;
    }
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  });

  return app;
}
