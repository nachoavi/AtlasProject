import rateLimit from 'express-rate-limit';

/** Rate-limit estricto para endpoints sensibles de auth (login, forgot-password). */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS' },
});

/** Rate-limit general API — 120 req/min por IP. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS' },
});
