import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Calculator, Loader2 } from 'lucide-react';
import { useAllApprovedVehicles } from '@/hooks/useRouteCraft';
import { CURATED_JOURNEYS } from '@/data/curatedJourneys';
import {
  computeIndiaRoutes,
  haversineKm,
  type RouteDataProvider,
  type RouteWaypoint,
} from '@/lib/googleMaps';
import {
  calculateEvTrip,
  calculateFuelExpense,
  calculateTripBudget,
  EFFICIENCY_SOURCE_LABELS,
  getReferenceFuelPrices,
  getUnitFuelPriceForVehicle,
  parseVehicleEfficiency,
  type AdditionalExpensesInput,
} from '@/lib/routecraft';
import { PlaceAutocompleteInput } from '@/components/routecraft/PlaceAutocompleteInput';
import { BudgetBreakdownCard } from '@/components/routecraft/BudgetBreakdownCard';
import { VehicleJourneyCompare } from '@/components/routecraft/VehicleJourneyCompare';
import { Button } from '@/components/ui/button';

export function TripBudgetPage() {
  const [searchParams] = useSearchParams();
  const vehicleParam = searchParams.get('vehicle');
  const compareFocus = searchParams.get('compare') === '1';

  const { data: vehicles = [] } = useAllApprovedVehicles(null);
  const [selectedVehicleSlug, setSelectedVehicleSlug] = useState('');
  const [originWp, setOriginWp] = useState<RouteWaypoint>(CURATED_JOURNEYS[0].origin);
  const [destWp, setDestWp] = useState<RouteWaypoint>(CURATED_JOURNEYS[0].destination);
  const [tripLabel, setTripLabel] = useState(
    `${CURATED_JOURNEYS[0].origin.label} → ${CURATED_JOURNEYS[0].destination.label}`
  );
  const [distanceKm, setDistanceKm] = useState(310);
  const [providerTollInr, setProviderTollInr] = useState<number | null>(null);
  const [routeProvider, setRouteProvider] = useState<RouteDataProvider>('coordinate_estimate');
  const [routeLoading, setRouteLoading] = useState(false);

  const [rentalDays, setRentalDays] = useState(4);
  const [passengers, setPassengers] = useState(4);
  const [manualTollText, setManualTollText] = useState('650');
  const [maxBudgetText, setMaxBudgetText] = useState('');
  const [additional, setAdditional] = useState<AdditionalExpensesInput>({
    parkingInr: 400,
    accommodationInr: 0,
    foodInr: 0,
    driverChargesInr: 0,
    extraKmChargesInr: 0,
    miscInr: 0,
    additionalServicesInr: 0,
  });

  // Automatically calculate road distance via Google Maps when Indian origin/destination changes
  useEffect(() => {
    let active = true;
    setTripLabel(`${originWp.label} → ${destWp.label}`);
    setRouteLoading(true);
    computeIndiaRoutes(
      { lat: originWp.lat, lng: originWp.lng },
      { lat: destWp.lat, lng: destWp.lng },
      []
    )
      .then((res) => {
        if (!active) return;
        setRouteProvider(res.provider);
        const primary = res.routes[0];
        if (primary?.distanceKm) {
          setDistanceKm(Math.round(primary.distanceKm));
          setProviderTollInr(primary.estimatedTollInr ?? null);
        } else {
          setDistanceKm(
            Math.max(10, Math.round(haversineKm(originWp, destWp) * 1.24))
          );
          setProviderTollInr(null);
        }
      })
      .finally(() => {
        if (active) setRouteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [originWp, destWp]);

  useEffect(() => {
    if (vehicles.length === 0) return;
    if (vehicleParam && vehicles.some((v) => v.id === vehicleParam)) {
      setSelectedVehicleSlug(vehicleParam);
    } else if (!selectedVehicleSlug) {
      setSelectedVehicleSlug(vehicles[0].id);
    }
  }, [vehicles, vehicleParam, selectedVehicleSlug]);

  useEffect(() => {
    if (compareFocus) {
      window.setTimeout(() => {
        document.getElementById('budget-compare-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    }
  }, [compareFocus]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleSlug) ?? vehicles[0] ?? null,
    [vehicles, selectedVehicleSlug]
  );

  const fuelSnap = getReferenceFuelPrices(selectedVehicle?.citySlug);
  const eff = selectedVehicle ? parseVehicleEfficiency(selectedVehicle) : null;
  const unitPrice = selectedVehicle
    ? getUnitFuelPriceForVehicle(selectedVehicle.fuelType, fuelSnap)
    : fuelSnap.petrolInr;

  const evCalc =
    selectedVehicle && eff?.isElectric
      ? calculateEvTrip({
          distanceKm,
          batteryKwh: eff.batteryKwh,
          ratedRangeKm: eff.ratedRangeKm,
          startBatteryPct: 90,
          tariffPerKwh: unitPrice,
          efficiencySource: eff.source,
        })
      : null;

  const fuelCalc =
    selectedVehicle && eff && !eff.isElectric
      ? calculateFuelExpense({
          distanceKm,
          fuelType: selectedVehicle.fuelType,
          mileageKmPerUnit: eff.mileageKmPerUnit,
          efficiencySource: eff.source,
          fuelPricePerUnit: unitPrice,
          isUserEnteredPrice: false,
        })
      : null;

  const manualTollNumber =
    manualTollText.trim() !== '' && Number(manualTollText) >= 0 ? Number(manualTollText) : null;
  const maxBudgetNumber =
    maxBudgetText.trim() !== '' && Number(maxBudgetText) > 0 ? Number(maxBudgetText) : null;

  const summary = calculateTripBudget({
    dailyRateInr: selectedVehicle?.pricePerDay ?? 0,
    rentalDays,
    securityDepositInr: selectedVehicle?.securityDeposit ?? 0,
    fuelOrChargingCostInr: evCalc ? evCalc.totalEnergyCostInr : fuelCalc?.fuelCostInr ?? 0,
    fuelProvenance: evCalc ? evCalc.provenance : fuelCalc?.provenance ?? 'user_assumption',
    fuelDetail: evCalc
      ? `${evCalc.estimatedEnergyRequiredKwh} kWh @ ₹${unitPrice}/kWh`
      : fuelCalc
        ? `${fuelCalc.fuelRequiredUnits} ${fuelCalc.fuelUnitLabel} @ ₹${unitPrice} (${fuelCalc.mileageKmPerUnit} km/${fuelCalc.fuelUnitLabel} · ${EFFICIENCY_SOURCE_LABELS[fuelCalc.efficiencySource]})`
        : 'Select vehicle',
    providerTollInr,
    manualTollInr: manualTollNumber,
    passengers,
    maxBudgetInr: maxBudgetNumber,
    additional,
  });

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-8">
        <div className="border-b border-[#2A2A30] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              <Calculator className="h-3.5 w-3.5" />
              ROUTECRAFT · Trip Budget Engine
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-[#F4F1EA]">
              Complete Trip Expense Calculator
            </h1>
            <p className="text-sm text-[#8E8E98] max-w-2xl">
              Search any Indian origin and destination to pull road distance from Google Maps, then
              model rental fees, fuel or EV charging, tolls, What-If scenarios, and bill splits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/fuel-calculator">
              <Button variant="outline">Fuel & EV Calculator</Button>
            </Link>
            <Link to="/route-planner">
              <Button variant="champagne">
                Open Map Planner
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* All-India Origin / Destination Picker + Vehicle + Trip Parameters */}
        <div className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlaceAutocompleteInput
              label="Origin (All India)"
              value={originWp.label}
              biasPoint={originWp}
              onSelectPlace={(p) => setOriginWp(p)}
            />
            <PlaceAutocompleteInput
              label="Destination (All India)"
              value={destWp.label}
              biasPoint={destWp}
              onSelectPlace={(p) => setDestWp(p)}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                Quick Corridor Preset
              </label>
              <select
                onChange={(e) => {
                  const j = CURATED_JOURNEYS.find((item) => item.id === e.target.value);
                  if (!j) return;
                  setOriginWp(j.origin);
                  setDestWp(j.destination);
                  setRentalDays(j.recommendedDays);
                }}
                defaultValue=""
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
              >
                <option value="" disabled>Choose curated India corridor...</option>
                {CURATED_JOURNEYS.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} ({j.recommendedDays}d)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#2A2A30]">
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                SHAREWHEELS Vehicle (Actual DB Pricing)
              </label>
              <select
                value={selectedVehicleSlug}
                onChange={(e) => setSelectedVehicleSlug(e.target.value)}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.location}) — ₹{v.pricePerDay}/d · {v.fuelType}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Driving Distance (km)
                </label>
                <span className="text-[10px] text-[#C8A97E] inline-flex items-center gap-1">
                  {routeLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {routeProvider !== 'coordinate_estimate' ? 'Google Maps' : 'Est.'}
                </span>
              </div>
              <input
                type="number"
                min={10}
                max={10000}
                value={distanceKm}
                onChange={(e) => setDistanceKm(Math.max(10, Number(e.target.value) || 100))}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                Rental Days
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={rentalDays}
                onChange={(e) => setRentalDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
              />
            </div>
          </div>
        </div>

        <BudgetBreakdownCard
          tripTitle={tripLabel}
          summary={summary}
          additional={additional}
          onChangeAdditional={setAdditional}
          manualTollText={manualTollText}
          onChangeManualTollText={setManualTollText}
          onChangePassengers={setPassengers}
          maxBudgetText={maxBudgetText}
          onChangeMaxBudgetText={setMaxBudgetText}
          onQuickSuggest={(action) => {
            if (action === 'add_passenger') setPassengers((p) => p + 1);
            if (action === 'compare_vehicles') {
              document.getElementById('budget-compare-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        <div id="budget-compare-section">
          <VehicleJourneyCompare
            vehicles={vehicles}
            distanceKm={distanceKm}
            rentalDays={rentalDays}
            passengers={passengers}
            tollInr={summary.tollCostInr}
            citySlug={selectedVehicle?.citySlug}
            primaryVehicleSlug={selectedVehicle?.id}
            onSelectVehicle={(v) => setSelectedVehicleSlug(v.id)}
          />
        </div>
      </div>
    </main>
  );
}
