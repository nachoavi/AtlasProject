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
        'group relative isolate overflow-hidden rounded-3xl p-8 text-atlas-white',
        'transition-shadow duration-300 hover:shadow-atlas-glow',
        featured
          ? 'bg-gradient-to-br from-atlas-yellow via-[#6b7a00] to-atlas-black shadow-[0_24px_60px_-24px_rgba(223,255,0,0.4)]'
          : 'border-2 border-atlas-yellow bg-atlas-black shadow-[0_24px_60px_-24px_rgba(218,216,3,0.15)]',
      )}
    >
      {plan.badge && (
        <span
          className={cn(
            'absolute right-6 top-6 z-10 rounded-full px-3 py-1 font-display text-[10px] uppercase tracking-wider',
            featured
              ? 'bg-atlas-black text-atlas-white'
              : 'bg-atlas-yellow text-atlas-black',
          )}
        >
          {plan.badge}
        </span>
      )}

      <header className="relative z-[1]">
        <p
          className={cn(
            'font-sans text-xs font-bold uppercase tracking-[0.3em]',
            featured ? 'text-atlas-black' : 'text-atlas-yellow',
          )}
        >
          Plan
        </p>
        <h3
          className={cn(
            'mt-1 break-words font-display text-[2rem] uppercase leading-[0.95] sm:text-5xl sm:leading-[0.85]',
            featured && 'text-atlas-black',
          )}
        >
          {plan.shortName}
        </h3>
      </header>

      <div
        className={cn(
          'relative z-[1] mt-6 rounded-2xl p-6',
          featured ? 'bg-atlas-black/30' : 'bg-atlas-ink',
        )}
      >
        <div
          className={cn(
            'flex items-baseline gap-2 border-b pb-4',
            featured ? 'border-atlas-white/20' : 'border-atlas-white/10',
          )}
        >
          <span className="font-display text-4xl">{formatClp(plan.priceClp)}</span>
          <span className="text-xs uppercase tracking-wider text-atlas-white/50">/mes</span>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {plan.perks.map((perk) => (
            <li key={perk} className="flex gap-3">
              <Check size={18} strokeWidth={3} className="mt-0.5 shrink-0 text-atlas-yellow" />
              <span className="leading-snug text-atlas-white/80">{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={`/registro?plan=${plan.code}`}
        className={cn(
          'relative z-[1] mt-6 inline-flex items-center justify-center rounded-full bg-atlas-coral font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover',
          featured ? 'w-full py-4 text-lg' : 'px-6 py-3',
        )}
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
