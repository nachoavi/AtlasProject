import type { ReactNode } from 'react';
import { Activity, Footprints, Apple } from 'lucide-react';
import { HEALTH_SERVICES } from '@atlas/shared';
import { SectionLabel } from '../../components/atlas/SectionLabel';

const ICONS: Record<string, ReactNode> = {
  KINESIOLOGIA: <Activity size={32} strokeWidth={2.5} />,
  PODOLOGIA: <Footprints size={32} strokeWidth={2.5} />,
  NUTRICION: <Apple size={32} strokeWidth={2.5} />,
};

export function HealthSection() {
  return (
    <section id="salud" className="relative isolate bg-white py-24 text-atlas-black">
      <div className="mx-auto max-w-7xl px-6">
        <SectionLabel number="06" title="Servicios profesionales" inverse />
        <div className="mt-4 grid items-end gap-6 sm:grid-cols-[1fr_auto]">
          <h2 className="max-w-3xl font-display text-5xl uppercase leading-[0.95] sm:text-7xl">
            Tu cuerpo, <br />
            <span className="bg-atlas-yellow px-3 leading-none">acompañado.</span>
          </h2>
          <p className="max-w-xs text-sm text-atlas-black/60 sm:text-right">
            Agenda horas online con kinesiólogo, podólogo o nutricionista. Algunos planes incluyen
            evaluación inicial gratuita.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {HEALTH_SERVICES.map((service) => (
            <a
              key={service.code}
              href={`/servicios/${service.code.toLowerCase()}`}
              className="group flex flex-col gap-6 rounded-2xl border-2 border-atlas-black/10 p-8 transition-all hover:border-atlas-coral hover:bg-atlas-black hover:text-atlas-white"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-atlas-yellow text-atlas-black transition-transform group-hover:rotate-[10deg]">
                {ICONS[service.code]}
              </div>
              <div>
                <h3 className="font-display text-3xl uppercase">{service.name}</h3>
                <p className="mt-3 text-sm leading-relaxed opacity-80">{service.description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-atlas-coral">
                Agendar hora →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
