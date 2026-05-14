import { Router } from 'express';
import { LoginSchema, RegisterSchema } from '@atlas/shared';
import { AuthError, loginUser, refreshTokens, registerUser, revokeRefreshToken } from '../services/auth.service.js';
import { validateBody } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { REFRESH_COOKIE_NAME, clearRefreshCookie, setRefreshCookie } from '../lib/cookies.js';

export const authRouter: Router = Router();

authRouter.post('/register', authLimiter, validateBody(RegisterSchema), async (req, res, next) => {
  try {
    const meta = { userAgent: req.get('user-agent') ?? undefined, ipAddress: req.ip };
    const { user, tokens } = await registerUser(req.body, meta);
    setRefreshCookie(res, tokens.refreshToken);
    res.status(201).json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    if (err instanceof AuthError) {
      const status = err.code === 'EMAIL_TAKEN' || err.code === 'RUT_TAKEN' ? 409 : 400;
      res.status(status).json({ error: err.code, message: err.message });
      return;
    }
    next(err);
  }
});

authRouter.post('/login', authLimiter, validateBody(LoginSchema), async (req, res, next) => {
  try {
    const meta = { userAgent: req.get('user-agent') ?? undefined, ipAddress: req.ip };
    const { user, tokens } = await loginUser(req.body, meta);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    if (err instanceof AuthError) {
      const status = err.code === 'INVALID_CREDENTIALS' ? 401 : err.code === 'USER_INACTIVE' ? 403 : 400;
      res.status(status).json({ error: err.code, message: err.message });
      return;
    }
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      res.status(401).json({ error: 'NO_REFRESH_COOKIE' });
      return;
    }
    const meta = { userAgent: req.get('user-agent') ?? undefined, ipAddress: req.ip };
    const { accessToken, refreshToken: newRefresh, user } = await refreshTokens(refreshToken, meta);
    setRefreshCookie(res, newRefresh);
    res.json({ accessToken, user });
  } catch (err) {
    if (err instanceof AuthError) {
      clearRefreshCookie(res);
      res.status(401).json({ error: err.code, message: err.message });
      return;
    }
    next(err);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) await revokeRefreshToken(refreshToken);
    clearRefreshCookie(res);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
