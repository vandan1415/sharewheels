import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BatteryCharging, Fuel, ArrowRight } from 'lucide-react';
import { useAllApprovedVehicles } from '@/hooks/useRouteCraft';
import {
  calculateEvTrip,
  calculateFuelExpense,
  EFFICIENCY_SOURCE_LABELS,
  FUEL_PRICE_REFERENCE_DATE,
  getReferenceFuelPrices,
  parseVehicleEfficiency,
  PROVENANCE_META,
  REFERENCE_FUEL_PRICES_INDIA,
  type EfficiencySource,
} from '@/lib/routecraft';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type FuelMode = 'Petrol' | 'Diesel' | 'CNG' | 'Hybrid' | 'Electric';

export function FuelCalculatorPage() {
  const { data: vehicles = [] } = useAllApprovedVehicles(null);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [citySlug, setCitySlug] = useState('chandigarh-tricity');
  const [fuelType, setFuelType] = useState<FuelMode>('Petrol');
  const [distanceKm, setDistanceKm] = useState(310);

  // Combustion state
  const [manualMileage, setManualMileage] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  // EV state
  const [batteryKwh, setBatteryKwh] = useState(40.5);
  const [ratedRangeKm, setRatedRangeKm] = useState(465);
  const [startBatteryPct, setStartBatteryPct] = useState(90);
  const [reservePct, setReservePct] = useState(15);
  const [evTariff, setEvTariff] = useState(14);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedSlug) ?? null,
    [vehicles, selectedSlug]
  );

  const citySnap = getReferenceFuelPrices(citySlug);

  const handleSelectVehicle = (slug: string) => {
    setSelectedSlug(slug);
    const v = vehicles.find((item) => item.id === slug);
    if (!v) return;
    if (v.citySlug) setCitySlug(v.citySlug);
    const eff = parseVehicleEfficiency(v);
    setFuelType((v.fuelType as FuelMode) || 'Petrol');
    setManualMileage('');
    setManualPrice('');
    if (eff.isElectric) {
      setBatteryKwh(eff.batteryKwh);
      setRatedRangeKm(eff.ratedRangeKm);
      setEvTariff(getReferenceFuelPrices(v.citySlug).evTariffPerKwh);
    }
  };

  const defaultCityFuelPrice =
    fuelType === 'Diesel'
      ? citySnap.dieselInr
      : fuelType === 'CNG'
        ? citySnap.cngInr
        : citySnap.petrolInr;

  const activeUnitPrice =
    manualPrice.trim() !== '' && Number(manualPrice) > 0
      ? Number(manualPrice)
      : defaultCityFuelPrice;

  const vehicleEff = selectedVehicle ? parseVehicleEfficiency(selectedVehicle) : null;
  const defaultCombustionMileage =
    vehicleEff && !vehicleEff.isElectric
      ? vehicleEff.mileageKmPerUnit
      : fuelType === 'Hybrid'
        ? 23.2
        : fuelType === 'CNG'
          ? 22.0
          : fuelType === 'Diesel'
            ? 17.5
            : 16.0;

  const activeMileage =
    manualMileage.trim() !== '' && Number(manualMileage) > 0
      ? Number(manualMileage)
      : defaultCombustionMileage;

  const activeSource: EfficiencySource =
    manualMileage.trim() !== '' && Number(manualMileage) > 0
      ? 'user_entered'
      : vehicleEff?.source ?? 'default_assumption';

  const combustionResult =
    fuelType !== 'Electric'
      ? calculateFuelExpense({
          distanceKm,
          fuelType,
          mileageKmPerUnit: activeMileage,
          efficiencySource: activeSource,
          fuelPricePerUnit: activeUnitPrice,
          isUserEnteredPrice: manualPrice.trim() !== '',
        })
      : null;

  const evResult =
    fuelType === 'Electric'
      ? calculateEvTrip({
          distanceKm,
          batteryKwh,
          ratedRangeKm,
          startBatteryPct,
          reserveBatteryPct: reservePct,
          tariffPerKwh: evTariff,
          efficiencySource: vehicleEff?.source ?? 'default_assumption',
        })
      : null;

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10 space-y-8">
        <div className="border-b border-[#2A2A30] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              {fuelType === 'Electric' ? <BatteryCharging className="h-3.5 w-3.5" /> : <Fuel className="h-3.5 w-3.5" />}
              ROUTECRAFT · Fuel & EV Intelligence
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-[#F4F1EA]">
              Fuel & Charging Cost Calculator
            </h1>
            <p className="text-sm text-[#8E8E98] max-w-2xl">
              Compare Petrol, Diesel, CNG, Hybrid, and Electric vehicle running costs with clear
              efficiency provenance and city fuel rate assumptions.
            </p>
          </div>
          <Link to="/route-planner">
            <Button variant="champagne">
              Open Route Planner
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Inputs Card */}
        <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                Load from SHAREWHEELS Fleet (Optional)
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => handleSelectVehicle(e.target.value)}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
              >
                <option value="">Custom Fuel / Vehicle Assumptions</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.fuelType} · {v.mileageOrRange || 'Default'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                City Fuel Price Reference
              </label>
              <select
                value={citySlug}
                onChange={(e) => setCitySlug(e.target.value)}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
              >
                {Object.values(REFERENCE_FUEL_PRICES_INDIA).map((c) => (
                  <option key={c.citySlug} value={c.citySlug}>{c.cityLabel}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                Trip Distance (km)
              </label>
              <input
                type="number"
                min={5}
                max={10000}
                value={distanceKm}
                onChange={(e) => setDistanceKm(Math.max(5, Number(e.target.value) || 50))}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
              />
            </div>
          </div>

          {/* Fuel Type Selector */}
          <div className="flex flex-wrap gap-2">
            {(['Petrol', 'Diesel', 'CNG', 'Hybrid', 'Electric'] as FuelMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFuelType(mode)}
                className={`border px-4 py-2 rounded-sm text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                  fuelType === mode
                    ? 'border-[#C8A97E] bg-[#C8A97E] text-[#0A0A0B] font-medium'
                    : 'border-[#2A2A30] bg-[#0A0A0B] text-[#E8E4DC] hover:border-[#C8A97E]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {fuelType !== 'Electric' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Expected Mileage (km / {fuelType === 'CNG' ? 'kg' : 'L'})
                </label>
                <input
                  type="number"
                  min={2}
                  step="0.5"
                  value={manualMileage}
                  onChange={(e) => setManualMileage(e.target.value)}
                  placeholder={`Current: ${defaultCombustionMileage} (${EFFICIENCY_SOURCE_LABELS[activeSource]})`}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  {fuelType} Price (₹ / {fuelType === 'CNG' ? 'kg' : 'L'}) — Last Known ({FUEL_PRICE_REFERENCE_DATE})
                </label>
                <input
                  type="number"
                  min={10}
                  step="0.1"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder={`Ref (${citySnap.cityLabel}): ₹${defaultCityFuelPrice}`}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#8E8E98]">Battery (kWh)</label>
                <input
                  type="number"
                  min={5}
                  step="0.5"
                  value={batteryKwh}
                  onChange={(e) => setBatteryKwh(Math.max(5, Number(e.target.value) || 40))}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-[#F4F1EA] rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#8E8E98]">Rated Range (km)</label>
                <input
                  type="number"
                  min={50}
                  value={ratedRangeKm}
                  onChange={(e) => setRatedRangeKm(Math.max(50, Number(e.target.value) || 400))}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-[#F4F1EA] rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#8E8E98]">Start SoC (%)</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={startBatteryPct}
                  onChange={(e) => setStartBatteryPct(Math.max(10, Math.min(100, Number(e.target.value) || 90)))}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-[#F4F1EA] rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#8E8E98]">Min Reserve (%)</label>
                <input
                  type="number"
                  min={10}
                  max={40}
                  value={reservePct}
                  onChange={(e) => setReservePct(Math.max(10, Math.min(40, Number(e.target.value) || 15)))}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-[#F4F1EA] rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#8E8E98]">Tariff (₹/kWh)</label>
                <input
                  type="number"
                  min={1}
                  step="0.5"
                  value={evTariff}
                  onChange={(e) => setEvTariff(Math.max(1, Number(e.target.value) || 14))}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-[#F4F1EA] rounded-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Calculation Results */}
        {combustionResult && (
          <div className="border border-[#C8A97E]/40 bg-[#111114] p-6 rounded-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`border px-2.5 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.12em] ${PROVENANCE_META[combustionResult.provenance].badgeClass}`}>
                {PROVENANCE_META[combustionResult.provenance].label}
              </span>
              <span className="text-xs text-[#8E8E98]">
                Efficiency Basis: <strong className="text-[#E8E4DC]">{EFFICIENCY_SOURCE_LABELS[combustionResult.efficiencySource]}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 border border-[#2A2A30] divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A30] bg-[#0A0A0B]">
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#8E8E98] block">Estimated Fuel Needed</span>
                <strong className="mt-1 font-display text-2xl text-[#F4F1EA]">
                  {combustionResult.fuelRequiredUnits} {combustionResult.fuelUnitLabel}
                </strong>
              </div>
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#8E8E98] block">Fuel Rate Used</span>
                <strong className="mt-1 font-display text-2xl text-[#E8E4DC]">
                  ₹{combustionResult.unitPriceInr}/{combustionResult.fuelUnitLabel}
                </strong>
              </div>
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#8E8E98] block">Running Cost / km</span>
                <strong className="mt-1 font-display text-2xl text-[#E8E4DC]">
                  ₹{combustionResult.costPerKmInr}/km
                </strong>
              </div>
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#C8A97E] block">Estimated Fuel Cost</span>
                <strong className="mt-1 font-display text-3xl text-[#C8A97E]">
                  {formatINR(combustionResult.fuelCostInr)}
                </strong>
              </div>
            </div>

            <div className="border border-amber-500/30 bg-amber-950/15 p-3.5 rounded-sm flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
              <p>
                {citySnap.sourceNote} (last updated {citySnap.lastUpdated}). Actual fuel consumption
                depends on traffic, mountain gradients, driving style, AC load, and vehicle condition.
              </p>
            </div>
          </div>
        )}

        {evResult && (
          <div className="border border-sky-500/40 bg-[#111114] p-6 rounded-sm space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-5 border border-[#2A2A30] divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A30] bg-[#0A0A0B]">
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#8E8E98] block">Consumption</span>
                <strong className="mt-1 font-display text-xl text-[#F4F1EA]">
                  {evResult.energyConsumptionKwhPer100Km} kWh/100km
                </strong>
              </div>
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#8E8E98] block">Energy Required</span>
                <strong className="mt-1 font-display text-xl text-[#F4F1EA]">
                  {evResult.estimatedEnergyRequiredKwh} kWh
                </strong>
              </div>
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#8E8E98] block">Charging Stops</span>
                <strong className="mt-1 font-display text-2xl text-[#C8A97E]">
                  {evResult.chargingStopsNeeded}
                </strong>
              </div>
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#8E8E98] block">Arrival Battery</span>
                <strong className="mt-1 font-display text-xl text-emerald-300">
                  ~{evResult.estimatedRemainingBatteryPct}%
                </strong>
              </div>
              <div className="p-4">
                <span className="text-[10px] uppercase text-[#C8A97E] block">Est. Energy Cost</span>
                <strong className="mt-1 font-display text-2xl text-[#C8A97E]">
                  {formatINR(evResult.totalEnergyCostInr)}
                </strong>
              </div>
            </div>
            <p className="text-xs text-[#8E8E98]">{evResult.availabilityDisclaimer}</p>
          </div>
        )}
      </div>
    </main>
  );
}
