export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface RouteWaypoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface PlaceSuggestion {
  placeId: string;
  label: string;
  primaryText: string;
  secondaryText: string;
}

export interface GeocodedPlace {
  placeId?: string;
  label: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

export interface ComputedRouteOption {
  index: number;
  category: 'fastest' | 'shortest' | 'alternative';
  label: string;
  description: string;
  routeLabels: string[];
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  encodedPolyline: string;
  estimatedTollInr: number | null;
  legs: { distanceKm: number; durationMinutes: number }[];
}

export type FacilityLayerId =
  | 'sharewheels_vehicles'
  | 'petrol'
  | 'diesel'
  | 'cng'
  | 'ev_charging'
  | 'toll_plazas'
  | 'restaurants'
  | 'hotels'
  | 'parking'
  | 'attractions'
  | 'hospitals'
  | 'emergency';

export interface FacilityLayerMeta {
  id: FacilityLayerId;
  label: string;
  color: string;
  shortTag: string;
  requiresPlacesApi: boolean;
}

export const FACILITY_LAYERS: readonly FacilityLayerMeta[] = [
  { id: 'sharewheels_vehicles', label: 'SHAREWHEELS Vehicles', color: '#C8A97E', shortTag: 'SW', requiresPlacesApi: false },
  { id: 'petrol', label: 'Petrol Stations', color: '#E59A38', shortTag: 'P', requiresPlacesApi: true },
  { id: 'diesel', label: 'Diesel Stations', color: '#D97736', shortTag: 'D', requiresPlacesApi: true },
  { id: 'cng', label: 'CNG Stations', color: '#34D399', shortTag: 'CNG', requiresPlacesApi: true },
  { id: 'ev_charging', label: 'EV Charging', color: '#38BDF8', shortTag: 'EV', requiresPlacesApi: true },
  { id: 'toll_plazas', label: 'Toll Plazas', color: '#FBBF24', shortTag: '₹', requiresPlacesApi: true },
  { id: 'restaurants', label: 'Restaurants', color: '#F472B6', shortTag: 'R', requiresPlacesApi: true },
  { id: 'hotels', label: 'Hotels', color: '#A78BFA', shortTag: 'H', requiresPlacesApi: true },
  { id: 'parking', label: 'Parking', color: '#60A5FA', shortTag: 'PK', requiresPlacesApi: true },
  { id: 'attractions', label: 'Tourist Attractions', color: '#2DD4BF', shortTag: '★', requiresPlacesApi: true },
  { id: 'hospitals', label: 'Hospitals', color: '#F87171', shortTag: '+', requiresPlacesApi: true },
  { id: 'emergency', label: 'Emergency', color: '#EF4444', shortTag: '!', requiresPlacesApi: true },
] as const;

export interface NearbyFacilityPlace {
  id: string;
  layer: FacilityLayerId;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  userRatingCount: number | null;
  openNow: boolean | null;
  phone: string | null;
  googleMapsUri: string | null;
  types: string[];
  distanceFromRouteKm?: number;
}

export const SHAREWHEELS_DARK_MAP_STYLES: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#141417' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9c9ca6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0b' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2a30' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a1a1f' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#232329' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#34302a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#c8a97e' }, { lightness: -40 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0e13' }] },
];

