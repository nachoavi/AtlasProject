import { motion } from 'framer-motion';
import { Dumbbell, Mountain, Zap, Target, ActivitySquare } from 'lucide-react';
import { SectionLabel } from '../../components/atlas/SectionLabel';

const ZONES = [
  {
    icon: <Dumbbell size={28} strokeWidth={2.5} />,
    label: 'Sala de pesas',
    description: 'Equipamiento isotónico y libre para todos los niveles.',
  },
  {
    icon: <ActivitySquare size={28} strokeWidth={2.5} />,
    label: 'Calistenia',
    description: 'Domina tu peso corporal con técnicas avanzadas.',
  },
  {
    icon: <Mountain size={28} strokeWidth={2.5} />,
    label: 'Escalada',
    description: 'Muro para principiantes y escaladores avanzados.',
  },
  {
    icon: <Zap size={28} strokeWidth={2.5} />,
    label: 'HIIT',
    description: 'Alta intensidad y prevención de lesiones.',
  },
  {
    icon: <Target size={28} strokeWidth={2.5} />,
    label: 'Tiro al arco',
    description: 'Técnica y concentración con arco deportivo.',
  },
];

export function ZonesSection() {
  return (
    <section id="zonas" className="relative isolate overflow-hidden bg-atlas-black py-24">
      {/* Franjas diagonales laterales — lenguaje visual Stitch */}
      <div className="stripe-y left-0" aria-hidden="true" />
      <div className="stripe-y right-0" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel number="01" title="Zonas de entrenamiento" />
        <h2 className="mt-4 max-w-3xl font-display text-4xl uppercase leading-tight sm:text-7xl sm:leading-[0.95]">
          Cinco disciplinas, <span className="text-atlas-yellow">un solo lugar.</span>
        </h2>

        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {ZONES.map((zone, i) => (
            <motion.div
              key={zone.label}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-atlas-yellow text-atlas-black ring-[3px] ring-atlas-ink shadow-[0_8px_24px_-8px_rgba(218,216,3,0.5)]"
              >
                {zone.icon}
              </motion.div>
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-atlas-white">
                {zone.label}
              </span>
              <p className="text-xs leading-relaxed text-atlas-white/50">{zone.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
