import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Users, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatClp } from '@atlas/shared';
import { apiFetch, ApiError } from '../../lib/api';

type Session = {
  id: string;
  startsAt: string;
  durationMin: number;
  capacity: number;
  enrolledCount: number;
  workshop: { code: string; name: string; basePriceClp: number };
  instructor: { id: string; fullName: string };
};

type Enrollment = {
  id: string;
  status: 'BOOKED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';
  priceChargedClp: number;
  session: {
    id: string;
    startsAt: string;
    workshop: { name: string };
    instructor: { fullName: string };
  };
};

export function WorkshopsPage() {
  const qc = useQueryClient();
  const sessionsQ = useQuery({
    queryKey: ['workshops', 'sessions'],
    queryFn: () => apiFetch<{ sessions: Session[] }>('/workshops/sessions'),
  });
  const enrollmentsQ = useQuery({
    queryKey: ['me', 'workshop-enrollments'],
    queryFn: () => apiFetch<{ enrollments: Enrollment[] }>('/me/workshop-enrollments'),
  });

  const enrolledSessionIds = new Set(
    (enrollmentsQ.data?.enrollments ?? [])
      .filter((e) => e.status !== 'CANCELLED')
      .map((e) => e.session.id),
  );

  const enroll = useMutation({
    mutationFn: (sessionId: string) =>
      apiFetch<{ discountPct: number }>('/me/workshop-enrollments', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }),
    onSuccess: (res) => {
      toast.success(
        res.discountPct > 0
          ? `Inscrito · ${res.discountPct}% de descuento aplicado`
          : 'Inscrito en el taller',
      );
      qc.invalidateQueries({ queryKey: ['workshops'] });
      qc.invalidateQueries({ queryKey: ['me', 'workshop-enrollments'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('No se pudo inscribir');
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => apiFetch(`/me/workshop-enrollments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Inscripción cancelada');
      qc.invalidateQueries({ queryKey: ['workshops'] });
      qc.invalidateQueries({ queryKey: ['me', 'workshop-enrollments'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
    },
  });

  const activeEnrollments = (enrollmentsQ.data?.enrollments ?? []).filter(
    (e) => e.status !== 'CANCELLED',
  );

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
          Clases dirigidas
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase">Talleres</h1>
        <p className="mt-3 max-w-xl text-sm text-atlas-white/60">
          Calistenia y escalada con instructor. Tu plan aplica descuento automático en el precio.
        </p>

        {activeEnrollments.length > 0 && (
          <>
            <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
              Tus inscripciones
            </h2>
            <ul className="grid gap-2">
              {activeEnrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-atlas-ink p-4"
                >
                  <div>
                    <p className="font-display uppercase">{e.session.workshop.name}</p>
                    <p className="text-xs text-atlas-yellow">
                      {format(parseISO(e.session.startsAt), "EEEE d 'de' MMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Cancelar inscripción?')) cancel.mutate(e.id);
                    }}
                    className="rounded-full border border-atlas-white/20 px-3 py-1.5 text-xs uppercase tracking-wider hover:bg-atlas-white/10"
                  >
                    <X size={12} className="inline" /> Cancelar
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
          Próximas sesiones
        </h2>
        {sessionsQ.isLoading ? (
          <p className="text-sm text-atlas-white/40">Cargando…</p>
        ) : sessionsQ.data && sessionsQ.data.sessions.length === 0 ? (
          <div className="rounded-2xl bg-atlas-ink p-8 text-center text-atlas-white/60">
            No hay talleres agendados por ahora. Vuelve pronto.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {sessionsQ.data?.sessions.map((s) => {
              const full = s.enrolledCount >= s.capacity;
              const enrolled = enrolledSessionIds.has(s.id);
              return (
                <li key={s.id} className="flex flex-col gap-3 rounded-2xl bg-atlas-ink p-5">
                  <div>
                    <p className="font-display text-xl uppercase">{s.workshop.name}</p>
                    <p className="text-sm text-atlas-yellow">
                      {format(parseISO(s.startsAt), "EEEE d 'de' MMM · HH:mm", { locale: es })}
                    </p>
                    <p className="mt-1 text-xs text-atlas-white/60">
                      {s.instructor.fullName} · {s.durationMin} min
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-atlas-white/50">
                      <Users size={12} /> {s.enrolledCount}/{s.capacity} cupos
                    </span>
                    <span className="font-display text-sm">
                      {s.workshop.basePriceClp > 0 ? formatClp(s.workshop.basePriceClp) : 'Gratis'}
                    </span>
                  </div>
                  {enrolled ? (
                    <span className="inline-flex items-center justify-center gap-2 rounded-full bg-atlas-success/20 px-4 py-2 text-sm font-display uppercase tracking-wider text-atlas-success">
                      <Check size={14} /> Inscrito
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={full || enroll.isPending}
                      onClick={() => enroll.mutate(s.id)}
                      className="rounded-full bg-atlas-coral px-4 py-2 text-sm font-display uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover disabled:opacity-40"
                    >
                      {full ? 'Sin cupos' : 'Inscribirme'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
