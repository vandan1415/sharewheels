import type { LiveVehicle } from '@/hooks/useVehicles';
import type { LatLngPoint, RouteWaypoint } from '@/lib/googleMaps';
import { haversineKm } from '@/lib/googleMaps';
import { formatMinutesLocalized } from '@/i18n/dynamic';

export type CostProvenance =
  | 'confirmed'
  | 'provider_estimate'
  | 'spec_calculated'
  | 'user_assumption'
  | 'unavailable';

export const PROVENANCE_META: Record<
  CostProvenance,
  { label: string; badgeClass: string }
> = {
  confirmed: {
    label: 'Confirmed price',
    badgeClass: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
  },
  provider_estimate: {
    label: 'Provider-supplied estimate',
    badgeClass: 'border-[#C8A97E]/40 bg-[#C8A97E]/10 text-[#C8A97E]',
  },
  spec_calculated: {
    label: 'Vehicle spec calculation',
    badgeClass: 'border-sky-500/40 bg-sky-950/30 text-sky-300',
  },
  user_assumption: {
    label: 'User-entered assumption',
    badgeClass: 'border-[#2A2A30] bg-[#1A1A1F] text-[#E8E4DC]',
  },
  unavailable: {
    label: 'Unavailable information',
    badgeClass: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
  },
};

export type EfficiencySource =
  | 'manufacturer_certified'
  | 'owner_reported'
  | 'user_entered'
  | 'default_assumption';

export const EFFICIENCY_SOURCE_LABELS: Record<EfficiencySource, string> = {
  manufacturer_certified: 'Manufacturer-certified figure',
  owner_reported: 'Owner-reported figure',
  user_entered: 'User-entered mileage',
  default_assumption: 'Default planning assumption',
};

export interface FuelPriceSnapshot {
  citySlug: string;
  cityLabel: string;
  petrolInr: number;
  dieselInr: number;
  cngInr: number;
  evTariffPerKwh: number;
  lastUpdated: string;
  sourceNote: string;
  isLiveFeed: boolean;
}

export const FUEL_PRICE_REFERENCE_DATE = '2026-11-25';

export const REFERENCE_FUEL_PRICES_INDIA: Record<string, FuelPriceSnapshot> = {
  'delhi-ncr': {
    citySlug: 'delhi-ncr',
    cityLabel: 'Delhi NCR',
    petrolInr: 94.77,
    dieselInr: 87.67,
    cngInr: 75.09,
    evTariffPerKwh: 14,
    lastUpdated: FUEL_PRICE_REFERENCE_DATE,
    sourceNote: 'Last known reference baseline (no live fuel price feed connected — editable)',
    isLiveFeed: false,
  },
  mumbai: {
    citySlug: 'mumbai',
    cityLabel: 'Mumbai',
    petrolInr: 103.5,
    dieselInr: 90.03,
    cngInr: 77.0,
    evTariffPerKwh: 16,
    lastUpdated: FUEL_PRICE_REFERENCE_DATE,
    sourceNote: 'Last known reference baseline (no live fuel price feed connected — editable)',
    isLiveFeed: false,
  },
  bengaluru: {
    citySlug: 'bengaluru',
    cityLabel: 'Bengaluru',
    petrolInr: 102.92,
    dieselInr: 90.99,
    cngInr: 82.0,
    evTariffPerKwh: 15,
    lastUpdated: FUEL_PRICE_REFERENCE_DATE,
    sourceNote: 'Last known reference baseline (no live fuel price feed connected — editable)',
    isLiveFeed: false,
  },
  hyderabad: {
    citySlug: 'hyderabad',
    cityLabel: 'Hyderabad',
    petrolInr: 107.46,
    dieselInr: 95.7,
    cngInr: 92.0,
    evTariffPerKwh: 15,
    lastUpdated: FUEL_PRICE_REFERENCE_DATE,
    sourceNote: 'Last known reference baseline (no live fuel price feed connected — editable)',
    isLiveFeed: false,
  },
  chennai: {
    citySlug: 'chennai',
    cityLabel: 'Chennai',
    petrolInr: 100.8,
    dieselInr: 92.39,
    cngInr: 85.0,
    evTariffPerKwh: 15,
    lastUpdated: FUEL_PRICE_REFERENCE_DATE,
    sourceNote: 'Last known reference baseline (no live fuel price feed connected — editable)',
    isLiveFeed: false,
  },
  pune: {
    citySlug: 'pune',
    cityLabel: 'Pune',
    petrolInr: 104.22,
    dieselInr: 90.75,
    cngInr: 87.9,
    evTariffPerKwh: 16,
    lastUpdated: FUEL_PRICE_REFERENCE_DATE,
    sourceNote: 'Last known reference baseline (no live fuel price feed connected — editable)',
    isLiveFeed: false,
  },
  'chandigarh-tricity': {
    citySlug: 'chandigarh-tricity',
    cityLabel: 'Chandigarh Tricity',
    petrolInr: 94.3,
    dieselInr: 82.45,
    cngInr: 84.0,
    evTariffPerKwh: 14,
    lastUpdated: FUEL_PRICE_REFERENCE_DATE,
    sourceNote: 'Last known reference baseline (no live fuel price feed connected — editable)',
    isLiveFeed: false,
  },
  jaipur: {
    citySlug: 'jaipur',
    cityLabel: 'Jaipur',
    petrolInr: 104.72,
    dieselInr: 90.21,
    cngInr: 91.5,
    evTariffPerKwh: 15,
    lastUpdated: FUEL_PRICE_REFERENCE_DATE,
    sourceNote: 'Last known reference baseline (no live fuel price feed connected — editable)',
    isLiveFeed: false,
  },
};

