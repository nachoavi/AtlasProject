import { WORKSHOPS_CATALOG } from '@atlas/shared';
import { SectionLabel } from '../../components/atlas/SectionLabel';
import { WorkshopCard } from '../../components/atlas/WorkshopCard';

export function WorkshopsSection() {
  return (
    <section id="talleres" className="relative isolate bg-atlas-black py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <SectionLabel number="05" title="Clases dirigidas" />
            <h2 className="mt-4 max-w-3xl font-display text-5xl uppercase leading-[0.95] sm:text-7xl">
              Talleres con <span className="text-atlas-yellow">instructor.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm text-atlas-white/60 sm:text-right">
            Cupos limitados por bloque horario. Tu plan te da hasta 20% de descuento.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {WORKSHOPS_CATALOG.map((workshop, i) => (
            <WorkshopCard
              key={workshop.code}
              workshop={workshop}
              silhouette={i === 0 ? 'calistenia' : 'escalada'}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
