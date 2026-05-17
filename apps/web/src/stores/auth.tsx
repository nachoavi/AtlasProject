import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput } from '@atlas/shared';
import { apiFetch, bootstrapSession, onUnauthenticatedSetter, setAccessToken } from '../lib/api';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'MEMBER' | 'TRAINER' | 'PROFESSIONAL' | 'STAFF' | 'ADMIN';
  rut?: string | null;
  phone?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  register: (input: RegisterInput) => Promise<{ user: AuthUser }>;
  login: (input: LoginInput) => Promise<{ user: AuthUser }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

type AuthResponse = { user: AuthUser; accessToken: string };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    // Limpia el cache de queries para que los datos de un usuario no
    // se filtren a la siguiente sesión.
    queryClient.clear();
  }, [queryClient]);

  const fetchMe = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: AuthUser }>('/me');
      setUser(data.user);
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  // On mount: try to refresh from cookie. If successful, fetch /me.
  useEffect(() => {
    onUnauthenticatedSetter(() => setUser(null));
    void (async () => {
      const ok = await bootstrapSession();
      if (ok) await fetchMe();
      setLoading(false);
    })();
  }, [fetchMe]);

  const register = useCallback<AuthState['register']>(async (input) => {
    const data = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return { user: data.user };
  }, []);

  const login = useCallback<AuthState['login']>(async (input) => {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return { user: data.user };
  }, []);

  const logout = useCallback<AuthState['logout']>(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', skipAuth: true, skipRefresh: true });
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo<AuthState>(
    () => ({ user, loading, register, login, logout, refresh: fetchMe }),
    [user, loading, register, login, logout, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
