import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Search, UserPlus } from 'lucide-react';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  formatClp,
  type PaymentMethodCode,
} from '@atlas/shared';
import { apiFetch, ApiError } from '../../lib/api';
import { FormField } from '../../components/auth/FormField';
import { cn } from '../../lib/cn';

type Member = {
  id: string;
  email: string;
  fullName: string;
  rut: string | null;
  phone: string | null;
  subscriptions: Array<{ id: string; endsAt: string; plan: { code: string; name: string } }>;
};

type Plan = {
  id: string;
  code: string;
  name: string;
  priceClp: number;
  daysPerWeek: number;
};

type SessionPack = {
  id: string;
  code: string;
  name: string;
  priceClp: number;
  variant: 'LEGION' | 'TRANSFORMA';
  sessionsTotal: number;
};

type ProductSelection =
  | { kind: 'plan'; plan: Plan }
  | { kind: 'session_pack'; pack: SessionPack };

export function EnrollWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [member, setMember] = useState<Member | null>(null);
  const [product, setProduct] = useState<ProductSelection | null>(null);
  const navigate = useNavigate();

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/staff')}
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white"
      >
        <ArrowLeft size={14} />
        Volver al dashboard
      </button>

      <Steps step={step} />

      <div className="mt-8">
        {step === 1 && (
          <StepMember
            onNext={(m) => {
              setMember(m);
              setStep(2);
            }}
          />
        )}
        {step === 2 && member && (
          <StepProduct
            member={member}
            onBack={() => setStep(1)}
            onNext={(p) => {
              setProduct(p);
              setStep(3);
            }}
          />
        )}
        {step === 3 && member && product && (
          <StepPayment
            member={member}
            product={product}
            onBack={() => setStep(2)}
            onCompleted={() => navigate('/staff', { replace: true })}
          />
        )}
      </div>
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: 'Miembro' },
    { n: 2, label: 'Producto' },
    { n: 3, label: 'Pago' },
  ];
  return (
    <ol className="flex items-center gap-3 text-xs uppercase tracking-wider">
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

// =====================================================
// Step 1: Buscar o crear miembro
// =====================================================
function StepMember({ onNext }: { onNext: (m: Member) => void }) {
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);

  // Siempre consulta: sin texto devuelve los miembros más recientes.
  const { data, isFetching } = useQuery({
    queryKey: ['staff', 'members', 'search', q],
    queryFn: () => apiFetch<{ members: Member[] }>(`/staff/members/search?q=${encodeURIComponent(q)}`),
  });

  if (creating) return <CreateMemberForm onCreated={onNext} onCancel={() => setCreating(false)} />;

  const members = data?.members ?? [];
  const isSearching = q.trim().length > 0;

  return (
    <section>
      <h2 className="font-display text-3xl uppercase">¿Quién se inscribe?</h2>
      <p className="mt-2 text-sm text-atlas-white/60">
        Elige un miembro de la lista o búscalo por RUT, email o nombre.
      </p>

      {/* CTA prominente para registrar un miembro nuevo */}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mt-5 flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-atlas-coral/60 bg-atlas-coral/10 px-5 py-4 text-left transition-colors hover:bg-atlas-coral/20"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-atlas-coral text-atlas-white">
            <UserPlus size={20} />
          </span>
          <div>
            <p className="font-display text-lg uppercase text-atlas-white">Registrar nuevo miembro</p>
            <p className="text-xs text-atlas-white/60">
              ¿Es la primera vez del cliente? Créale la cuenta aquí.
            </p>
          </div>
        </div>
        <span className="font-display text-2xl text-atlas-coral">+</span>
      </button>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-atlas-ink px-4 py-3 ring-1 ring-atlas-white/10 focus-within:ring-atlas-yellow">
        <Search size={18} className="text-atlas-white/40" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, RUT o email…"
          autoFocus
          className="flex-1 bg-transparent text-atlas-white outline-none placeholder:text-atlas-white/30"
        />
      </div>

      <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-[0.3em] text-atlas-white/50">
        {isSearching ? 'Resultados' : 'Miembros recientes'}
      </p>

      <div className="min-h-[100px]">
        {isFetching && members.length === 0 ? (
          <p className="text-sm text-atlas-white/40">Cargando…</p>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-atlas-ink p-6">
            <p className="text-sm">
              {isSearching ? `No encontramos a nadie con "${q}".` : 'Aún no hay miembros registrados.'}
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-full bg-atlas-coral px-5 py-2 font-display text-sm uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover"
            >
              <UserPlus size={14} /> Crear nuevo miembro
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onNext(m)}
                  className="group flex w-full items-center justify-between gap-4 rounded-2xl bg-atlas-ink px-5 py-4 text-left transition-colors hover:bg-atlas-yellow hover:text-atlas-black"
                >
                  <div>
                    <p className="font-display text-lg uppercase">{m.fullName}</p>
                    <p className="text-xs text-atlas-white/60 group-hover:text-atlas-black/70">
                      {m.email} {m.rut ? `· ${m.rut}` : ''}
                    </p>
                  </div>
                  {m.subscriptions[0] ? (
                    <span className="rounded-full bg-atlas-success px-3 py-1 text-xs uppercase tracking-wider text-atlas-white">
                      {m.subscriptions[0].plan.code}
                    </span>
                  ) : (
                    <span className="text-xs text-atlas-white/40 group-hover:text-atlas-black/60">
                      sin plan
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CreateMemberForm({
  onCreated,
  onCancel,
}: {
  onCreated: (m: Member) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ fullName: '', email: '', rut: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createdMember, setCreatedMember] = useState<Member | null>(null);

  if (tempPassword && createdMember) {
    return (
      <section className="rounded-2xl bg-atlas-ink p-8">
        <h2 className="font-display text-2xl uppercase text-atlas-yellow">Miembro creado</h2>
        <p className="mt-2 text-sm">
          Entrega esta contraseña temporal a <strong>{createdMember.fullName}</strong>. Podrá
          cambiarla luego desde su perfil.
        </p>
        <div className="mt-4 rounded-xl bg-atlas-black p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-atlas-white/40">
            Contraseña temporal
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-atlas-yellow">
            {tempPassword}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCreated(createdMember)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-atlas-coral px-6 py-3 font-display uppercase tracking-wider text-atlas-white hover:bg-atlas-coral-hover"
        >
          Continuar al producto <ArrowRight size={16} />
        </button>
      </section>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const result = await apiFetch<{
        user: Member;
        tempPassword: string;
      }>('/staff/members', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setTempPassword(result.tempPassword);
      setCreatedMember({ ...result.user, subscriptions: [] });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_TAKEN') setErrors({ email: 'Este email ya está registrado' });
        else if (err.code === 'RUT_TAKEN') setErrors({ rut: 'Este RUT ya está registrado' });
        else if (err.code === 'VALIDATION_ERROR') {
          const fields = (err.details as { fieldErrors?: Record<string, string[]> }) ?? {};
          const map: Record<string, string> = {};
          for (const [k, v] of Object.entries(fields.fieldErrors ?? {})) map[k] = v[0] ?? '';
          setErrors(map);
        } else toast.error(err.message || 'No se pudo crear');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl bg-atlas-ink p-6 sm:p-8">
      <h2 className="font-display text-3xl uppercase">Nuevo miembro</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nombre completo"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          error={errors.fullName}
        />
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          error={errors.email}
        />
        <FormField
          label="RUT (opcional)"
          value={form.rut}
          onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
          placeholder="12.345.678-K"
          error={errors.rut}
        />
        <FormField
          label="Teléfono (opcional)"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+56 9 …"
          error={errors.phone}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-atlas-white/60 hover:text-atlas-white"
        >
          ← Volver a la búsqueda
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-atlas-coral px-6 py-3 font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover disabled:opacity-50"
        >
          {submitting ? 'Creando…' : 'Crear miembro'}
        </button>
      </div>
    </form>
  );
}

// =====================================================
// Step 2: Elegir producto
// =====================================================
function StepProduct({
  member,
  onBack,
  onNext,
}: {
  member: Member;
  onBack: () => void;
  onNext: (p: ProductSelection) => void;
}) {
  const { data } = useQuery({
    queryKey: ['staff', 'catalog'],
    queryFn: () => apiFetch<{ plans: Plan[]; sessionPacks: SessionPack[] }>('/staff/catalog'),
  });

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white"
      >
        <ArrowLeft size={14} /> Cambiar miembro
      </button>

      <div className="rounded-2xl bg-atlas-yellow p-4 text-atlas-black">
        <p className="text-xs uppercase tracking-wider opacity-70">Miembro</p>
        <p className="font-display text-2xl uppercase">{member.fullName}</p>
        <p className="text-xs">
          {member.email} {member.rut ? `· ${member.rut}` : ''}
        </p>
      </div>

      <h2 className="mt-8 font-display text-3xl uppercase">¿Qué producto contrata?</h2>

      <section className="mt-6">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-yellow">
          Planes mensuales
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(data?.plans ?? []).map((p) => (
            <li key={p.code}>
              <button
                type="button"
                onClick={() => onNext({ kind: 'plan', plan: p })}
                className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-atlas-ink px-5 py-4 text-left transition-colors hover:bg-atlas-yellow hover:text-atlas-black"
              >
                <div>
                  <p className="font-display text-lg uppercase">{p.name}</p>
                  <p className="text-xs text-atlas-white/60 group-hover:text-atlas-black/70">
                    {p.daysPerWeek} días/sem · {p.code}
                  </p>
                </div>
                <span className="font-display text-xl text-atlas-yellow group-hover:text-atlas-coral">
                  {formatClp(p.priceClp)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-atlas-yellow">
          Session packs (Legión + Transforma)
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(data?.sessionPacks ?? []).map((p) => (
            <li key={p.code}>
              <button
                type="button"
                onClick={() => onNext({ kind: 'session_pack', pack: p })}
                className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-atlas-ink px-5 py-4 text-left transition-colors hover:bg-atlas-coral hover:text-atlas-white"
              >
                <div>
                  <p className="font-display text-lg uppercase">{p.name}</p>
                  <p className="text-xs text-atlas-white/60 group-hover:text-atlas-white/80">
                    {p.sessionsTotal} sesiones · {p.variant}
                  </p>
                </div>
                <span className="font-display text-xl text-atlas-yellow group-hover:text-atlas-white">
                  {formatClp(p.priceClp)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

// =====================================================
// Step 3: Registrar pago
// =====================================================
function StepPayment({
  member,
  product,
  onBack,
  onCompleted,
}: {
  member: Member;
  product: ProductSelection;
  onBack: () => void;
  onCompleted: () => void;
}) {
  const basePrice =
    product.kind === 'plan' ? product.plan.priceClp : product.pack.priceClp;

  const [method, setMethod] = useState<PaymentMethodCode>('CASH');
  const [amount, setAmount] = useState<number>(basePrice);
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    setAmount(basePrice);
  }, [basePrice]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (product.kind === 'plan') {
        return apiFetch('/staff/subscriptions', {
          method: 'POST',
          body: JSON.stringify({
            userId: member.id,
            planCode: product.plan.code,
            paymentMethod: method,
            amountClp: amount,
            notes,
          }),
        });
      }
      return apiFetch('/staff/session-packs', {
        method: 'POST',
        body: JSON.stringify({
          userId: member.id,
          packCode: product.pack.code,
          paymentMethod: method,
          amountClp: amount,
          notes,
        }),
      });
    },
    onSuccess: () => {
      toast.success('Inscripción registrada');
      qc.invalidateQueries({ queryKey: ['staff'] });
      onCompleted();
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('No se pudo registrar el pago');
    },
  });

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-atlas-white/60 hover:text-atlas-white"
      >
        <ArrowLeft size={14} /> Cambiar producto
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-atlas-yellow p-4 text-atlas-black">
          <p className="text-xs uppercase tracking-wider opacity-70">Miembro</p>
          <p className="font-display text-xl uppercase">{member.fullName}</p>
        </div>
        <div className="rounded-2xl bg-atlas-ink p-4">
          <p className="text-xs uppercase tracking-wider text-atlas-yellow">
            {product.kind === 'plan' ? 'Plan' : 'Pack'}
          </p>
          <p className="font-display text-xl uppercase">
            {product.kind === 'plan' ? product.plan.name : product.pack.name}
          </p>
          <p className="mt-1 text-sm text-atlas-white/60">{formatClp(basePrice)}</p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-3xl uppercase">Registrar pago</h2>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-atlas-white/70">
            Método
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  'rounded-xl border-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors',
                  method === m
                    ? 'border-atlas-yellow bg-atlas-yellow text-atlas-black'
                    : 'border-atlas-white/10 text-atlas-white/70 hover:border-atlas-white/30',
                )}
              >
                {PAYMENT_METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-atlas-white/70">
            Monto (CLP)
          </p>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-ink px-4 py-3 font-display text-3xl text-atlas-yellow focus:border-atlas-yellow focus:outline-none"
          />
          {amount !== basePrice && (
            <p className="mt-2 text-xs text-atlas-coral">
              Descuento aplicado: {formatClp(basePrice - amount)} ({Math.round(((basePrice - amount) / basePrice) * 100)}%)
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-atlas-white/70">
          Notas (opcional)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: pagó con vuelto, promo de convenio, descuento gerencia…"
          rows={2}
          className="w-full rounded-xl border-2 border-atlas-white/10 bg-atlas-ink px-4 py-3 text-sm text-atlas-white focus:border-atlas-yellow focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-8 inline-flex items-center gap-3 rounded-full bg-atlas-coral px-8 py-4 font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover disabled:opacity-50"
      >
        {mutation.isPending ? 'Registrando…' : `Cobrar ${formatClp(amount)}`}
        <Check size={18} />
      </button>
    </section>
  );
}
