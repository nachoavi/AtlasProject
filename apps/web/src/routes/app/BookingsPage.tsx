import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CalendarPlus, Activity, Footprints, Apple, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '../../lib/api';

type ServiceCode = 'KINESIOLOGIA' | 'PODOLOGIA' | 'NUTRICION';

type Booking = {
  id: string;
  serviceType: ServiceCode;
  slotStart: string;
  slotEnd: string;
  status: 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  notes: string | null;
  professional: {
    id: string;
    user: { fullName: string };
  };
};

const SERVICE_ICONS: Record<ServiceCode, React.ReactNode> = {
  KINESIOLOGIA: <Activity size={20} />,
  PODOLOGIA: <Footprints size={20} />,
  NUTRICION: <Apple size={20} />,
};
const SERVICE_LABELS: Record<ServiceCode, string> = {
  KINESIOLOGIA: 'Kinesiología',
  PODOLOGIA: 'Podología',
  NUTRICION: 'Nutrición',
};

export function BookingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const upcoming = useQuery({
    queryKey: ['me', 'bookings', 'upcoming'],
    queryFn: () => apiFetch<{ bookings: Booking[] }>('/me/bookings?scope=upcoming'),
  });
  const past = useQuery({
    queryKey: ['me', 'bookings', 'past'],
    queryFn: () => apiFetch<{ bookings: Booking[] }>('/me/bookings?scope=past'),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => apiFetch(`/me/bookings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Reserva cancelada');
      qc.invalidateQueries({ queryKey: ['me', 'bookings'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
    },
  });

  return (
    <main className="min-h-dvh bg-atlas-black text-atlas-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white"
        >
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => navigate('/app/reservas/nueva')}
          className="inline-flex items-center gap-2 rounded-full bg-atlas-coral px-5 py-2 font-display text-sm uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover"
        >
          <CalendarPlus size={16} />
          Reservar hora
        </button>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">
          Tus servicios
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase">Reservas</h1>

        <h2 className="mt-12 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
          Próximas ({upcoming.data?.bookings.length ?? 0})
        </h2>
        {upcoming.data && upcoming.data.bookings.length === 0 ? (
          <div className="rounded-2xl bg-atlas-ink p-8 text-center">
            <p className="text-atlas-white/60">
              Aún no tienes reservas. Pide hora con kinesiología, podología o nutrición.
            </p>
            <button
              type="button"
              onClick={() => navigate('/app/reservas/nueva')}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-atlas-coral px-5 py-2 font-display text-sm uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover"
            >
              <CalendarPlus size={16} /> Reservar
            </button>
          </div>
        ) : (
          <ul className="grid gap-3">
            {upcoming.data?.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 rounded-2xl bg-atlas-ink p-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-atlas-yellow text-atlas-black">
                    {SERVICE_ICONS[b.serviceType]}
                  </span>
                  <div>
                    <p className="font-display text-lg uppercase">{SERVICE_LABELS[b.serviceType]}</p>
                    <p className="text-sm text-atlas-white/70">{b.professional.user.fullName}</p>
                    <p className="text-xs text-atlas-yellow">
                      {format(parseISO(b.slotStart), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (confirm('¿Cancelar esta reserva?')) cancel.mutate(b.id);
                  }}
                  className="rounded-full border border-atlas-white/20 px-4 py-2 text-xs uppercase tracking-wider hover:bg-atlas-white/10"
                >
                  <X size={14} className="inline" /> Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}

        {past.data && past.data.bookings.length > 0 && (
          <>
            <h2 className="mt-12 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
              Historial
            </h2>
            <ul className="grid gap-2 text-sm">
              {past.data.bookings.slice(0, 10).map((b) => (
                <li
                  key={b.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-atlas-ink/60 px-5 py-3"
                >
                  <span className="text-atlas-white/40">
                    {format(parseISO(b.slotStart), 'd MMM', { locale: es })}
                  </span>
                  <span>
                    {SERVICE_LABELS[b.serviceType]} · {b.professional.user.fullName}
                  </span>
                  <span className="rounded-full bg-atlas-black px-3 py-1 text-[10px] uppercase tracking-wider text-atlas-white/60">
                    {b.status === 'ATTENDED' ? 'Asistió' : b.status === 'CANCELLED' ? 'Cancelada' : b.status === 'NO_SHOW' ? 'No-show' : 'Pendiente'}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

