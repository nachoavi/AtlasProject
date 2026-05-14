import { MapPin } from 'lucide-react';
import { CENTER_INFO } from '@atlas/shared';
import { SectionLabel } from '../../components/atlas/SectionLabel';
import { Grain } from '../../components/atlas/Grain';

const SCHEDULE = [
  { day: 'Lunes a Viernes', blocks: ['06:00 — 13:00', '15:00 — 22:30'] },
  { day: 'Sábado', blocks: ['08:00 — 13:00', '15:00 — 22:00'] },
  { day: 'Domingo', blocks: ['Cerrado'], closed: true },
];

const MAPS_QUERY = encodeURIComponent(CENTER_INFO.address);

export function ScheduleSection() {
  return (
    <section id="horarios" className="relative isolate bg-atlas-yellow py-24 text-atlas-black">
      <Grain intensity={0.3} className="mix-blend-multiply" />

      <div className="mx-auto grid max-w-7xl items-start gap-12 px-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionLabel number="07" title="Horarios + ubicación" inverse />
          <h2 className="mt-4 font-display text-5xl uppercase leading-[0.9] sm:text-7xl">
            Estamos en <br />
            <span className="text-atlas-coral">La Unión.</span>
          </h2>

          <div className="mt-10 space-y-6">
            {SCHEDULE.map((row) => (
              <div
                key={row.day}
                className="grid grid-cols-[1fr_auto] items-baseline gap-6 border-b border-atlas-black/20 pb-4"
              >
                <span className="font-display text-2xl uppercase">{row.day}</span>
                <div className="flex flex-col items-end gap-1 font-sans text-base">
                  {row.blocks.map((b) => (
                    <span key={b} className={row.closed ? 'text-atlas-coral' : ''}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3 text-sm">
            <MapPin size={18} />
            <span className="font-semibold uppercase tracking-wider">{CENTER_INFO.address}</span>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-3 rounded-full bg-atlas-coral px-7 py-4 font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover"
          >
            Cómo llegar
            <span className="inline-block h-2 w-2 rotate-45 bg-atlas-white" />
          </a>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border-4 border-atlas-black bg-atlas-black shadow-2xl">
          <iframe
            title="Ubicación de Atlas Training Center"
            src={`https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`}
            loading="lazy"
            className="absolute inset-0 h-full w-full grayscale"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Overlay con coordenadas decorativas */}
          <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-atlas-yellow px-3 py-1 font-display text-xs uppercase tracking-wider text-atlas-black">
            Atlas TC · La Unión
          </div>
        </div>
      </div>
    </section>
  );
}
