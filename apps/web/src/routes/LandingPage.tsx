import { HeroSection } from './landing/HeroSection';
import { ZonesSection } from './landing/ZonesSection';
import { PlansSection } from './landing/PlansSection';
import { TrainingTracksSection } from './landing/TrainingTracksSection';
import { WorkshopsSection } from './landing/WorkshopsSection';
import { HealthSection } from './landing/HealthSection';
import { ScheduleSection } from './landing/ScheduleSection';
import { LandingFooter } from './landing/LandingFooter';

export function LandingPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-atlas-black text-atlas-white">
      <HeroSection />
      <ZonesSection />
      <PlansSection />
      <TrainingTracksSection />
      <WorkshopsSection />
      <HealthSection />
      <ScheduleSection />
      <LandingFooter />
    </main>
  );
}
