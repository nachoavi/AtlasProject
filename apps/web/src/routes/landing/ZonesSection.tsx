import { Dumbbell, Mountain, Zap, Target, ActivitySquare } from 'lucide-react';
import { SectionLabel } from '../../components/atlas/SectionLabel';
import { HighlightBadge } from '../../components/atlas/HighlightBadge';

const ZONES = [
  { icon: <Dumbbell size={28} strokeWidth={2.5} />, label: 'Sala de pesas' },
  { icon: <ActivitySquare size={28} strokeWidth={2.5} />, label: 'Calistenia' },
  { icon: <Mountain size={28} strokeWidth={2.5} />, label: 'Escalada' },
  { icon: <Zap size={28} strokeWidth={2.5} />, label: 'HIIT' },
  { icon: <Target size={28} strokeWidth={2.5} />, label: 'Tiro al arco' },
];

export function ZonesSection() {
  return (
    <section id="zonas" className="relative isolate bg-atlas-black py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel number="01" title="Zonas de entrenamiento" />
        <h2 className="mt-4 max-w-3xl font-display text-4xl uppercase leading-tight sm:text-7xl sm:leading-[0.95]">
          Cinco disciplinas, <span className="text-atlas-yellow">un solo lugar.</span>
        </h2>
        <p className="mt-4 max-w-xl text-atlas-white/60">
          Tu suscripción te abre todas las zonas. Sin recargos, sin paquetes ocultos. Entrenas lo
          que necesites, cuando lo necesites.
        </p>

        <div className="mt-16 flex flex-wrap items-start justify-center gap-x-8 gap-y-12 sm:justify-start sm:gap-x-12">
          {ZONES.map((zone) => (
            <HighlightBadge key={zone.label} icon={zone.icon} label={zone.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