export function getReferenceFuelPrices(citySlug?: string | null): FuelPriceSnapshot {
  if (citySlug && REFERENCE_FUEL_PRICES_INDIA[citySlug]) {
    return REFERENCE_FUEL_PRICES_INDIA[citySlug];
  }
  return REFERENCE_FUEL_PRICES_INDIA['delhi-ncr'];
}

export function getUnitFuelPriceForVehicle(
  fuelType: string,
  snapshot: FuelPriceSnapshot
): number {
  const f = fuelType.toLowerCase();
  if (f === 'diesel') return snapshot.dieselInr;
  if (f === 'cng') return snapshot.cngInr;
  if (f === 'electric') return snapshot.evTariffPerKwh;
  return snapshot.petrolInr;
}

export interface VehicleEfficiencyInfo {
  isElectric: boolean;
  mileageKmPerUnit: number;
  source: EfficiencySource;
  rawSpec: string | null;
  batteryKwh: number;
  ratedRangeKm: number;
  rangeSource: EfficiencySource;
}

export function parseVehicleEfficiency(vehicle: Pick<LiveVehicle, 'fuelType' | 'mileageOrRange' | 'variant' | 'category' | 'name'>): VehicleEfficiencyInfo {
  const isEv = vehicle.fuelType.toLowerCase() === 'electric';
  const raw = (vehicle.mileageOrRange || '').trim();
  const variant = (vehicle.variant || '').trim();

  if (isEv) {
    const kwhMatch = `${variant} ${vehicle.name}`.match(/(\d+(?:\.\d+)?)\s*kWh/i);
    const rangeMatch = raw.match(/(\d+(?:\.\d+)?)\s*km/i);

    const batteryKwh = kwhMatch ? Number(kwhMatch[1]) : 40.5;
    const ratedRangeKm = rangeMatch ? Number(rangeMatch[1]) : 400;
    const rangeSource: EfficiencySource = rangeMatch
      ? /ARAI|NEDC|WLTP/i.test(raw)
        ? 'manufacturer_certified'
        : 'owner_reported'
      : 'default_assumption';

    const kmPerKwh = Number((ratedRangeKm / Math.max(10, batteryKwh)).toFixed(2));
    return {
      isElectric: true,
      mileageKmPerUnit: kmPerKwh,
      source: rangeSource,
      rawSpec: raw || null,
      batteryKwh,
      ratedRangeKm,
      rangeSource,
    };
  }

  const kmplMatch = raw.match(/(\d+(?:\.\d+)?)\s*km\/(?:l|kg)/i);
  if (kmplMatch) {
    const val = Number(kmplMatch[1]);
    return {
      isElectric: false,
      mileageKmPerUnit: val,
      source: 'manufacturer_certified',
      rawSpec: raw,
      batteryKwh: 0,
      ratedRangeKm: 0,
      rangeSource: 'default_assumption',
    };
  }

  // Fallback default planning assumption based on fuel & category
  const f = vehicle.fuelType.toLowerCase();
  const cat = vehicle.category.toLowerCase();
  let assumed = 15.0;
  if (f === 'hybrid') assumed = 23.0;
  else if (f === 'cng') assumed = 22.0;
  else if (f === 'diesel') assumed = cat.includes('suv') || cat.includes('off-road') ? 15.0 : 18.5;
  else assumed = cat.includes('hatchback') ? 18.5 : cat.includes('suv') || cat.includes('luxury') ? 12.5 : 15.5;

  return {
    isElectric: false,
    mileageKmPerUnit: assumed,
    source: 'default_assumption',
    rawSpec: raw || null,
    batteryKwh: 0,
    ratedRangeKm: 0,
    rangeSource: 'default_assumption',
  };
}

