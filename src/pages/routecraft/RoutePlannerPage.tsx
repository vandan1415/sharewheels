import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BatteryCharging,
  Bookmark,
  CheckCircle2,
  GripVertical,
  Loader2,
  RefreshCw,
  Route as RouteIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  computeIndiaRoutes,
  decodePolyline,
  haversineKm,
  INDIA_CITY_CENTERS,
  isBrowserMapsConfigured,
  resolveIndiaPlace,
  reverseGeocodeIndia,
  searchIndiaNearbyFacilities,
  type ComputedRouteOption,
  type FacilityLayerId,
  type LatLngPoint,
  type NearbyFacilityPlace,
  type RouteDataProvider,
  type RouteWaypoint,
} from '@/lib/googleMaps';
import { INDIA_DESTINATIONS } from '@/data/indiaDestinations';
import {
  calculateEvTrip,
  calculateFuelExpense,
  calculateTripBudget,
  compareStopOrderDistance,
  EFFICIENCY_SOURCE_LABELS,
  formatDurationMinutes,
  getReferenceFuelPrices,
  getUnitFuelPriceForVehicle,
  parseVehicleEfficiency,
  type AdditionalExpensesInput,
  type EfficiencySource,
} from '@/lib/routecraft';
import { CURATED_JOURNEYS, findCuratedJourney } from '@/data/curatedJourneys';
import {
  useAllApprovedVehicles,
  useSavedJourneyLookup,
  useSavedJourneys,
} from '@/hooks/useRouteCraft';
import { useAuth } from '@/context/AuthContext';
import { useLocationContext } from '@/context/LocationContext';
import { formatINR } from '@/lib/utils';
import { PlaceAutocompleteInput } from '@/components/routecraft/PlaceAutocompleteInput';
import { RouteCraftMap } from '@/components/routecraft/RouteCraftMap';
import { BudgetBreakdownCard } from '@/components/routecraft/BudgetBreakdownCard';
import { VehicleJourneyCompare } from '@/components/routecraft/VehicleJourneyCompare';
import { Button } from '@/components/ui/button';

const TRIP_PREFERENCES = [
  'Fastest journey',
  'Minimum driving distance',
  'Scenic journey',
  'Fewer stops',
  'Family-friendly journey',
  'Adventure journey',
  'Budget-friendly journey',
] as const;

