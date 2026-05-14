import { motion } from 'framer-motion';
import { Users, User } from 'lucide-react';
import { SESSION_PACKS_CATALOG, LEGION_PERKS, TRANSFORMA_PERKS } from '@atlas/shared';
import { SectionLabel } from '../../components/atlas/SectionLabel';
import { SessionPackTable } from '../../components/atlas/SessionPackTable';
import { StatueSilhouette } from '../../components/atlas/StatueSilhouette';
import { MarqueeStrip } from '../../components/atlas/MarqueeStrip';

export function TrainingTracksSection() {
  const legionPacks = SESSION_PACKS_CATALOG.filter((p) => p.variant === 'LEGION');
  const transformaPacks = SESSION_PACKS_CATALOG.filter((p) => p.variant === 'TRANSFORMA');

  return (
    <section id="legion" className="relative isolate">
      <MarqueeStrip
        items={['Atlas Legión', 'Atlas Transforma', 'Programa personalizado', '4 → 16 sesiones']}
        rotation={1.5}
        bg="coral"
      />

      {/* Atlas Legión */}
      <div className="bg-atlas-yellow py-24 text-atlas-black">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionLabel number="03" title="Programa grupal" inverse />
            <h2 className="mt-4 font-display text-5xl uppercase leading-[0.9] sm:text-7xl">
              Atlas
              <br />
              <span className="relative inline-block">
                Legión
                <span className="absolute bottom-2 left-0 right-0 -z-10 h-3 bg-atlas-coral" />
              </span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed">
              Grupos pequeños de 2 a 3 personas con planificación de entrenamiento basada en
              objetivos. Entrena con tu gente, sin perder atención.
            </p>

            <ul className="mt-8 space-y-3">
              {LEGION_PERKS.map((perk) => (
                <motion.li
                  key={perk}
                  initial={{ x: -10 }}
                  whileInView={{ x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-start gap-3 text-sm"
                >
                  <Users size={18} className="mt-0.5 shrink-0 text-atlas-coral" />
                  <span>{perk}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <SessionPackTable packs={legionPacks} accentColor="coral" />
            <div className="absolute -top-12 right-0 hidden h-32 w-32 lg:block">
              <StatueSilhouette variant="apollo" className="h-full w-full opacity-30" />
            </div>
          </div>
        </div>
      </div>

      {/* Atlas Transforma */}
      <div className="relative bg-atlas-black py-24 text-atlas-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1fr_1fr]">
          <div className="relative order-2 lg:order-1">
            <SessionPackTable packs={transformaPacks} accentColor="yellow" />
            <div className="absolute -bottom-10 left-0 hidden h-40 w-40 lg:block">
              <StatueSilhouette variant="venus" className="h-full w-full opacity-40" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SectionLabel number="04" title="Personal training" />
            <h2 className="mt-4 font-display text-5xl uppercase leading-[0.9] sm:text-7xl">
              Atlas
              <br />
              <span className="text-atlas-yellow">Transforma</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-atlas-white/70">
              Sesiones 1:1 de una hora con un coach dedicado. Cada minuto pensado para ti, cada
              repetición auditada en vivo.
            </p>

            <ul className="mt-8 space-y-3">
              {TRANSFORMA_PERKS.map((perk) => (
                <motion.li
                  key={perk}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3 text-sm text-atlas-white/85"
                >
                  <User size={18} className="mt-0.5 shrink-0 text-atlas-yellow" />
                  <span>{perk}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