export interface FuelCalculationResult {
  distanceKm: number;
  mileageKmPerUnit: number;
  efficiencySource: EfficiencySource;
  fuelRequiredUnits: number;
  fuelUnitLabel: 'L' | 'kg';
  unitPriceInr: number;
  fuelCostInr: number;
  costPerKmInr: number;
  provenance: CostProvenance;
}

export function calculateFuelExpense(params: {
  distanceKm: number;
  fuelType: string;
  mileageKmPerUnit: number;
  efficiencySource: EfficiencySource;
  fuelPricePerUnit: number;
  isUserEnteredPrice: boolean;
}): FuelCalculationResult {
  const safeDist = Math.max(0, params.distanceKm);
  const safeMileage = Math.max(1, params.mileageKmPerUnit);
  const fuelRequiredUnits = Number((safeDist / safeMileage).toFixed(2));
  const fuelCostInr = Math.round(fuelRequiredUnits * Math.max(0, params.fuelPricePerUnit));
  const provenance: CostProvenance =
    params.isUserEnteredPrice ||
    params.efficiencySource === 'user_entered' ||
    params.efficiencySource === 'default_assumption'
      ? 'user_assumption'
      : 'spec_calculated';

  return {
    distanceKm: Number(safeDist.toFixed(1)),
    mileageKmPerUnit: safeMileage,
    efficiencySource: params.efficiencySource,
    fuelRequiredUnits,
    fuelUnitLabel: params.fuelType.toLowerCase() === 'cng' ? 'kg' : 'L',
    unitPriceInr: params.fuelPricePerUnit,
    fuelCostInr,
    costPerKmInr: safeDist > 0 ? Number((fuelCostInr / safeDist).toFixed(2)) : 0,
    provenance,
  };
}

export interface EvTripCalculationResult {
  distanceKm: number;
  batteryKwh: number;
  ratedRangeKm: number;
  startBatteryPct: number;
  reserveBatteryPct: number;
  energyConsumptionKwhPer100Km: number;
  estimatedEnergyRequiredKwh: number;
  enRouteEnergyRequiredKwh: number;
  chargingStopsNeeded: number;
  estimatedRemainingBatteryPct: number;
  totalEnergyCostInr: number;
  enRouteChargingCostInr: number;
  provenance: CostProvenance;
  availabilityDisclaimer: string;
}

export function calculateEvTrip(params: {
  distanceKm: number;
  batteryKwh: number;
  ratedRangeKm: number;
  startBatteryPct: number;
  reserveBatteryPct?: number;
  tariffPerKwh: number;
  efficiencySource: EfficiencySource;
}): EvTripCalculationResult {
  const dist = Math.max(0, params.distanceKm);
  const battery = Math.max(10, params.batteryKwh);
  const rangeKm = Math.max(80, params.ratedRangeKm);
  const startPct = Math.min(100, Math.max(5, params.startBatteryPct));
  const reservePct = Math.min(40, Math.max(10, params.reserveBatteryPct ?? 15));

  const energyConsumptionKwhPer100Km = Number(((battery / rangeKm) * 100).toFixed(1));
  const estimatedEnergyRequiredKwh = Number(((dist / rangeKm) * battery).toFixed(1));
  const startKwh = battery * (startPct / 100);
  const reserveKwh = battery * (reservePct / 100);
  const usableInitialKwh = Math.max(0, startKwh - reserveKwh);
  const usablePerStopKwh = battery * ((85 - reservePct) / 100);

  let chargingStopsNeeded = 0;
  let enRouteEnergyRequiredKwh = 0;
  let endKwh = startKwh - estimatedEnergyRequiredKwh;

  if (estimatedEnergyRequiredKwh > usableInitialKwh && dist > 0) {
    const deficitKwh = estimatedEnergyRequiredKwh - usableInitialKwh;
    chargingStopsNeeded = Math.max(1, Math.ceil(deficitKwh / Math.max(5, usablePerStopKwh)));
    enRouteEnergyRequiredKwh = Number(deficitKwh.toFixed(1));
    const addedKwh = chargingStopsNeeded * usablePerStopKwh;
    endKwh = Math.min(battery * 0.9, startKwh + addedKwh - estimatedEnergyRequiredKwh);
    if (endKwh < reserveKwh) endKwh = reserveKwh;
  }

  const estimatedRemainingBatteryPct = Math.max(
    0,
    Math.min(100, Math.round((endKwh / battery) * 100))
  );
  const totalEnergyCostInr = Math.round(estimatedEnergyRequiredKwh * Math.max(0, params.tariffPerKwh));
  const enRouteChargingCostInr = Math.round(enRouteEnergyRequiredKwh * Math.max(0, params.tariffPerKwh));

  return {
    distanceKm: Number(dist.toFixed(1)),
    batteryKwh: battery,
    ratedRangeKm: rangeKm,
    startBatteryPct: startPct,
    reserveBatteryPct: reservePct,
    energyConsumptionKwhPer100Km,
    estimatedEnergyRequiredKwh,
    enRouteEnergyRequiredKwh,
    chargingStopsNeeded,
    estimatedRemainingBatteryPct,
    totalEnergyCostInr,
    enRouteChargingCostInr,
    provenance:
      params.efficiencySource === 'manufacturer_certified'
        ? 'spec_calculated'
        : 'user_assumption',
    availabilityDisclaimer:
      'Station positions come from Google Places directory; live charger port status requires a charging-network integration.',
  };
}

