import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

export function FinalCtaSection() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-[#2A2A30] bg-[#111114] py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 text-center space-y-8">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold uppercase tracking-[-0.03em] text-[#F4F1EA] max-w-4xl mx-auto leading-[0.98]">
          {t('home.finalTitle')}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link to="/explore">
            <Button variant="primary" size="lg">
              {t('home.finalExploreCta')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link to="/wheelmate">
            <Button variant="champagne" size="lg">
              {t('home.finalListCta')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
