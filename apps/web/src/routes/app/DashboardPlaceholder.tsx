import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../stores/auth';

/**
 * Placeholder de Fase 1 — el dashboard real se construye en Fase 3 (racha + check-in + progreso).
 */
export function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <main className="min-h-dvh bg-atlas-black text-atlas-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-atlas-white/10 px-6 py-6">
        <Link to="/" className="font-display text-2xl uppercase">
          Atlas
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 rounded-full border border-atlas-white/20 px-4 py-2 text-xs uppercase tracking-wider transition-colors hover:bg-atlas-white/10"
        >
          <LogOut size={14} />
          Salir
        </button>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-atlas-yellow">
          Hola, {user?.fullName.split(' ')[0]}
        </p>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9]">
          Tu <span className="text-atlas-yellow">dashboard</span> llega pronto.
        </h1>
        <p className="mt-4 max-w-xl text-atlas-white/70">
          La autenticación está lista. En la próxima fase agregamos suscripción, check-in con QR,
          racha de entrenamiento y tu rutina activa.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-atlas-ink p-6">
            <p className="text-xs uppercase tracking-wider text-atlas-yellow">Email</p>
            <p className="mt-2 break-all text-sm">{user?.email}</p>
          </div>
          <div className="rounded-2xl bg-atlas-ink p-6">
            <p className="text-xs uppercase tracking-wider text-atlas-yellow">Rol</p>
            <p className="mt-2 text-sm">{user?.role}</p>
          </div>
          <div className="rounded-2xl bg-atlas-ink p-6">
            <p className="text-xs uppercase tracking-wider text-atlas-yellow">RUT</p>
            <p className="mt-2 text-sm">{user?.rut ?? 'No registrado'}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
