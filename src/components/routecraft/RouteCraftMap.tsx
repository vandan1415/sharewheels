import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Layers,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
  Star,
  X,
} from 'lucide-react';
import type { LiveVehicle } from '@/hooks/useVehicles';
import {
  decodePolyline,
  FACILITY_LAYERS,
  INDIA_CITY_CENTERS,
  isBrowserMapsConfigured,
  loadGoogleMapsJs,
  minDistanceToRouteKm,
  SHAREWHEELS_DARK_MAP_STYLES,
  type ComputedRouteOption,
  type FacilityLayerId,
  type LatLngPoint,
  type NearbyFacilityPlace,
  type RouteWaypoint,
} from '@/lib/googleMaps';
import { Button } from '@/components/ui/button';

interface RouteCraftMapProps {
  origin: RouteWaypoint;
  destination: RouteWaypoint;
  stops: RouteWaypoint[];
  routes: ComputedRouteOption[];
  selectedRouteIndex: number;
  activeLayers: Set<FacilityLayerId>;
  onToggleLayer: (layer: FacilityLayerId) => void;
  nearbyPlaces: NearbyFacilityPlace[];
  loadingLayers: boolean;
  vehicles: LiveVehicle[];
  onMapAddStop?: (point: LatLngPoint) => void;
  onAddPlaceAsStop?: (place: NearbyFacilityPlace) => void;
  serverConfigured: boolean;
  heightClass?: string;
}

