import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type AuthUser } from '../../stores/auth';

export function RequireRole({
  roles,
  children,
}: {
  roles: AuthUser['role'][];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-atlas-black text-atlas-white/50">
        <span className="font-display uppercase tracking-wider">Cargando…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-atlas-black px-8 text-center text-atlas-white">
        <h1 className="font-display text-5xl uppercase">Sin acceso</h1>
        <p className="max-w-md text-atlas-white/60">
          Esta sección es solo para personal del centro. Si crees que es un error, contacta a
          administración.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
