import { motion } from 'framer-motion';

/**
 * Anillo de progreso para mostrar la racha + uso semanal.
 * El gradiente conic-style usa los colores del logo Atlas (magenta → naranja → amarillo).
 */
export function StreakRing({
  current,
  longest,
  weekUsed,
  weekAllowed,
}: {
  current: number;
  longest: number;
  weekUsed: number;
  weekAllowed: number | null;
}) {
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const weekRatio = weekAllowed ? Math.min(weekUsed / weekAllowed, 1) : 0;
  const offset = c * (1 - weekRatio);

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="streak-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E6378C" />
              <stop offset="50%" stopColor="#F77F2E" />
              <stop offset="100%" stopColor="#DAD803" />
            </linearGradient>
          </defs>
          {/* fondo del aro */}
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          {/* aro de progreso semanal */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#streak-gradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-atlas-yellow">Racha</span>
          <span className="font-display text-7xl uppercase leading-none">{current}</span>
          <span className="mt-1 text-xs text-atlas-white/60">
            {current === 1 ? 'día' : 'días'}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-6 text-xs">
        <div className="text-center">
          <p className="text-atlas-white/40 uppercase tracking-wider">Esta semana</p>
          <p className="font-display text-lg text-atlas-yellow">
            {weekUsed}
            {weekAllowed != null && (
              <span className="text-atlas-white/40"> / {weekAllowed}</span>
            )}
          </p>
        </div>
        <div className="h-8 w-px bg-atlas-white/10" />
        <div className="text-center">
          <p className="text-atlas-white/40 uppercase tracking-wider">Mejor racha</p>
          <p className="font-display text-lg">{longest}d</p>
        </div>
      </div>
    </div>
  );
}
