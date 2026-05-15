import type { CookieOptions, Response } from 'express';
import { env } from '../env.js';

const COOKIE_NAME = 'atlas_refresh';

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    domain: env.COOKIE_DOMAIN,
    // En dev: '/' es necesario porque el proxy de Vite expone el API en /api/*.
    // En prod con dominio separado para el API, también funciona (más amplio pero httpOnly+secure+sameSite=strict mitigan el riesgo).
    path: '/',
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

export const REFRESH_COOKIE_NAME = COOKIE_NAME;
