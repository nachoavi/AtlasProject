import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, ScanLine, Check, AlertTriangle, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';

type Member = {
  id: string;
  email: string;
  fullName: string;
  rut: string | null;
  subscriptions: Array<{ id: string; endsAt: string; plan: { code: string; name: string; daysPerWeek: number } }>;
};

type CheckInResponse = {
  checkIn: { id: string; occurredAt: string };
  newBadges: Array<{ id: string; code: string; name: string }>;
  weeklyUsage: { used: number; allowed: number } | null;
  member?: { id: string; fullName: string; email: string; rut: string | null };
};

type TodayCheckIn = {
  id: string;
  occurredAt: string;
  source: 'STAFF_SCAN' | 'SELF_QR' | 'STAFF_MANUAL';
  user: { id: string; fullName: string; email: string };
};

export function CheckinPage() {
  const [tab, setTab] = useState<'search' | 'scan'>('search');

  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">Hoy</p>
      <h1 className="mt-2 font-display text-5xl uppercase">Check-in</h1>

      <div className="mt-6 inline-flex rounded-full bg-atlas-ink p-1">
        <button
          type="button"
          onClick={() => setTab('search')}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm uppercase tracking-wider transition-colors',
            tab === 'search' ? 'bg-atlas-yellow text-atlas-black' : 'text-atlas-white/60 hover:text-atlas-white',
          )}
        >
          <Search size={14} />
          Buscar miembro
        </button>
        <button
          type="button"
          onClick={() => setTab('scan')}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm uppercase tracking-wider transition-colors',
            tab === 'scan' ? 'bg-atlas-yellow text-atlas-black' : 'text-atlas-white/60 hover:text-atlas-white',
          )}
        >
          <ScanLine size={14} />
          Escanear QR
        </button>
      </div>

      <div className="mt-8">
        {tab === 'search' ? <SearchPane /> : <ScanPane />}
      </div>

      <TodayList />
    </div>
  );
}

