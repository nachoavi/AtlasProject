import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { addDays } from 'date-fns';
import type { LoginInput, RegisterInput } from '@atlas/shared';
import { env } from '../env.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from '../lib/jwt.js';

export class AuthError extends Error {
  constructor(
    public code: 'EMAIL_TAKEN' | 'RUT_TAKEN' | 'INVALID_CREDENTIALS' | 'USER_INACTIVE' | 'INVALID_REFRESH',
    message: string,
  ) {
    super(message);
  }
}

export async function registerUser(
  input: RegisterInput,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        rut: input.rut,
        phone: input.phone,
        role: UserRole.MEMBER,
        profile: { create: {} },
      },
    });

    const tokens = await issueTokensForUser(user.id, user.role, meta);
    return { user: stripSensitive(user), tokens };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[]) ?? [];
      if (target.includes('email')) throw new AuthError('EMAIL_TAKEN', 'Email ya registrado');
      if (target.includes('rut')) throw new AuthError('RUT_TAKEN', 'RUT ya registrado');
    }
    throw err;
  }
}

export async function loginUser(
  input: LoginInput,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AuthError('INVALID_CREDENTIALS', 'Credenciales inválidas');

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new AuthError('INVALID_CREDENTIALS', 'Credenciales inválidas');

  if (user.status !== UserStatus.ACTIVE) {
    throw new AuthError('USER_INACTIVE', 'Cuenta inactiva — contacta al centro');
  }

  const tokens = await issueTokensForUser(user.id, user.role, meta);
  return { user: stripSensitive(user), tokens };
}

export async function refreshTokens(
  refreshPlain: string,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const tokenHash = hashRefreshToken(refreshPlain);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!existing || existing.expiresAt < new Date()) {
    throw new AuthError('INVALID_REFRESH', 'Refresh token inválido o expirado');
  }

  // Detección de reuso: si el token ya fue revocado, es un ataque o re-juego — revoca toda la familia
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AuthError('INVALID_REFRESH', 'Token reutilizado — sesión cerrada por seguridad');
  }

  // Rotación: revoca el actual y emite nuevo
  const newRefresh = generateRefreshToken();
  const expiresAt = addDays(new Date(), env.JWT_REFRESH_TTL_DAYS);

  const created = await prisma.refreshToken.create({
    data: {
      userId: existing.userId,
      tokenHash: newRefresh.hash,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedBy: created.id },
  });

  const accessToken = signAccessToken({ sub: existing.user.id, role: existing.user.role });
  return {
    accessToken,
    refreshToken: newRefresh.plain,
    user: stripSensitive(existing.user),
  };
}

export async function revokeRefreshToken(refreshPlain: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshPlain);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function issueTokensForUser(
  userId: string,
  role: UserRole,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const refresh = generateRefreshToken();
  const expiresAt = addDays(new Date(), env.JWT_REFRESH_TTL_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: refresh.hash,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  const accessToken = signAccessToken({ sub: userId, role });
  return { accessToken, refreshToken: refresh.plain };
}

function stripSensitive<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}
