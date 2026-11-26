import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const STEPS = [
  {
    step: '01',
    title: 'Discover',
    desc: 'Browse city cars, luxury sedans, electric vehicles, or 4x4s across Chandigarh–Tricity.',
  },
  {
    step: '02',
    title: 'Choose',
    desc: 'Compare transparent daily rates, seating, and Vehicle Passport records side by side.',
  },
  {
    step: '03',
    title: 'Book',
    desc: 'Select your trip dates, verify your driving licence, and confirm your booking.',
  },
  {
    step: '04',
    title: 'Drive',
    desc: 'Complete a quick pickup inspection and take the road on your own schedule.',
  },
];

export function HowItWorksSection() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-[#2A2A30] bg-[#111114] py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              {t('home.howEyebrow')}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-[#F4F1EA]">
              {t('home.howTitle')}
            </h2>
          </div>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#E8E4DC] hover:text-[#C8A97E]"
          >
            {t('home.howGuide')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#2A2A30] border-y border-[#2A2A30]">
          {STEPS.map((item) => (
            <div key={item.step} className="py-8 md:px-7 first:md:pl-0 last:md:pr-0 space-y-4">
              <span className="font-mono text-xs text-[#C8A97E]">{item.step}</span>
              <h3 className="font-display text-2xl font-medium text-[#F4F1EA]">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#8E8E98]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
