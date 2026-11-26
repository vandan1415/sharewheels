import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type {
  CommissionConfig,
  OwnerAddress,
  OwnerBookingRow,
  OwnerIdentityDoc,
  OwnerPayoutRow,
  OwnerProfile,
  OwnerVehicleRow,
} from '@/lib/owner';

export function useCommissionConfig() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['platform-commission-config', user?.id ?? null],
    enabled: Boolean(user?.id && supabase),
    queryFn: async (): Promise<CommissionConfig | null> => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('platform_commission_config')
        .select('*')
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data as CommissionConfig | null;
    },
    staleTime: 60_000,
  });
}

export function useOwnerAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['owner-account', user?.id ?? null],
    enabled: Boolean(user?.id && supabase),
    queryFn: async () => {
      if (!supabase || !user?.id) {
        return {
          profile: null as OwnerProfile | null,
          address: null as OwnerAddress | null,
          documents: [] as OwnerIdentityDoc[],
        };
      }

      const [profileRes, addrRes, docsRes] = await Promise.all([
        supabase.from('owner_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('owner_addresses').select('*').eq('owner_id', user.id).maybeSingle(),
        supabase
          .from('owner_identity_documents')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      return {
        profile: (profileRes.data as OwnerProfile | null) ?? null,
        address: (addrRes.data as OwnerAddress | null) ?? null,
        documents: (docsRes.data as OwnerIdentityDoc[]) ?? [],
      };
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['owner-account', user?.id ?? null] });

  return { ...query, invalidate };
}

export function useOwnerVehicles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['owner-vehicles', user?.id ?? null],
    enabled: Boolean(user?.id && supabase),
    queryFn: async (): Promise<OwnerVehicleRow[]> => {
      if (!supabase || !user?.id) return [];
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id, slug, name, brand, model, variant, year, location, city_slug, location_id,
          category_id, price_per_day_paise, security_deposit_paise, transmission, fuel_type,
          seats, drivetrain, colour, kilometres_driven, engine_capacity, pickup_area,
          min_rental_days, max_rental_days, available_days, pickup_preferences,
          available, is_paused, listing_status, submitted_at, rejection_reason,
          description, created_at,
          vehicle_categories(id, name, slug),
          vehicle_submissions(*),
          vehicle_documents(*),
          vehicle_submission_photos(*)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as unknown as OwnerVehicleRow[]) ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['owner-vehicles', user?.id ?? null] });

  return { ...query, invalidate };
}

export function useOwnerBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-bookings', user?.id ?? null],
    enabled: Boolean(user?.id && supabase),
    queryFn: async (): Promise<OwnerBookingRow[]> => {
      if (!supabase || !user?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, vehicle_id, customer_id, start_at, end_at, rental_mode, billable_units, applied_rate_paise, status,
          rental_total_paise, deposit_paise, advance_paid_paise, balance_due_paise,
          razorpay_payment_id, razorpay_verified_at, payment_status, created_at,
          vehicles!inner(id, slug, name, location, owner_id, price_per_day_paise)
        `)
        .eq('vehicles.owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data as unknown as OwnerBookingRow[]) ?? [];
    },
  });
}

export function useOwnerPayouts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-payouts', user?.id ?? null],
    enabled: Boolean(user?.id && supabase),
    queryFn: async (): Promise<OwnerPayoutRow[]> => {
      if (!supabase || !user?.id) return [];
      const { data, error } = await supabase
        .from('owner_payouts')
        .select(`
          id, owner_id, booking_id, vehicle_id,
          gross_rental_paise, commission_bps, commission_paise,
          tax_deduction_paise, net_payout_paise, payout_status, created_at,
          vehicles(name, slug)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data as unknown as OwnerPayoutRow[]) ?? [];
    },
  });
}

export function useOwnerNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['owner-notifications', user?.id ?? null],
    enabled: Boolean(user?.id && supabase),
    queryFn: async () => {
      if (!supabase || !user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data ?? [];
    },
  });

  const markAllRead = async () => {
    if (!supabase || !user?.id) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    queryClient.invalidateQueries({ queryKey: ['owner-notifications', user?.id ?? null] });
  };

  return { ...query, markAllRead };
}

export function useOwnerFormLookups() {
  return useQuery({
    queryKey: ['owner-form-lookups'],
    queryFn: async () => {
      if (!supabase) return { locations: [], categories: [] };
      const [locRes, catRes] = await Promise.all([
        supabase
          .from('locations')
          .select('id, slug, name, state')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('vehicle_categories')
          .select('id, slug, name')
          .in('slug', [
            'hatchbacks',
            'sedans',
            'compact-suvs',
            'full-size-suvs',
            'family-mpvs',
            'off-road-adventure',
            'luxury-vehicles',
            'electric-vehicles',
          ])
          .order('sort_order', { ascending: true }),
      ]);
      return {
        locations: locRes.data ?? [],
        categories: catRes.data ?? [],
      };
    },
    staleTime: 120_000,
  });
}
