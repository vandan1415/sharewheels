import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { LiveVehicle } from '@/hooks/useVehicles';
import type { OffRoadSubCategory, RecordSourceLabel, TerrainType, VehicleCategory } from '@/data/demoVehicles';

const SOURCE_MAP: Record<string, RecordSourceLabel> = {
  owner_submitted: 'Owner Submitted',
  document_reviewed: 'Document Reviewed',
  independently_verified: 'Independently Verified',
  platform_recorded: 'Platform Recorded',
};

const VEHICLE_SELECT_ALL = `
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

function mapRow(row: any): LiveVehicle {
  const off = Array.isArray(row.vehicle_offroad_specs)
    ? row.vehicle_offroad_specs[0]
    : row.vehicle_offroad_specs;

  const imgs: any[] = [...(row.vehicle_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const galleryPhotos = imgs
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
    citySlug: row.city_slug || '',
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
    gallery: galleryPhotos.map((g) => g.url),
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
    isDemo: Boolean(row.is_demo) as true,
  };
}

export function useAllApprovedVehicles(citySlugFilter?: string | null) {
  return useQuery<LiveVehicle[]>({
    queryKey: ['routecraft-approved-vehicles', citySlugFilter ?? 'ALL'],
    queryFn: async () => {
      if (!supabase) return [];
      let query = supabase
        .from('vehicles')
        .select(VEHICLE_SELECT_ALL)
        .eq('is_archived', false)
        .eq('listing_status', 'APPROVED')
        .eq('is_paused', false)
        .order('price_per_day_paise', { ascending: true });

      if (citySlugFilter) {
        query = query.eq('city_slug', citySlugFilter);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data.map(mapRow);
    },
    staleTime: 60_000,
  });
}

export interface SavedJourneyRow {
  id: string;
  user_id: string;
  share_token: string;
  is_shared: boolean;
  title: string;
  origin_label: string;
  origin_lat: number | null;
  origin_lng: number | null;
  origin_place_id: string | null;
  destination_label: string;
  destination_lat: number | null;
  destination_lng: number | null;
  destination_place_id: string | null;
  stops: Array<{ id: string; label: string; lat: number; lng: number; placeId?: string }>;
  vehicle_id: string | null;
  vehicle_slug: string | null;
  departure_date: string | null;
  return_date: string | null;
  departure_time: string;
  passengers: number;
  preferences: string[];
  max_budget_inr: number | null;
  route_preference: string;
  distance_km: number | null;
  duration_minutes: number | null;
  route_summary: string | null;
  budget_assumptions: Record<string, any>;
  estimated_totals: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useSavedJourneys() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<SavedJourneyRow[]>({
    queryKey: ['saved-journeys', user?.id ?? null],
    enabled: Boolean(user?.id && supabase),
    queryFn: async () => {
      if (!supabase || !user?.id) return [];
      const { data, error } = await supabase
        .from('saved_journeys')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as SavedJourneyRow[]) ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['saved-journeys', user?.id ?? null] });

  const saveMutation = useMutation({
    mutationFn: async (
      payload: Omit<SavedJourneyRow, 'id' | 'user_id' | 'share_token' | 'created_at' | 'updated_at'> & {
        id?: string;
      }
    ) => {
      if (!supabase || !user?.id) {
        throw new Error('Sign in with your Customer account to save journeys.');
      }
      const { id, ...rest } = payload;
      const nowIso = new Date().toISOString();
      if (id) {
        const { data, error } = await supabase
          .from('saved_journeys')
          .update({ ...rest, updated_at: nowIso })
          .eq('id', id)
          .eq('user_id', user.id)
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return data as SavedJourneyRow;
      }

      const { data, error } = await supabase
        .from('saved_journeys')
        .insert({ ...rest, user_id: user.id })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as SavedJourneyRow;
    },
    onSuccess: invalidate,
  });

  const duplicateMutation = useMutation({
    mutationFn: async (row: SavedJourneyRow) => {
      if (!supabase || !user?.id) throw new Error('Sign in required.');
      const {
        id: _id,
        user_id: _uid,
        share_token: _tok,
        created_at: _ca,
        updated_at: _ua,
        ...rest
      } = row;
      const { data, error } = await supabase
        .from('saved_journeys')
        .insert({
          ...rest,
          user_id: user.id,
          is_shared: false,
          title: `${row.title} (Copy)`,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as SavedJourneyRow;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (journeyId: string) => {
      if (!supabase || !user?.id) throw new Error('Sign in required.');
      const { error } = await supabase
        .from('saved_journeys')
        .delete()
        .eq('id', journeyId)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const toggleShareMutation = useMutation({
    mutationFn: async (params: { journeyId: string; isShared: boolean }) => {
      if (!supabase || !user?.id) throw new Error('Sign in required.');
      const { data, error } = await supabase
        .from('saved_journeys')
        .update({ is_shared: params.isShared, updated_at: new Date().toISOString() })
        .eq('id', params.journeyId)
        .eq('user_id', user.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as SavedJourneyRow;
    },
    onSuccess: invalidate,
  });

  return {
    ...query,
    invalidate,
    saveJourney: saveMutation.mutateAsync,
    savingJourney: saveMutation.isPending,
    duplicateJourney: duplicateMutation.mutateAsync,
    deleteJourney: deleteMutation.mutateAsync,
    toggleShare: toggleShareMutation.mutateAsync,
  };
}

export function useSavedJourneyLookup(savedId: string | null, shareToken: string | null) {
  return useQuery<SavedJourneyRow | null>({
    queryKey: ['saved-journey-lookup', savedId ?? null, shareToken ?? null],
    enabled: Boolean((savedId || shareToken) && supabase),
    queryFn: async () => {
      if (!supabase) return null;
      if (shareToken) {
        const { data } = await supabase
          .from('saved_journeys')
          .select('*')
          .eq('share_token', shareToken)
          .eq('is_shared', true)
          .maybeSingle();
        return (data as SavedJourneyRow | null) ?? null;
      }
      if (savedId) {
        const { data } = await supabase
          .from('saved_journeys')
          .select('*')
          .eq('id', savedId)
          .maybeSingle();
        return (data as SavedJourneyRow | null) ?? null;
      }
      return null;
    },
  });
}
