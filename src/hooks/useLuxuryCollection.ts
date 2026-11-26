import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  LUXURY_SHOWROOM_SEQUENCE,
  matchShowroomSpecForVehicle,
  type LuxuryShowroomSpec,
} from '@/data/luxuryShowroom';

export interface LuxuryListingItem {
  id: string; // slug for /vehicles/:id routing
  dbId: string;
  citySlug: string | null;
  cityName: string;
  location: string;
  name: string;
  brand: string;
  model: string;
  variant: string;
  category: string;
  transmission: string;
  fuelType: string;
  seats: number;
  drivetrain: string;
  pricePerDay: number;
  securityDeposit: number;
  available: boolean;
  isDemo: boolean;
  verificationStatus: string;
  imageUrl: string;
  spec: LuxuryShowroomSpec;
}

const CITY_NAME_MAP: Record<string, string> = {
  'delhi-ncr': 'Delhi NCR, India',
  mumbai: 'Mumbai, India',
  bengaluru: 'Bengaluru, India',
  'chandigarh-tricity': 'Chandigarh Tricity, India',
  hyderabad: 'Hyderabad, India',
  pune: 'Pune, India',
  jaipur: 'Jaipur, India',
  chennai: 'Chennai, India',
};

function mapLuxuryRow(row: any): LuxuryListingItem | null {
  const matchedSpec = matchShowroomSpecForVehicle(
    row.name ?? '',
    row.brand ?? '',
    row.model ?? ''
  );
  if (!matchedSpec) return null;

  return {
    id: row.slug,
    dbId: row.id,
    citySlug: row.city_slug ?? null,
    cityName:
      (row.city_slug && CITY_NAME_MAP[row.city_slug]) ||
      row.location ||
      `${matchedSpec.fallbackCity}, India`,
    location: row.location || '',
    name: row.name,
    brand: row.brand,
    model: row.model,
    variant: row.variant || '',
    category: row.vehicle_categories?.name || 'Luxury Vehicles',
    transmission: row.transmission || '',
    fuelType: row.fuel_type || '',
    seats: Number(row.seats || 0),
    drivetrain: row.drivetrain || '',
    pricePerDay: Math.round(Number(row.price_per_day_paise || 0) / 100),
    securityDeposit: Math.round(Number(row.security_deposit_paise || 0) / 100),
    available: Boolean(row.available),
    isDemo: Boolean(row.is_demo),
    verificationStatus: row.verification_status || 'Document Reviewed',
    imageUrl: matchedSpec.imageUrl,
    spec: matchedSpec,
  };
}

export function useLuxuryCollection(selectedCitySlug?: string | null) {
  const query = useQuery<LuxuryListingItem[]>({
    queryKey: ['luxury-collection-all'],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id, slug, city_slug, name, brand, model, variant, location,
          price_per_day_paise, security_deposit_paise,
          transmission, fuel_type, seats, drivetrain,
          available, verification_status, is_demo, image_url,
          vehicle_categories!inner(name, slug)
        `)
        .eq('is_archived', false)
        .eq('is_paused', false)
        .eq('listing_status', 'APPROVED')
        .in('vehicle_categories.slug', ['luxury-vehicles', 'luxury-cars'])
        .order('price_per_day_paise', { ascending: false });

      if (error || !data) return [];
      return data
        .map(mapLuxuryRow)
        .filter((item): item is LuxuryListingItem => item !== null);
    },
  });

  const allItems = query.data ?? [];

  // City-specific curated set (usually 3 city-specific Luxury Collection listings)
  const cityItems = selectedCitySlug
    ? allItems.filter((item) => item.citySlug === selectedCitySlug)
    : [];

  // Canonical 6-vehicle showroom loop across India (preferring the active city's real listing per model when present)
  const panIndiaSixItems: LuxuryListingItem[] = LUXURY_SHOWROOM_SEQUENCE.map((spec) => {
    const cityMatch = selectedCitySlug
      ? allItems.find((i) => i.spec.id === spec.id && i.citySlug === selectedCitySlug && i.available) ??
        allItems.find((i) => i.spec.id === spec.id && i.citySlug === selectedCitySlug)
      : undefined;

    if (cityMatch) return cityMatch;

    const availMatch =
      allItems.find((i) => i.spec.id === spec.id && i.available) ??
      allItems.find((i) => i.spec.id === spec.id);

    if (availMatch) return availMatch;

    // Non-bookable preview fallback ONLY if database has zero records for this model yet
    return {
      id: '',
      dbId: '',
      citySlug: null,
      cityName: `${spec.fallbackCity}, India`,
      location: spec.fallbackCity,
      name: `${spec.displayBrand} ${spec.displayModel}`,
      brand: spec.displayBrand,
      model: spec.displayModel,
      variant: '',
      category: 'Luxury Vehicles',
      transmission: 'Automatic',
      fuelType: '',
      seats: 0,
      drivetrain: '',
      pricePerDay: 0,
      securityDeposit: 0,
      available: false,
      isDemo: true,
      verificationStatus: 'Showroom Preview Only',
      imageUrl: spec.imageUrl,
      spec,
    };
  });

  return {
    ...query,
    allItems,
    cityItems,
    panIndiaSixItems,
  };
}
