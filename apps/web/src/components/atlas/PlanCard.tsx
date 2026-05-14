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
        'group relative isolate overflow-hidden rounded-3xl bg-atlas-yellow p-8 text-atlas-black',
        'transition-shadow duration-300',
        'shadow-[0_24px_60px_-24px_rgba(229,240,0,0.45)]',
        'hover:shadow-atlas-glow',
        featured && 'ring-4 ring-atlas-coral ring-offset-4 ring-offset-atlas-black',
      )}
    >
      {plan.badge && (
        <span className="absolute right-6 top-6 z-10 rounded-full bg-atlas-coral px-3 py-1 font-display text-[10px] uppercase tracking-wider text-atlas-white">
          {plan.badge}
        </span>
      )}

      <header className="relative z-[1]">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em]">Atlas</p>
        <h3 className="mt-1 font-display text-5xl uppercase leading-[0.85]">
          {plan.shortName}
        </h3>
      </header>

      <div className="relative z-[1] mt-6 rounded-2xl bg-white p-6 shadow-md">
        <div className="flex items-baseline gap-2 border-b border-black/10 pb-4">
          <span className="font-display text-4xl">{formatClp(plan.priceClp)}</span>
          <span className="text-xs uppercase tracking-wider text-black/60">/mes</span>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {plan.perks.map((perk) => (
            <li key={perk} className="flex gap-3">
              <Check
                size={18}
                strokeWidth={3}
                className="mt-0.5 shrink-0 text-atlas-success"
              />
              <span className="leading-snug">{perk}</span>
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

      {/* Marca de agua decorativa: el número de días por semana */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -right-8 font-display text-[14rem] leading-none text-atlas-black/[0.08]"
      >
        {plan.daysPerWeek}d
      </div>
    </motion.article>
  );
}
