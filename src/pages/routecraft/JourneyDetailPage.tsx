import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Compass, MapPin } from 'lucide-react';
import { findCuratedJourney } from '@/data/curatedJourneys';
import { useAllApprovedVehicles } from '@/hooks/useRouteCraft';
import {
  computeIndiaRoutes,
  haversineKm,
  type ComputedRouteOption,
  type FacilityLayerId,
} from '@/lib/googleMaps';
import {
  calculateFuelExpense,
  formatDurationMinutes,
  getReferenceFuelPrices,
  getUnitFuelPriceForVehicle,
  parseVehicleEfficiency,
} from '@/lib/routecraft';
import { formatINR } from '@/lib/utils';
import { RouteCraftMap } from '@/components/routecraft/RouteCraftMap';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/ui/VehicleImage';

export function JourneyDetailPage() {
  const { id } = useParams();
  const journey = findCuratedJourney(id);
  const { data: allVehicles = [] } = useAllApprovedVehicles(null);
  const [routes, setRoutes] = useState<ComputedRouteOption[]>([]);
  const [serverConfigured, setServerConfigured] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<FacilityLayerId>>(
    () => new Set<FacilityLayerId>(['sharewheels_vehicles'])
  );

  useEffect(() => {
    if (!journey) return;
    computeIndiaRoutes(
      { lat: journey.origin.lat, lng: journey.origin.lng },
      { lat: journey.destination.lat, lng: journey.destination.lng },
      journey.suggestedStops.map((s) => ({ lat: s.lat, lng: s.lng }))
    )
      .then((res) => {
        setServerConfigured(res.serverConfigured);
        setRoutes(res.routes);
      })
      .catch(() => {});
  }, [journey]);

  const localVehicles = useMemo(() => {
    if (!journey) return [];
    const cityMatches = allVehicles.filter((v) => v.citySlug === journey.originCitySlug);
    return (cityMatches.length > 0 ? cityMatches : allVehicles).slice(0, 6);
  }, [journey, allVehicles]);

  if (!journey) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] pt-28 px-6 text-center space-y-4">
        <p className="font-display text-2xl text-[#F4F1EA]">Curated journey not found</p>
        <Link to="/journeys">
          <Button variant="outline">Back to All Journeys</Button>
        </Link>
      </main>
    );
  }

  const primaryRoute = routes[0];
  const fallbackKm = (() => {
    const pts = [journey.origin, ...journey.suggestedStops, journey.destination];
    let sum = 0;
    for (let i = 0; i < pts.length - 1; i += 1) sum += haversineKm(pts[i], pts[i + 1]);
    return Number((sum * 1.24).toFixed(1));
  })();
  const distanceKm = primaryRoute?.distanceKm ?? fallbackKm;
  const durationMinutes =
    primaryRoute?.durationMinutes ?? Math.round((fallbackKm / 52) * 60);

  const recommendedVehicle =
    localVehicles.find((v) => v.category === journey.recommendedCategory) ??
    localVehicles[0];
  const fuelSnap = getReferenceFuelPrices(journey.originCitySlug);
  const eff = recommendedVehicle ? parseVehicleEfficiency(recommendedVehicle) : null;
  const estFuel =
    recommendedVehicle && eff
      ? calculateFuelExpense({
          distanceKm,
          fuelType: recommendedVehicle.fuelType,
          mileageKmPerUnit: eff.mileageKmPerUnit,
          efficiencySource: eff.source,
          fuelPricePerUnit: getUnitFuelPriceForVehicle(recommendedVehicle.fuelType, fuelSnap),
          isUserEnteredPrice: false,
        }).fuelCostInr
      : 0;
  const estRental = recommendedVehicle ? recommendedVehicle.pricePerDay * journey.recommendedDays : 0;

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/journeys"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#8E8E98] hover:text-[#C8A97E]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Curated Journeys
          </Link>
          <Link to={`/route-planner?journey=${journey.id}`}>
            <Button variant="champagne" size="lg">
              PLAN THIS JOURNEY
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Hero Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#2A2A30] pb-10">
          <div className="lg:col-span-6 space-y-4">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              <Compass className="h-3.5 w-3.5" />
              {journey.recommendedCategory} · {journey.bestSeason}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F1EA]">
              {journey.title}
            </h1>
            <p className="text-base text-[#E8E4DC]">{journey.subtitle}</p>
            <p className="text-sm text-[#8E8E98] leading-relaxed">{journey.routeNotes}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-[#2A2A30] bg-[#111114] p-4 rounded-sm text-xs">
              <div>
                <span className="text-[10px] uppercase text-[#8E8E98] block">Distance</span>
                <strong className="font-display text-lg text-[#F4F1EA]">{distanceKm} km</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8E8E98] block">Drive Time</span>
                <strong className="font-display text-lg text-[#F4F1EA]">
                  {formatDurationMinutes(durationMinutes)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8E8E98] block">Rec. Duration</span>
                <strong className="font-display text-lg text-[#C8A97E]">
                  {journey.recommendedDays} Days
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8E8E98] block">Total Est.</span>
                <strong className="font-display text-lg text-[#F4F1EA]">
                  {estRental > 0 ? formatINR(estRental + estFuel) : 'See Planner'}
                </strong>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[16/10] bg-[#111114] border border-[#2A2A30] rounded-sm overflow-hidden">
            <VehicleImage
              src={journey.heroImage}
              alt={journey.title}
              label={journey.title}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Route Map */}
        <RouteCraftMap
          origin={journey.origin}
          destination={journey.destination}
          stops={journey.suggestedStops}
          routes={routes}
          selectedRouteIndex={0}
          activeLayers={activeLayers}
          onToggleLayer={(layer) =>
            setActiveLayers((prev) => {
              const next = new Set(prev);
              if (next.has(layer)) next.delete(layer);
              else next.add(layer);
              return next;
            })
          }
          nearbyPlaces={[]}
          loadingLayers={false}
          vehicles={localVehicles}
          serverConfigured={serverConfigured}
          heightClass="h-[380px] lg:h-[460px]"
        />

        {/* Stops & Places to Visit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-4">
            <h2 className="font-display text-xl font-medium text-[#F4F1EA]">Suggested Route Stops</h2>
            <div className="space-y-2.5 text-xs">
              {journey.suggestedStops.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 border border-[#2A2A30] bg-[#0A0A0B] p-3 rounded-sm">
                  <span className="text-[#C8A97E] font-mono">0{idx + 1}</span>
                  <MapPin className="h-3.5 w-3.5 text-[#C8A97E]" />
                  <span className="text-[#F4F1EA] font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-4">
            <h2 className="font-display text-xl font-medium text-[#F4F1EA]">Places to Visit Along the Corridor</h2>
            <ul className="space-y-2.5 text-xs text-[#E8E4DC]">
              {journey.placesToVisit.map((place) => (
                <li key={place} className="border border-[#2A2A30] bg-[#0A0A0B] px-3 py-2.5 rounded-sm">
                  {place}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Real Matching Vehicles */}
        {localVehicles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-medium text-[#F4F1EA]">
                Recommended SHAREWHEELS Vehicles
              </h2>
              <Link to={`/route-planner?journey=${journey.id}`}>
                <Button variant="champagne" size="sm">PLAN THIS JOURNEY</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {localVehicles.slice(0, 3).map((v) => (
                <div key={v.id} className="border border-[#2A2A30] bg-[#111114] rounded-sm overflow-hidden flex flex-col">
                  <div className="aspect-[16/10] bg-[#1A1A1F]">
                    <VehicleImage src={v.image} alt={v.name} label={v.name} className="w-full h-full" />
                  </div>
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#C8A97E]">{v.category}</p>
                      <h3 className="font-display text-lg font-medium text-[#F4F1EA]">{v.name}</h3>
                      <p className="text-xs text-[#8E8E98]">{v.location} · {v.fuelType} · {v.seats} seats</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#2A2A30]">
                      <span className="font-medium text-sm text-[#C8A97E]">{formatINR(v.pricePerDay)}/day</span>
                      <Link to={`/route-planner?journey=${journey.id}&vehicle=${v.id}`}>
                        <Button size="sm" variant="outline">Plan With This Car</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
