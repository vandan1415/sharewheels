import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Globe, MapPin, Menu, Route, Search, Sparkles, User, X } from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuth } from '@/context/AuthContext';
import { useLocationContext } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_LANGUAGES, type TranslationKey } from '@/lib/i18n';

const NAV_LINKS: { key: TranslationKey; to: string }[] = [
  { key: 'nav.explore', to: '/explore' },
  { key: 'nav.guide', to: '/how-it-works' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [routeCraftOpen, setRouteCraftOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { data: vehicles = [] } = useVehicles();
  const { user, signOut } = useAuth();
  const { selectedCity, openLocationModal } = useLocationContext();
  const { language, setLanguage, languageMeta, t, td } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
    setLangOpen(false);
    setRouteCraftOpen(false);
  }, [location.pathname]);

  const filteredVehicles = query.trim()
    ? vehicles
        .filter((v) =>
          `${v.name} ${v.brand} ${v.model} ${v.variant} ${v.category} ${v.location}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .slice(0, 5)
    : vehicles.slice(0, 4);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate(`/explore${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || location.pathname !== '/'
            ? 'bg-[#0A0A0B]/95 border-b border-[#2A2A30]/80'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-10 lg:gap-12">
            <Link
              to="/"
              className="font-display text-xs sm:text-[13px] font-semibold tracking-[0.26em] uppercase text-[#F4F1EA] hover:text-[#C8A97E] transition-colors shrink-0"
            >
              SHAREWHEELS
            </Link>

            <div className="hidden lg:flex items-center gap-7 xl:gap-9">
              {NAV_LINKS.map((item) => {
                const active =
                  location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-[0.17em] py-1 border-b transition-colors whitespace-nowrap',
                      active
                        ? 'text-[#C8A97E] border-[#C8A97E]'
                        : 'text-[#E8E4DC]/85 border-transparent hover:text-[#F4F1EA]'
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}

              <Link
                to="/luxury"
                className={cn(
                  'text-[11px] font-medium uppercase tracking-[0.17em] py-1 border-b transition-colors whitespace-nowrap',
                  location.pathname.startsWith('/luxury')
                    ? 'text-[#C8A97E] border-[#C8A97E]'
                    : 'text-[#E8E4DC]/85 border-transparent hover:text-[#C8A97E]'
                )}
              >
                {t('nav.luxuryCollection')}
              </Link>

              <Link
                to="/wheelmate"
                className={cn(
                  'inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.17em] py-1 border-b transition-colors whitespace-nowrap',
                  location.pathname === '/wheelmate'
                    ? 'text-[#C8A97E] border-[#C8A97E]'
                    : 'text-[#E8E4DC]/85 border-transparent hover:text-[#C8A97E]'
                )}
              >
                <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>{t('nav.wheelmate')}</span>
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setRouteCraftOpen((v) => !v);
                    setLangOpen(false);
                    setAccountOpen(false);
                    setSearchOpen(false);
                  }}
                  aria-expanded={routeCraftOpen}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.17em] py-1 border-b transition-colors whitespace-nowrap cursor-pointer',
                    ['/route-planner', '/journeys', '/trip-budget', '/fuel-calculator', '/saved-journeys'].some((p) =>
                      location.pathname.startsWith(p)
                    ) || location.pathname.startsWith('/journey/')
                      ? 'text-[#C8A97E] border-[#C8A97E]'
                      : 'text-[#E8E4DC]/85 border-transparent hover:text-[#C8A97E]'
                  )}
                >
                  <Route className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>{t('nav.routeCraft')}</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform', routeCraftOpen && 'rotate-180')} />
                </button>

                {routeCraftOpen && (
                  <div className="absolute left-0 mt-3 w-60 rounded-sm border border-[#2A2A30] bg-[#111114] p-2 shadow-2xl z-50">
                    <div className="border-b border-[#2A2A30] px-2.5 pb-2 mb-1">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#C8A97E]">
                        {t('nav.roadTripEcosystem')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs">
                      <Link to="/route-planner" className="px-2.5 py-2 text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm">
                        {t('nav.routePlanner')}
                      </Link>
                      <Link to="/trip-budget" className="px-2.5 py-2 text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm">
                        {t('nav.tripBudget')}
                      </Link>
                      <Link to="/fuel-calculator" className="px-2.5 py-2 text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm">
                        {t('nav.fuelCalculator')}
                      </Link>
                      <Link to="/saved-journeys" className="px-2.5 py-2 text-[#C8A97E] hover:bg-[#1A1A1F] rounded-sm">
                        {t('nav.savedJourneys')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setLangOpen(false);
                openLocationModal();
              }}
              aria-label={t('nav.selectLocationAria')}
              className="inline-flex items-center gap-1 border border-[#2A2A30] bg-[#111114]/90 hover:border-[#C8A97E] px-2 sm:px-2.5 py-1.5 rounded-sm text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.14em] text-[#F4F1EA] transition-colors cursor-pointer whitespace-nowrap"
            >
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#C8A97E] shrink-0" />
              <span className="max-w-[78px] sm:max-w-[125px] truncate">
                {selectedCity ? td.city(selectedCity.name) : t('nav.location')}
              </span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangOpen((v) => !v);
                  setAccountOpen(false);
                  setSearchOpen(false);
                }}
                aria-label={t('nav.selectLanguage')}
                aria-expanded={langOpen}
                className="inline-flex items-center gap-1 border border-[#2A2A30] bg-[#111114]/90 hover:border-[#C8A97E] px-2 sm:px-2.5 py-1.5 rounded-sm text-[10px] sm:text-[11px] tracking-[0.06em] text-[#F4F1EA] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#C8A97E] shrink-0" />
                <span>{languageMeta.shortLabel}</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-sm border border-[#2A2A30] bg-[#111114] p-2 shadow-2xl z-50">
                  <div className="border-b border-[#2A2A30] px-2 pb-2 mb-1.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#C8A97E]">
                      {t('nav.selectLanguage')}
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto flex flex-col gap-0.5">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const active = lang.code === language;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                            setLangOpen(false);
                          }}
                          className={cn(
                            'flex items-center justify-between px-2.5 py-2 rounded-sm text-left transition-colors cursor-pointer',
                            active
                              ? 'bg-[#C8A97E]/15 text-[#F4F1EA]'
                              : 'hover:bg-[#1A1A1F] text-[#E8E4DC]'
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium leading-tight">
                              {lang.nativeLabel}
                            </p>
                            <p className="text-[10px] text-[#8E8E98] truncate">
                              {lang.label} · {lang.region}
                            </p>
                          </div>
                          {active && <Check className="h-3.5 w-3.5 text-[#C8A97E] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/owner"
              className="hidden md:inline-flex items-center bg-[#C8A97E] hover:bg-[#F4F1EA] text-[#0A0A0B] font-medium text-[10px] uppercase tracking-[0.16em] px-4 py-2 rounded-sm transition-colors whitespace-nowrap"
            >
              {t('nav.listVehicle')}
            </Link>

            <span className="hidden lg:block h-4 w-px bg-[#2A2A30]" aria-hidden="true" />

            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v);
                setAccountOpen(false);
                setLangOpen(false);
              }}
              aria-label="Search vehicles"
              className="flex items-center text-[#E8E4DC]/85 hover:text-[#C8A97E] transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4 stroke-[1.5]" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen((v) => !v);
                  setSearchOpen(false);
                  setLangOpen(false);
                }}
                aria-label="Account menu"
                className="flex items-center text-[#E8E4DC]/85 hover:text-[#C8A97E] transition-colors cursor-pointer"
              >
                <User className="h-4 w-4 stroke-[1.5]" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-sm border border-[#2A2A30] bg-[#111114] p-3 shadow-2xl">
                  <div className="border-b border-[#2A2A30] pb-2.5 mb-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#C8A97E]">
                      {user ? t('nav.customerAccount') : t('nav.customerAccess')}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8E8E98] truncate">
                      {user ? user.email : t('nav.signInPrompt')}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    {user ? (
                      <>
                        <Link
                          to="/dashboard"
                          className="flex items-center justify-between px-2.5 py-2 text-xs text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm"
                        >
                          <span>{t('nav.dashboard')}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8E8E98]" />
                        </Link>
                        <Link
                          to="/bookings"
                          className="flex items-center justify-between px-2.5 py-2 text-xs text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm"
                        >
                          <span>{t('nav.myBookings')}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8E8E98]" />
                        </Link>
                        <Link
                          to="/saved"
                          className="flex items-center justify-between px-2.5 py-2 text-xs text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm"
                        >
                          <span>{t('nav.savedVehicles')}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8E8E98]" />
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center justify-between px-2.5 py-2 text-xs text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm"
                        >
                          <span>{t('nav.profileVerification')}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8E8E98]" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => signOut()}
                          className="mt-1 border-t border-[#2A2A30] pt-2 text-left px-2.5 py-1.5 text-xs text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
                        >
                          {t('nav.signOut')}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="flex items-center justify-between px-2.5 py-2 text-xs text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm"
                        >
                          <span>{t('nav.signIn')}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8E8E98]" />
                        </Link>
                        <Link
                          to="/register"
                          className="flex items-center justify-between px-2.5 py-2 text-xs text-[#F4F1EA] hover:bg-[#1A1A1F] rounded-sm"
                        >
                          <span>{t('nav.createAccount')}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8E8E98]" />
                        </Link>
                        <Link
                          to="/compare"
                          className="flex items-center justify-between px-2.5 py-2 text-xs text-[#C8A97E] hover:bg-[#1A1A1F] rounded-sm"
                        >
                          <span>{t('nav.compareVehicles')}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="lg:hidden text-[#F4F1EA] hover:text-[#C8A97E] cursor-pointer"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden border-t border-[#2A2A30] bg-[#0A0A0B]/95 px-6 py-6">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-xs font-medium uppercase tracking-[0.18em] text-[#E8E4DC] hover:text-[#C8A97E]"
                >
                  {t(item.key)}
                </Link>
              ))}
              <Link
                to="/luxury"
                className="text-xs font-medium uppercase tracking-[0.18em] text-[#C8A97E]"
              >
                {t('nav.luxuryCollection')}
              </Link>
              <Link
                to="/wheelmate"
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#C8A97E]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t('nav.wheelmate')}
              </Link>
              <div className="border-t border-[#2A2A30] pt-3 flex flex-col gap-2.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#C8A97E]">
                  {t('nav.routeCraft')}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link to="/route-planner" className="text-[#E8E4DC] hover:text-[#C8A97E]">{t('nav.routePlannerShort')}</Link>
                  <Link to="/trip-budget" className="text-[#E8E4DC] hover:text-[#C8A97E]">{t('nav.tripBudgetShort')}</Link>
                  <Link to="/fuel-calculator" className="text-[#E8E4DC] hover:text-[#C8A97E]">{t('nav.fuelCalculatorShort')}</Link>
                  <Link to="/saved-journeys" className="text-[#C8A97E] hover:underline">{t('nav.savedJourneys')}</Link>
                </div>
              </div>
              <Link
                to="/owner"
                className="inline-block text-center bg-[#C8A97E] text-[#0A0A0B] font-medium text-xs uppercase tracking-[0.16em] py-2.5 rounded-sm"
              >
                {t('nav.listVehicle')}
              </Link>

              <div className="border-t border-[#2A2A30] pt-4 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  {t('nav.selectLanguage')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        'px-2.5 py-2 border rounded-sm text-left text-xs transition-colors cursor-pointer',
                        lang.code === language
                          ? 'border-[#C8A97E] bg-[#C8A97E]/15 text-[#F4F1EA]'
                          : 'border-[#2A2A30] bg-[#111114] text-[#8E8E98] hover:text-[#F4F1EA]'
                      )}
                    >
                      <span className="block font-medium text-[#F4F1EA]">{lang.nativeLabel}</span>
                      <span className="text-[10px]">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#2A2A30] pt-4 flex gap-5">
                {user ? (
                  <Link to="/dashboard" className="text-xs uppercase tracking-[0.16em] text-[#C8A97E]">
                    {t('nav.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-xs uppercase tracking-[0.16em] text-[#C8A97E]">
                      {t('nav.signIn')}
                    </Link>
                    <Link to="/register" className="text-xs uppercase tracking-[0.16em] text-[#8E8E98]">
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0A0A0B]/90 flex items-start justify-center pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl border border-[#2A2A30] bg-[#111114] rounded-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-[#2A2A30] pb-3">
              <Search className="h-4 w-4 text-[#C8A97E]" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  selectedCity
                    ? `${t('nav.searchPlaceholder')} — ${selectedCity.name}`
                    : t('nav.selectCityFirst')
                }
                className="w-full bg-transparent text-sm text-[#F4F1EA] placeholder:text-[#8E8E98] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4 divide-y divide-[#2A2A30]/70">
              {filteredVehicles.map((v) => (
                <Link
                  key={v.id}
                  to={`/vehicles/${v.id}`}
                  className="flex items-center justify-between py-3 hover:bg-[#1A1A1F]/60 px-2 rounded-sm transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#F4F1EA]">{v.name}</p>
                    <p className="text-xs text-[#8E8E98]">
                      {v.category} · {v.location}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#C8A97E]">
                    {formatINR(v.pricePerDay)} {t('explore.perDay')}
                  </span>
                </Link>
              ))}
              {filteredVehicles.length === 0 && (
                <p className="py-6 text-center text-xs text-[#8E8E98]">
                  {selectedCity ? t('explore.noMatches') : t('explore.chooseCityPrompt')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
