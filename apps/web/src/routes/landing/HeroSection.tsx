import { motion } from 'framer-motion';
import { InstagramIcon } from '../../components/icons/InstagramIcon';
import { CENTER_INFO } from '@atlas/shared';
import { Grain } from '../../components/atlas/Grain';
import { MarqueeStrip } from '../../components/atlas/MarqueeStrip';

const TOP_NAV = [
  { label: 'Planes', href: '#planes' },
  { label: 'Talleres', href: '#talleres' },
  { label: 'Salud', href: '#salud' },
  { label: 'Horarios', href: '#horarios' },
];

export function HeroSection() {
  return (
    <section className="relative isolate min-h-dvh overflow-hidden bg-atlas-black">
      {/* Background photo — reemplazar src con foto real del gimnasio */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-atlas-black via-atlas-black/60 to-atlas-black/40" />
      </div>

      <Grain className="z-[2]" intensity={0.35} />

      {/* Nav */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold uppercase tracking-tighter">ATLAS</span>
          <span className="hidden font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-atlas-yellow sm:block">
            Training Center
          </span>
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
          className="rounded-sm border border-atlas-white/20 px-4 py-2 font-display text-xs uppercase tracking-wider transition-colors hover:bg-atlas-white/10"
        >
          Ingresar
        </a>
      </nav>

      {/* Contenido principal — alineado al fondo */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-88px)] max-w-7xl flex-col justify-end px-6 pb-16">
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="font-hero text-[clamp(4rem,18vw,9rem)] text-atlas-white">
            CARGA TU
          </span>
          <span className="font-hero text-[clamp(4.5rem,22vw,11rem)] text-atlas-yellow">
            MUNDO
          </span>

          <p className="mt-4 font-sans text-sm font-bold uppercase tracking-[0.3em] text-atlas-white/70">
            La Unión · Los Ríos
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a
              href="#planes"
              className="bg-atlas-coral px-8 py-3 font-display text-xl font-bold uppercase italic tracking-wider text-atlas-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.25)] transition-colors hover:bg-atlas-coral-hover active:scale-95"
            >
              Ver planes
            </a>
            <a
              href={`https://instagram.com/${CENTER_INFO.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-wider text-atlas-white/80 hover:text-atlas-yellow"
            >
              <InstagramIcon size={18} />
              {CENTER_INFO.instagram}
            </a>
          </div>
        </motion.div>
      </div>

      {/* Marquee de cierre */}
      <div className="relative z-[2]">
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
