import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, CalendarPlus, Users, X, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';

type Pack = {
  id: string;
  sessionsRemaining: number;
  sessionsTotal: number;
  startsAt: string;
  expiresAt: string;
  sessionPack: {
    code: string;
    name: string;
    variant: 'LEGION' | 'TRANSFORMA';
    groupSizeMin: number;
    groupSizeMax: number;
    sessionDurationMin: number;
  };
};

type Session = {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  trainer: { id: string; fullName: string };
  userSessionPack: { sessionPack: { name: string; variant: string } };
  participants?: Array<{ id: string; userId: string | null; guestName: string | null }>;
};

type Trainer = { id: string; fullName: string };

type PacksResponse = {
  packs: Pack[];
  upcomingSessions: Session[];
  pastSessions: Session[];
};

export function SessionPacksPage() {
  const [redeeming, setRedeeming] = useState<Pack | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me', 'session-packs'],
    queryFn: () => apiFetch<PacksResponse>('/me/session-packs'),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => apiFetch(`/me/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Sesión cancelada · se devolvió al pack');
      qc.invalidateQueries({ queryKey: ['me', 'session-packs'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
    },
  });

  if (redeeming) {
    return (
      <RedeemForm
        pack={redeeming}
        onBack={() => setRedeeming(null)}
        onDone={() => {
          setRedeeming(null);
          qc.invalidateQueries({ queryKey: ['me', 'session-packs'] });
        }}
      />
    );
  }

  const packs = data?.packs ?? [];
  const upcoming = data?.upcomingSessions ?? [];

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
          Entrenamiento personalizado
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase">Mis sesiones</h1>
        <p className="mt-3 max-w-xl text-sm text-atlas-white/60">
          Tus packs Atlas Legión (grupal) y Atlas Transforma (1:1). Agenda tus sesiones con el
          entrenador.
        </p>

        {/* Packs activos */}
        <h2 className="mt-10 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
          Packs activos
        </h2>
        {isLoading ? (
          <p className="text-sm text-atlas-white/40">Cargando…</p>
        ) : packs.length === 0 ? (
          <div className="rounded-2xl bg-atlas-ink p-8 text-center">
            <p className="text-atlas-white/60">
              No tienes packs activos. Acércate a recepción para contratar Atlas Legión o
              Transforma.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {packs.map((p) => {
              const usedPct =
                ((p.sessionsTotal - p.sessionsRemaining) / p.sessionsTotal) * 100;
              return (
                <li key={p.id} className="rounded-3xl bg-atlas-yellow p-6 text-atlas-black">
                  <p className="text-xs uppercase tracking-wider opacity-70">
                    {p.sessionPack.variant === 'LEGION' ? 'Grupal 2-3p' : 'Personalizado 1:1'}
                  </p>
                  <h3 className="font-display text-2xl uppercase leading-tight">
                    {p.sessionPack.name}
                  </h3>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-display text-3xl">{p.sessionsRemaining}</span>
                      <span className="text-xs uppercase tracking-wider">
                        de {p.sessionsTotal} disponibles
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-atlas-black/15">
                      <div className="h-full bg-atlas-black" style={{ width: `${usedPct}%` }} />
                    </div>
                    <p className="mt-2 text-xs">
                      Vence {format(parseISO(p.expiresAt), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRedeeming(p)}
                    disabled={p.sessionsRemaining <= 0}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-atlas-coral px-5 py-3 font-display uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover disabled:opacity-40"
                  >
                    <CalendarPlus size={16} />
                    Agendar sesión
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Próximas sesiones */}
        <h2 className="mt-12 mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
          Próximas sesiones ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-atlas-white/40">No tienes sesiones agendadas.</p>
        ) : (
          <ul className="grid gap-2">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-atlas-ink p-5"
              >
                <div>
                  <p className="font-display uppercase">
                    {s.userSessionPack.sessionPack.name}
                  </p>
                  <p className="text-xs text-atlas-yellow">
                    {format(parseISO(s.scheduledAt), "EEEE d 'de' MMM · HH:mm", { locale: es })}
                  </p>
                  <p className="text-xs text-atlas-white/60">
                    {s.trainer.fullName}
                    {s.participants && s.participants.length > 1
                      ? ` · ${s.participants.length} personas`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Cancelar esta sesión? Se devolverá al pack.')) cancel.mutate(s.id);
                  }}
                  className="rounded-full border border-atlas-white/20 px-3 py-1.5 text-xs uppercase tracking-wider hover:bg-atlas-white/10"
                >
                  <X size={12} className="inline" /> Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// =====================================================
// Formulario para agendar (redimir) una sesión del pack
// =====================================================
function RedeemForm({
  pack,
  onBack,
  onDone,
}: {
  pack: Pack;
  onBack: () => void;
  onDone: () => void;
}) {
  const isLegion = pack.sessionPack.variant === 'LEGION';
  const maxExtra = pack.sessionPack.groupSizeMax - 1; // sin contar al dueño
  const minExtra = pack.sessionPack.groupSizeMin - 1;

  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [trainerId, setTrainerId] = useState('');
  const [guests, setGuests] = useState<string[]>(isLegion ? [''] : []);

  const trainersQ = useQuery({
    queryKey: ['me', 'trainers'],
    queryFn: () => apiFetch<{ trainers: Trainer[] }>('/me/trainers'),
  });

  const redeem = useMutation({
    mutationFn: () => {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const participants = guests
        .map((g) => g.trim())
        .filter((g) => g.length >= 2)
        .map((guestName) => ({ guestName }));
      return apiFetch(`/me/session-packs/${pack.id}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ scheduledAt, trainerId, participants }),
      });
    },
    onSuccess: () => {
      toast.success('Sesión agendada');
      onDone();
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('No se pudo agendar');
    },
  });

  const validGuests = guests.map((g) => g.trim()).filter((g) => g.length >= 2);
  const canSubmit =
    date &&
    time &&
    trainerId &&
    (!isLegion || (validGuests.length >= minExtra && validGuests.length <= maxExtra));

  const minDate = format(startOfDay(new Date()), 'yyyy-MM-dd');

  return (
    <main className="min-h-dvh bg-atlas-black text-atlas-white">
      <section className="mx-auto max-w-2xl px-6 py-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white"
        >
          <ArrowLeft size={14} /> Mis sesiones
        </button>

        <div className="rounded-2xl bg-atlas-yellow p-5 text-atlas-black">
          <p className="text-xs uppercase tracking-wider opacity-70">Agendar sesión de</p>
          <p className="font-display text-2xl uppercase">{pack.sessionPack.name}</p>
          <p className="text-xs">
            {pack.sessionsRemaining} sesiones restantes · {pack.sessionPack.sessionDurationMin} min
          </p>
        </div>

        <h2 className="mt-8 font-display text-3xl uppercase">Detalles</h2>

        <div className="mt-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-atlas-white/70">
                Fecha
              </span>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-2 border-atlas-white/10 bg-atlas-ink px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-atlas-white/70">
                Hora
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl border-2 border-atlas-white/10 bg-atlas-ink px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-atlas-white/70">
              Entrenador
            </span>
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="rounded-xl border-2 border-atlas-white/10 bg-atlas-ink px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
            >
              <option value="">Selecciona…</option>
              {trainersQ.data?.trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </label>

          {isLegion && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-atlas-white/70">
                <Users size={14} />
                Acompañantes ({pack.sessionPack.groupSizeMin}-{pack.sessionPack.groupSizeMax}{' '}
                personas en total contigo)
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {guests.map((g, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={g}
                      onChange={(e) =>
                        setGuests((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))
                      }
                      placeholder={`Nombre del acompañante ${i + 1}`}
                      className="flex-1 rounded-xl border-2 border-atlas-white/10 bg-atlas-ink px-4 py-3 text-sm text-atlas-white focus:border-atlas-yellow focus:outline-none"
                    />
                    {guests.length > minExtra && (
                      <button
                        type="button"
                        onClick={() => setGuests((arr) => arr.filter((_, j) => j !== i))}
                        className="rounded-xl border-2 border-atlas-white/10 px-3 hover:bg-atlas-white/5"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {guests.length < maxExtra && (
                  <button
                    type="button"
                    onClick={() => setGuests((arr) => [...arr, ''])}
                    className="inline-flex items-center gap-2 self-start text-sm text-atlas-yellow hover:underline"
                  >
                    <Plus size={14} /> Agregar acompañante
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={!canSubmit || redeem.isPending}
            onClick={() => redeem.mutate()}
            className={cn(
              'mt-2 inline-flex items-center justify-center gap-3 rounded-full px-8 py-4',
              'bg-atlas-coral font-display uppercase tracking-wider text-atlas-white',
              'hover:bg-atlas-coral-hover disabled:opacity-40',
            )}
          >
            {redeem.isPending ? 'Agendando…' : 'Confirmar sesión'}
            {redeem.isPending ? <Check size={18} /> : <ArrowRight size={18} />}
          </button>

          <p className="text-xs text-atlas-white/40">
            Puedes cancelar hasta 12h antes y la sesión vuelve a tu pack.
          </p>
        </div>
      </section>
    </main>
  );
}
