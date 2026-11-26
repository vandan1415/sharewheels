import { CinematicHero } from '@/components/hero/CinematicHero';
import { FeaturedVehiclesSection } from '@/components/home/FeaturedVehiclesSection';
import { ExperienceSection } from '@/components/home/ExperienceSection';
import { TrustSafetySection } from '@/components/home/TrustSafetySection';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';

export function HomePage() {
  return (
    <main className="bg-[#0A0A0B]">
      <CinematicHero />
      <FeaturedVehiclesSection />
      <ExperienceSection />
      <TrustSafetySection />
      <FinalCtaSection />
    </main>
  );
}
