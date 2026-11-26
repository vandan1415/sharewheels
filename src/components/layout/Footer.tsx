import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[#2A2A30] bg-[#0A0A0B] text-[#E8E4DC]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[#2A2A30] pb-10">
          <div className="space-y-2">
            <Link
              to="/"
              className="font-display text-xs font-semibold tracking-[0.26em] uppercase text-[#F4F1EA]"
            >
              SHAREWHEELS
            </Link>
            <p className="text-xs text-[#8E8E98]">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs uppercase tracking-[0.14em] text-[#E8E4DC]/80">
            <Link to="/explore" className="hover:text-[#C8A97E]">{t('nav.explore')}</Link>
            <Link to="/luxury" className="hover:text-[#C8A97E]">{t('footer.luxury')}</Link>
            <Link to="/route-planner" className="hover:text-[#C8A97E]">{t('nav.routeCraft')}</Link>
            <Link to="/journeys" className="hover:text-[#C8A97E]">{t('footer.journeys')}</Link>
            <Link to="/wheelmate" className="hover:text-[#C8A97E]">{t('nav.wheelmate')}</Link>
            <Link to="/passport" className="hover:text-[#C8A97E]">{t('nav.vehiclePassport')}</Link>
            <Link to="/how-it-works" className="hover:text-[#C8A97E]">{t('nav.howItWorks')}</Link>
            <Link to="/trust-and-safety" className="hover:text-[#C8A97E]">{t('footer.trustSafety')}</Link>
            <Link to="/owner" className="hover:text-[#C8A97E]">{t('nav.listVehicle')}</Link>
            <Link to="/contact" className="hover:text-[#C8A97E]">{t('footer.contact')}</Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-[#8E8E98]">
          <p>{t('footer.disclaimer')}</p>
          <p className="shrink-0">© 2026 SHAREWHEELS</p>
        </div>
      </div>
    </footer>
  );
}
