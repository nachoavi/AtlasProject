import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Círculo amarillo con icono negro centrado — réplica de los highlights de Instagram.
 * El label aparece debajo, en blanco/negro según contexto.
 */
export function HighlightBadge({
  icon,
  label,
  href,
  inverse = false,
}: {
  icon: ReactNode;
  label: string;
  href?: string;
  inverse?: boolean;
}) {
  const content = (
    <motion.div
      whileHover={{ scale: 1.08, rotate: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-atlas-yellow text-atlas-black ring-[3px] ring-atlas-ink shadow-[0_8px_24px_-8px_rgba(229,240,0,0.5)]">
          {icon}
        </div>
      </div>
      <span
        className={cn(
          'font-sans text-xs font-semibold uppercase tracking-wider',
          inverse ? 'text-atlas-black' : 'text-atlas-white',
        )}
      >
        {label}
      </span>
    </motion.div>
  );

  return href ? <a href={href}>{content}</a> : content;
}
