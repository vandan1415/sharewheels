import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OdometerLogItem {
  id: string;
  odometer_km: number;
  recorded_at: string;
  source_type:
    | 'owner_submission'
    | 'inspection_pickup'
    | 'inspection_return'
    | 'service_record'
    | 'admin_verified';
  verified: boolean;
  notes: string | null;
}

export interface ServiceRecordItem {
  id: string;
  service_date: string;
  odometer_km: number | null;
  service_centre: string | null;
  service_type: string;
  maintenance_performed: string;
  next_recommended_service_date: string | null;
  next_recommended_odometer_km: number | null;
  is_verified: boolean;
  created_at: string;
}

export interface PublicInspectionItem {
  id: string;
  phase: string;
  odometer_km: number | null;
  fuel_level: string | null;
  damage_observations: string | null;
  notes: string | null;
  photo_urls: string[];
  created_at: string;
}

export interface PassportEventItem {
  id: string;
  event_date: string;
  title: string;
  summary: string;
  source_label: string;
  sort_order: number;
}

export type DocumentHealthStatus =
  | 'Valid'
  | 'Expiring soon'
  | 'Expired'
  | 'Pending verification'
  | 'Not submitted';

export interface PublicDocumentStatusItem {
  document_type: string;
  label: string;
  status: DocumentHealthStatus;
  expiry_month_year: string | null;
}

export interface PublicVehiclePassport {
  vehicle: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    model: string;
    variant: string | null;
    year: number;
    registration_year: number | null;
    masked_registration_number: string | null;
    registration_city: string | null;
    location: string;
    city_slug: string;
    category: string;
    colour: string | null;
    fuel_type: string;
    transmission: string;
    seats: number;
    engine_capacity: string | null;
    horsepower: string | null;
    torque: string | null;
    drivetrain: string | null;
    mileage_or_range: string | null;
    image_url: string | null;
    is_demo: boolean;
    verification_status: string;
    listing_status: string;
  };
  usage: {
    total_distance_km: number | null;
    last_updated_at: string | null;
    odometer_logs: OdometerLogItem[];
  };
  condition: {
    overall_condition: string | null;
    exterior_condition: string | null;
    interior_condition: string | null;
    tyre_condition: string | null;
    inspection_count: number;
    last_inspection_at: string | null;
    documented_damage: string | null;
  };
  service_records: ServiceRecordItem[];
  inspections: PublicInspectionItem[];
  passport_events: PassportEventItem[];
  document_statuses: PublicDocumentStatusItem[];
  trust_indicators: {
    owner_identity_verified: boolean;
    vehicle_documents_verified: boolean;
    vehicle_inspected: boolean;
    odometer_updated: boolean;
    maintenance_history_available: boolean;
  };
}

export function useVehiclePassport(vehicleSlug?: string) {
  return useQuery<PublicVehiclePassport | null>({
    queryKey: ['public-vehicle-passport', vehicleSlug],
    enabled: Boolean(vehicleSlug),
    queryFn: async () => {
      if (!supabase || !vehicleSlug) return null;
      const { data, error } = await supabase.rpc('get_public_vehicle_passport', {
        p_vehicle_slug: vehicleSlug,
      });
      if (error) {
        throw new Error(error.message);
      }
      return (data as PublicVehiclePassport | null) ?? null;
    },
    staleTime: 30_000,
  });
}
