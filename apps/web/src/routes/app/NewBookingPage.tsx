import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Apple, ArrowLeft, ArrowRight, Check, Footprints } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';

type ServiceCode = 'KINESIOLOGIA' | 'PODOLOGIA' | 'NUTRICION';
type AvailabilityRow = {
  professional: { id: string; fullName: string };
  slots: Array<{ start: string; end: string }>;
};

const SERVICES: Array<{ code: ServiceCode; name: string; description: string; icon: React.ReactNode }> = [
  {
    code: 'KINESIOLOGIA',
    name: 'Kinesiología',
    description: 'Recuperación y prevención de lesiones deportivas.',
    icon: <Activity size={24} />,
  },
  {
    code: 'PODOLOGIA',
    name: 'Podología',
    description: 'Cuidado biomecánico del pie deportivo.',
    icon: <Footprints size={24} />,
  },
  {
    code: 'NUTRICION',
    name: 'Nutrición',
    description: 'Plan nutricional según tus objetivos.',
    icon: <Apple size={24} />,
  },
];

export function NewBookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [service, setService] = useState<ServiceCode | null>(null);
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [picked, setPicked] = useState<{ professionalId: string; start: string } | null>(null);

  return (
    <main className="min-h-dvh bg-atlas-black text-atlas-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link
          to="/app/reservas"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white"
        >
          <ArrowLeft size={14} />
          Mis reservas
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">
          Nueva reserva
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase">Pedir hora</h1>

        <Steps step={step} />

        <div className="mt-10">
          {step === 1 && (
            <StepService onPick={(s) => { setService(s); setStep(2); }} />
          )}
          {step === 2 && service && (
            <StepDateAndSlot
              service={service}
              date={date}
              onBack={() => setStep(1)}
              onDateChange={setDate}
              onPick={(p) => {
                setPicked(p);
                setStep(3);
              }}
            />
          )}
          {step === 3 && service && picked && (
            <StepConfirm
              service={service}
              picked={picked}
              onBack={() => setStep(2)}
              onCompleted={() => navigate('/app/reservas', { replace: true })}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function Steps({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: 'Servicio' },
    { n: 2, label: 'Horario' },
    { n: 3, label: 'Confirmar' },
  ];
  return (
    <ol className="mt-8 flex items-center gap-3 text-xs uppercase tracking-wider">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <li key={it.n} className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full font-display text-sm',
                done
                  ? 'bg-atlas-success text-atlas-white'
                  : active
                    ? 'bg-atlas-yellow text-atlas-black'
                    : 'bg-atlas-ink text-atlas-white/40',
              )}
            >
              {done ? <Check size={14} /> : it.n}
            </span>
            <span className={cn(active || done ? 'text-atlas-white' : 'text-atlas-white/40')}>
              {it.label}
            </span>
            {i < items.length - 1 && <span className="text-atlas-white/20">·</span>}
          </li>
        );
      })}
    </ol>
  );
}

