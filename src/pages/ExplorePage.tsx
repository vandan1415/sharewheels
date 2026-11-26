import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, Heart, LayoutGrid, List, MapPin, Route, ShieldCheck } from 'lucide-react';
import { INDIA_CATEGORIES, useVehicles } from '@/hooks/useVehicles';
import { useLocationContext } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatINR } from '@/lib/utils';
import { calculateHourlyPriceInr } from '@/lib/pricing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StateNotice } from '@/components/ui/StateNotice';
import { VehicleImage } from '@/components/ui/VehicleImage';

type SortOption = 'recommended' | 'lowest' | 'highest' | 'recent';

export function ExplorePage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialQuery = searchParams.get('q') || '';

  const { selectedCity, openLocationModal } = useLocationContext();
  const { t } = useLanguage();
  const { data: vehicles = [], isLoading } = useVehicles();
  const { user } = useAuth();

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string>(initialCategory);
  const [transmission, setTransmission] = useState<string>('All');
  const [fuel, setFuel] = useState<string>('All');
  const [minSeats, setMinSeats] = useState<number>(1);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  const toggleCompare = (slug: string) => {
    setCompareSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3
          ? [...prev, slug]
          : prev
    );
  };

  const toggleSave = async (e: React.MouseEvent, slug: string, dbId?: string) => {
    e.preventDefault();
    setSavedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
    if (user && supabase && dbId) {
      if (savedSlugs.includes(slug)) {
        await supabase.from('favourites').delete().match({ user_id: user.id, vehicle_id: dbId });
      } else {
        await supabase.from('favourites').upsert({ user_id: user.id, vehicle_id: dbId });
      }
    }
  };

  const filtered = useMemo(() => {
    const list = vehicles.filter((v) => {
      if (query.trim()) {
        const hay = `${v.name} ${v.brand} ${v.model} ${v.variant} ${v.location} ${v.category}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      if (category !== 'All' && v.category !== category) return false;
      if (transmission !== 'All' && v.transmission !== transmission) return false;
      if (fuel !== 'All' && v.fuelType !== fuel) return false;
      if (v.seats < minSeats) return false;
      if (maxPrice < 100000 && v.pricePerDay > maxPrice) return false;
      return true;
    });

    if (sortBy === 'lowest') return [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sortBy === 'highest') return [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (sortBy === 'recent') return [...list].sort((a, b) => b.year - a.year);
    return list;
  }, [vehicles, query, category, transmission, fuel, minSeats, maxPrice, sortBy]);

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2A2A30] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              <span>{selectedCity ? selectedCity.name : t('explore.noLocation')}</span>
              <button
                type="button"
                onClick={openLocationModal}
                className="underline text-[#E8E4DC] hover:text-[#C8A97E] cursor-pointer"
              >
                {t('explore.changeCity')}
              </button>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#F4F1EA]">
              {t('explore.title')}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/route-planner">
              <Button variant="outline" size="sm">
                <Route className="h-3.5 w-3.5 text-[#C8A97E]" />
                <span>Plan Road Trip (ROUTECRAFT)</span>
              </Button>
            </Link>
            <span className="text-xs text-[#8E8E98]">
              {!selectedCity
                ? t('explore.selectLocation')
                : isLoading
                  ? t('explore.loadingFleet')
                  : `${filtered.length} / ${vehicles.length} · ${selectedCity.name}`}
            </span>
            <div className="flex border border-[#2A2A30] rounded-sm overflow-hidden">
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => setViewMode('grid')}
                className={`p-2 cursor-pointer ${viewMode === 'grid' ? 'bg-[#1A1A1F] text-[#C8A97E]' : 'text-[#8E8E98]'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => setViewMode('list')}
                className={`p-2 cursor-pointer ${viewMode === 'list' ? 'bg-[#1A1A1F] text-[#C8A97E]' : 'text-[#8E8E98]'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 border border-[#2A2A30] bg-[#111114] p-4 rounded-sm">
          <Input
            placeholder={t('explore.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA]"
          >
            <option value="All">{t('explore.allCategories')}</option>
            {INDIA_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className="h-11 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA]"
          >
            <option value="All">{t('explore.allTransmissions')}</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
            <option value="Single-Speed">Single-Speed (EV)</option>
          </select>
          <select
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className="h-11 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA]"
          >
            <option value="All">{t('explore.allFuels')}</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>
          <select
            value={minSeats}
            onChange={(e) => setMinSeats(Number(e.target.value))}
            className="h-11 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA]"
          >
            <option value={1}>{t('explore.anySeats')}</option>
            <option value={4}>4+ Seats</option>
            <option value={5}>5+ Seats</option>
            <option value={7}>7+ Seats</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-11 rounded-sm border border-[#2A2A30] bg-[#0A0A0B] px-3 text-xs text-[#F4F1EA]"
          >
            <option value="recommended">{t('explore.sortRecommended')}</option>
            <option value="lowest">{t('explore.sortLowHigh')}</option>
            <option value="highest">{t('explore.sortHighLow')}</option>
            <option value="recent">{t('explore.sortNewest')}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#8E8E98]">
          <div className="flex items-center gap-3">
            <span>Max Daily Price: {maxPrice >= 100000 ? 'Any Budget' : formatINR(maxPrice)}</span>
            <input
              type="range"
              min={2000}
              max={100000}
              step={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[#C8A97E] cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/off-road" className="text-[#C8A97E] hover:underline uppercase text-[11px] tracking-[0.14em]">
              Open Off-Road Experience →
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setCategory('All');
                setTransmission('All');
                setFuel('All');
                setMinSeats(1);
                setMaxPrice(100000);
                setSortBy('recommended');
              }}
            >
              {t('explore.resetFilters')}
            </Button>
          </div>
        </div>

        {!selectedCity ? (
          <StateNotice
            variant="empty"
            title={t('explore.chooseCityPrompt')}
            description="Select one of our 8 supported Indian cities to view real-time availability, hourly/daily pricing, and local handovers."
            action={
              <Button variant="champagne" onClick={openLocationModal}>
                {t('explore.selectLocation')}
              </Button>
            }
          />
        ) : filtered.length === 0 && !isLoading ? (
          <StateNotice
            variant="empty"
            title={`No matching vehicles in ${selectedCity.name}`}
            description={t('explore.noMatches')}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setCategory('All');
                  setTransmission('All');
                  setFuel('All');
                  setMinSeats(1);
                  setMaxPrice(100000);
                }}
              >
                Reset Filters
              </Button>
            }
          />
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filtered.map((v) => {
              const isSaved = savedSlugs.includes(v.id);
              const isComparing = compareSlugs.includes(v.id);

              return (
                <div
                  key={v.id}
                  className={`group border border-[#2A2A30] bg-[#111114] rounded-sm overflow-hidden hover:border-[#C8A97E]/60 transition-colors ${
                    viewMode === 'list' ? 'grid grid-cols-1 md:grid-cols-12' : 'flex flex-col'
                  }`}
                >
                  <Link
                    to={`/vehicles/${v.id}`}
                    className={`relative block bg-[#1A1A1F] ${
                      viewMode === 'list' ? 'md:col-span-4 aspect-[16/10]' : 'aspect-[16/10]'
                    }`}
                  >
                    <VehicleImage
                      src={v.image}
                      alt={v.name}
                      label={`${v.brand} ${v.model} ${v.variant}`}
                      className="h-full w-full"
                    />
                    <button
                      type="button"
                      aria-label="Save vehicle"
                      onClick={(e) => toggleSave(e, v.id, v.dbId)}
                      className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-[#0A0A0B]/85 border border-[#2A2A30] rounded-sm text-[#F4F1EA] hover:border-[#C8A97E] cursor-pointer"
                    >
                      <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-[#C8A97E] text-[#C8A97E]' : ''}`} />
                    </button>
                  </Link>

                  <div
                    className={`p-5 flex flex-col justify-between space-y-4 ${
                      viewMode === 'list' ? 'md:col-span-8' : 'flex-1'
                    }`}
                  >
                    <Link to={`/vehicles/${v.id}`} className="space-y-1.5 block">
                      <div className="flex items-center justify-between text-[11px] text-[#8E8E98]">
                        <span className="uppercase tracking-[0.14em] text-[#C8A97E]">{v.category}</span>
                        <span>{v.year} · {v.drivetrain}</span>
                      </div>
                      <h3 className="font-display text-lg font-medium text-[#F4F1EA] group-hover:text-[#C8A97E]">
                        {v.name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-[#8E8E98]">
                        <MapPin className="h-3 w-3 text-[#C8A97E]/70" />
                        {v.location} · {v.transmission} · {v.fuelType} · {v.seats} Seats
                      </p>
                      {v.mileageOrRange && (
                        <p className="text-[11px] text-[#8E8E98]">
                          Efficiency / Range: {v.mileageOrRange}
                        </p>
                      )}
                    </Link>

                    <div className="border-t border-[#2A2A30] pt-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-display text-base font-semibold text-[#F4F1EA]">
                          {formatINR(v.pricePerDay)}
                          <span className="text-xs font-normal text-[#8E8E98]"> {t('explore.perDay')}</span>
                        </p>
                        <p className="text-[11px] text-[#C8A97E]">
                          {formatINR(calculateHourlyPriceInr(v.pricePerDay))} / hr
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCompare(v.id)}
                          className={`inline-flex items-center gap-1 border px-2 py-1 text-[10px] uppercase tracking-[0.12em] rounded-sm cursor-pointer ${
                            isComparing
                              ? 'border-[#C8A97E] bg-[#C8A97E]/15 text-[#C8A97E]'
                              : 'border-[#2A2A30] text-[#8E8E98] hover:text-[#F4F1EA]'
                          }`}
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          {isComparing ? t('explore.added') : t('explore.compare')}
                        </button>
                        <Link to={`/vehicles/${v.id}`}>
                          <Badge variant="outline">
                            <ShieldCheck className="h-3 w-3 text-[#C8A97E]" />
                            {t('explore.verified')}
                          </Badge>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {compareSlugs.length > 0 && (
          <div className="fixed bottom-5 right-5 z-40 border border-[#C8A97E] bg-[#111114] px-5 py-3.5 rounded-sm shadow-2xl flex items-center gap-4">
            <span className="text-xs text-[#F4F1EA]">
              {compareSlugs.length} / 3 selected
            </span>
            <Link to={`/compare?slugs=${compareSlugs.join(',')}`}>
              <Button variant="champagne" size="sm">
                Compare Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
