import { CENTER_INFO } from '@atlas/shared';

/**
 * Landing placeholder (Fase 0).
 * Fase 1 reemplazará con hero, comparador de planes, talleres, horarios y formulario.
 */
export function LandingPage() {
  return (
    <main className="min-h-dvh bg-atlas-black text-atlas-white">
      <section className="mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-sans text-sm uppercase tracking-[0.3em] text-atlas-yellow">
          {CENTER_INFO.name}
        </p>
        <h1 className="mt-4 font-display text-6xl uppercase leading-none text-atlas-white sm:text-8xl">
          Carga tu <span className="text-atlas-yellow">mundo</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-atlas-white/70">
          Gym, calistenia, escalada, HIIT y tiro al arco. Servicios de kinesiología, podología y
          nutrición. En {CENTER_INFO.comuna}.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a className="btn-coral" href="/planes">
            Ver planes
          </a>
          <a
            className="rounded-full border border-atlas-white/20 px-6 py-3 font-display uppercase tracking-wider text-atlas-white hover:bg-atlas-white/5"
            href="#contacto"
          >
            Contacto
          </a>
        </div>

        <p className="mt-16 text-xs uppercase tracking-widest text-atlas-white/40">
          {CENTER_INFO.address}
        </p>
      </section>
    </main>
  );
}
