import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { formatClp, type PlanInfo } from '@atlas/shared';
import { cn } from '../../lib/cn';

/**
 * Tarjeta de plan — replica el lenguaje visual de los flyers de Atlas:
 * fondo amarillo, título display en negro, card blanca interna con checklist.
 */
export function PlanCard({ plan, featured = false }: { plan: PlanInfo; featured?: boolean }) {
  return (
    <motion.article
      initial={{ y: 24 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className={cn(
        'group relative isolate overflow-hidden rounded-3xl border-2 border-atlas-yellow bg-atlas-black p-8 text-atlas-white',
        'transition-shadow duration-300',
        'shadow-[0_24px_60px_-24px_rgba(218,216,3,0.15)]',
        'hover:shadow-atlas-glow',
        featured && 'ring-4 ring-atlas-yellow ring-offset-4 ring-offset-atlas-black',
      )}
    >
      {plan.badge && (
        <span className="absolute right-6 top-6 z-10 rounded-full bg-atlas-yellow px-3 py-1 font-display text-[10px] uppercase tracking-wider text-atlas-black">
          {plan.badge}
        </span>
      )}

      <header className="relative z-[1]">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-atlas-yellow">
          Plan
        </p>
        <h3 className="mt-1 break-words font-display text-[2rem] uppercase leading-[0.95] sm:text-5xl sm:leading-[0.85]">
          {plan.shortName}
        </h3>
      </header>

      <div className="relative z-[1] mt-6 rounded-2xl bg-atlas-ink p-6">
        <div className="flex items-baseline gap-2 border-b border-atlas-white/10 pb-4">
          <span className="font-display text-4xl">{formatClp(plan.priceClp)}</span>
          <span className="text-xs uppercase tracking-wider text-atlas-white/50">/mes</span>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {plan.perks.map((perk) => (
            <li key={perk} className="flex gap-3">
              <Check
                size={18}
                strokeWidth={3}
                className="mt-0.5 shrink-0 text-atlas-yellow"
              />
              <span className="leading-snug text-atlas-white/80">{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={`/registro?plan=${plan.code}`}
        className="relative z-[1] mt-6 inline-flex items-center justify-center rounded-full bg-atlas-coral px-6 py-3 font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover"
      >
        Empieza ya
      </a>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -right-8 font-display text-[14rem] leading-none text-atlas-yellow/[0.06]"
      >
        {plan.daysPerWeek}d
      </div>
    </motion.article>
  );
}
