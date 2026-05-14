import { cn } from '../../lib/cn';

/**
 * Etiqueta editorial estilo revista: "01 / PLANES".
 * Uso: prefacio de cada sección, alineado con la asimetría del layout.
 */
export function SectionLabel({
  number,
  title,
  className,
  inverse = false,
}: {
  number: string;
  title: string;
  className?: string;
  inverse?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 font-sans text-xs uppercase tracking-[0.4em]',
        inverse ? 'text-atlas-black/60' : 'text-atlas-white/50',
        className,
      )}
    >
      <span className={cn(inverse ? 'text-atlas-black' : 'text-atlas-yellow', 'font-bold')}>
        {number}
      </span>
      <span className={cn('h-px w-10', inverse ? 'bg-atlas-black/30' : 'bg-atlas-white/30')} />
      <span>{title}</span>
    </div>
  );
}
