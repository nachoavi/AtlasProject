import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Grain } from '../atlas/Grain';

/**
 * Layout para pantallas de auth (login, registro, recuperar).
 * Asimétrico: lado izquierdo branding masivo, lado derecho formulario sobre tarjeta blanca.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-atlas-black text-atlas-white lg:flex-row">
      <Grain intensity={0.3} className="z-0" />

      {/* Lado branding */}
      <section className="relative z-[1] flex flex-col justify-between border-b border-atlas-white/10 bg-atlas-black px-8 py-10 lg:w-[42%] lg:border-b-0 lg:border-r lg:px-16 lg:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-atlas-white/60 transition-colors hover:text-atlas-yellow"
        >
          <ArrowLeft size={16} />
          Volver al sitio
        </Link>

        <div className="my-12 hidden lg:block">
          <p className="font-sans text-xs uppercase tracking-[0.4em] text-atlas-yellow">
            Atlas · Training Center
          </p>
          <h1 className="mt-6 font-display text-7xl uppercase leading-[0.85] xl:text-8xl">
            {title}
          </h1>
          <p className="mt-6 max-w-md text-base text-atlas-white/70">{subtitle}</p>
        </div>

        <div className="hidden text-xs uppercase tracking-[0.3em] text-atlas-white/30 lg:block">
          Angamos 338 · La Unión
        </div>

        {/* Mobile header */}
        <div className="mt-6 lg:hidden">
          <h1 className="font-display text-4xl uppercase leading-[0.9]">{title}</h1>
          <p className="mt-3 text-sm text-atlas-white/70">{subtitle}</p>
        </div>
      </section>

      {/* Lado formulario */}
      <section className="relative z-[1] flex flex-1 items-center justify-center bg-atlas-ink px-6 py-10 lg:px-16">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 text-atlas-black shadow-2xl sm:p-10">
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-sm text-atlas-white/70">{footer}</div>}
        </div>
      </section>
    </div>
  );
}