export const INDIA_CITY_CENTERS: Record<string, LatLngPoint & { label: string }> = {
  'delhi-ncr': { label: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
  mumbai: { label: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777 },
  bengaluru: { label: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
  hyderabad: { label: 'Hyderabad, Telangana', lat: 17.385, lng: 78.4867 },
  chennai: { label: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  pune: { label: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  'chandigarh-tricity': { label: 'Chandigarh Tricity', lat: 30.7333, lng: 76.7794 },
  jaipur: { label: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
};

export function getBrowserGoogleMapsKey(): string {
  return ((import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '').trim();
}

export function isBrowserMapsConfigured(): boolean {
  return getBrowserGoogleMapsKey().length > 10;
}

let mapsScriptPromise: Promise<boolean> | null = null;

export function loadGoogleMapsJs(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const w = window as unknown as { google?: { maps?: unknown } };
  if (w.google?.maps) return Promise.resolve(true);

  const key = getBrowserGoogleMapsKey();
  if (!key) return Promise.resolve(false);
  if (mapsScriptPromise) return mapsScriptPromise;

  mapsScriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-routecraft-gmaps="true"]'
    );
    if (existing) {
      if (w.google?.maps) {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(Boolean(w.google?.maps)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.dataset.routecraftGmaps = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean(w.google?.maps));
    script.onerror = () => {
      mapsScriptPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return mapsScriptPromise;
}

interface CacheEntry<T> {
  expiresAt: number;
  data: T;
}

const sessionResponseCache = new Map<string, CacheEntry<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();
const apiStats = {
  networkCalls: 0,
  cacheHits: 0,
  lastError: null as string | null,
  serverConfigured: true,
};

export function getMapsApiUsageStats() {
  return { ...apiStats, cacheEntries: sessionResponseCache.size };
}

export async function callRouteCraftMapsApi<T = Record<string, any>>(
  action: 'autocomplete' | 'place_details' | 'geocode' | 'compute_routes' | 'nearby_places',
  payload: Record<string, unknown>,
  cacheTtlMs = 120_000
): Promise<T & { configured?: boolean; message?: string; code?: string }> {
  const cacheKey = `${action}:${JSON.stringify(payload)}`;
  const cached = sessionResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    apiStats.cacheHits += 1;
    return cached.data as T & { configured?: boolean; message?: string; code?: string };
  }

  const existingInflight = inflightRequests.get(cacheKey);
  if (existingInflight) {
    return (await existingInflight) as T & { configured?: boolean; message?: string; code?: string };
  }

  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const execPromise = (async () => {
    apiStats.networkCalls += 1;
    const res = await fetch(`${baseUrl}/functions/v1/routecraft-maps-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: pubKey,
        Authorization: `Bearer ${pubKey}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.message || json?.error || `Maps proxy error (${res.status})`;
      apiStats.lastError = msg;
      throw new Error(msg);
    }

    if (json?.configured === false) {
      apiStats.serverConfigured = false;
    } else {
      apiStats.serverConfigured = true;
      apiStats.lastError = null;
      if (cacheTtlMs > 0) {
        sessionResponseCache.set(cacheKey, {
          expiresAt: Date.now() + cacheTtlMs,
          data: json,
        });
      }
    }
    return json;
  })();

  inflightRequests.set(cacheKey, execPromise);
  try {
    return (await execPromise) as T & { configured?: boolean; message?: string; code?: string };
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

export function decodePolyline(encoded: string): LatLngPoint[] {
  if (!encoded) return [];
  const points: LatLngPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export function haversineKm(a: LatLngPoint, b: LatLngPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function minDistanceToRouteKm(
  point: LatLngPoint,
  routePoints: LatLngPoint[]
): number | undefined {
  if (!routePoints.length) return undefined;
  const step = Math.max(1, Math.floor(routePoints.length / 80));
  let best = Infinity;
  for (let i = 0; i < routePoints.length; i += step) {
    const d = haversineKm(point, routePoints[i]);
    if (d < best) best = d;
  }
  const last = haversineKm(point, routePoints[routePoints.length - 1]);
  if (last < best) best = last;
  return Number(best.toFixed(1));
}

export type RouteDataProvider =
  | 'google_routes_server'
  | 'google_directions_browser'
  | 'coordinate_estimate';

function classifyRouteOptions(
  rawList: Omit<ComputedRouteOption, 'category' | 'label'>[]
): ComputedRouteOption[] {
  if (rawList.length === 0) return [];
  let minDurIdx = 0;
  let minDistIdx = 0;
  rawList.forEach((r, idx) => {
    if (r.durationSeconds < rawList[minDurIdx].durationSeconds) minDurIdx = idx;
    if (r.distanceMeters < rawList[minDistIdx].distanceMeters) minDistIdx = idx;
  });

  return rawList.map((r, idx) => {
    let category: ComputedRouteOption['category'] = 'alternative';
    let label = 'ALTERNATIVE ROUTE';
    if (idx === minDurIdx) {
      category = 'fastest';
      label = 'FASTEST ROUTE';
    } else if (idx === minDistIdx) {
      category = 'shortest';
      label = 'SHORTEST ROUTE';
    }
    return { ...r, category, label };
  });
}

async function getGoogleMapsGlobal(): Promise<any | null> {
  if (typeof window === 'undefined' || !isBrowserMapsConfigured()) return null;
  const ready = await loadGoogleMapsJs();
  if (!ready) return null;
  return (window as any).google?.maps ?? null;
}

export async function searchPlacesBrowser(
  input: string,
  biasPoint?: LatLngPoint | null
): Promise<PlaceSuggestion[]> {
  const clean = input.trim();
  const key = getBrowserGoogleMapsKey();
  if (clean.length < 2 || !key) return [];

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
      },
      body: JSON.stringify({
        input: clean,
        includedRegionCodes: ['in'],
        languageCode: 'en',
        ...(biasPoint
          ? {
              locationBias: {
                circle: {
                  center: { latitude: biasPoint.lat, longitude: biasPoint.lng },
                  radius: 50000,
                },
              },
            }
          : {}),
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
    return list
      .filter((s: any) => s?.placePrediction?.placeId)
      .slice(0, 7)
      .map((s: any) => {
        const pred = s.placePrediction;
        const primary = pred.structuredFormat?.mainText?.text || pred.text?.text || '';
        const secondary = pred.structuredFormat?.secondaryText?.text || '';
        return {
          placeId: pred.placeId,
          label: pred.text?.text || primary,
          primaryText: primary,
          secondaryText: secondary,
        };
      });
  } catch {
    return [];
  }
}

export async function resolvePlaceBrowser(params: {
  placeId?: string;
  address?: string;
}): Promise<GeocodedPlace | null> {
  const key = getBrowserGoogleMapsKey();
  if (!key) return null;

  try {
    if (params.placeId) {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(params.placeId)}`,
        {
          headers: {
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
          },
        }
      );
      if (res.ok) {
        const p = await res.json();
        const lat = p?.location?.latitude;
        const lng = p?.location?.longitude;
        if (typeof lat === 'number' && typeof lng === 'number') {
          return {
            placeId: p.id || params.placeId,
            label: p.displayName?.text || p.formattedAddress || params.address || 'India Location',
            formattedAddress: p.formattedAddress || '',
            lat,
            lng,
          };
        }
      }
    }

    const address = (params.address ?? '').trim();
    if (!address) return null;
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        textQuery: /india/i.test(address) ? address : `${address}, India`,
        regionCode: 'IN',
        maxResultCount: 1,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.places?.[0];
    const lat = first?.location?.latitude;
    const lng = first?.location?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return {
      placeId: first.id,
      label: first.displayName?.text || first.formattedAddress || address,
      formattedAddress: first.formattedAddress || '',
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocodeBrowser(
  lat: number,
  lng: number
): Promise<GeocodedPlace | null> {
  const maps = await getGoogleMapsGlobal();
  if (!maps?.Geocoder) return null;

  return new Promise((resolve) => {
    try {
      const geocoder = new maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[] | null, status: string) => {
        const first = status === 'OK' && Array.isArray(results) ? results[0] : null;
        if (!first) {
          resolve(null);
          return;
        }
        resolve({
          placeId: first.place_id,
          label: first.formatted_address || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
          formattedAddress: first.formatted_address || '',
          lat,
          lng,
        });
      });
    } catch {
      resolve(null);
    }
  });
}

function parseIsoSeconds(raw: unknown): number {
  if (typeof raw !== 'string') return 0;
  const m = raw.match(/^([\d.]+)s$/);
  return m ? Math.round(Number(m[1])) : 0;
}

function parseTollInrPrice(tollInfo: Record<string, any> | undefined): number | null {
  const prices = tollInfo?.estimatedPrice;
  if (!Array.isArray(prices) || prices.length === 0) return null;
  const inrEntry = prices.find((p: any) => p?.currencyCode === 'INR') ?? prices[0];
  if (!inrEntry || inrEntry.currencyCode !== 'INR') return null;
  const total = Math.round(Number(inrEntry.units ?? 0) + Number(inrEntry.nanos ?? 0) / 1e9);
  return Number.isFinite(total) && total > 0 ? total : null;
}

export async function computeRoutesBrowser(
  origin: LatLngPoint,
  destination: LatLngPoint,
  intermediates: LatLngPoint[] = []
): Promise<{ routes: ComputedRouteOption[]; error?: string }> {
  const key = getBrowserGoogleMapsKey();
  if (!key) {
    return { routes: [], error: 'VITE_GOOGLE_MAPS_API_KEY not configured.' };
  }

  try {
    const requestBody: Record<string, unknown> = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: intermediates.length === 0,
      extraComputations: ['TOLLS'],
      languageCode: 'en-IN',
      units: 'METRIC',
    };

    if (intermediates.length > 0) {
      requestBody.intermediates = intermediates.map((pt) => ({
        location: { latLng: { latitude: pt.lat, longitude: pt.lng } },
      }));
    }

    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': [
          'routes.duration',
          'routes.distanceMeters',
          'routes.polyline.encodedPolyline',
          'routes.description',
          'routes.routeLabels',
          'routes.travelAdvisory.tollInfo',
          'routes.legs.distanceMeters',
          'routes.legs.duration',
        ].join(','),
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        routes: [],
        error: data?.error?.message || `Routes API error (${res.status})`,
      };
    }

    const rawRoutes: any[] = Array.isArray(data?.routes) ? data.routes : [];
    if (rawRoutes.length === 0) {
      return { routes: [], error: 'Google Maps Routes API returned no drivable route.' };
    }

    const rawMapped: Omit<ComputedRouteOption, 'category' | 'label'>[] = rawRoutes.map(
      (r: any, idx: number) => {
        const distanceMeters = Number(r.distanceMeters ?? 0);
        const durationSeconds = parseIsoSeconds(r.duration);
        const legsRaw: any[] = Array.isArray(r.legs) ? r.legs : [];
        return {
          index: idx,
          description: r.description || `Route ${idx + 1}`,
          routeLabels: Array.isArray(r.routeLabels) ? r.routeLabels : [],
          distanceMeters,
          distanceKm: Number((distanceMeters / 1000).toFixed(1)),
          durationSeconds,
          durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
          encodedPolyline: r.polyline?.encodedPolyline || '',
          estimatedTollInr: parseTollInrPrice(r.travelAdvisory?.tollInfo),
          legs: legsRaw.map((leg) => ({
            distanceKm: Number((Number(leg.distanceMeters ?? 0) / 1000).toFixed(1)),
            durationMinutes: Math.max(1, Math.round(parseIsoSeconds(leg.duration) / 60)),
          })),
        };
      }
    );

    return { routes: classifyRouteOptions(rawMapped) };
  } catch (err) {
    return {
      routes: [],
      error: err instanceof Error ? err.message : 'Google Routes API failed',
    };
  }
}

const BROWSER_NEARBY_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.regularOpeningHours.openNow',
  'places.nationalPhoneNumber',
  'places.googleMapsUri',
  'places.types',
].join(',');

export async function searchNearbyPlacesBrowser(
  layer: FacilityLayerId,
  center: LatLngPoint,
  radiusMeters = 25_000
): Promise<NearbyFacilityPlace[]> {
  const key = getBrowserGoogleMapsKey();
  if (layer === 'sharewheels_vehicles' || !key) return [];

  const NEARBY_TYPES: Record<string, string[]> = {
    petrol: ['gas_station'],
    ev_charging: ['electric_vehicle_charging_station'],
    restaurants: ['restaurant'],
    hotels: ['lodging'],
    parking: ['parking'],
    attractions: ['tourist_attraction'],
    hospitals: ['hospital'],
    emergency: ['hospital', 'police', 'fire_station'],
  };
  const TEXT_QUERIES: Record<string, string> = {
    diesel: 'diesel petrol pump India',
    cng: 'CNG filling station India',
    toll_plazas: 'toll plaza highway India',
  };

  try {
    const safeRadius = Math.min(50_000, Math.max(1000, radiusMeters));
    const isText = Boolean(TEXT_QUERIES[layer]);
    const endpoint = isText
      ? 'https://places.googleapis.com/v1/places:searchText'
      : 'https://places.googleapis.com/v1/places:searchNearby';

    const body = isText
      ? {
          textQuery: TEXT_QUERIES[layer],
          maxResultCount: 12,
          locationBias: {
            circle: {
              center: { latitude: center.lat, longitude: center.lng },
              radius: safeRadius,
            },
          },
        }
      : {
          includedTypes: NEARBY_TYPES[layer] ?? ['tourist_attraction'],
          maxResultCount: 12,
          locationRestriction: {
            circle: {
              center: { latitude: center.lat, longitude: center.lng },
              radius: safeRadius,
            },
          },
        };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': BROWSER_NEARBY_FIELD_MASK,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.places) ? data.places : [];
    return list
      .filter((p: any) => p?.location?.latitude && p?.location?.longitude)
      .map((p: any) => ({
        id: p.id || `${layer}-${p.location.latitude}-${p.location.longitude}`,
        layer,
        name: p.displayName?.text || 'Facility',
        address: p.formattedAddress || '',
        lat: Number(p.location.latitude),
        lng: Number(p.location.longitude),
        rating: typeof p.rating === 'number' ? p.rating : null,
        userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
        openNow:
          typeof p.regularOpeningHours?.openNow === 'boolean'
            ? p.regularOpeningHours.openNow
            : null,
        phone: p.nationalPhoneNumber || null,
        googleMapsUri: p.googleMapsUri || null,
        types: Array.isArray(p.types) ? p.types : [],
      }));
  } catch {
    return [];
  }
}

// Unified high-level pan-India Google Maps wrappers (Server Proxy -> Browser Maps JS SDK fallback)
export async function searchIndiaPlaces(
  input: string,
  biasPoint?: LatLngPoint | null
): Promise<{
  suggestions: PlaceSuggestion[];
  source: 'google_server' | 'google_browser' | 'offline';
}> {
  const clean = input.trim();
  if (clean.length < 2) return { suggestions: [], source: 'offline' };

  const cacheKey = `india_auto:${clean.toLowerCase()}:${biasPoint?.lat?.toFixed(1) ?? ''}`;
  const cached = sessionResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as {
      suggestions: PlaceSuggestion[];
      source: 'google_server' | 'google_browser' | 'offline';
    };
  }

  try {
    const res = await callRouteCraftMapsApi<{ suggestions: PlaceSuggestion[] }>(
      'autocomplete',
      { input: clean, lat: biasPoint?.lat, lng: biasPoint?.lng },
      60_000
    );
    if (res.configured !== false && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
      const val = { suggestions: res.suggestions, source: 'google_server' as const };
      sessionResponseCache.set(cacheKey, { expiresAt: Date.now() + 60_000, data: val });
      return val;
    }
  } catch {
    // Fall through to browser SDK
  }

  const browserList = await searchPlacesBrowser(clean, biasPoint);
  if (browserList.length > 0) {
    const val = { suggestions: browserList, source: 'google_browser' as const };
    sessionResponseCache.set(cacheKey, { expiresAt: Date.now() + 60_000, data: val });
    return val;
  }

  return { suggestions: [], source: 'offline' };
}

export async function resolveIndiaPlace(params: {
  placeId?: string;
  address?: string;
}): Promise<GeocodedPlace | null> {
  const action = params.placeId ? 'place_details' : 'geocode';
  try {
    const res = await callRouteCraftMapsApi<{ place?: GeocodedPlace }>(
      action,
      params.placeId ? { placeId: params.placeId } : { address: params.address },
      300_000
    );
    if (res.configured !== false && res.place) {
      return res.place;
    }
  } catch {
    // Fall through to browser Geocoder
  }

  return resolvePlaceBrowser(params);
}

export async function reverseGeocodeIndia(
  lat: number,
  lng: number
): Promise<GeocodedPlace | null> {
  try {
    const res = await callRouteCraftMapsApi<{ place?: GeocodedPlace }>(
      'geocode',
      { lat, lng },
      300_000
    );
    if (res.configured !== false && res.place) {
      return res.place;
    }
  } catch {
    // Fall through
  }

  return reverseGeocodeBrowser(lat, lng);
}

export async function computeIndiaRoutes(
  origin: LatLngPoint,
  destination: LatLngPoint,
  intermediates: LatLngPoint[] = []
): Promise<{
  routes: ComputedRouteOption[];
  provider: RouteDataProvider;
  serverConfigured: boolean;
  error?: string;
}> {
  const cacheKey = `india_routes:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}|${intermediates.map((i) => `${i.lat.toFixed(4)},${i.lng.toFixed(4)}`).join(';')}`;
  const cached = sessionResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as {
      routes: ComputedRouteOption[];
      provider: RouteDataProvider;
      serverConfigured: boolean;
      error?: string;
    };
  }

  let serverConfigured = true;
  let serverError: string | undefined;

  try {
    const res = await callRouteCraftMapsApi<{ routes: ComputedRouteOption[] }>(
      'compute_routes',
      { origin, destination, intermediates },
      180_000
    );
    if (res.configured === false) {
      serverConfigured = false;
    } else if (Array.isArray(res.routes) && res.routes.length > 0) {
      const payload = {
        routes: res.routes,
        provider: 'google_routes_server' as const,
        serverConfigured: true,
      };
      sessionResponseCache.set(cacheKey, { expiresAt: Date.now() + 180_000, data: payload });
      return payload;
    }
  } catch (err) {
    serverError = err instanceof Error ? err.message : 'Server route error';
  }

  if (isBrowserMapsConfigured()) {
    const browserRes = await computeRoutesBrowser(origin, destination, intermediates);
    if (browserRes.routes.length > 0) {
      const payload = {
        routes: browserRes.routes,
        provider: 'google_directions_browser' as const,
        serverConfigured,
      };
      sessionResponseCache.set(cacheKey, { expiresAt: Date.now() + 180_000, data: payload });
      return payload;
    }
    return {
      routes: [],
      provider: 'coordinate_estimate',
      serverConfigured,
      error: browserRes.error || serverError,
    };
  }

  return {
    routes: [],
    provider: 'coordinate_estimate',
    serverConfigured,
    error: serverError,
  };
}

export async function searchIndiaNearbyFacilities(
  layer: FacilityLayerId,
  center: LatLngPoint,
  radiusMeters = 25_000
): Promise<NearbyFacilityPlace[]> {
  if (layer === 'sharewheels_vehicles') return [];
  const cacheKey = `india_nearby:${layer}:${center.lat.toFixed(2)},${center.lng.toFixed(2)}:${radiusMeters}`;
  const cached = sessionResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as NearbyFacilityPlace[];
  }

  try {
    const res = await callRouteCraftMapsApi<{ places: NearbyFacilityPlace[] }>(
      'nearby_places',
      { layer, lat: center.lat, lng: center.lng, radiusMeters },
      240_000
    );
    if (res.configured !== false && Array.isArray(res.places) && res.places.length > 0) {
      sessionResponseCache.set(cacheKey, { expiresAt: Date.now() + 240_000, data: res.places });
      return res.places;
    }
  } catch {
    // Fall through
  }

  const browserPlaces = await searchNearbyPlacesBrowser(layer, center, radiusMeters);
  if (browserPlaces.length > 0) {
    sessionResponseCache.set(cacheKey, { expiresAt: Date.now() + 240_000, data: browserPlaces });
  }
  return browserPlaces;
}
