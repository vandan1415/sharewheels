import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function TrustSafetySection() {
  const { t } = useLanguage();

  const highlights = [
    {
      title: t('home.trustH1Title'),
      desc: t('home.trustH1Desc'),
    },
    {
      title: t('home.trustH2Title'),
      desc: t('home.trustH2Desc'),
    },
    {
      title: t('home.trustH3Title'),
      desc: t('home.trustH3Desc'),
    },
  ];

  return (
    <section className="border-t border-[#2A2A30] bg-[#0A0A0B] py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              {t('home.trustEyebrow')}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-[#F4F1EA]">
              {t('home.trustTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-[#8E8E98]">
              {t('home.trustLead')}
            </p>
            <div className="flex flex-wrap gap-6 pt-2">
              <Link
                to="/trust-and-safety"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#C8A97E] hover:underline"
              >
                {t('home.trustDetails')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/passport"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#E8E4DC] hover:text-[#C8A97E]"
              >
                {t('home.trustPassport')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 divide-y divide-[#2A2A30] border-y border-[#2A2A30]">
            {highlights.map((item) => (
              <div key={item.title} className="py-6 space-y-2">
                <h3 className="font-display text-xl font-medium text-[#F4F1EA]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#8E8E98] max-w-2xl">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
