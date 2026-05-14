/**
 * Cliente HTTP para la API de Atlas.
 * - El access token vive en memoria (no localStorage) por seguridad XSS.
 * - El refresh token vive en cookie httpOnly y se renueva en /auth/refresh.
 * - Si una request retorna 401, intenta refrescar 1 vez antes de fallar.
 */

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

let accessToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function onUnauthenticatedSetter(fn: () => void): void {
  onUnauthenticated = fn;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

type Options = RequestInit & { skipAuth?: boolean; skipRefresh?: boolean };

async function rawFetch(path: string, opts: Options = {}): Promise<Response> {
  const { skipAuth, skipRefresh: _skipRefresh, headers, ...rest } = opts;
  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has('Content-Type') && opts.body && typeof opts.body === 'string') {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (!skipAuth && accessToken) {
    finalHeaders.set('Authorization', `Bearer ${accessToken}`);
  }
  return fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: finalHeaders,
  });
}

async function tryRefresh(): Promise<boolean> {
  try {
    const r = await rawFetch('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
      skipRefresh: true,
    });
    if (!r.ok) return false;
    const data = (await r.json()) as { accessToken: string };
    accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  let res = await rawFetch(path, opts);

  if (res.status === 401 && !opts.skipRefresh && !opts.skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, opts);
    } else {
      accessToken = null;
      onUnauthenticated?.();
    }
  }

  if (!res.ok) {
    let payload: { error?: string; message?: string; issues?: unknown } = {};
    try {
      payload = await res.json();
    } catch {
      // body not JSON
    }
    throw new ApiError(
      res.status,
      payload.error ?? 'UNKNOWN_ERROR',
      payload.message ?? res.statusText,
      payload.issues,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function bootstrapSession(): Promise<boolean> {
  return tryRefresh();
}
