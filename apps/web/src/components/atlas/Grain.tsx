import { cn } from '../../lib/cn';

/**
 * Overlay de grano sutil para dar textura "cartel impreso" a fondos sólidos.
 * Generado con feTurbulence SVG inline (sin assets externos).
 */
export function Grain({
  className,
  intensity = 0.55,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 z-0 mix-blend-soft-light', className)}
      style={{
        opacity: Math.min(intensity, 0.35),
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}
