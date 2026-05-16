import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Users, Check, CalendarHeart } from 'lucide-react';
import { toast } from 'sonner';
import { formatClp } from '@atlas/shared';
import { apiFetch, ApiError } from '../../lib/api';

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  priceClp: number;
  rsvpCount: number;
};

type Rsvp = {
  id: string;
  eventId: string;
  priceChargedClp: number;
  event: { id: string; title: string; startsAt: string };
};

export function EventsPage() {
  const qc = useQueryClient();
  const eventsQ = useQuery({
    queryKey: ['events'],
    queryFn: () => apiFetch<{ events: EventItem[] }>('/events'),
  });
  const rsvpsQ = useQuery({
    queryKey: ['me', 'event-rsvps'],
    queryFn: () => apiFetch<{ rsvps: Rsvp[] }>('/me/event-rsvps'),
  });

  const rsvpedEventIds = new Set((rsvpsQ.data?.rsvps ?? []).map((r) => r.eventId));

  const rsvp = useMutation({
    mutationFn: (eventId: string) =>
      apiFetch(`/me/events/${eventId}/rsvp`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Asistencia confirmada');
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['me', 'event-rsvps'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('No se pudo confirmar');
    },
  });

  const cancelRsvp = useMutation({
    mutationFn: (id: string) => apiFetch(`/me/event-rsvps/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Asistencia cancelada');
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['me', 'event-rsvps'] });
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
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">
          Comunidad Atlas
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase">Eventos</h1>
        <p className="mt-3 max-w-xl text-sm text-atlas-white/60">
          Jornadas especiales, competencias y actividades del centro. Confirma tu lugar.
        </p>

        {eventsQ.isLoading ? (
          <p className="mt-10 text-sm text-atlas-white/40">Cargando…</p>
        ) : eventsQ.data && eventsQ.data.events.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-atlas-ink p-8 text-center text-atlas-white/60">
            No hay eventos publicados por ahora.
          </div>
        ) : (
          <ul className="mt-10 grid gap-4">
            {eventsQ.data?.events.map((e) => {
              const confirmed = rsvpedEventIds.has(e.id);
              const myRsvp = rsvpsQ.data?.rsvps.find((r) => r.eventId === e.id);
              const full = e.capacity != null && e.rsvpCount >= e.capacity;
              return (
                <li key={e.id} className="overflow-hidden rounded-3xl bg-atlas-ink">
                  <div className="flex items-start gap-4 bg-atlas-yellow p-6 text-atlas-black">
                    <CalendarHeart size={32} className="shrink-0" />
                    <div>
                      <h3 className="font-display text-2xl uppercase leading-none">{e.title}</h3>
                      <p className="mt-1 text-sm font-semibold">
                        {format(parseISO(e.startsAt), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                        {e.endsAt ? ` – ${format(parseISO(e.endsAt), 'HH:mm')}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="p-6">
                    {e.description && (
                      <p className="text-sm text-atlas-white/70">{e.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-xs text-atlas-white/50">
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} />
                          {e.rsvpCount}
                          {e.capacity != null ? `/${e.capacity}` : ''} confirmados
                        </span>
                        <span className="font-display text-sm text-atlas-white">
                          {e.priceClp > 0 ? formatClp(e.priceClp) : 'Gratis'}
                        </span>
                      </div>
                      {confirmed ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-atlas-success/20 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-atlas-success">
                            <Check size={12} /> Confirmado
                          </span>
                          <button
                            type="button"
                            onClick={() => myRsvp && cancelRsvp.mutate(myRsvp.id)}
                            className="rounded-full border border-atlas-white/20 px-3 py-1.5 text-xs uppercase tracking-wider hover:bg-atlas-white/10"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={full || rsvp.isPending}
                          onClick={() => rsvp.mutate(e.id)}
                          className="rounded-full bg-atlas-coral px-5 py-2 font-display text-sm uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover disabled:opacity-40"
                        >
                          {full ? 'Sin cupos' : 'Confirmar asistencia'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
