import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LogOut, QrCode, TrendingUp, Trophy } from 'lucide-react';
import { formatClp } from '@atlas/shared';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { StreakRing } from '../../components/atlas/StreakRing';
import { cn } from '../../lib/cn';

type Streak = {
  current: number;
  longest: number;
  lastCheckInAt: string | null;
  thisWeek: { used: number; allowed: number | null };
  recent7Days: Array<{ date: string; checkedIn: boolean }>;
  total: number;
};

type Subscription = {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED' | 'CANCELLED';
  startsAt: string;
  endsAt: string;
  plan: { code: string; name: string; daysPerWeek: number; priceClp: number };
};

type BadgeUnlock = {
  id: string;
  unlockedAt: string;
  badge: { id: string; code: string; name: string; description: string };
};

type MeResponse = {
  user: { id: string; email: string; fullName: string; role: string; rut: string | null };
  activeSubscription: Subscription | null;
};

export function MemberDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const meQ = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<MeResponse>('/me'),
  });
  const streakQ = useQuery({
    queryKey: ['me', 'streak'],
    queryFn: () => apiFetch<Streak>('/me/streak'),
    refetchInterval: 60_000,
  });
  const badgesQ = useQuery({
    queryKey: ['me', 'badges'],
    queryFn: () => apiFetch<{ badges: BadgeUnlock[] }>('/me/badges'),
  });

  const sub = meQ.data?.activeSubscription;
  const daysLeft = sub ? Math.max(0, differenceInCalendarDays(new Date(sub.endsAt), new Date())) : 0;
  const totalDays = sub
    ? Math.max(1, differenceInCalendarDays(new Date(sub.endsAt), new Date(sub.startsAt)))
    : 0;
  const subUsedPct = sub ? Math.min(100, ((totalDays - daysLeft) / totalDays) * 100) : 0;

  return (
    <main className="min-h-dvh bg-atlas-black text-atlas-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-atlas-yellow font-display text-atlas-black">
            A
          </span>
          <span className="font-display text-xl uppercase">Atlas</span>
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className="inline-flex items-center gap-2 rounded-full border border-atlas-white/20 px-4 py-2 text-xs uppercase tracking-wider transition-colors hover:bg-atlas-white/10"
        >
          <LogOut size={14} />
          Salir
        </button>
      </header>

      <section className="mx-auto max-w-5xl px-6">
        <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">
          Hola, {user?.fullName.split(' ')[0]}
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-[0.95] sm:text-6xl">
          {streakQ.data?.current
            ? `Llevas ${streakQ.data.current} ${streakQ.data.current === 1 ? 'día' : 'días'} entrenando.`
            : 'Vamos a entrenar.'}
        </h1>
      </section>

      {/* Racha + QR */}
      <section className="mx-auto mt-12 grid max-w-5xl gap-8 px-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col items-center rounded-3xl bg-atlas-ink p-8">
          {streakQ.data ? (
            <StreakRing
              current={streakQ.data.current}
              longest={streakQ.data.longest}
              weekUsed={streakQ.data.thisWeek.used}
              weekAllowed={streakQ.data.thisWeek.allowed}
            />
          ) : (
            <p className="text-atlas-white/40">Cargando racha…</p>
          )}

          {streakQ.data && (
            <div className="mt-6 flex w-full items-center justify-between gap-2">
              {streakQ.data.recent7Days.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] uppercase text-atlas-white/40">
                    {format(new Date(day.date), 'EEE', { locale: es }).slice(0, 1)}
                  </span>
                  <span
                    className={cn(
                      'h-9 w-9 rounded-lg',
                      day.checkedIn ? 'bg-atlas-yellow' : 'bg-atlas-white/5',
                    )}
                  />
                </div>
              ))}
            </div>
          )}

          <Link
            to="/app/qr"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-atlas-coral px-7 py-4 font-display uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover"
          >
            <QrCode size={18} />
            Marcar entrada
          </Link>
        </div>

        {/* Suscripción */}
        <div className="flex flex-col gap-4">
          {sub ? (
            <div className="rounded-3xl bg-atlas-yellow p-6 text-atlas-black">
              <p className="text-xs uppercase tracking-wider opacity-70">Tu plan</p>
              <h3 className="mt-1 font-display text-3xl uppercase">{sub.plan.name}</h3>
              <p className="mt-2 text-sm">
                {sub.plan.daysPerWeek} días/semana · {formatClp(sub.plan.priceClp)}/mes
              </p>
              <div className="mt-4">
                <div className="flex items-baseline justify-between text-xs">
                  <span>
                    {daysLeft} {daysLeft === 1 ? 'día' : 'días'} restantes
                  </span>
                  <span className="opacity-60">vence {format(new Date(sub.endsAt), 'd MMM', { locale: es })}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-atlas-black/15">
                  <div
                    className="h-full bg-atlas-black"
                    style={{ width: `${subUsedPct}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-atlas-ink p-6">
              <p className="text-xs uppercase tracking-wider text-atlas-yellow">Sin plan activo</p>
              <p className="mt-2 text-sm text-atlas-white/70">
                Acércate a recepción para activar tu suscripción y empezar a entrenar.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<TrendingUp size={18} />} label="Total" value={String(streakQ.data?.total ?? 0)} sub="entradas" />
            <Stat icon={<Trophy size={18} />} label="Logros" value={String(badgesQ.data?.badges.length ?? 0)} sub="desbloqueados" />
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="mx-auto mt-12 max-w-5xl px-6 pb-16">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-atlas-yellow">
          <Trophy size={14} /> Logros
        </h2>
        {!badgesQ.data || badgesQ.data.badges.length === 0 ? (
          <div className="rounded-2xl bg-atlas-ink p-8 text-center">
            <p className="text-atlas-white/60">
              Aún no desbloqueas logros. Marca tu primera entrada para empezar.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badgesQ.data.badges.map((b) => (
              <li key={b.id} className="rounded-2xl bg-atlas-ink p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-atlas-yellow">
                    <Trophy size={20} className="text-atlas-black" />
                  </div>
                  <div>
                    <p className="font-display uppercase">{b.badge.name}</p>
                    <p className="text-xs text-atlas-white/60">{b.badge.description}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-atlas-white/40">
                      {format(new Date(b.unlockedAt), "d 'de' MMM", { locale: es })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-atlas-ink p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-yellow">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-3xl uppercase">{value}</p>
      <p className="text-xs text-atlas-white/40">{sub}</p>
    </div>
  );
}

