import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { LiveVehicle } from '@/hooks/useVehicles';
import { formatINR } from '@/lib/utils';
import {
  calculateEvTrip,
  calculateFuelExpense,
  EFFICIENCY_SOURCE_LABELS,
  getReferenceFuelPrices,
  getUnitFuelPriceForVehicle,
  parseVehicleEfficiency,
} from '@/lib/routecraft';
import { Button } from '@/components/ui/button';

interface VehicleJourneyCompareProps {
  vehicles: LiveVehicle[];
  distanceKm: number;
  rentalDays: number;
  passengers: number;
  tollInr: number;
  citySlug?: string | null;
  primaryVehicleSlug?: string | null;
  onSelectVehicle?: (vehicle: LiveVehicle) => void;
}

export function VehicleJourneyCompare({
  vehicles,
  distanceKm,
  rentalDays,
  passengers,
  tollInr,
  citySlug,
  primaryVehicleSlug,
  onSelectVehicle,
}: VehicleJourneyCompareProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (vehicles.length === 0 || selectedSlugs.length > 0) return;
    const initial: string[] = [];
    if (primaryVehicleSlug && vehicles.some((v) => v.id === primaryVehicleSlug)) {
      initial.push(primaryVehicleSlug);
    }
    for (const v of vehicles) {
      if (initial.length >= 3) break;
      if (!initial.includes(v.id)) initial.push(v.id);
    }
    setSelectedSlugs(initial);
  }, [vehicles, primaryVehicleSlug, selectedSlugs.length]);

  const fuelSnap = getReferenceFuelPrices(citySlug);
  const chosenVehicles = selectedSlugs
    .map((slug) => vehicles.find((v) => v.id === slug))
    .filter((v): v is LiveVehicle => Boolean(v));

  const setSlot = (slotIdx: number, newSlug: string) => {
    setSelectedSlugs((prev) => {
      const next = [...prev];
      next[slotIdx] = newSlug;
      return next;
    });
  };

  if (vehicles.length === 0) return null;

  const computed = chosenVehicles.map((v) => {
    const eff = parseVehicleEfficiency(v);
    const unitPrice = getUnitFuelPriceForVehicle(v.fuelType, fuelSnap);
    const fuelOrChargingCostInr = eff.isElectric
      ? calculateEvTrip({
          distanceKm,
          batteryKwh: eff.batteryKwh,
          ratedRangeKm: eff.ratedRangeKm,
          startBatteryPct: 90,
          tariffPerKwh: unitPrice,
          efficiencySource: eff.source,
        }).totalEnergyCostInr
      : calculateFuelExpense({
          distanceKm,
          fuelType: v.fuelType,
          mileageKmPerUnit: eff.mileageKmPerUnit,
          efficiencySource: eff.source,
          fuelPricePerUnit: unitPrice,
          isUserEnteredPrice: false,
        }).fuelCostInr;

    const rentalInr = v.pricePerDay * Math.max(1, rentalDays);
    const totalInr = rentalInr + fuelOrChargingCostInr + tollInr;
    const perPersonInr = Math.round(totalInr / Math.max(1, passengers));

    return {
      vehicle: v,
      eff,
      rentalInr,
      fuelOrChargingCostInr,
      totalInr,
      perPersonInr,
    };
  });

  return (
    <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#2A2A30] pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#C8A97E]">
            Compare Your Journey Cost
          </p>
          <h3 className="font-display text-2xl font-semibold text-[#F4F1EA]">
            Compare Up to 3 SHAREWHEELS Vehicles
          </h3>
        </div>
        <p className="text-xs text-[#8E8E98]">
          {distanceKm} km · {rentalDays} day{rentalDays > 1 ? 's' : ''} · {passengers} passengers
        </p>
      </div>

      {/* Vehicle Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((idx) => (
          <select
            key={idx}
            value={selectedSlugs[idx] || ''}
            onChange={(e) => setSlot(idx, e.target.value)}
            className="h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.location} · ₹{v.pricePerDay}/d · {v.fuelType})
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* Comparison Matrix */}
      <div className="overflow-x-auto border border-[#2A2A30] rounded-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0A0A0B] border-b border-[#2A2A30] text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
            <tr>
              <th className="py-3 px-4">Comparison</th>
              {computed.map((item, idx) => (
                <th key={`${item.vehicle.id}-${idx}`} className="py-3 px-4 text-[#F4F1EA]">
                  {item.vehicle.name}
                  <span className="block text-[10px] font-normal text-[#8E8E98]">
                    {item.vehicle.location} · {item.vehicle.fuelType}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A30]">
            <tr>
              <td className="py-3 px-4 text-[#8E8E98]">Rental expense ({rentalDays}d)</td>
              {computed.map((c, idx) => (
                <td key={idx} className="py-3 px-4 font-medium text-[#F4F1EA]">
                  {formatINR(c.rentalInr)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-4 text-[#8E8E98]">Estimated fuel / charging</td>
              {computed.map((c, idx) => (
                <td key={idx} className="py-3 px-4 font-medium text-[#E8E4DC]">
                  {formatINR(c.fuelOrChargingCostInr)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-4 text-[#8E8E98]">Toll expense</td>
              {computed.map((_, idx) => (
                <td key={idx} className="py-3 px-4 text-[#E8E4DC]">
                  {tollInr > 0 ? formatINR(tollInr) : '₹0 / Unavailable'}
                </td>
              ))}
            </tr>
            <tr className="bg-[#0A0A0B]">
              <td className="py-3 px-4 font-medium text-[#C8A97E]">Total trip cost</td>
              {computed.map((c, idx) => (
                <td key={idx} className="py-3 px-4 font-display text-base font-semibold text-[#C8A97E]">
                  {formatINR(c.totalInr)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-4 text-[#8E8E98]">Cost per person</td>
              {computed.map((c, idx) => (
                <td key={idx} className="py-3 px-4 font-medium text-[#F4F1EA]">
                  {formatINR(c.perPersonInr)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-4 text-[#8E8E98]">Fuel efficiency assumption</td>
              {computed.map((c, idx) => (
                <td key={idx} className="py-3 px-4 text-[11px] text-[#8E8E98]">
                  {c.eff.isElectric
                    ? `${c.eff.batteryKwh} kWh · ${c.eff.ratedRangeKm} km`
                    : `${c.eff.mileageKmPerUnit} km/l`}
                  <span className="block text-[10px]">
                    {EFFICIENCY_SOURCE_LABELS[c.eff.source]}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-4 text-[#8E8E98]">Action</td>
              {computed.map((c, idx) => (
                <td key={idx} className="py-3 px-4">
                  <div className="flex flex-wrap gap-2">
                    {onSelectVehicle && (
                      <Button
                        type="button"
                        size="sm"
                        variant="champagne"
                        onClick={() => onSelectVehicle(c.vehicle)}
                      >
                        Use in Plan
                      </Button>
                    )}
                    <Link
                      to={`/vehicles/${c.vehicle.id}`}
                      className="inline-flex items-center gap-1 border border-[#2A2A30] hover:border-[#C8A97E] px-2.5 py-1.5 rounded-sm text-[11px] text-[#E8E4DC]"
                    >
                      Listing
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
