import { motion } from 'framer-motion';
import { formatClp, type SessionPackInfo } from '@atlas/shared';

/**
 * Tabla de session packs (Legión o Transforma) con presentación editorial.
 * Las filas se animan en stagger al entrar en viewport.
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
      <div className="grid grid-cols-[1fr_auto] items-center bg-atlas-black px-6 py-4 text-atlas-white">
        <span className="font-display uppercase tracking-wider">Pack</span>
        <span className="font-display uppercase tracking-wider">Precio</span>
      </div>
      <ul>
        {packs.map((pack, i) => (
          <motion.li
            key={pack.code}
            initial={{ x: -16 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-black/5 px-6 py-4 last:border-b-0 hover:bg-black/[0.03]"
          >
            <span className="font-display text-3xl leading-none">
              {pack.sessionsTotal}
              <span className="text-base font-sans font-normal text-black/40">×</span>
            </span>
            <span className="text-sm uppercase tracking-wider text-black/60">
              sesiones · 60 min
            </span>
            <span
              className={
                accentColor === 'yellow'
                  ? 'rounded-full bg-atlas-yellow px-4 py-1 font-display text-lg text-atlas-black'
                  : 'rounded-full bg-atlas-coral px-4 py-1 font-display text-lg text-atlas-white'
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
