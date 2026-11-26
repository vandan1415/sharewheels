import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLocationContext } from '@/context/LocationContext';
import type {
  DemoVehicle,
  OffRoadSubCategory,
  RecordSourceLabel,
  TerrainType,
  VehicleCategory,
} from '@/data/demoVehicles';

const SOURCE_MAP: Record<string, RecordSourceLabel> = {
  owner_submitted: 'Owner Submitted',
  document_reviewed: 'Document Reviewed',
  independently_verified: 'Independently Verified',
  platform_recorded: 'Platform Recorded',
};

export interface GalleryPhoto {
  url: string;
  angle: string;
  sourceSite?: string;
  sourceUrl?: string;
  photographer?: string;
  license?: string;
}

export interface LiveVehicle extends Omit<DemoVehicle, 'category' | 'isDemo'> {
  dbId?: string;
  isDemo: boolean;
  citySlug: string;
  variant: string;
  registrationCity: string;
  drivetrain: string;
  mileageOrRange: string;
  description: string;
  placeholderKey: string;
  category: string;
  galleryPhotos: GalleryPhoto[];
}

export const INDIA_CATEGORIES = [
  'Hatchbacks',
  'Sedans',
  'Compact SUVs',
  'Full-Size SUVs',
  'Family MPVs',
  'Off-Road & Adventure',
  'Luxury Vehicles',
  'Electric Vehicles',
] as const;

function mapRowToVehicle(row: any): LiveVehicle {
  const off = Array.isArray(row.vehicle_offroad_specs)
    ? row.vehicle_offroad_specs[0]
    : row.vehicle_offroad_specs;

  const imgs: any[] = [...(row.vehicle_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const galleryPhotos: GalleryPhoto[] = imgs
    .filter((i) => i.webp_url || i.image_url)
    .map((i) => ({
      url: i.webp_url || i.image_url,
      angle: i.angle || 'exterior',
      sourceSite: i.source_site,
      sourceUrl: i.source_url,
      photographer: i.photographer,
      license: i.license,
    }));
  const primaryImg =
    imgs.find((i) => i.is_primary)?.webp_url ||
    imgs.find((i) => i.is_primary)?.image_url ||
    row.image_url ||
    '';

  return {
    dbId: row.id,
    id: row.slug,
    citySlug: row.city_slug,
    name: row.name,
    brand: row.brand,
    model: row.model,
    variant: row.variant || '',
    year: row.year,
    registrationCity: row.registration_city || '',
    category: (row.vehicle_categories?.name ?? 'Compact SUVs') as VehicleCategory,
    location: row.location,
    pricePerDay: Math.round(Number(row.price_per_day_paise) / 100),
    securityDeposit: Math.round(Number(row.security_deposit_paise) / 100),
    transmission: row.transmission,
    fuelType: row.fuel_type,
    seats: row.seats,
    drivetrain: row.drivetrain || off?.drivetrain || 'FWD',
    mileageOrRange: row.mileage_or_range || '',
    description: row.description || '',
    placeholderKey: row.image_placeholder_key || row.slug,
    rating: Number(row.rating),
    tripsCount: row.trips_count,
    available: row.available,
    verificationStatus: row.verification_status,
    ownerName: row.owner_display_name,
    ownerSince: row.owner_since,
    image: primaryImg,
    gallery: galleryPhotos.length > 0 ? galleryPhotos.map((g) => g.url) : [],
    galleryPhotos,
    highlights: row.highlights ?? [],
    rules: row.rules ?? [],
    offRoadSpecs: off
      ? {
          subCategory: off.sub_category as OffRoadSubCategory,
          drivetrain: off.drivetrain,
          groundClearanceMm: off.ground_clearance_mm,
          approachAngleDeg: off.approach_angle_deg ?? undefined,
          departureAngleDeg: off.departure_angle_deg ?? undefined,
          tyreType: off.tyre_type,
          terrains: (row.vehicle_terrain_capabilities ?? []).map((t: any) => ({
            terrain: t.terrain as TerrainType,
            sourceLabel: SOURCE_MAP[t.source_label] ?? 'Owner Submitted',
          })),
          modifications: off.modifications ?? [],
          recoveryEquipment: off.recovery_equipment ?? [],
          restrictions: off.restrictions ?? [],
          permittedRoutes: off.permitted_routes,
        }
      : undefined,
    passportEvents: (row.vehicle_passport_events ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((ev: any) => ({
        id: ev.id,
        date: ev.event_date,
        title: ev.title,
        summary: ev.summary,
        sourceLabel: SOURCE_MAP[ev.source_label] ?? 'Platform Recorded',
      })),
    isDemo: row.is_demo !== false,
  };
}

const VEHICLE_SELECT = `
  id, slug, city_slug, name, brand, model, variant, year, registration_city,
  location, price_per_day_paise, security_deposit_paise,
  transmission, fuel_type, seats, drivetrain, mileage_or_range,
  rating, trips_count, available, verification_status, owner_display_name, owner_since,
  image_url, image_placeholder_key, gallery_urls, highlights, rules, description, is_demo,
  vehicle_categories!inner(name, slug),
  vehicle_images(image_url, webp_url, is_primary, sort_order, angle, placeholder_key, source_site, source_url, photographer, license),
  vehicle_offroad_specs(
    sub_category, drivetrain, ground_clearance_mm,
    approach_angle_deg, departure_angle_deg, tyre_type,
    modifications, recovery_equipment, restrictions, permitted_routes
  ),
  vehicle_terrain_capabilities(terrain, source_label),
  vehicle_passport_events(id, event_date, title, summary, source_label, sort_order)
`;

export function useVehicles(overrideCitySlug?: string | null) {
  const { selectedCity } = useLocationContext();
  const citySlug = overrideCitySlug === undefined ? selectedCity?.slug ?? null : overrideCitySlug;

  return useQuery<LiveVehicle[]>({
    queryKey: ['vehicles', citySlug],
    queryFn: async () => {
      if (!supabase || !citySlug) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select(VEHICLE_SELECT)
        .eq('is_archived', false)
        .eq('is_paused', false)
        .eq('available', true)
        .eq('listing_status', 'APPROVED')
        .eq('city_slug', citySlug)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []).map(mapRowToVehicle);
    },
    staleTime: 60_000,
  });
}

export function useVehicleBySlug(slug?: string) {
  return useQuery<LiveVehicle | null>({
    queryKey: ['vehicle-slug', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!supabase || !slug) return null;
      const { data, error } = await supabase
        .from('vehicles')
        .select(VEHICLE_SELECT)
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) return null;
      return mapRowToVehicle(data);
    },
    staleTime: 60_000,
  });
}

export function useVehiclesBySlugs(slugs: string[]) {
  return useQuery<LiveVehicle[]>({
    queryKey: ['vehicles-slugs', slugs.join(',')],
    enabled: slugs.length > 0,
    queryFn: async () => {
      if (!supabase || slugs.length === 0) return [];
      const { data, error } = await supabase
        .from('vehicles')
        .select(VEHICLE_SELECT)
        .in('slug', slugs);

      if (error || !data) return [];
      return data.map(mapRowToVehicle);
    },
    staleTime: 60_000,
  });
}