export function RoutePlannerPage() {
  const [searchParams] = useSearchParams();
  const journeyParam = searchParams.get('journey');
  const vehicleParam = searchParams.get('vehicle');
  const savedParam = searchParams.get('saved');
  const shareParam = searchParams.get('share');
  const originParam = searchParams.get('origin');
  const destParam = searchParams.get('destination');
  const daysParam = searchParams.get('days');
  const paxParam = searchParams.get('passengers');
  const budgetParam = searchParams.get('budget');

  const { user } = useAuth();
  const { selectedCity } = useLocationContext();
  const { data: vehicles = [] } = useAllApprovedVehicles(null);
  const { saveJourney, savingJourney } = useSavedJourneys();
  const { data: loadedSaved } = useSavedJourneyLookup(savedParam, shareParam);

  const initialCurated = findCuratedJourney(journeyParam || undefined) ?? CURATED_JOURNEYS[0];

  const [journeyTitle, setJourneyTitle] = useState(initialCurated.title);
  const [origin, setOrigin] = useState<RouteWaypoint>(initialCurated.origin);
  const [destination, setDestination] = useState<RouteWaypoint>(initialCurated.destination);
  const [stops, setStops] = useState<RouteWaypoint[]>([]);

  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date(Date.now() + 86400_000 * 2);
    return d.toISOString().slice(0, 10);
  });
  const [returnDate, setReturnDate] = useState(() => {
    const daysOffset = Math.max(1, Number(daysParam) || initialCurated.recommendedDays);
    const d = new Date(Date.now() + 86400_000 * (2 + daysOffset));
    return d.toISOString().slice(0, 10);
  });
  const [departureTime, setDepartureTime] = useState('07:00');
  const [passengers, setPassengers] = useState(() => Math.max(1, Number(paxParam) || 4));
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['Fastest journey']);
  const [maxBudgetText, setMaxBudgetText] = useState(budgetParam || '');

  const [selectedVehicleSlug, setSelectedVehicleSlug] = useState<string>('');
  const [routes, setRoutes] = useState<ComputedRouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeProvider, setRouteProvider] = useState<RouteDataProvider>('coordinate_estimate');
  const [serverConfigured, setServerConfigured] = useState(true);

  const [activeLayers, setActiveLayers] = useState<Set<FacilityLayerId>>(
    () => new Set<FacilityLayerId>(['sharewheels_vehicles'])
  );
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyFacilityPlace[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(false);

  // Editable Fuel / EV / Toll / Additional Expense Assumptions
  const [manualMileageText, setManualMileageText] = useState('');
  const [manualFuelPriceText, setManualFuelPriceText] = useState('');
  const [startBatteryPct, setStartBatteryPct] = useState(90);
  const [manualTollText, setManualTollText] = useState('');
  const [additional, setAdditional] = useState<AdditionalExpensesInput>({
    parkingInr: 0,
    accommodationInr: 0,
    foodInr: 0,
    driverChargesInr: 0,
    extraKmChargesInr: 0,
    miscInr: 0,
    additionalServicesInr: 0,
  });

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | undefined>(undefined);
  const dragIdxRef = useRef<number | null>(null);

  // Hydrate curated journey param
  useEffect(() => {
    const j = findCuratedJourney(journeyParam || undefined);
    if (!j) return;
    setJourneyTitle(j.title);
    setOrigin(j.origin);
    setDestination(j.destination);
    setStops(j.suggestedStops);
    const d0 = new Date(Date.now() + 86400_000 * 2);
    const d1 = new Date(d0.getTime() + j.recommendedDays * 86400_000);
    setDepartureDate(d0.toISOString().slice(0, 10));
    setReturnDate(d1.toISOString().slice(0, 10));
  }, [journeyParam]);

  // Hydrate explicit ?origin=...&destination=... params (e.g. from WHEELMATE)
  useEffect(() => {
    if (!originParam && !destParam) return;
    const findKnown = (q: string): RouteWaypoint | null => {
      const low = q.toLowerCase();
      for (const d of INDIA_DESTINATIONS) {
        if (d.label.toLowerCase().includes(low) || low.includes(d.label.toLowerCase().split(' ')[0])) {
          return { id: d.id, label: d.label, lat: d.lat, lng: d.lng };
        }
      }
      for (const c of Object.values(INDIA_CITY_CENTERS)) {
        if (c.label.toLowerCase().includes(low) || low.includes(c.label.toLowerCase().split(' ')[0])) {
          return { id: `wp-${c.label}`, label: c.label, lat: c.lat, lng: c.lng };
        }
      }
      for (const j of CURATED_JOURNEYS) {
        if (j.origin.label.toLowerCase().includes(low)) return j.origin;
        if (j.destination.label.toLowerCase().includes(low)) return j.destination;
      }
      return null;
    };

    const resolveEndpoint = async (label: string, setter: (w: RouteWaypoint) => void) => {
      const hit = findKnown(label);
      if (hit) {
        setter(hit);
        return;
      }
      const place = await resolveIndiaPlace({ address: label });
      if (place) {
        setter({
          id: `wp-${crypto.randomUUID()}`,
          label,
          lat: place.lat,
          lng: place.lng,
          placeId: place.placeId,
        });
      }
    };

    if (originParam) resolveEndpoint(originParam, setOrigin);
    if (destParam) resolveEndpoint(destParam, setDestination);
    if (originParam && destParam) setJourneyTitle(`${originParam} → ${destParam}`);
  }, [originParam, destParam]);

  // Hydrate saved / shared journey from Supabase
  useEffect(() => {
    if (!loadedSaved) return;
    setSavedRecordId(loadedSaved.id);
    setJourneyTitle(loadedSaved.title);
    if (loadedSaved.origin_lat !== null && loadedSaved.origin_lng !== null) {
      setOrigin({
        id: 'saved-origin',
        label: loadedSaved.origin_label,
        lat: loadedSaved.origin_lat,
        lng: loadedSaved.origin_lng,
        placeId: loadedSaved.origin_place_id || undefined,
      });
    }
    if (loadedSaved.destination_lat !== null && loadedSaved.destination_lng !== null) {
      setDestination({
        id: 'saved-dest',
        label: loadedSaved.destination_label,
        lat: loadedSaved.destination_lat,
        lng: loadedSaved.destination_lng,
        placeId: loadedSaved.destination_place_id || undefined,
      });
    }
    setStops(Array.isArray(loadedSaved.stops) ? loadedSaved.stops : []);
    if (loadedSaved.vehicle_slug) setSelectedVehicleSlug(loadedSaved.vehicle_slug);
    if (loadedSaved.departure_date) setDepartureDate(loadedSaved.departure_date);
    if (loadedSaved.return_date) setReturnDate(loadedSaved.return_date);
    if (loadedSaved.departure_time) setDepartureTime(loadedSaved.departure_time);
    setPassengers(loadedSaved.passengers || 2);
    if (loadedSaved.preferences?.length) setSelectedPrefs(loadedSaved.preferences);
    if (loadedSaved.max_budget_inr) setMaxBudgetText(String(loadedSaved.max_budget_inr));
  }, [loadedSaved]);

  // Select default or param vehicle from real DB fleet
  useEffect(() => {
    if (vehicles.length === 0) return;
    if (vehicleParam && vehicles.some((v) => v.id === vehicleParam)) {
      setSelectedVehicleSlug(vehicleParam);
      return;
    }
    if (!selectedVehicleSlug || !vehicles.some((v) => v.id === selectedVehicleSlug)) {
      const localMatch = selectedCity
        ? vehicles.find((v) => v.citySlug === selectedCity.slug)
        : null;
      setSelectedVehicleSlug((localMatch ?? vehicles[0]).id);
    }
  }, [vehicles, vehicleParam, selectedCity, selectedVehicleSlug]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleSlug) ?? vehicles[0] ?? null,
    [vehicles, selectedVehicleSlug]
  );

  const rentalDays = useMemo(() => {
    const startMs = new Date(departureDate).getTime();
    const endMs = new Date(returnDate).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 1;
    return Math.min(30, Math.max(1, Math.round((endMs - startMs) / 86400_000)));
  }, [departureDate, returnDate]);

  // Compute routes cleanly with server proxy or browser Google Maps Directions fallback
  const fetchRoutes = useCallback(async () => {
    setRouteLoading(true);
    setRouteError(null);
    try {
      const res = await computeIndiaRoutes(
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
        stops.map((s) => ({ lat: s.lat, lng: s.lng }))
      );

      setServerConfigured(res.serverConfigured);
      setRouteProvider(res.provider);
      setRoutes(res.routes);
      if (res.routes.length > 0) {
        if (selectedPrefs.includes('Minimum driving distance')) {
          const shortIdx = res.routes.findIndex((r) => r.category === 'shortest');
          setSelectedRouteIndex(shortIdx >= 0 ? shortIdx : 0);
        } else {
          setSelectedRouteIndex(0);
        }
      } else if (res.error) {
        setRouteError(res.error);
      }
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : 'Unable to compute route.');
      setRouteProvider('coordinate_estimate');
      setRoutes([]);
    } finally {
      setRouteLoading(false);
    }
  }, [origin, destination, stops, selectedPrefs]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Fetch nearby Places along route midpoint when facility layers are active
  useEffect(() => {
    const activePlacesLayers = Array.from(activeLayers).filter(
      (id) => id !== 'sharewheels_vehicles'
    );
    if (activePlacesLayers.length === 0 || (!serverConfigured && !isBrowserMapsConfigured())) {
      setNearbyPlaces([]);
      return;
    }

    let cancelled = false;
    const activeRoute = routes[selectedRouteIndex] ?? routes[0];
    const pts = activeRoute?.encodedPolyline ? decodePolyline(activeRoute.encodedPolyline) : [];
    const anchor: LatLngPoint =
      pts.length > 0
        ? pts[Math.floor(pts.length / 2)]
        : { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 };

    setLoadingLayers(true);
    Promise.all(
      activePlacesLayers.map((layer) =>
        searchIndiaNearbyFacilities(layer, anchor, 25000).catch(() => [] as NearbyFacilityPlace[])
      )
    )
      .then((arrays) => {
        if (cancelled) return;
        setNearbyPlaces(arrays.flat());
      })
      .finally(() => {
        if (!cancelled) setLoadingLayers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeLayers, routes, selectedRouteIndex, origin.lat, origin.lng, destination.lat, destination.lng, serverConfigured]);

  const activeRoute = routes[selectedRouteIndex] ?? routes[0] ?? null;

  // Fallback coordinate road factor when Google Routes Server Key is pending
  const coordinateEstimateKm = useMemo(() => {
    const pts = [origin, ...stops, destination];
    let direct = 0;
    for (let i = 0; i < pts.length - 1; i += 1) {
      direct += haversineKm(pts[i], pts[i + 1]);
    }
    return Number((direct * 1.24).toFixed(1));
  }, [origin, stops, destination]);

  const effectiveDistanceKm = activeRoute ? activeRoute.distanceKm : coordinateEstimateKm;
  const effectiveDurationMinutes = activeRoute
    ? activeRoute.durationMinutes
    : Math.max(30, Math.round((coordinateEstimateKm / 55) * 60));

  const arrivalTimeLabel = useMemo(() => {
    const [hh, mm] = departureTime.split(':').map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return '—';
    const dep = new Date(`${departureDate}T00:00:00`);
    dep.setHours(hh, mm + effectiveDurationMinutes, 0, 0);
    return dep.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [departureDate, departureTime, effectiveDurationMinutes]);

  const fuelSnapshot = getReferenceFuelPrices(selectedVehicle?.citySlug || selectedCity?.slug);
  const effInfo = selectedVehicle
    ? parseVehicleEfficiency(selectedVehicle)
    : null;

  const activeFuelPrice =
    manualFuelPriceText.trim() !== '' && Number(manualFuelPriceText) > 0
      ? Number(manualFuelPriceText)
      : selectedVehicle
        ? getUnitFuelPriceForVehicle(selectedVehicle.fuelType, fuelSnapshot)
        : fuelSnapshot.petrolInr;

  const activeMileage =
    manualMileageText.trim() !== '' && Number(manualMileageText) > 0
      ? Number(manualMileageText)
      : effInfo?.mileageKmPerUnit ?? 15;

  const activeEffSource: EfficiencySource =
    manualMileageText.trim() !== '' && Number(manualMileageText) > 0
      ? 'user_entered'
      : effInfo?.source ?? 'default_assumption';

  const evCalc =
    effInfo?.isElectric && selectedVehicle
      ? calculateEvTrip({
          distanceKm: effectiveDistanceKm,
          batteryKwh: effInfo.batteryKwh,
          ratedRangeKm: effInfo.ratedRangeKm,
          startBatteryPct,
          tariffPerKwh: activeFuelPrice,
          efficiencySource: activeEffSource,
        })
      : null;

  const fuelCalc =
    !effInfo?.isElectric && selectedVehicle
      ? calculateFuelExpense({
          distanceKm: effectiveDistanceKm,
          fuelType: selectedVehicle.fuelType,
          mileageKmPerUnit: activeMileage,
          efficiencySource: activeEffSource,
          fuelPricePerUnit: activeFuelPrice,
          isUserEnteredPrice: manualFuelPriceText.trim() !== '',
        })
      : null;

  const fuelOrChargingCostInr = evCalc
    ? evCalc.totalEnergyCostInr
    : fuelCalc?.fuelCostInr ?? 0;

  const manualTollNumber =
    manualTollText.trim() !== '' && Number(manualTollText) >= 0
      ? Number(manualTollText)
      : null;
  const maxBudgetNumber =
    maxBudgetText.trim() !== '' && Number(maxBudgetText) > 0
      ? Number(maxBudgetText)
      : null;

  const budgetSummary = calculateTripBudget({
    dailyRateInr: selectedVehicle?.pricePerDay ?? 0,
    rentalDays,
    securityDepositInr: selectedVehicle?.securityDeposit ?? 0,
    fuelOrChargingCostInr,
    fuelProvenance: evCalc
      ? evCalc.provenance
      : fuelCalc?.provenance ?? 'user_assumption',
    fuelDetail: evCalc
      ? `${evCalc.estimatedEnergyRequiredKwh} kWh @ ₹${activeFuelPrice}/kWh (${EFFICIENCY_SOURCE_LABELS[activeEffSource]})`
      : fuelCalc
        ? `${fuelCalc.fuelRequiredUnits} ${fuelCalc.fuelUnitLabel} @ ₹${activeFuelPrice} (${fuelCalc.mileageKmPerUnit} km/${fuelCalc.fuelUnitLabel} · ${EFFICIENCY_SOURCE_LABELS[activeEffSource]})`
        : 'Select vehicle',
    providerTollInr: activeRoute?.estimatedTollInr ?? null,
    manualTollInr: manualTollNumber,
    passengers,
    maxBudgetInr: maxBudgetNumber,
    additional,
  });

  const stopOrderPreview = useMemo(
    () => compareStopOrderDistance(origin, stops, destination),
    [origin, stops, destination]
  );

  const handleToggleLayer = (layer: FacilityLayerId) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const handleMapAddStop = async (pt: LatLngPoint) => {
    let label = `Waypoint (${pt.lat.toFixed(3)}, ${pt.lng.toFixed(3)})`;
    let placeId: string | undefined;
    try {
      const geo = await reverseGeocodeIndia(pt.lat, pt.lng);
      if (geo?.label) {
        label = geo.label.split(',').slice(0, 2).join(', ');
        placeId = geo.placeId;
      }
    } catch {
      // Fallback to raw coordinate label
    }
    setStops((prev) => [
      ...prev,
      { id: `map-${crypto.randomUUID()}`, label, lat: pt.lat, lng: pt.lng, placeId },
    ]);
  };

  const handleAddPlaceAsStop = (place: NearbyFacilityPlace) => {
    setStops((prev) => [
      ...prev,
      {
        id: `place-${place.id}-${Date.now()}`,
        label: place.name,
        lat: place.lat,
        lng: place.lng,
        placeId: place.id,
      },
    ]);
  };

  const moveStop = (from: number, to: number) => {
    if (to < 0 || to >= stops.length) return;
    setStops((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const handleSaveJourney = async () => {
    setSaveFeedback(null);
    setSaveError(null);
    if (!user) {
      setSaveError('Please sign in with your Customer account to save journeys.');
      return;
    }
    try {
      const saved = await saveJourney({
        id: savedRecordId,
        is_shared: loadedSaved?.is_shared ?? false,
        title: journeyTitle.trim() || `${origin.label} → ${destination.label}`,
        origin_label: origin.label,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        origin_place_id: origin.placeId ?? null,
        destination_label: destination.label,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        destination_place_id: destination.placeId ?? null,
        stops,
        vehicle_id: selectedVehicle?.dbId ?? null,
        vehicle_slug: selectedVehicle?.id ?? null,
        departure_date: departureDate,
        return_date: returnDate,
        departure_time: departureTime,
        passengers,
        preferences: selectedPrefs,
        max_budget_inr: maxBudgetNumber,
        route_preference: activeRoute?.category ?? 'fastest',
        distance_km: effectiveDistanceKm,
        duration_minutes: effectiveDurationMinutes,
        route_summary: activeRoute?.description || `${origin.label} to ${destination.label}`,
        budget_assumptions: {
          manualTollNumber,
          additional,
          manualMileageText,
          manualFuelPriceText,
        },
        estimated_totals: {
          totalTripCostInr: budgetSummary.totalTripCostInr,
          costPerPersonInr: budgetSummary.costPerPersonInr,
          rentalCostInr: budgetSummary.rentalCostInr,
          fuelOrChargingCostInr: budgetSummary.fuelOrChargingCostInr,
        },
      });
      setSavedRecordId(saved.id);
      setSaveFeedback('Journey saved cleanly to your Saved Journeys.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save journey.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-20 pb-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Editorial Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#2A2A30] pb-6">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              SHAREWHEELS · ROUTECRAFT
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.025em] text-[#F4F1EA]">
              Interactive Road Trip Planner
            </h1>
            <p className="text-xs sm:text-sm text-[#8E8E98] max-w-2xl">
              Discover routes, compare fuel & EV charging stops, calculate exact rental + trip budgets
              against live SHAREWHEELS vehicles, and plan every kilometre.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/journeys">
              <Button variant="outline" size="sm">Curated Journeys</Button>
            </Link>
            <Link to="/saved-journeys">
              <Button variant="outline" size="sm">Saved Journeys</Button>
            </Link>
            <Button
              type="button"
              variant="champagne"
              size="sm"
              disabled={savingJourney}
              onClick={handleSaveJourney}
            >
              {savingJourney ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bookmark className="h-3.5 w-3.5" />}
              <span>{savedRecordId ? 'Update Saved Journey' : 'Save Journey'}</span>
            </Button>
          </div>
        </div>

        {saveFeedback && (
          <div className="border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 rounded-sm text-xs text-emerald-200 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {saveFeedback}
            </span>
            <Link to="/saved-journeys" className="text-[#C8A97E] underline">
              Manage Saved Journeys →
            </Link>
          </div>
        )}
        {saveError && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 rounded-sm text-xs text-red-200">
            {saveError}
          </div>
        )}

        {/* Map-First Core Workspace (65–70% Map Desktop Width + Side Planner Controls) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Map (Left / First on Mobile) */}
          <div className="lg:col-span-8 space-y-5 order-1">
            <RouteCraftMap
              origin={origin}
              destination={destination}
              stops={stops}
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              activeLayers={activeLayers}
              onToggleLayer={handleToggleLayer}
              nearbyPlaces={nearbyPlaces}
              loadingLayers={loadingLayers}
              vehicles={vehicles}
              onMapAddStop={handleMapAddStop}
              onAddPlaceAsStop={handleAddPlaceAsStop}
              serverConfigured={serverConfigured}
            />

            {/* Route Choices Comparison */}
            <div className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
                      Route Overview & Alternatives
                    </p>
                    <span
                      className={`border px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.12em] ${
                        routeProvider !== 'coordinate_estimate'
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                          : 'border-[#2A2A30] bg-[#0A0A0B] text-[#8E8E98]'
                      }`}
                    >
                      {routeProvider === 'google_routes_server'
                        ? 'Google Maps Distance · Routes API'
                        : routeProvider === 'google_directions_browser'
                          ? 'Google Maps Distance · Routes API (Live)'
                          : 'Road Estimate (Corridor Fallback)'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E98]">
                    {origin.label} → {destination.label}:{' '}
                    <strong className="text-[#F4F1EA]">{effectiveDistanceKm} km</strong> ·{' '}
                    <strong className="text-[#F4F1EA]">{formatDurationMinutes(effectiveDurationMinutes)}</strong>{' '}
                    (ETA {arrivalTimeLabel})
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={routeLoading}
                  onClick={fetchRoutes}
                >
                  {routeLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>Recalculate</span>
                </Button>
              </div>

              {routeError && (
                <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 px-3 py-2 rounded-sm">
                  {routeError}
                </p>
              )}

              {routes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {routes.map((r, idx) => {
                    const isSelected = idx === selectedRouteIndex;
                    const rFuel =
                      selectedVehicle && effInfo
                        ? effInfo.isElectric
                          ? calculateEvTrip({
                              distanceKm: r.distanceKm,
                              batteryKwh: effInfo.batteryKwh,
                              ratedRangeKm: effInfo.ratedRangeKm,
                              startBatteryPct,
                              tariffPerKwh: activeFuelPrice,
                              efficiencySource: activeEffSource,
                            }).totalEnergyCostInr
                          : calculateFuelExpense({
                              distanceKm: r.distanceKm,
                              fuelType: selectedVehicle.fuelType,
                              mileageKmPerUnit: activeMileage,
                              efficiencySource: activeEffSource,
                              fuelPricePerUnit: activeFuelPrice,
                              isUserEnteredPrice: manualFuelPriceText.trim() !== '',
                            }).fuelCostInr
                        : 0;
                    const rToll = manualTollNumber ?? r.estimatedTollInr ?? 0;
                    const rTotal =
                      (selectedVehicle?.pricePerDay ?? 0) * rentalDays + rFuel + rToll;

                    return (
                      <button
                        key={`${r.index}-${r.category}`}
                        type="button"
                        onClick={() => setSelectedRouteIndex(idx)}
                        className={`text-left border p-4 rounded-sm space-y-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#C8A97E] bg-[#C8A97E]/10'
                            : 'border-[#2A2A30] bg-[#0A0A0B] hover:border-[#C8A97E]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-[0.14em] text-[#C8A97E]">
                            {r.label}
                          </span>
                          <span className="text-xs font-medium text-[#F4F1EA]">
                            {r.distanceKm} km
                          </span>
                        </div>
                        <p className="text-xs text-[#E8E4DC] truncate">
                          {r.description || 'Highway corridor'}
                        </p>
                        <div className="text-[11px] text-[#8E8E98] space-y-0.5 pt-1 border-t border-[#2A2A30]">
                          <p>Duration: {formatDurationMinutes(r.durationMinutes)}</p>
                          <p>Est. Fuel/EV: {formatINR(rFuel)}</p>
                          <p>
                            Tolls:{' '}
                            {r.estimatedTollInr !== null
                              ? `${formatINR(r.estimatedTollInr)} (est.)`
                              : manualTollNumber !== null
                                ? `${formatINR(manualTollNumber)} (manual)`
                                : 'Unavailable'}
                          </p>
                          <p className="text-[#C8A97E] font-medium pt-0.5">
                            Total Travel Est: {formatINR(rTotal)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-[#8E8E98]">Est. Distance</p>
                    <p className="mt-1 font-display text-lg text-[#F4F1EA]">{effectiveDistanceKm} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-[#8E8E98]">Driving Duration</p>
                    <p className="mt-1 font-display text-lg text-[#F4F1EA]">
                      {formatDurationMinutes(effectiveDurationMinutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-[#8E8E98]">Estimated Arrival</p>
                    <p className="mt-1 text-sm font-medium text-[#C8A97E]">{arrivalTimeLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-[#8E8E98]">Intermediate Stops</p>
                    <p className="mt-1 font-display text-lg text-[#F4F1EA]">{stops.length}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Planner Controls Sidebar */}
          <div className="lg:col-span-4 space-y-5 order-2 border border-[#2A2A30] bg-[#111114] p-5 rounded-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                Journey Title
              </label>
              <input
                type="text"
                value={journeyTitle}
                onChange={(e) => setJourneyTitle(e.target.value)}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
              />
            </div>

            <PlaceAutocompleteInput
              label="Starting Location"
              value={origin.label}
              biasPoint={origin}
              onSelectPlace={(p) => setOrigin(p)}
              onServerConfigDetected={setServerConfigured}
            />

            {/* Intermediate Stops with Drag-and-Drop Reorder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  Intermediate Stops ({stops.length})
                </span>
                {stops.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStops([])}
                    className="text-[10px] text-red-300 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {stops.map((s, idx) => (
                <div
                  key={s.id}
                  draggable
                  onDragStart={() => {
                    dragIdxRef.current = idx;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdxRef.current !== null && dragIdxRef.current !== idx) {
                      moveStop(dragIdxRef.current, idx);
                    }
                    dragIdxRef.current = null;
                  }}
                  className="flex items-center justify-between gap-2 border border-[#2A2A30] bg-[#0A0A0B] px-2.5 py-2 rounded-sm text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="h-3.5 w-3.5 text-[#8E8E98] cursor-grab shrink-0" />
                    <span className="text-[10px] text-[#C8A97E] font-mono">{idx + 1}</span>
                    <span className="truncate text-[#E8E4DC]">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Move stop up"
                      onClick={() => moveStop(idx, idx - 1)}
                      className="p-1 text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move stop down"
                      onClick={() => moveStop(idx, idx + 1)}
                      className="p-1 text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove stop"
                      onClick={() => setStops((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-red-300 hover:text-red-200 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

              <PlaceAutocompleteInput
                label="Add Intermediate Stop"
                value=""
                placeholder="Type town, viewpoint, or pitstop..."
                biasPoint={origin}
                onSelectPlace={(p) => setStops((prev) => [...prev, p])}
              />

              {stops.length >= 2 && (
                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-3 rounded-sm text-[11px] space-y-2">
                  <div className="flex items-center justify-between text-[#C8A97E]">
                    <span className="inline-flex items-center gap-1">
                      <RouteIcon className="h-3 w-3" />
                      Multi-Stop Sequence Preview
                    </span>
                    {stopOrderPreview.isImproved && (
                      <span>~{stopOrderPreview.savedKm} km shorter straight-line path</span>
                    )}
                  </div>
                  <p className="text-[#8E8E98]">{stopOrderPreview.methodLabel}</p>
                  {stopOrderPreview.isImproved && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setStops(stopOrderPreview.reorderedStops)}
                    >
                      Apply Nearest-Neighbour Stop Order
                    </Button>
                  )}
                </div>
              )}
            </div>

            <PlaceAutocompleteInput
              label="Destination"
              value={destination.label}
              biasPoint={destination}
              onSelectPlace={(p) => setDestination(p)}
              onServerConfigDetected={setServerConfigured}
            />

            {/* Dates & Time */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
                  Departure
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2 text-[11px] text-[#F4F1EA] rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
                  Return
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2 text-[11px] text-[#F4F1EA] rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
                  Time
                </label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2 text-[11px] text-[#F4F1EA] rounded-sm"
                />
              </div>
            </div>

            {/* Selected SHAREWHEELS Vehicle */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                Selected SHAREWHEELS Vehicle ({rentalDays}d rental)
              </label>
              <select
                value={selectedVehicleSlug}
                onChange={(e) => {
                  setSelectedVehicleSlug(e.target.value);
                  setManualMileageText('');
                  setManualFuelPriceText('');
                }}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.location} · ₹{v.pricePerDay}/d ({v.fuelType})
                  </option>
                ))}
              </select>
              {selectedVehicle && (
                <div className="flex items-center justify-between text-[11px] text-[#8E8E98] pt-1">
                  <span>
                    {selectedVehicle.seats} seats · {selectedVehicle.transmission} · {selectedVehicle.fuelType}
                  </span>
                  <Link
                    to={`/vehicles/${selectedVehicle.id}`}
                    className="text-[#C8A97E] hover:underline inline-flex items-center gap-1"
                  >
                    Book Vehicle <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Fuel / EV Inputs */}
            {evCalc ? (
              <div className="border border-sky-500/30 bg-sky-950/15 p-3.5 rounded-sm space-y-2 text-xs">
                <div className="flex items-center justify-between text-sky-300">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <BatteryCharging className="h-4 w-4" />
                    EV Trip Intelligence
                  </span>
                  <span>{evCalc.batteryKwh} kWh · {evCalc.ratedRangeKm} km</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#8E8E98] block">Start Battery %</span>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={startBatteryPct}
                      onChange={(e) => setStartBatteryPct(Math.max(10, Math.min(100, Number(e.target.value) || 90)))}
                      className="mt-1 w-full h-8 bg-[#0A0A0B] border border-[#2A2A30] px-2 text-[#F4F1EA] rounded-sm"
                    />
                  </div>
                  <div>
                    <span className="text-[#8E8E98] block">Charging ₹/kWh</span>
                    <input
                      type="number"
                      min={1}
                      step="0.5"
                      value={manualFuelPriceText || activeFuelPrice}
                      onChange={(e) => setManualFuelPriceText(e.target.value)}
                      className="mt-1 w-full h-8 bg-[#0A0A0B] border border-[#2A2A30] px-2 text-[#F4F1EA] rounded-sm"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-[#E8E4DC]">
                  Required: <strong>{evCalc.estimatedEnergyRequiredKwh} kWh</strong> · Charging Stops:{' '}
                  <strong className="text-[#C8A97E]">{evCalc.chargingStopsNeeded}</strong> · Arrival SoC:{' '}
                  <strong>~{evCalc.estimatedRemainingBatteryPct}%</strong>
                </p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLayers((prev) => new Set(prev).add('ev_charging'));
                    }}
                    className="text-[11px] text-sky-300 underline cursor-pointer"
                  >
                    Show EV Chargers on Map
                  </button>
                </div>
                <p className="text-[10px] text-[#8E8E98]">{evCalc.availabilityDisclaimer}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
                    Efficiency (km/{fuelCalc?.fuelUnitLabel || 'L'})
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    value={manualMileageText || activeMileage}
                    onChange={(e) => setManualMileageText(e.target.value)}
                    className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2.5 text-xs text-[#F4F1EA] rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
                    Fuel ₹/{fuelCalc?.fuelUnitLabel || 'L'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.1"
                    value={manualFuelPriceText || activeFuelPrice}
                    onChange={(e) => setManualFuelPriceText(e.target.value)}
                    className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2.5 text-xs text-[#F4F1EA] rounded-sm"
                  />
                </div>
              </div>
            )}

            {/* Trip Preferences */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                Travel Preferences
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TRIP_PREFERENCES.map((pref) => {
                  const active = selectedPrefs.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() =>
                        setSelectedPrefs((prev) =>
                          prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
                        )
                      }
                      className={`border px-2.5 py-1 rounded-sm text-[11px] transition-colors cursor-pointer ${
                        active
                          ? 'border-[#C8A97E] bg-[#C8A97E]/15 text-[#F4F1EA]'
                          : 'border-[#2A2A30] bg-[#0A0A0B] text-[#8E8E98] hover:text-[#E8E4DC]'
                      }`}
                    >
                      {pref}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#2A2A30] pt-3 flex items-center justify-between text-xs">
              <span className="text-[#8E8E98]">Estimated Total</span>
              <span className="font-display text-lg font-semibold text-[#C8A97E]">
                {formatINR(budgetSummary.totalTripCostInr)} ({formatINR(budgetSummary.costPerPersonInr)}/pax)
              </span>
            </div>

            <Link
              to={`/wheelmate`}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#C8A97E] hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Need help customising? Ask WHEELMATE →
            </Link>
          </div>
        </div>

        {/* Dynamic Expense & Budget Breakdown */}
        <BudgetBreakdownCard
          tripTitle={journeyTitle}
          summary={budgetSummary}
          additional={additional}
          onChangeAdditional={setAdditional}
          manualTollText={manualTollText}
          onChangeManualTollText={setManualTollText}
          onChangePassengers={setPassengers}
          maxBudgetText={maxBudgetText}
          onChangeMaxBudgetText={setMaxBudgetText}
          onQuickSuggest={(action) => {
            if (action === 'add_passenger') setPassengers((p) => p + 1);
            if (action === 'reduce_stops') setStops((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
            if (action === 'compare_vehicles') {
              document.getElementById('compare-journey-vehicles')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        {/* Compare Up to 3 Real Inventory Vehicles for This Journey */}
        <div id="compare-journey-vehicles">
          <VehicleJourneyCompare
            vehicles={vehicles}
            distanceKm={effectiveDistanceKm}
            rentalDays={rentalDays}
            passengers={passengers}
            tollInr={budgetSummary.tollCostInr}
            citySlug={selectedVehicle?.citySlug || selectedCity?.slug}
            primaryVehicleSlug={selectedVehicle?.id}
            onSelectVehicle={(v) => setSelectedVehicleSlug(v.id)}
          />
        </div>
      </div>
    </main>
  );
}
