import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { InstagramIcon } from '../../components/icons/InstagramIcon';
import { CENTER_INFO } from '@atlas/shared';
import { Grain } from '../../components/atlas/Grain';
import { StatueSilhouette } from '../../components/atlas/StatueSilhouette';
import { MarqueeStrip } from '../../components/atlas/MarqueeStrip';

const TOP_NAV = [
  { label: 'Planes', href: '#planes' },
  { label: 'Legión', href: '#legion' },
  { label: 'Talleres', href: '#talleres' },
  { label: 'Salud', href: '#salud' },
  { label: 'Horarios', href: '#horarios' },
];

export function HeroSection() {
  return (
    <section className="relative isolate min-h-dvh bg-atlas-black">
      <Grain className="z-[2]" intensity={0.4} />

      {/* Nav superior */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-atlas-yellow font-display text-lg text-atlas-black">
            A
          </div>
          <div className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-base uppercase">Atlas</span>
            <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-atlas-white/60">
              Training Center
            </span>
          </div>
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {TOP_NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="font-sans text-sm uppercase tracking-wider text-atlas-white/80 transition-colors hover:text-atlas-yellow"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="/login"
          className="rounded-full border border-atlas-white/20 px-4 py-2 font-display text-xs uppercase tracking-wider transition-colors hover:bg-atlas-white/10"
        >
          Ingresar
        </a>
      </nav>

      {/* Hero principal — split asimétrico */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 pb-16 pt-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-0 lg:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-[3]"
        >
          <p className="flex items-center gap-3 font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">
            <span className="inline-block h-px w-12 bg-atlas-yellow" />
            La Unión · Los Ríos
          </p>

          <h1 className="mt-6 font-display text-[clamp(3.5rem,11vw,9rem)] uppercase leading-[0.85] tracking-tight">
            Carga{' '}
            <span className="relative inline-block">
              <span className="relative z-[1] text-atlas-black">tu mundo</span>
              <span className="absolute inset-x-[-8px] inset-y-2 -z-0 -skew-y-2 bg-atlas-yellow" />
            </span>
          </h1>

          <p className="mt-8 max-w-lg text-balance text-base leading-relaxed text-atlas-white/70">
            Gym, calistenia, escalada, HIIT y tiro al arco. Servicios de kinesiología, podología y
            nutrición. Un solo centro, todas las disciplinas que necesitas para sostener el peso de
            tus objetivos.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#planes"
              className="group inline-flex items-center gap-3 rounded-full bg-atlas-coral px-7 py-4 font-display uppercase tracking-wider text-atlas-white transition-colors hover:bg-atlas-coral-hover"
            >
              Ver planes
              <span className="inline-block h-2 w-2 rotate-45 bg-atlas-white transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={`https://instagram.com/${CENTER_INFO.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-sm uppercase tracking-wider text-atlas-white/80 hover:text-atlas-yellow"
            >
              <InstagramIcon size={18} />
              {CENTER_INFO.instagram}
            </a>
          </div>

          <div className="mt-12 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-atlas-white/40">
            <MapPin size={14} />
            <span>Angamos 338 · La Unión</span>
          </div>
        </motion.div>

        {/* Lado derecho: estatua + bloque amarillo */}
        <div className="relative h-[420px] lg:h-[600px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute right-0 top-0 h-full w-[85%] -skew-x-[6deg] bg-atlas-yellow"
          />
          <StatueSilhouette
            variant="atlas"
            className="absolute right-4 top-1/2 z-[1] h-[110%] -translate-y-1/2 drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)] lg:right-12"
          />
          {/* Cuadritos decorativos */}
          <div className="absolute -left-2 top-12 h-3 w-3 bg-atlas-coral" />
          <div className="absolute right-12 top-4 h-2 w-2 bg-atlas-black" />
        </div>
      </div>

      {/* Marquee decorativo de cierre */}
      <div className="relative z-[2] mt-8">
        <MarqueeStrip
          items={[
            'Gym',
            'Calistenia',
            'Escalada',
            'HIIT',
            'Tiro al arco',
            'Kinesiología',
            'Podología',
            'Nutrición',
          ]}
          rotation={-1.5}
          bg="yellow"
        />
      </div>
    </section>
  );
}
