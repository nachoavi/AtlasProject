import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarPlus, Dumbbell, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';

type Instructor = { id: string; fullName: string; email: string };
type WorkshopType = { id: string; code: string; name: string; defaultDurationMin: number };
type Session = {
  id: string;
  startsAt: string;
  durationMin: number;
  capacity: number;
  enrolledCount: number;
  workshop: { code: string; name: string };
  instructor: { fullName: string };
};

export function WorkshopsAdmin() {
  const [tab, setTab] = useState<'workshops' | 'events'>('workshops');

  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">Programación</p>
      <h1 className="mt-2 font-display text-5xl uppercase">Talleres y eventos</h1>

      <div className="mt-6 inline-flex rounded-full bg-atlas-ink p-1">
        <button
          type="button"
          onClick={() => setTab('workshops')}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm uppercase tracking-wider transition-colors',
            tab === 'workshops' ? 'bg-atlas-yellow text-atlas-black' : 'text-atlas-white/60',
          )}
        >
          <Dumbbell size={14} /> Talleres
        </button>
        <button
          type="button"
          onClick={() => setTab('events')}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm uppercase tracking-wider transition-colors',
            tab === 'events' ? 'bg-atlas-yellow text-atlas-black' : 'text-atlas-white/60',
          )}
        >
          <Sparkles size={14} /> Eventos
        </button>
      </div>

      <div className="mt-8">{tab === 'workshops' ? <WorkshopsTab /> : <EventsTab />}</div>
    </div>
  );
}

function WorkshopsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    workshopCode: 'CALISTENIA',
    instructorId: '',
    date: '',
    time: '19:00',
    capacity: 12,
  });

  const workshopsQ = useQuery({
    queryKey: ['workshops'],
    queryFn: () => apiFetch<{ workshops: WorkshopType[] }>('/workshops'),
  });
  const instructorsQ = useQuery({
    queryKey: ['staff', 'instructors'],
    queryFn: () => apiFetch<{ instructors: Instructor[] }>('/staff/instructors'),
  });
  const sessionsQ = useQuery({
    queryKey: ['workshops', 'sessions'],
    queryFn: () => apiFetch<{ sessions: Session[] }>('/workshops/sessions'),
  });

  const create = useMutation({
    mutationFn: () => {
      const startsAt = new Date(`${form.date}T${form.time}:00`).toISOString();
      return apiFetch('/staff/workshop-sessions', {
        method: 'POST',
        body: JSON.stringify({
          workshopCode: form.workshopCode,
          instructorId: form.instructorId,
          startsAt,
          capacity: form.capacity,
        }),
      });
    },
    onSuccess: () => {
      toast.success('Sesión agendada');
      qc.invalidateQueries({ queryKey: ['workshops'] });
      setForm((f) => ({ ...f, date: '' }));
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('No se pudo agendar');
    },
  });

  const canSubmit = form.workshopCode && form.instructorId && form.date && form.time;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl bg-atlas-ink p-6">
        <h2 className="font-display text-2xl uppercase">Agendar sesión</h2>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Taller">
            <select
              value={form.workshopCode}
              onChange={(e) => setForm((f) => ({ ...f, workshopCode: e.target.value }))}
              className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
            >
              {workshopsQ.data?.workshops.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Instructor">
            <select
              value={form.instructorId}
              onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))}
              className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
            >
              <option value="">Selecciona…</option>
              {instructorsQ.data?.instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.fullName}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
              />
            </Field>
            <Field label="Hora">
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
              />
            </Field>
          </div>
          <Field label="Cupos">
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
              className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
            />
          </Field>
          <button
            type="button"
            disabled={!canSubmit || create.isPending}
            onClick={() => create.mutate()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-atlas-coral px-6 py-3 font-display uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover disabled:opacity-40"
          >
            <CalendarPlus size={16} />
            {create.isPending ? 'Agendando…' : 'Agendar sesión'}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
          Próximas sesiones ({sessionsQ.data?.sessions.length ?? 0})
        </h2>
        <ul className="grid gap-2">
          {sessionsQ.data?.sessions.map((s) => (
            <li key={s.id} className="rounded-2xl bg-atlas-ink p-4">
              <p className="font-display uppercase">{s.workshop.name}</p>
              <p className="text-xs text-atlas-yellow">
                {format(parseISO(s.startsAt), "EEE d MMM · HH:mm", { locale: es })}
              </p>
              <p className="text-xs text-atlas-white/50">
                {s.instructor.fullName} · {s.enrolledCount}/{s.capacity} cupos
              </p>
            </li>
          ))}
          {sessionsQ.data && sessionsQ.data.sessions.length === 0 && (
            <p className="text-sm text-atlas-white/40">Sin sesiones agendadas.</p>
          )}
        </ul>
      </section>
    </div>
  );
}

function EventsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '10:00',
    capacity: 50,
    priceClp: 0,
  });

  const eventsQ = useQuery({
    queryKey: ['events'],
    queryFn: () =>
      apiFetch<{ events: Array<{ id: string; title: string; startsAt: string; rsvpCount: number }> }>(
        '/events',
      ),
  });

  const create = useMutation({
    mutationFn: () => {
      const startsAt = new Date(`${form.date}T${form.time}:00`).toISOString();
      return apiFetch('/staff/events', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          startsAt,
          capacity: form.capacity || undefined,
          priceClp: form.priceClp,
          isPublished: true,
        }),
      });
    },
    onSuccess: () => {
      toast.success('Evento creado y publicado');
      qc.invalidateQueries({ queryKey: ['events'] });
      setForm({ title: '', description: '', date: '', time: '10:00', capacity: 50, priceClp: 0 });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('No se pudo crear');
    },
  });

  const canSubmit = form.title.trim().length >= 2 && form.date && form.time;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl bg-atlas-ink p-6">
        <h2 className="font-display text-2xl uppercase">Crear evento</h2>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Título">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Atlas Open Day"
              className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
            />
          </Field>
          <Field label="Descripción">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
              />
            </Field>
            <Field label="Hora">
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cupos">
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
              />
            </Field>
            <Field label="Precio CLP (0 = gratis)">
              <input
                type="number"
                min={0}
                value={form.priceClp}
                onChange={(e) => setForm((f) => ({ ...f, priceClp: Number(e.target.value) }))}
                className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-black px-4 py-3 text-atlas-white focus:border-atlas-yellow focus:outline-none"
              />
            </Field>
          </div>
          <button
            type="button"
            disabled={!canSubmit || create.isPending}
            onClick={() => create.mutate()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-atlas-coral px-6 py-3 font-display uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover disabled:opacity-40"
          >
            <Sparkles size={16} />
            {create.isPending ? 'Creando…' : 'Crear y publicar'}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
          Eventos publicados ({eventsQ.data?.events.length ?? 0})
        </h2>
        <ul className="grid gap-2">
          {eventsQ.data?.events.map((e) => (
            <li key={e.id} className="rounded-2xl bg-atlas-ink p-4">
              <p className="font-display uppercase">{e.title}</p>
              <p className="text-xs text-atlas-yellow">
                {format(parseISO(e.startsAt), "EEE d MMM · HH:mm", { locale: es })}
              </p>
              <p className="text-xs text-atlas-white/50">{e.rsvpCount} confirmados</p>
            </li>
          ))}
          {eventsQ.data && eventsQ.data.events.length === 0 && (
            <p className="text-sm text-atlas-white/40">Sin eventos publicados.</p>
          )}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-atlas-white/70">{label}</span>
      {children}
    </label>
  );
}
