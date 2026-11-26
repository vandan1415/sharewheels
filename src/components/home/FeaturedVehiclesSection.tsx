import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useLocationContext } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatINR } from '@/lib/utils';
import { VehicleImage } from '@/components/ui/VehicleImage';
import { Button } from '@/components/ui/button';

export function FeaturedVehiclesSection() {
  const { selectedCity, openLocationModal } = useLocationContext();
  const { t, td } = useLanguage();
  const { data: vehicles = [], isLoading } = useVehicles();
  const flagship = vehicles[0];
  const secondary = vehicles.slice(1, 4);

  return (
    <section className="border-t border-[#2A2A30] bg-[#0A0A0B] py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[#2A2A30] pb-6">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              {selectedCity
                ? `${t('home.featuredEyebrow')} · ${td.city(selectedCity.name)}`
                : t('home.featuredEyebrow')}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.025em] text-[#F4F1EA]">
              {t('home.featuredTitle')}
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={openLocationModal}
              className="text-xs uppercase tracking-[0.16em] text-[#8E8E98] hover:text-[#C8A97E] cursor-pointer"
            >
              {t('explore.changeCity')}
            </button>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#E8E4DC] hover:text-[#C8A97E] transition-colors"
            >
              {t('home.featuredViewAll')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {!selectedCity ? (
          <div className="border border-[#2A2A30] bg-[#111114] p-12 text-center space-y-4">
            <p className="font-display text-xl text-[#F4F1EA]">
              {t('explore.chooseCityPrompt')}
            </p>
            <Button variant="champagne" onClick={openLocationModal}>
              <MapPin className="h-4 w-4" />
              {t('explore.selectLocation')}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="py-12 text-xs uppercase tracking-[0.16em] text-[#8E8E98]">
            {t('explore.loadingFleet')}
          </div>
        ) : !flagship ? (
          <div className="border border-[#2A2A30] bg-[#111114] p-12 text-center text-xs text-[#8E8E98]">
            {t('explore.noMatches')}
          </div>
        ) : (
          <>
            {/* Asymmetrical Flagship Feature */}
            <Link
              to={`/vehicles/${flagship.id}`}
              className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              <div className="lg:col-span-7 overflow-hidden bg-[#111114] aspect-[16/10]">
                <VehicleImage
                  src={flagship.image}
                  alt={flagship.name}
                  label={`${flagship.brand} ${flagship.model} ${flagship.variant}`}
                  className="h-full w-full transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
              <div className="lg:col-span-5 space-y-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">
                  {td.category(flagship.category)} · {flagship.drivetrain}
                </p>
                <h3 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-[#F4F1EA] group-hover:text-[#C8A97E] transition-colors">
                  {flagship.name}
                </h3>
                <p className="flex items-center gap-2 text-xs text-[#8E8E98]">
                  <MapPin className="h-3.5 w-3.5 text-[#C8A97E]" />
                  {td.city(flagship.location)} · {flagship.year}
                </p>
                <div className="grid grid-cols-3 border-y border-[#2A2A30] py-4 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-[#8E8E98]">{t('home.dailyRate')}</p>
                    <p className="mt-1 font-display text-lg font-medium text-[#F4F1EA]">
                      {formatINR(flagship.pricePerDay)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-[#8E8E98]">{t('home.transmission')}</p>
                    <p className="mt-1 font-medium text-[#F4F1EA]">{td.transmission(flagship.transmission)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-[#8E8E98]">{t('home.seating')}</p>
                    <p className="mt-1 font-medium text-[#F4F1EA]">{flagship.seats} {t('home.seatsUnit')}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#C8A97E]">
                  {t('home.featuredViewVehicle')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>

            {/* Hairline Editorial Trio */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2A2A30] border-t border-[#2A2A30] pt-10">
              {secondary.map((v) => (
                <Link
                  key={v.id}
                  to={`/vehicles/${v.id}`}
                  className="group py-6 md:py-0 md:px-8 first:md:pl-0 last:md:pr-0 space-y-5"
                >
                  <div className="overflow-hidden bg-[#111114] aspect-[16/10]">
                    <VehicleImage
                      src={v.image}
                      alt={v.name}
                      label={`${v.brand} ${v.model}`}
                      className="h-full w-full transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="font-display text-lg font-medium text-[#F4F1EA] group-hover:text-[#C8A97E] transition-colors">
                        {v.name}
                      </h4>
                      <span className="font-display text-sm font-medium text-[#C8A97E] shrink-0">
                        {formatINR(v.pricePerDay)} {t('explore.perDay')}
                      </span>
                    </div>
                    <p className="text-xs text-[#8E8E98]">
                      {td.city(v.location)} · {td.transmission(v.transmission)} · {v.seats} {t('home.seatsUnit')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