export interface BudgetLineItem {
  id: string;
  label: string;
  amountInr: number | null;
  provenance: CostProvenance;
  detail?: string;
}

export interface AdditionalExpensesInput {
  parkingInr: number;
  accommodationInr: number;
  foodInr: number;
  driverChargesInr: number;
  extraKmChargesInr: number;
  miscInr: number;
  additionalServicesInr: number;
}

export interface TripBudgetSummary {
  rentalCostInr: number;
  extraKmChargesInr: number;
  platformChargesInr: number;
  fuelOrChargingCostInr: number;
  tollCostInr: number;
  tollProvenance: CostProvenance;
  additionalExpensesInr: number;
  totalTripCostInr: number;
  passengers: number;
  costPerPersonInr: number;
  refundableSecurityDepositInr: number;
  maxBudgetInr: number | null;
  budgetExceededByInr: number;
  lines: BudgetLineItem[];
}

export function calculateTripBudget(params: {
  dailyRateInr: number;
  rentalDays: number;
  securityDepositInr: number;
  fuelOrChargingCostInr: number;
  fuelProvenance: CostProvenance;
  fuelDetail: string;
  providerTollInr: number | null;
  manualTollInr: number | null;
  passengers: number;
  maxBudgetInr: number | null;
  additional: AdditionalExpensesInput;
}): TripBudgetSummary {
  const safeDays = Math.max(1, Math.round(params.rentalDays));
  const safePassengers = Math.max(1, Math.round(params.passengers));
  const rentalCostInr = Math.max(0, Math.round(params.dailyRateInr)) * safeDays;
  const extraKmChargesInr = Math.max(0, Math.round(params.additional.extraKmChargesInr));
  const platformChargesInr = 0;

  let tollCostInr = 0;
  let tollProvenance: CostProvenance = 'unavailable';
  if (params.manualTollInr !== null && params.manualTollInr >= 0) {
    tollCostInr = Math.round(params.manualTollInr);
    tollProvenance = 'user_assumption';
  } else if (params.providerTollInr !== null && params.providerTollInr >= 0) {
    tollCostInr = Math.round(params.providerTollInr);
    tollProvenance = 'provider_estimate';
  }

  const parking = Math.max(0, Math.round(params.additional.parkingInr));
  const accommodation = Math.max(0, Math.round(params.additional.accommodationInr));
  const food = Math.max(0, Math.round(params.additional.foodInr));
  const driver = Math.max(0, Math.round(params.additional.driverChargesInr));
  const misc = Math.max(0, Math.round(params.additional.miscInr));
  const services = Math.max(0, Math.round(params.additional.additionalServicesInr));

  const additionalExpensesInr = parking + accommodation + food + driver + misc + services;
  const totalTripCostInr =
    rentalCostInr +
    extraKmChargesInr +
    platformChargesInr +
    Math.max(0, Math.round(params.fuelOrChargingCostInr)) +
    tollCostInr +
    additionalExpensesInr;

  const costPerPersonInr = Math.round(totalTripCostInr / safePassengers);
  const budgetExceededByInr =
    params.maxBudgetInr && params.maxBudgetInr > 0
      ? Math.max(0, totalTripCostInr - params.maxBudgetInr)
      : 0;

  const lines: BudgetLineItem[] = [
    {
      id: 'rental',
      label: `Base Rental (${safeDays} day${safeDays > 1 ? 's' : ''})`,
      amountInr: rentalCostInr,
      provenance: 'confirmed',
      detail: 'Calculated from actual vehicle listing rate in Supabase',
    },
    ...(extraKmChargesInr > 0
      ? [
          {
            id: 'extra_km',
            label: 'Additional Kilometre Charges',
            amountInr: extraKmChargesInr,
            provenance: 'user_assumption' as CostProvenance,
          },
        ]
      : []),
    {
      id: 'fuel',
      label: 'Fuel / Charging Expense',
      amountInr: Math.round(params.fuelOrChargingCostInr),
      provenance: params.fuelProvenance,
      detail: params.fuelDetail,
    },
    {
      id: 'tolls',
      label: 'Tolls',
      amountInr: tollProvenance === 'unavailable' ? null : tollCostInr,
      provenance: tollProvenance,
      detail:
        tollProvenance === 'provider_estimate'
          ? 'Estimated via Google Routes Toll Advisory'
          : tollProvenance === 'user_assumption'
            ? 'Manually entered toll estimate'
            : 'Live toll data unavailable — enter manual estimate if needed',
    },
    {
      id: 'parking',
      label: 'Parking',
      amountInr: parking,
      provenance: 'user_assumption',
    },
    {
      id: 'accommodation',
      label: 'Accommodation',
      amountInr: accommodation,
      provenance: 'user_assumption',
    },
    {
      id: 'food',
      label: 'Food',
      amountInr: food,
      provenance: 'user_assumption',
    },
    {
      id: 'other',
      label: 'Driver / Misc / Additional Services',
      amountInr: driver + misc + services,
      provenance: 'user_assumption',
    },
  ];

  return {
    rentalCostInr,
    extraKmChargesInr,
    platformChargesInr,
    fuelOrChargingCostInr: Math.round(params.fuelOrChargingCostInr),
    tollCostInr,
    tollProvenance,
    additionalExpensesInr,
    totalTripCostInr,
    passengers: safePassengers,
    costPerPersonInr,
    refundableSecurityDepositInr: Math.max(0, Math.round(params.securityDepositInr)),
    maxBudgetInr: params.maxBudgetInr,
    budgetExceededByInr,
    lines,
  };
}

