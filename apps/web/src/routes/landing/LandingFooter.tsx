import { MessageCircle } from 'lucide-react';
import { CENTER_INFO, FACILITY_AMENITIES } from '@atlas/shared';
import { MarqueeStrip } from '../../components/atlas/MarqueeStrip';
import { InstagramIcon } from '../../components/icons/InstagramIcon';

export function LandingFooter() {
  const instagramHandle = CENTER_INFO.instagram.replace('@', '');

  return (
    <footer className="relative isolate bg-atlas-black text-atlas-white">
      <MarqueeStrip
        items={['Carga tu mundo', 'Atlas Training Center', 'La Unión · Los Ríos']}
        rotation={-1.2}
        bg="black"
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <h3 className="font-display text-5xl uppercase leading-tight sm:text-7xl sm:leading-[0.85]">
            ¿Listo para <br />
            <span className="text-atlas-yellow">cargar?</span>
          </h3>
          <p className="mt-6 max-w-md text-atlas-white/70">
            Reserva tu evaluación física gratuita o pásate a conocer las instalaciones. Te
            mostramos cada zona y resolvemos tus dudas en menos de 30 minutos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-atlas-yellow px-6 py-3 font-display uppercase tracking-wider text-atlas-black transition-transform hover:scale-105"
            >
              <InstagramIcon size={20} />
              {CENTER_INFO.instagram}
            </a>
            <a
              href="https://wa.me/?text=Hola%20Atlas%2C%20quiero%20agendar%20una%20visita"
              className="inline-flex items-center gap-3 rounded-full border border-atlas-white/20 px-6 py-3 font-display uppercase tracking-wider transition-colors hover:bg-atlas-white/10"
            >
              <MessageCircle size={20} />
              WhatsApp
            </a>
          </div>
        </div>

        <div>
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-atlas-yellow">
            Servicios incluidos
          </p>
          <ul className="mt-5 space-y-2">
            {FACILITY_AMENITIES.map((a) => (
              <li key={a.code} className="flex items-center gap-3 text-sm">
                <span className="inline-block h-1.5 w-1.5 bg-atlas-yellow" />
                {a.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-atlas-yellow">
            Visítanos
          </p>
          <address className="mt-5 not-italic text-sm leading-relaxed text-atlas-white/80">
            {CENTER_INFO.address}
            <br />
            <span className="text-atlas-white/50">Comuna de {CENTER_INFO.comuna}</span>
            <br />
            <span className="text-atlas-white/50">Región de {CENTER_INFO.region}</span>
          </address>
        </div>
      </div>

      <div className="border-t border-atlas-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs uppercase tracking-wider text-atlas-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Atlas Training Center</span>
          <span>Hecho con esfuerzo en La Unión, Chile</span>
        </div>
      </div>
    </footer>
  );
}
