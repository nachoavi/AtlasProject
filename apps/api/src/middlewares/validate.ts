import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema, infer as ZInfer } from 'zod';

/** Valida `req.body` contra un schema Zod y reemplaza con la versión parseada. */
export function validateBody<S extends ZodSchema>(schema: S) {
  return (req: Request<unknown, unknown, ZInfer<S>>, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'VALIDATION_ERROR', issues: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}