export function RouteCraftMap({
  origin,
  destination,
  stops,
  routes,
  selectedRouteIndex,
  activeLayers,
  onToggleLayer,
  nearbyPlaces,
  loadingLayers,
  vehicles,
  onMapAddStop,
  onAddPlaceAsStop,
  serverConfigured,
  heightClass = 'h-[440px] lg:h-[620px]',
}: RouteCraftMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const onMapClickRef = useRef(onMapAddStop);
  onMapClickRef.current = onMapAddStop;

  const [jsReady, setJsReady] = useState(false);
  const [jsFailed, setJsFailed] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [layersDrawerOpen, setLayersDrawerOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<
    | { kind: 'place'; data: NearbyFacilityPlace }
    | { kind: 'vehicle'; data: LiveVehicle }
    | null
  >(null);

  const browserKeyPresent = isBrowserMapsConfigured();

  const activeRoute = routes[selectedRouteIndex] ?? routes[0] ?? null;
  const activeRoutePoints = useMemo(() => {
    if (activeRoute?.encodedPolyline) {
      return decodePolyline(activeRoute.encodedPolyline);
    }
    return [origin, ...stops, destination];
  }, [activeRoute?.encodedPolyline, origin, stops, destination]);

  useEffect(() => {
    if (!browserKeyPresent) return;
    let active = true;
    loadGoogleMapsJs().then((ok) => {
      if (!active) return;
      if (ok) setJsReady(true);
      else setJsFailed(true);
    });
    return () => {
      active = false;
    };
  }, [browserKeyPresent]);

  useEffect(() => {
    if (!jsReady || !mapContainerRef.current || mapInstanceRef.current) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    const map = new g.maps.Map(mapContainerRef.current, {
      center: { lat: origin.lat, lng: origin.lng },
      zoom: 7,
      mapTypeId: mapType,
      styles: mapType === 'roadmap' ? SHAREWHEELS_DARK_MAP_STYLES : undefined,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
    });

    map.addListener('click', (ev: any) => {
      const lat = ev?.latLng?.lat?.();
      const lng = ev?.latLng?.lng?.();
      if (typeof lat === 'number' && typeof lng === 'number') {
        onMapClickRef.current?.({ lat, lng });
      }
    });

    mapInstanceRef.current = map;
  }, [jsReady, origin.lat, origin.lng]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setMapTypeId(mapType);
    map.setOptions({
      styles: mapType === 'roadmap' ? SHAREWHEELS_DARK_MAP_STYLES : undefined,
    });
  }, [mapType]);

  // Update markers and polylines efficiently
  useEffect(() => {
    const map = mapInstanceRef.current;
    const g = (window as any).google;
    if (!map || !g?.maps) return;

    for (const ov of overlaysRef.current) {
      ov.setMap(null);
    }
    overlaysRef.current = [];

    const bounds = new g.maps.LatLngBounds();

    // Draw alternative polylines first, active polyline on top
    routes.forEach((route, idx) => {
      const pts = decodePolyline(route.encodedPolyline);
      if (pts.length === 0) return;
      const isSelected = idx === selectedRouteIndex;
      const poly = new g.maps.Polyline({
        path: pts,
        geodesic: true,
        strokeColor: isSelected ? '#C8A97E' : '#64748B',
        strokeOpacity: isSelected ? 0.95 : 0.45,
        strokeWeight: isSelected ? 5 : 3,
        zIndex: isSelected ? 10 : 4,
        map,
      });
      overlaysRef.current.push(poly);
      if (isSelected) {
        pts.forEach((p) => bounds.extend(p));
      }
    });

    if (routes.length === 0) {
      const fallbackPts = [origin, ...stops, destination];
      const dashed = new g.maps.Polyline({
        path: fallbackPts,
        geodesic: true,
        strokeColor: '#C8A97E',
        strokeOpacity: 0.65,
        strokeWeight: 3,
        map,
      });
      overlaysRef.current.push(dashed);
    }

    const addPin = (pt: LatLngPoint, title: string, label: string, color: string, zIndex = 20) => {
      bounds.extend(pt);
      const marker = new g.maps.Marker({
        position: pt,
        map,
        title,
        zIndex,
        label: {
          text: label,
          color: '#0A0A0B',
          fontSize: '10px',
          fontWeight: '700',
        },
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#0A0A0B',
          strokeWeight: 2,
        },
      });
      overlaysRef.current.push(marker);
      return marker;
    };

    addPin(origin, `Start: ${origin.label}`, 'A', '#F4F1EA', 30);
    stops.forEach((s, idx) => addPin(s, `Stop ${idx + 1}: ${s.label}`, String(idx + 1), '#E8E4DC', 25));
    addPin(destination, `Destination: ${destination.label}`, 'B', '#C8A97E', 30);

    // Facility markers
    nearbyPlaces.forEach((pl) => {
      if (!activeLayers.has(pl.layer)) return;
      const meta = FACILITY_LAYERS.find((l) => l.id === pl.layer);
      const marker = new g.maps.Marker({
        position: { lat: pl.lat, lng: pl.lng },
        map,
        title: pl.name,
        zIndex: 15,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: meta?.color || '#38BDF8',
          fillOpacity: 0.95,
          strokeColor: '#0A0A0B',
          strokeWeight: 1.5,
        },
      });
      marker.addListener('click', () => {
        const dist = minDistanceToRouteKm({ lat: pl.lat, lng: pl.lng }, activeRoutePoints);
        setSelectedMarker({
          kind: 'place',
          data: { ...pl, distanceFromRouteKm: dist },
        });
      });
      overlaysRef.current.push(marker);
    });

    // SHAREWHEELS Fleet Markers
    if (activeLayers.has('sharewheels_vehicles')) {
      const grouped = new Map<string, LiveVehicle[]>();
      for (const v of vehicles) {
        const arr = grouped.get(v.citySlug) ?? [];
        arr.push(v);
        grouped.set(v.citySlug, arr);
      }
      grouped.forEach((cityVehicles, citySlug) => {
        const center = INDIA_CITY_CENTERS[citySlug];
        if (!center) return;
        cityVehicles.slice(0, 4).forEach((v, idx) => {
          const offsetLat = center.lat + (idx - 1.5) * 0.012;
          const offsetLng = center.lng + ((idx % 2 === 0 ? 1 : -1) * 0.014);
          const marker = new g.maps.Marker({
            position: { lat: offsetLat, lng: offsetLng },
            map,
            title: `${v.name} (₹${v.pricePerDay}/day)`,
            zIndex: 18,
            label: {
              text: 'SW',
              color: '#0A0A0B',
              fontSize: '8px',
              fontWeight: '700',
            },
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: '#C8A97E',
              fillOpacity: 1,
              strokeColor: '#F4F1EA',
              strokeWeight: 1.5,
            },
          });
          marker.addListener('click', () => {
            setSelectedMarker({ kind: 'vehicle', data: v });
          });
          overlaysRef.current.push(marker);
        });
      });
    }

    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
  }, [
    origin,
    destination,
    stops,
    routes,
    selectedRouteIndex,
    nearbyPlaces,
    activeLayers,
    vehicles,
    activeRoutePoints,
    jsReady,
  ]);

  const handleZoom = (delta: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setZoom((map.getZoom() ?? 7) + delta);
  };

  return (
    <div className="relative border border-[#2A2A30] bg-[#111114] rounded-sm overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2A30] bg-[#0A0A0B]/95 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className="h-3.5 w-3.5 text-[#C8A97E] shrink-0" />
          <span className="truncate font-medium text-[#F4F1EA]">
            {origin.label} → {stops.length > 0 ? `${stops.length} stop(s) → ` : ''}{destination.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMapType((t) => (t === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="border border-[#2A2A30] hover:border-[#C8A97E] bg-[#111114] px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-[0.12em] text-[#E8E4DC] cursor-pointer"
          >
            {mapType === 'roadmap' ? 'Satellite' : 'Map'}
          </button>
          <button
            type="button"
            onClick={() => setLayersDrawerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 border border-[#C8A97E]/50 bg-[#C8A97E]/10 px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-[0.12em] text-[#C8A97E] cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Layers ({activeLayers.size})</span>
            {loadingLayers && <Loader2 className="h-3 w-3 animate-spin" />}
          </button>
        </div>
      </div>

      {/* Layers Toggle Bar */}
      {layersDrawerOpen && (
        <div className="border-b border-[#2A2A30] bg-[#0A0A0B] p-3 flex flex-wrap gap-1.5">
          {FACILITY_LAYERS.map((layer) => {
            const on = activeLayers.has(layer.id);
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onToggleLayer(layer.id)}
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-sm text-[11px] transition-colors cursor-pointer ${
                  on
                    ? 'border-[#C8A97E] bg-[#C8A97E]/15 text-[#F4F1EA]'
                    : 'border-[#2A2A30] bg-[#111114] text-[#8E8E98] hover:text-[#E8E4DC]'
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: layer.color }}
                />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Map Canvas or Graceful API Configuration Fallback */}
      <div className={`relative w-full ${heightClass}`}>
        {browserKeyPresent && !jsFailed ? (
          <>
            <div ref={mapContainerRef} className="w-full h-full bg-[#141417]" />

            {!jsReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0B]/80 text-xs text-[#C8A97E] gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Initialising Google Maps Platform...</span>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute right-3 bottom-4 z-20 flex flex-col border border-[#2A2A30] bg-[#0A0A0B]/95 rounded-sm overflow-hidden">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => handleZoom(1)}
                className="p-2 text-[#E8E4DC] hover:text-[#C8A97E] hover:bg-[#1A1A1F] cursor-pointer border-b border-[#2A2A30]"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => handleZoom(-1)}
                className="p-2 text-[#E8E4DC] hover:text-[#C8A97E] hover:bg-[#1A1A1F] cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>

            {onMapAddStop && (
              <div className="absolute left-3 bottom-4 z-20 border border-[#2A2A30] bg-[#0A0A0B]/90 px-3 py-1.5 rounded-sm text-[11px] text-[#8E8E98]">
                Click anywhere on map to add a waypoint stop
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[#111114] p-6 flex flex-col justify-between">
            <div className="border border-amber-500/40 bg-amber-950/20 p-4 rounded-sm flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-[#F4F1EA]">
                  Google Maps Browser Key Required for Interactive Map Tiles
                </p>
                <p className="text-[#E8E4DC]/80 leading-relaxed">
                  Add <code className="text-[#C8A97E]">VITE_GOOGLE_MAPS_API_KEY</code> to{' '}
                  <code>.env.local</code> for live Google Map tiles
                  {!serverConfigured
                    ? ' and set GOOGLE_MAPS_SERVER_API_KEY in Supabase Edge Function secrets for live Routes, Places, and Geocoding.'
                    : '. Route calculations and calculations continue smoothly.'}
                </p>
              </div>
            </div>

            {/* Clean Editorial Waypoint Schematic */}
            <div className="my-auto py-8 max-w-2xl mx-auto w-full space-y-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C8A97E]">
                Route Waypoint Sequence (Coordinate Preview)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="border border-[#F4F1EA]/40 bg-[#0A0A0B] px-3.5 py-2.5 rounded-sm text-xs">
                  <span className="text-[10px] text-[#C8A97E] block">START (A)</span>
                  <span className="font-medium text-[#F4F1EA]">{origin.label}</span>
                  <span className="block text-[10px] text-[#8E8E98]">
                    {origin.lat.toFixed(3)}, {origin.lng.toFixed(3)}
                  </span>
                </div>
                {stops.map((s, idx) => (
                  <div key={s.id} className="border border-[#2A2A30] bg-[#0A0A0B] px-3.5 py-2.5 rounded-sm text-xs">
                    <span className="text-[10px] text-[#8E8E98] block">STOP {idx + 1}</span>
                    <span className="font-medium text-[#F4F1EA]">{s.label}</span>
                  </div>
                ))}
                <div className="border border-[#C8A97E] bg-[#C8A97E]/10 px-3.5 py-2.5 rounded-sm text-xs">
                  <span className="text-[10px] text-[#C8A97E] block">DESTINATION (B)</span>
                  <span className="font-medium text-[#F4F1EA]">{destination.label}</span>
                  <span className="block text-[10px] text-[#8E8E98]">
                    {destination.lat.toFixed(3)}, {destination.lng.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#8E8E98]">
              Fuel, EV charging, 3-vehicle cost comparison, budget tracking, and Split the Bill remain 100% interactive.
            </p>
          </div>
        )}

        {/* Marker Info Floating Panel */}
        {selectedMarker && (
          <div className="absolute top-3 left-3 z-30 max-w-xs w-full border border-[#C8A97E]/50 bg-[#0A0A0B]/95 p-4 rounded-sm shadow-2xl space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#C8A97E]">
                  {selectedMarker.kind === 'vehicle'
                    ? 'SHAREWHEELS Vehicle'
                    : FACILITY_LAYERS.find((l) => l.id === selectedMarker.data.layer)?.label ||
                      'Place'}
                </p>
                <p className="font-display text-sm font-medium text-[#F4F1EA] mt-0.5">
                  {selectedMarker.data.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMarker(null)}
                className="text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedMarker.kind === 'place' ? (
              <>
                <p className="text-[#8E8E98] leading-relaxed">{selectedMarker.data.address}</p>
                <div className="flex flex-wrap gap-3 text-[11px] text-[#E8E4DC]">
                  {selectedMarker.data.distanceFromRouteKm !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#C8A97E]" />
                      {selectedMarker.data.distanceFromRouteKm} km from route
                    </span>
                  )}
                  {selectedMarker.data.rating !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-[#C8A97E]" />
                      {selectedMarker.data.rating} ({selectedMarker.data.userRatingCount ?? 0})
                    </span>
                  )}
                  {selectedMarker.data.openNow !== null && (
                    <span
                      className={
                        selectedMarker.data.openNow ? 'text-emerald-300' : 'text-red-300'
                      }
                    >
                      {selectedMarker.data.openNow ? 'Open Now' : 'Closed'}
                    </span>
                  )}
                </div>
                {selectedMarker.data.phone && (
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-[#8E8E98]">
                    <Phone className="h-3 w-3 text-[#C8A97E]" />
                    {selectedMarker.data.phone}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {onAddPlaceAsStop && (
                    <Button
                      size="sm"
                      variant="champagne"
                      onClick={() => {
                        onAddPlaceAsStop(selectedMarker.data);
                        setSelectedMarker(null);
                      }}
                    >
                      Add as Stop
                    </Button>
                  )}
                  {selectedMarker.data.googleMapsUri && (
                    <a
                      href={selectedMarker.data.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 border border-[#2A2A30] px-2.5 py-1.5 rounded-sm text-[11px] text-[#E8E4DC] hover:border-[#C8A97E]"
                    >
                      Directions
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-[#8E8E98]">
                  {selectedMarker.data.location} · {selectedMarker.data.transmission} ·{' '}
                  {selectedMarker.data.fuelType}
                </p>
                <p className="text-sm font-medium text-[#C8A97E]">
                  ₹{selectedMarker.data.pricePerDay.toLocaleString('en-IN')} / day
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
