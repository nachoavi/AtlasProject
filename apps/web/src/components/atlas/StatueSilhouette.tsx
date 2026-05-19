import { motion } from 'framer-motion';

/**
 * Silueta SVG genérica de estatua greco-romana — placeholder hasta que el centro
 * provea los PNG/WebP transparentes oficiales (ver plan §14.5).
 *
 * El detalle distintivo: ropa moderna (tank top) en color verde lima sobre cuerpo
 * en tono mármol, igual que los flyers de Instagram.
 */
export function StatueSilhouette({
  variant = 'apollo',
  className,
}: {
  variant?: 'apollo' | 'atlas' | 'venus';
  className?: string;
}) {
  return (
    <motion.svg
      initial={{ scale: 0.96, x: 24 }}
      animate={{ scale: 1, x: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      viewBox="0 0 320 480"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Estatua greco-romana ${variant}`}
    >
      <defs>
        <linearGradient id="marble" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#EFEAE0" />
          <stop offset="0.6" stopColor="#C7BFB0" />
          <stop offset="1" stopColor="#8A8273" />
        </linearGradient>
        <linearGradient id="cloth" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#9CF02A" />
          <stop offset="1" stopColor="#5BB317" />
        </linearGradient>
      </defs>

      {/* Cabeza */}
      <ellipse cx="160" cy="68" rx="38" ry="46" fill="url(#marble)" />
      {/* Pelo / corona */}
      <path
        d="M 122 56 Q 160 0 198 56 Q 200 30 175 28 Q 165 8 145 28 Q 120 30 122 56 Z"
        fill="url(#marble)"
        opacity="0.85"
      />
      {/* Cuello */}
      <rect x="148" y="108" width="24" height="22" rx="6" fill="url(#marble)" />
      {/* Torso */}
      {variant === 'atlas' ? (
        // Pose Atlas — brazos arriba cargando esfera
        <>
          <circle cx="160" cy="40" r="40" fill="url(#marble)" opacity="0.25" />
          <path
            d="M 110 130 L 80 90 L 70 100 L 100 145 L 110 200 L 115 280 L 125 350 L 145 480 L 175 480 L 195 350 L 205 280 L 210 200 L 220 145 L 250 100 L 240 90 L 210 130 Z"
            fill="url(#marble)"
          />
          {/* Tank top verde */}
          <path
            d="M 120 135 L 200 135 L 205 195 L 195 210 L 125 210 L 115 195 Z"
            fill="url(#cloth)"
          />
        </>
      ) : variant === 'venus' ? (
        <>
          <path
            d="M 110 130 L 95 175 L 110 215 L 120 280 L 132 360 L 142 480 L 178 480 L 188 360 L 200 280 L 210 215 L 225 175 L 210 130 Z"
            fill="url(#marble)"
          />
          <path
            d="M 118 135 L 202 135 L 210 190 L 200 215 L 120 215 L 110 190 Z"
            fill="url(#cloth)"
          />
        </>
      ) : (
        <>
          {/* Apollo — pose estándar */}
          <path
            d="M 105 135 L 90 180 L 105 235 L 115 290 L 128 370 L 142 480 L 178 480 L 192 370 L 205 290 L 215 235 L 230 180 L 215 135 Z"
            fill="url(#marble)"
          />
          <path
            d="M 115 140 L 205 140 L 213 200 L 202 222 L 118 222 L 107 200 Z"
            fill="url(#cloth)"
          />
        </>
      )}

      {/* Sombras de definición muscular */}
      <path
        d="M 130 222 Q 160 240 190 222 L 188 270 Q 160 280 132 270 Z"
        fill="#000000"
        opacity="0.15"
      />
    </motion.svg>
  );
}