// =====================================================
// Buscar miembro
// =====================================================
function SearchPane() {
  const [q, setQ] = useState('');
  const qc = useQueryClient();
  // Siempre consulta: sin texto muestra miembros recientes.
  const { data, isFetching } = useQuery({
    queryKey: ['staff', 'members', 'search', q],
    queryFn: () => apiFetch<{ members: Member[] }>(`/staff/members/search?q=${encodeURIComponent(q)}`),
  });

  const mutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch<CheckInResponse>('/staff/check-ins', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: (result, userId) => {
      const member = data?.members.find((m) => m.id === userId);
      toast.success(`Entrada registrada · ${member?.fullName ?? 'Miembro'}`);
      if (result.newBadges?.length) {
        for (const b of result.newBadges) {
          toast(`🏆 Nuevo logro: ${b.name}`, { duration: 6000 });
        }
      }
      qc.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err, userId) => {
      const member = data?.members.find((m) => m.id === userId);
      if (err instanceof ApiError) {
        if (err.code === 'WEEKLY_QUOTA_REACHED') {
          if (confirm(`${err.message}\n\n¿Forzar entrada igualmente?`)) {
            void apiFetch<CheckInResponse>('/staff/check-ins', {
              method: 'POST',
              body: JSON.stringify({ userId, force: true }),
            })
              .then(() => {
                toast.success(`Entrada forzada · ${member?.fullName ?? 'Miembro'}`);
                qc.invalidateQueries({ queryKey: ['staff'] });
              })
              .catch(() => toast.error('No se pudo registrar'));
          }
          return;
        }
        toast.error(err.message);
      } else {
        toast.error('Error de red');
      }
    },
  });

  return (
    <section>
      <div className="flex items-center gap-3 rounded-2xl bg-atlas-ink px-4 py-3 ring-1 ring-atlas-white/10 focus-within:ring-atlas-yellow">
        <Search size={18} className="text-atlas-white/40" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="RUT, email o nombre…"
          autoFocus
          className="flex-1 bg-transparent text-atlas-white outline-none placeholder:text-atlas-white/30"
        />
      </div>

      <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/50">
        {q.trim().length > 0 ? 'Resultados' : 'Miembros recientes'}
      </p>

      <div className="min-h-[100px]">
        {isFetching && (data?.members.length ?? 0) === 0 ? (
          <p className="text-sm text-atlas-white/40">Cargando…</p>
        ) : data?.members.length === 0 ? (
          <p className="text-sm text-atlas-white/40">Sin resultados.</p>
        ) : (
          <ul className="grid gap-2">
            {data?.members.map((m) => {
              const sub = m.subscriptions[0];
              const isPending = mutation.isPending && mutation.variables === m.id;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-atlas-ink px-5 py-4"
                >
                  <div>
                    <p className="font-display text-lg uppercase">{m.fullName}</p>
                    <p className="text-xs text-atlas-white/60">
                      {m.email} {m.rut ? `· ${m.rut}` : ''}
                    </p>
                    {sub ? (
                      <p className="mt-1 text-xs text-atlas-yellow">
                        {sub.plan.name} · vence {format(new Date(sub.endsAt), "d MMM", { locale: es })}
                      </p>
                    ) : (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-atlas-coral">
                        <AlertTriangle size={12} /> Sin plan activo
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => mutation.mutate(m.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-atlas-coral px-5 py-2 font-display text-sm uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover disabled:opacity-50"
                  >
                    <Check size={14} />
                    {isPending ? '…' : 'Marcar entrada'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Escanear QR (entrada manual del token o pegado desde cámara externa)
// =====================================================
function ScanPane() {
  const [token, setToken] = useState('');
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<CheckInResponse>('/staff/check-ins/scan', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim() }),
      }),
    onSuccess: (result) => {
      toast.success(`Entrada registrada · ${result.member?.fullName ?? 'Miembro'}`);
      if (result.newBadges?.length) {
        for (const b of result.newBadges) {
          toast(`🏆 Nuevo logro: ${b.name}`, { duration: 6000 });
        }
      }
      setToken('');
      qc.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_OR_EXPIRED_QR') toast.error('QR inválido o expirado');
        else toast.error(err.message);
      } else toast.error('Error de red');
    },
  });

  return (
    <section>
      <p className="text-sm text-atlas-white/60">
        Pídele al miembro que abra su app y muestre el QR. Escanéalo (o ingresa el código manualmente
        si tu cámara está fallando).
      </p>
      <div className="mt-6 flex gap-3">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Pega aquí el código del QR…"
          className="flex-1 rounded-2xl bg-atlas-ink px-4 py-3 font-mono text-sm text-atlas-white ring-1 ring-atlas-white/10 focus:outline-none focus:ring-atlas-yellow"
        />
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={token.trim().length < 6 || mutation.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-atlas-coral px-6 py-3 font-display uppercase tracking-wider text-atlas-white disabled:opacity-50"
        >
          <Check size={16} />
          {mutation.isPending ? 'Validando…' : 'Confirmar'}
        </button>
      </div>
      <p className="mt-3 text-xs text-atlas-white/40">
        Sugerencia: en v2 montaremos lector con cámara. Por ahora, copia el token o usa la búsqueda.
      </p>
    </section>
  );
}

// =====================================================
// Lista de check-ins del día (auto-refresh)
// =====================================================
function TodayList() {
  const { data } = useQuery({
    queryKey: ['staff', 'check-ins', 'today'],
    queryFn: () => apiFetch<{ checkIns: TodayCheckIn[] }>('/staff/check-ins/today'),
    refetchInterval: 15_000,
  });

  return (
    <section className="mt-12">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/60">
        <Trophy size={14} /> Entradas de hoy ({data?.checkIns.length ?? 0})
      </h2>
      <div className="overflow-hidden rounded-2xl bg-atlas-ink">
        {!data || data.checkIns.length === 0 ? (
          <p className="px-6 py-6 text-sm text-atlas-white/40">Aún no hay entradas hoy.</p>
        ) : (
          <ul>
            {data.checkIns.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-atlas-white/5 px-6 py-3 last:border-b-0"
              >
                <span className="font-mono text-xs text-atlas-white/50">
                  {format(new Date(c.occurredAt), 'HH:mm')}
                </span>
                <span className="font-medium">{c.user.fullName}</span>
                <span className="rounded-full bg-atlas-black px-3 py-1 text-[10px] uppercase tracking-wider text-atlas-white/60">
                  {sourceLabel(c.source)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function sourceLabel(s: TodayCheckIn['source']): string {
  return s === 'SELF_QR' ? 'QR' : s === 'STAFF_SCAN' ? 'Scan' : 'Manual';
}
