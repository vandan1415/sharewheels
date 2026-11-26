import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { VehicleImage } from '@/components/ui/VehicleImage';

export function ExperienceSection() {
  const { t } = useLanguage();

  const experiences = [
    {
      title: t('home.exp1Title'),
      subtitle: t('home.exp1Sub'),
      to: '/explore?category=Hatchbacks',
      image:
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: t('home.exp2Title'),
      subtitle: t('home.exp2Sub'),
      to: '/explore?category=Sedans',
      image:
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: t('home.exp3Title'),
      subtitle: t('home.exp3Sub'),
      to: '/explore?category=Full-Size%20SUVs',
      image:
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: t('home.exp4Title'),
      subtitle: t('home.exp4Sub'),
      to: '/off-road',
      image:
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=80',
    },
    {
      title: t('home.exp5Title'),
      subtitle: t('home.exp5Sub'),
      to: '/luxury',
      image:
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80',
    },
  ];

  const topRow = experiences.slice(0, 3);
  const bottomRow = experiences.slice(3, 5);

  return (
    <section className="border-t border-[#2A2A30] bg-[#111114] py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-12">
        <div className="space-y-2 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
            {t('home.expEyebrow')}
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.025em] text-[#F4F1EA]">
            {t('home.expTitle')}
          </h2>
        </div>

        {/* Row 1: 3-column architectural strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topRow.map((exp) => (
            <Link
              key={exp.to}
              to={exp.to}
              className="group relative aspect-[4/3] overflow-hidden bg-[#0A0A0B]"
            >
              <VehicleImage
                src={exp.image}
                alt={exp.title}
                className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/35 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-display text-xl font-medium text-[#F4F1EA] group-hover:text-[#C8A97E] transition-colors">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-[#E8E4DC]/80">{exp.subtitle}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#C8A97E]" />
              </div>
            </Link>
          ))}
        </div>

        {/* Row 2: Asymmetrical wide editorial pair */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {bottomRow.map((exp, idx) => (
            <Link
              key={exp.to}
              to={exp.to}
              className={`group relative overflow-hidden bg-[#0A0A0B] ${
                idx === 0 ? 'lg:col-span-7 aspect-[16/9]' : 'lg:col-span-5 aspect-[16/9] lg:aspect-auto'
              }`}
            >
              <VehicleImage
                src={exp.image}
                alt={exp.title}
                className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/35 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <h3 className="font-display text-2xl font-medium text-[#F4F1EA] group-hover:text-[#C8A97E] transition-colors">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-[#E8E4DC]/85">{exp.subtitle}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#C8A97E]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