function StepService({ onPick }: { onPick: (s: ServiceCode) => void }) {
  return (
    <section>
      <h2 className="font-display text-3xl uppercase">¿Qué servicio necesitas?</h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {SERVICES.map((s) => (
          <li key={s.code}>
            <button
              type="button"
              onClick={() => onPick(s.code)}
              className="group flex h-full w-full flex-col gap-3 rounded-2xl bg-atlas-ink p-6 text-left transition-colors hover:bg-atlas-yellow hover:text-atlas-black"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-atlas-yellow text-atlas-black group-hover:bg-atlas-black group-hover:text-atlas-yellow">
                {s.icon}
              </span>
              <p className="font-display text-xl uppercase">{s.name}</p>
              <p className="text-sm opacity-80">{s.description}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StepDateAndSlot({
  service,
  date,
  onBack,
  onDateChange,
  onPick,
}: {
  service: ServiceCode;
  date: Date;
  onBack: () => void;
  onDateChange: (d: Date) => void;
  onPick: (p: { professionalId: string; start: string }) => void;
}) {
  // Próximos 14 días para elegir
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return startOfDay(d);
  });

  const { data, isFetching } = useQuery({
    queryKey: ['availability', service, date.toISOString()],
    queryFn: () =>
      apiFetch<{ availability: AvailabilityRow[] }>(
        `/services/${service}/availability?date=${date.toISOString()}`,
      ),
  });

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white"
      >
        <ArrowLeft size={14} /> Cambiar servicio
      </button>

      <h2 className="font-display text-3xl uppercase">Elige día y hora</h2>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => {
          const active = isSameDay(d, date);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onDateChange(d)}
              className={cn(
                'flex shrink-0 flex-col items-center rounded-xl px-4 py-3 text-center transition-colors',
                active
                  ? 'bg-atlas-yellow text-atlas-black'
                  : 'bg-atlas-ink text-atlas-white/70 hover:bg-atlas-white/5',
              )}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                {format(d, 'EEE', { locale: es })}
              </span>
              <span className="font-display text-2xl">{format(d, 'd')}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-60">
                {format(d, 'MMM', { locale: es })}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {isFetching ? (
          <p className="text-sm text-atlas-white/40">Cargando disponibilidad…</p>
        ) : !data || data.availability.every((row) => row.slots.length === 0) ? (
          <div className="rounded-2xl bg-atlas-ink p-8 text-center">
            <p className="text-atlas-white/60">No hay horas disponibles este día.</p>
            <p className="mt-1 text-xs text-atlas-white/40">Prueba otro día más adelante.</p>
          </div>
        ) : (
          <ul className="grid gap-6">
            {data.availability.map((row) =>
              row.slots.length === 0 ? null : (
                <li key={row.professional.id}>
                  <p className="mb-2 font-display text-lg uppercase">{row.professional.fullName}</p>
                  <ul className="flex flex-wrap gap-2">
                    {row.slots.map((s) => (
                      <li key={s.start}>
                        <button
                          type="button"
                          onClick={() =>
                            onPick({ professionalId: row.professional.id, start: s.start })
                          }
                          className="rounded-full bg-atlas-ink px-4 py-2 font-mono text-sm hover:bg-atlas-yellow hover:text-atlas-black"
                        >
                          {format(parseISO(s.start), 'HH:mm')}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </section>
  );
}

function StepConfirm({
  service,
  picked,
  onBack,
  onCompleted,
}: {
  service: ServiceCode;
  picked: { professionalId: string; start: string };
  onBack: () => void;
  onCompleted: () => void;
}) {
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  // Necesitamos el nombre del profesional para el resumen
  const { data: profData } = useQuery({
    queryKey: ['services', service, 'professionals'],
    queryFn: () =>
      apiFetch<{ professionals: Array<{ id: string; user: { fullName: string } }> }>(
        `/services/${service}/professionals`,
      ),
  });
  const prof = profData?.professionals.find((p) => p.id === picked.professionalId);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/me/bookings', {
        method: 'POST',
        body: JSON.stringify({
          professionalId: picked.professionalId,
          slotStart: picked.start,
          notes: notes || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success('Reserva confirmada');
      qc.invalidateQueries({ queryKey: ['me', 'bookings'] });
      onCompleted();
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('No se pudo crear la reserva');
    },
  });

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white"
      >
        <ArrowLeft size={14} /> Cambiar horario
      </button>

      <h2 className="font-display text-3xl uppercase">Confirma tu reserva</h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-atlas-yellow p-5 text-atlas-black">
          <p className="text-xs uppercase tracking-wider opacity-70">Servicio</p>
          <p className="mt-1 font-display text-2xl uppercase">{service}</p>
          <p className="mt-1 text-sm">{prof?.user.fullName ?? '…'}</p>
        </div>
        <div className="rounded-2xl bg-atlas-ink p-5">
          <p className="text-xs uppercase tracking-wider text-atlas-yellow">Cuándo</p>
          <p className="mt-1 font-display text-2xl uppercase">
            {format(parseISO(picked.start), "EEEE d 'de' MMM", { locale: es })}
          </p>
          <p className="mt-1 text-sm text-atlas-white/70">
            {format(parseISO(picked.start), 'HH:mm')} hrs · 30 min
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-atlas-white/70">
          Notas para el profesional (opcional)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Ej: dolor de rodilla por entrenamiento, alergia, objetivos…"
          className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-ink px-4 py-3 text-sm focus:border-atlas-yellow focus:outline-none"
        />
      </div>

      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="mt-8 inline-flex items-center gap-3 rounded-full bg-atlas-coral px-8 py-4 font-display uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover disabled:opacity-50"
      >
        {mutation.isPending ? 'Reservando…' : 'Confirmar reserva'}
        <ArrowRight size={18} />
      </button>

      <p className="mt-4 text-xs text-atlas-white/40">
        Puedes cancelar sin costo hasta 12h antes de la hora.
      </p>
    </section>
  );
}
