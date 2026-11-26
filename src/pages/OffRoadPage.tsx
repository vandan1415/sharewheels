import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, MapPin } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useLocationContext } from '@/context/LocationContext';
import { formatINR } from '@/lib/utils';
import { calculateHourlyPriceInr } from '@/lib/pricing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/ui/VehicleImage';

export function OffRoadPage() {
  const { selectedCity, openLocationModal } = useLocationContext();
  const { data: cityVehicles = [], isLoading } = useVehicles();
  const [videoError, setVideoError] = useState(false);

  const adventurePool = useMemo(
    () =>
      cityVehicles.filter(
        (v) =>
          v.category === 'Off-Road & Adventure' ||
          v.drivetrain === '4x4' ||
          v.drivetrain === '4WD' ||
          v.drivetrain === 'AWD' ||
          Boolean(v.offRoadSpecs)
      ),
    [cityVehicles]
  );

  const [drivetrain, setDrivetrain] = useState<'All' | '4x4' | '4WD' | 'AWD' | '2WD'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [transmission, setTransmission] = useState<'All' | 'Automatic' | 'Manual'>('All');
  const [fuelType, setFuelType] = useState<'All' | 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid'>('All');
  const [minSeats, setMinSeats] = useState<number>(1);
  const [minClearance, setMinClearance] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(15000);

  const filtered = useMemo(() => {
    return adventurePool.filter((v) => {
      const dt = v.offRoadSpecs?.drivetrain || v.drivetrain;
      if (drivetrain !== 'All' && dt !== drivetrain) return false;
      if (categoryFilter !== 'All' && v.category !== categoryFilter) return false;
      if (transmission !== 'All' && v.transmission !== transmission) return false;
      if (fuelType !== 'All' && v.fuelType !== fuelType) return false;
      if (v.seats < minSeats) return false;
      if (minClearance > 0 && (v.offRoadSpecs?.groundClearanceMm ?? 0) < minClearance) return false;
      if (v.pricePerDay > maxBudget) return false;
      return true;
    });
  }, [adventurePool, drivetrain, categoryFilter, transmission, fuelType, minSeats, minClearance, maxBudget]);

  const scrollToFleet = () => {
    document.getElementById('adventure-fleet')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="bg-[#0B0C0E] text-[#F4F1EA] pt-14">
      {/* Cinematic Opening Section preserving full 16:9 aspect ratio */}
      <section className="relative w-full border-b border-[#26282B] bg-[#0B0C0E] overflow-hidden">
        <div className="relative w-full aspect-video max-h-[86vh] mx-auto bg-[#0B0C0E]">
          {!videoError ? (
            <video
              src="/videos/sharewheels-offroad.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setVideoError(true)}
              className="h-full w-full object-contain bg-[#0B0C0E]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-[#131518] text-xs uppercase tracking-[0.2em] text-[#8E8E98]">
              Adventure Fleet — {selectedCity?.name || 'India'}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-[#0B0C0E]/20 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-10 -mt-20 sm:-mt-28 pb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold uppercase tracking-[-0.03em] text-[#F4F1EA] leading-[0.95]">
              BUILT FOR THE UNPAVED.
            </h1>
            <p className="text-sm sm:text-base text-[#E8E4DC]/85 max-w-xl">
              Leave the ordinary behind. Discover vehicles made for the roads less travelled.
            </p>
          </div>

          <Button variant="champagne" size="lg" onClick={scrollToFleet}>
            Explore Adventure Vehicles
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </section>

      {/* City-Scoped Adventure Listings & Filters */}
      <section id="adventure-fleet" className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#26282B] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              <span>{selectedCity ? selectedCity.name : 'Select Location'}</span>
              <button
                type="button"
                onClick={openLocationModal}
                className="underline text-[#E8E4DC] hover:text-[#C8A97E] cursor-pointer"
              >
                Change City
              </button>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F1EA]">
              Adventure & 4x4 Fleet
            </h2>
          </div>
          <span className="text-xs text-[#8E8E98]">
            {!selectedCity
              ? 'Select a city to view availability'
              : isLoading
                ? 'Loading adventure vehicles...'
                : `${filtered.length} matching vehicles in ${selectedCity.name}`}
          </span>
        </div>

        {/* Adventure Filter Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border border-[#26282B] bg-[#131518] p-5 rounded-sm">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] mb-1.5">
              Drivetrain
            </label>
            <select
              value={drivetrain}
              onChange={(e) => setDrivetrain(e.target.value as typeof drivetrain)}
              className="w-full h-10 rounded-sm border border-[#26282B] bg-[#0B0C0E] px-3 text-xs text-[#F4F1EA]"
            >
              <option value="All">All (4x4, 4WD, AWD)</option>
              <option value="4x4">4x4</option>
              <option value="4WD">4WD</option>
              <option value="AWD">AWD</option>
              <option value="2WD">2WD</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] mb-1.5">
              Vehicle Class
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 rounded-sm border border-[#26282B] bg-[#0B0C0E] px-3 text-xs text-[#F4F1EA]"
            >
              <option value="All">All Adventure Classes</option>
              <option value="Off-Road & Adventure">Off-Road & Adventure</option>
              <option value="Full-Size SUVs">Full-Size SUVs</option>
              <option value="Compact SUVs">Compact SUVs</option>
              <option value="Luxury Vehicles">Luxury Vehicles</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] mb-1.5">
              Transmission & Fuel
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as typeof transmission)}
                className="h-10 rounded-sm border border-[#26282B] bg-[#0B0C0E] px-2 text-xs text-[#F4F1EA]"
              >
                <option value="All">Any Trans.</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as typeof fuelType)}
                className="h-10 rounded-sm border border-[#26282B] bg-[#0B0C0E] px-2 text-xs text-[#F4F1EA]"
              >
                <option value="All">Any Fuel</option>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] mb-1.5">
              Seats & Clearance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={minSeats}
                onChange={(e) => setMinSeats(Number(e.target.value))}
                className="h-10 rounded-sm border border-[#26282B] bg-[#0B0C0E] px-2 text-xs text-[#F4F1EA]"
              >
                <option value={1}>Any Seats</option>
                <option value={4}>4+ Seats</option>
                <option value={5}>5+ Seats</option>
                <option value={7}>7 Seats</option>
              </select>
              <select
                value={minClearance}
                onChange={(e) => setMinClearance(Number(e.target.value))}
                className="h-10 rounded-sm border border-[#26282B] bg-[#0B0C0E] px-2 text-xs text-[#F4F1EA]"
              >
                <option value={0}>Any Clearance</option>
                <option value={200}>200mm+</option>
                <option value={215}>215mm+</option>
                <option value={225}>225mm+</option>
              </select>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4 pt-1">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98] shrink-0">
              Max Daily Rate: {formatINR(maxBudget)}
            </span>
            <input
              type="range"
              min={2500}
              max={15000}
              step={500}
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-[#C8A97E] cursor-pointer"
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDrivetrain('All');
                setCategoryFilter('All');
                setTransmission('All');
                setFuelType('All');
                setMinSeats(1);
                setMinClearance(0);
                setMaxBudget(15000);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Adventure Fleet Results */}
        {!selectedCity ? (
          <div className="border border-[#26282B] bg-[#131518] p-12 text-center space-y-4">
            <p className="font-display text-xl text-[#F4F1EA]">
              Choose your city to see local 4x4 & AWD availability
            </p>
            <Button variant="champagne" onClick={openLocationModal}>
              Select Location
            </Button>
          </div>
        ) : filtered.length === 0 && !isLoading ? (
          <div className="border border-[#26282B] bg-[#131518] p-12 text-center space-y-3">
            <p className="font-display text-lg text-[#F4F1EA]">
              No matching adventure vehicles in {selectedCity.name}
            </p>
            <p className="text-xs text-[#8E8E98]">
              Adjust your drivetrain, clearance, or budget filters, or check another city.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((v) => {
              const specs = v.offRoadSpecs;
              return (
                <div
                  key={v.id}
                  className="border border-[#26282B] bg-[#131518] rounded-sm overflow-hidden flex flex-col"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12">
                    <div className="sm:col-span-5 relative aspect-[4/3] sm:aspect-auto bg-[#0B0C0E]">
                      <VehicleImage
                        src={v.image}
                        alt={v.name}
                        label={`${v.brand} ${v.model}`}
                        className="h-full w-full"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="champagne" className="bg-[#0B0C0E]/90">
                          {specs?.drivetrain || v.drivetrain}
                        </Badge>
                      </div>
                    </div>

                    <div className="sm:col-span-7 p-5 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                          <span>{specs?.subCategory || v.category}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#C8A97E]" />
                            {v.location}
                          </span>
                        </div>
                        <h3 className="mt-1 font-display text-xl font-medium text-[#F4F1EA]">
                          {v.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#8E8E98]">
                          {v.year} · {v.transmission} · {v.fuelType} · {v.seats} Seats
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-y border-[#26282B] py-3 text-xs">
                        <div>
                          <p className="text-[10px] uppercase text-[#8E8E98]">Clearance</p>
                          <p className="font-medium text-[#F4F1EA]">
                            {specs?.groundClearanceMm ? `${specs.groundClearanceMm} mm` : 'OEM Spec'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#8E8E98]">Angles (A/D)</p>
                          <p className="font-medium text-[#F4F1EA]">
                            {specs?.approachAngleDeg
                              ? `${specs.approachAngleDeg}° / ${specs.departureAngleDeg}°`
                              : 'Standard SUV'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#8E8E98]">Rate</p>
                          <p className="font-medium text-[#C8A97E]">
                            {formatINR(v.pricePerDay)}/d · {formatINR(calculateHourlyPriceInr(v.pricePerDay))}/h
                          </p>
                        </div>
                      </div>

                      {specs?.modifications && specs.modifications.length > 0 && (
                        <p className="text-[11px] text-[#8E8E98]">
                          Hardware: {specs.modifications.join(' · ')}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#8E8E98] truncate max-w-[200px]">
                          {specs?.tyreType || v.mileageOrRange}
                        </span>
                        <Link to={`/vehicles/${v.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
