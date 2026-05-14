import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Users, CalendarClock, TrendingUp } from 'lucide-react';
import { formatClp, PAYMENT_METHOD_LABELS, type PaymentMethodCode } from '@atlas/shared';
import { apiFetch } from '../../lib/api';

type Dashboard = {
  today: {
    revenueClp: number;
    paymentsCount: number;
    subscriptionsCount: number;
    byMethod: Array<{ method: PaymentMethodCode | null; amountClp: number; count: number }>;
  };
  expiringWithin7Days: number;
};

export function StaffDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'dashboard'],
    queryFn: () => apiFetch<Dashboard>('/staff/dashboard'),
    refetchInterval: 30_000,
  });

  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">Hoy</p>
      <h1 className="mt-2 font-display text-5xl uppercase leading-[0.95] sm:text-6xl">
        Panel de <span className="text-atlas-yellow">recepción</span>
      </h1>

      <Link
        to="/staff/inscribir"
        className="mt-8 inline-flex items-center gap-3 rounded-full bg-atlas-coral px-7 py-4 font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover"
      >
        Inscribir miembro
        <ArrowRight size={18} />
      </Link>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<TrendingUp size={20} />}
          label="Recaudado hoy"
          value={isLoading ? '—' : formatClp(data?.today.revenueClp ?? 0)}
          sub={`${data?.today.paymentsCount ?? 0} pagos`}
        />
        <Stat
          icon={<Users size={20} />}
          label="Inscripciones hoy"
          value={isLoading ? '—' : String(data?.today.subscriptionsCount ?? 0)}
          sub="Nuevas suscripciones"
        />
        <Stat
          icon={<CalendarClock size={20} />}
          label="Próximos 7 días"
          value={isLoading ? '—' : String(data?.expiringWithin7Days ?? 0)}
          sub="Suscripciones por vencer"
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
          Métodos de pago hoy
        </h2>
        <div className="overflow-hidden rounded-2xl bg-atlas-ink">
          {(data?.today.byMethod ?? []).length === 0 ? (
            <p className="px-6 py-8 text-sm text-atlas-white/50">Aún no hay pagos registrados hoy.</p>
          ) : (
            <ul>
              {data?.today.byMethod.map((row) => (
                <li
                  key={row.method ?? 'unknown'}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-atlas-white/5 px-6 py-3 last:border-b-0"
                >
                  <span className="font-medium">
                    {row.method ? PAYMENT_METHOD_LABELS[row.method] : 'Sin método'}
                  </span>
                  <span className="text-sm text-atlas-white/50">{row.count}×</span>
                  <span className="font-display text-lg text-atlas-yellow">{formatClp(row.amountClp)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-atlas-ink p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-yellow">
        {icon}
        {label}
      </div>
      <p className="mt-3 font-display text-4xl uppercase">{value}</p>
      <p className="mt-1 text-xs text-atlas-white/50">{sub}</p>
    </div>
  );
}
