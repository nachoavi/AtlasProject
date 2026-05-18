import { PLANS_CATALOG } from '@atlas/shared';
import { SectionLabel } from '../../components/atlas/SectionLabel';
import { PlanCard } from '../../components/atlas/PlanCard';

export function PlansSection() {
  const generalPlans = PLANS_CATALOG.filter((p) => p.segment === 'general');
  const studentPlans = PLANS_CATALOG.filter((p) => p.segment === 'estudiante');

  return (
    <section id="planes" className="relative isolate bg-atlas-black py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <SectionLabel number="02" title="Planes mensuales" />
            <h2 className="mt-4 max-w-3xl font-display text-4xl uppercase leading-tight sm:text-7xl sm:leading-[0.95]">
              Elige <span className="text-atlas-yellow">tu ritmo.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm text-atlas-white/60 sm:text-right">
            Todos los planes incluyen acceso a duchas, lockers, parking y break room.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {generalPlans.map((plan) => (
            <PlanCard key={plan.code} plan={plan} featured={plan.code === 'ATLAS_ASCENSO'} />
          ))}
        </div>

        {/* Sección de estudiantes */}
        <div className="mt-20 rounded-3xl border border-atlas-yellow/30 bg-atlas-ink p-8 sm:p-12">
          <div className="grid items-start gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <SectionLabel number="02b" title="Para estudiantes" />
              <h3 className="mt-3 font-display text-4xl uppercase leading-[0.9] sm:text-5xl">
                Atlas <span className="text-atlas-yellow">En Formación</span>
              </h3>
              <p className="mt-3 max-w-md text-sm text-atlas-white/60">
                Si estudias en educación superior, accede a tarifas exclusivas con tu credencial
                vigente.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {studentPlans.map((plan) => (
              <a
                key={plan.code}
                href={`/registro?plan=${plan.code}`}
                className="group block rounded-2xl bg-atlas-black p-6 transition-all hover:bg-atlas-yellow hover:text-atlas-black"
              >
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-atlas-yellow group-hover:text-atlas-black">
                  {plan.daysPerWeek} días/semana
                </p>
                <p className="mt-2 font-display text-4xl uppercase">
                  ${(plan.priceClp / 1000).toFixed(0)}K
                </p>
                <p className="mt-2 text-xs text-atlas-white/50 group-hover:text-atlas-black/70">
                  Eval. física inicial · 5% desc. talleres
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
