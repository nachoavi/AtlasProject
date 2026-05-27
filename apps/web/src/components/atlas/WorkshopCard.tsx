import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { WorkshopInfo } from '@atlas/shared';
import { cn } from '../../lib/cn';

/**
 * Tarjeta de taller — silueta negra sobre amarillo, estilo "highlights de Instagram".
 */
export function WorkshopCard({
  workshop,
  silhouette,
}: {
  workshop: WorkshopInfo;
  silhouette: 'calistenia' | 'escalada';
}) {
  return (
    <motion.a
      href={`/talleres/${workshop.code.toLowerCase()}`}
      initial={{ y: 20 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ rotate: -0.5, scale: 1.02 }}
      className={cn(
        'group relative isolate flex flex-col justify-between overflow-hidden',
        'rounded-3xl bg-atlas-yellow p-8 text-atlas-black',
        'min-h-[280px] transition-shadow duration-300 hover:shadow-atlas-glow',
      )}
    >
      <div>
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em]">Taller</p>
        <h3 className="mt-2 break-words font-display text-4xl uppercase leading-[0.95] sm:text-6xl sm:leading-[0.85]">
          {workshop.name}
        </h3>
      </div>

      <div className="relative z-[1] flex items-end justify-between">
        <div>
          <p className="text-sm leading-snug">{workshop.description}</p>
          <p className="mt-3 font-display text-sm uppercase tracking-wider">
            {workshop.durationLabel} · cupos limitados
          </p>
          <span className="mt-4 inline-flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-wider transition-colors group-hover:text-atlas-black/60">
            Agendar hora
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </span>
        </div>
      </div>

      {/* Silueta decorativa de fondo */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-1/4 h-3/4 text-atlas-black/20"
        viewBox="0 0 200 240"
        fill="currentColor"
      >
        {silhouette === 'calistenia' ? (
          // Silueta de calistenia: hombre haciendo flexión
          <path d="M 30 180 L 50 165 L 70 155 L 95 152 L 130 150 L 165 148 L 180 152 L 180 168 L 165 175 L 130 178 L 95 180 L 70 184 L 50 188 Z M 90 152 Q 95 130 105 128 L 120 130 Q 125 145 122 152 Z M 75 188 L 80 220 L 90 220 L 88 188 Z M 155 178 L 160 215 L 170 215 L 165 175 Z" />
        ) : (
          // Silueta de escalada: trepando muro
          <path d="M 80 220 L 78 180 L 70 150 L 58 130 Q 50 110 60 95 Q 75 85 90 95 L 100 110 L 120 105 Q 135 95 145 110 L 150 130 L 158 150 L 160 175 L 162 220 Z M 95 100 Q 100 80 110 78 L 122 82 Q 128 95 124 102 Z M 142 130 L 160 100 L 175 95 L 178 105 L 165 115 L 150 135 Z" />
        )}
      </svg>
    </motion.a>
  );
}
