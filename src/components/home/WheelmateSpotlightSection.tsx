import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/ui/VehicleImage';
import { useLanguage } from '@/context/LanguageContext';

export function WheelmateSpotlightSection() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-[#2A2A30] bg-[#0A0A0B] py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('home.wheelmateEyebrow')}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.025em] leading-[1.02] text-[#F4F1EA]">
              {t('home.wheelmateTitle')}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-[#8E8E98] max-w-xl">
              Share your destination, passenger count, and daily budget in natural language.
              WHEELMATE narrows down available vehicles, compares options, and guides your
              choice effortlessly.
            </p>
            <div className="pt-2">
              <Link to="/wheelmate">
                <Button variant="champagne" size="lg">
                  {t('home.wheelmateCta')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Link
              to="/wheelmate"
              className="group relative block aspect-[16/10] overflow-hidden bg-[#111114]"
            >
              <VehicleImage
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
                alt="WHEELMATE personal mobility assistant"
                className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/25 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 border-l-2 border-[#C8A97E] pl-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
                  Example Ask
                </p>
                <p className="mt-1 font-display text-base sm:text-lg text-[#F4F1EA]">
                  &ldquo;I need a comfortable SUV from Chandigarh to Manali under ₹5,000 a day.&rdquo;
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
