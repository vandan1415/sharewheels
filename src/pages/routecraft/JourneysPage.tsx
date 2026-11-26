import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import { CURATED_JOURNEYS } from '@/data/curatedJourneys';
import { useAllApprovedVehicles } from '@/hooks/useRouteCraft';
import { calculateFuelExpense, getReferenceFuelPrices, parseVehicleEfficiency } from '@/lib/routecraft';
import { haversineKm } from '@/lib/googleMaps';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/ui/VehicleImage';

export function JourneysPage() {
  const { data: vehicles = [] } = useAllApprovedVehicles(null);

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-12">
        <div className="border-b border-[#2A2A30] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              <Compass className="h-3.5 w-3.5" />
              ROUTECRAFT · Curated Road Trips Across India
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.025em] text-[#F4F1EA]">
              Discover Signature Journeys
            </h1>
            <p className="text-sm text-[#8E8E98] max-w-2xl leading-relaxed">
              Curated driving corridors from Himalayan passes to Sahyadri coastlines. Open any
              itinerary to populate ROUTECRAFT with coordinates, stops, and live SHAREWHEELS vehicle pricing.
            </p>
          </div>
          <Link to="/route-planner">
            <Button variant="champagne">
              Open Blank Route Planner
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CURATED_JOURNEYS.map((j) => {
            const originVehicles = vehicles.filter((v) => v.citySlug === j.originCitySlug);
            const matchedVehicle =
              originVehicles.find((v) => v.category === j.recommendedCategory) ??
              originVehicles[0] ??
              vehicles[0];

            const pts = [j.origin, ...j.suggestedStops, j.destination];
            let straightKm = 0;
            for (let i = 0; i < pts.length - 1; i += 1) {
              straightKm += haversineKm(pts[i], pts[i + 1]);
            }
            const estDistKm = Math.round(straightKm * 1.24);
            const estRental = matchedVehicle ? matchedVehicle.pricePerDay * j.recommendedDays : 0;
            const fuelSnap = getReferenceFuelPrices(j.originCitySlug);
            const eff = matchedVehicle ? parseVehicleEfficiency(matchedVehicle) : null;
            const estFuel =
              matchedVehicle && eff && !eff.isElectric
                ? calculateFuelExpense({
                    distanceKm: estDistKm,
                    fuelType: matchedVehicle.fuelType,
                    mileageKmPerUnit: eff.mileageKmPerUnit,
                    efficiencySource: eff.source,
                    fuelPricePerUnit: fuelSnap.petrolInr,
                    isUserEnteredPrice: false,
                  }).fuelCostInr
                : 0;

            return (
              <div
                key={j.id}
                className="group border border-[#2A2A30] bg-[#111114] rounded-sm overflow-hidden flex flex-col hover:border-[#C8A97E]/60 transition-colors"
              >
                <Link to={`/journey/${j.id}`} className="relative aspect-[16/9] bg-[#1A1A1F] block overflow-hidden">
                  <VehicleImage
                    src={j.heroImage}
                    alt={j.title}
                    label={j.title}
                    className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
                        {j.recommendedCategory} · {j.recommendedDays} Days
                      </p>
                      <h2 className="font-display text-2xl font-semibold text-[#F4F1EA]">
                        {j.title}
                      </h2>
                    </div>
                    <span className="border border-[#2A2A30] bg-[#0A0A0B]/90 px-2.5 py-1 rounded-sm text-xs text-[#E8E4DC]">
                      ~{estDistKm} km
                    </span>
                  </div>
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#E8E4DC]">{j.subtitle}</p>
                    <p className="text-xs text-[#8E8E98] leading-relaxed">{j.routeNotes}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {j.suggestedStops.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 border border-[#2A2A30] bg-[#0A0A0B] px-2 py-0.5 rounded-sm text-[11px] text-[#8E8E98]"
                        >
                          <MapPin className="h-3 w-3 text-[#C8A97E]" />
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#2A2A30] pt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-[#8E8E98] block">Est. Rental</span>
                        <strong className="text-[#F4F1EA]">
                          {estRental > 0 ? formatINR(estRental) : 'Check fleet'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#8E8E98] block">Est. Fuel</span>
                        <strong className="text-[#E8E4DC]">
                          {estFuel > 0 ? formatINR(estFuel) : 'Calc in planner'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#8E8E98] block">Est. Combined</span>
                        <strong className="text-[#C8A97E]">
                          {estRental > 0 ? formatINR(estRental + estFuel) : '—'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <Link to={`/route-planner?journey=${j.id}`} className="flex-1">
                        <Button variant="champagne" className="w-full">
                          PLAN THIS JOURNEY
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Link to={`/journey/${j.id}`}>
                        <Button variant="outline">Itinerary</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
