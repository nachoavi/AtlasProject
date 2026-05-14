import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatClp, PAYMENT_METHOD_LABELS, type PaymentMethodCode } from '@atlas/shared';
import { apiFetch } from '../../lib/api';

type Payment = {
  id: string;
  amountClp: number;
  method: PaymentMethodCode | null;
  target: 'SUBSCRIPTION' | 'SESSION_PACK' | 'WORKSHOP_ENROLLMENT' | 'EVENT_RSVP';
  targetRef: string | null;
  notes: string | null;
  completedAt: string;
  collectedBy: { id: string; fullName: string } | null;
};

export function CashRegister() {
  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'payments', 'today'],
    queryFn: () => apiFetch<{ payments: Payment[] }>('/staff/payments/today'),
  });

  const payments = data?.payments ?? [];
  const total = payments.reduce((sum, p) => sum + p.amountClp, 0);

  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">
        {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
      </p>
      <h1 className="mt-2 font-display text-5xl uppercase">Caja del día</h1>

      <div className="mt-6 inline-block rounded-2xl bg-atlas-yellow px-8 py-6 text-atlas-black">
        <p className="text-xs uppercase tracking-wider opacity-70">Total recaudado</p>
        <p className="font-display text-5xl">{formatClp(total)}</p>
        <p className="mt-1 text-xs">{payments.length} pagos</p>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl bg-atlas-ink">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-atlas-white/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-atlas-white/60">
          <span>Hora · Concepto</span>
          <span>Método</span>
          <span>Recibido por</span>
          <span className="text-right">Monto</span>
        </div>
        {isLoading ? (
          <p className="px-6 py-8 text-sm text-atlas-white/50">Cargando…</p>
        ) : payments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-atlas-white/50">Aún no hay pagos hoy.</p>
        ) : (
          <ul>
            {payments.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-atlas-white/5 px-6 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-sm">
                    <span className="font-mono text-atlas-white/50">
                      {format(new Date(p.completedAt), 'HH:mm')}
                    </span>{' '}
                    · {targetLabel(p.target)}
                  </p>
                  {p.notes && <p className="text-xs text-atlas-white/40">{p.notes}</p>}
                </div>
                <span className="rounded-full bg-atlas-black px-3 py-1 text-xs">
                  {p.method ? PAYMENT_METHOD_LABELS[p.method] : '—'}
                </span>
                <span className="text-xs text-atlas-white/60">
                  {p.collectedBy?.fullName ?? '—'}
                </span>
                <span className="text-right font-display text-lg text-atlas-yellow">
                  {formatClp(p.amountClp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function targetLabel(t: Payment['target']): string {
  switch (t) {
    case 'SUBSCRIPTION':
      return 'Plan mensual';
    case 'SESSION_PACK':
      return 'Pack de sesiones';
    case 'WORKSHOP_ENROLLMENT':
      return 'Taller';
    case 'EVENT_RSVP':
      return 'Evento';
  }
}
