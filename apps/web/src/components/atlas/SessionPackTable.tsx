import { motion } from 'framer-motion';
import { formatClp, type SessionPackInfo } from '@atlas/shared';

/**
 * Tabla de session packs (Legión o Transforma) con presentación editorial.
 * Las filas se animan en stagger al entrar en viewport.
 * Diseñada para no desbordar en móvil: padding y tamaños compactos < sm.
 */
export function SessionPackTable({
  packs,
  accentColor,
}: {
  packs: readonly SessionPackInfo[];
  accentColor: 'yellow' | 'coral';
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white text-atlas-black shadow-2xl">
      <div className="flex items-center justify-between bg-atlas-black px-4 py-3 text-atlas-white sm:px-6 sm:py-4">
        <span className="font-display text-sm uppercase tracking-wider sm:text-base">Pack</span>
        <span className="font-display text-sm uppercase tracking-wider sm:text-base">Precio</span>
      </div>
      <ul>
        {packs.map((pack, i) => (
          <motion.li
            key={pack.code}
            initial={{ x: -16 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-b-0 hover:bg-black/[0.03] sm:gap-4 sm:px-6 sm:py-4"
          >
            <span className="font-display text-2xl leading-none sm:text-3xl">
              {pack.sessionsTotal}
              <span className="font-sans text-sm font-normal text-black/40">×</span>
            </span>
            <span className="min-w-0 flex-1 text-xs uppercase tracking-wide text-black/60 sm:text-sm">
              sesiones · 60 min
            </span>
            <span
              className={
                accentColor === 'yellow'
                  ? 'shrink-0 rounded-full bg-atlas-yellow px-3 py-1 font-display text-sm text-atlas-black sm:px-4 sm:text-lg'
                  : 'shrink-0 rounded-full bg-atlas-coral px-3 py-1 font-display text-sm text-atlas-white sm:px-4 sm:text-lg'
              }
            >
              {formatClp(pack.priceClp)}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
