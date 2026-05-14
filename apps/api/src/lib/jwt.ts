import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { env } from '../env.js';

export type AccessTokenPayload = {
  sub: string; // userId
  role: UserRole;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    issuer: 'atlas-api',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'atlas-api' });
  if (typeof decoded === 'string') throw new Error('Invalid token payload');
  return { sub: decoded.sub as string, role: decoded.role as UserRole };
}

/**
 * Refresh tokens son opacos (no JWT) — un string aleatorio cuyo hash se guarda.
 * Esto permite revocación inmediata sin esperar expiración del JWT.
 */
export function generateRefreshToken(): { plain: string; hash: string } {
  const plain = crypto.randomBytes(48).toString('base64url');
  const hash = crypto.createHash('sha256').update(plain).digest('hex');
  return { plain, hash };
}

export function hashRefreshToken(plain: string): string {
  return crypto.createHash('sha256').update(plain).digest('hex');
}