export function formatDurationMinutes(minutes: number): string {
  return formatMinutesLocalized(minutes);
}

export function compareStopOrderDistance(
  origin: LatLngPoint,
  stops: RouteWaypoint[],
  destination: LatLngPoint
) {
  const sequenceDistance = (ordered: LatLngPoint[]) => {
    let total = 0;
    for (let i = 0; i < ordered.length - 1; i += 1) {
      total += haversineKm(ordered[i], ordered[i + 1]);
    }
    return Number(total.toFixed(1));
  };

  const currentDistanceKm = sequenceDistance([origin, ...stops, destination]);

  if (stops.length < 2) {
    return {
      currentDistanceKm,
      heuristicDistanceKm: currentDistanceKm,
      reorderedStops: stops,
      savedKm: 0,
      isImproved: false,
      methodLabel: 'Nearest-neighbour distance preview (Haversine)',
    };
  }

  // Greedy nearest-neighbour from origin across intermediate stops before heading to destination
  const remaining = [...stops];
  const reorderedStops: RouteWaypoint[] = [];
  let cursor: LatLngPoint = origin;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const dFromCursor = haversineKm(cursor, remaining[i]);
      if (dFromCursor < bestScore) {
        bestScore = dFromCursor;
        bestIdx = i;
      }
    }
    const chosen = remaining.splice(bestIdx, 1)[0];
    reorderedStops.push(chosen);
    cursor = chosen;
  }

  const heuristicDistanceKm = sequenceDistance([origin, ...reorderedStops, destination]);
  const savedKm = Number(Math.max(0, currentDistanceKm - heuristicDistanceKm).toFixed(1));

  return {
    currentDistanceKm,
    heuristicDistanceKm,
    reorderedStops,
    savedKm,
    isImproved: savedKm >= 2,
    methodLabel: 'Nearest-neighbour distance preview (Haversine straight-line heuristic)',
  };
}
