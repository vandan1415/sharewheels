import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { callAdminApi, type AdminSessionInfo } from '@/lib/admin';

export function useAdminSession() {
  const { user, session, loading } = useAuth();

  return useQuery({
    queryKey: ['admin-session', user?.id ?? null, session?.access_token?.slice(-12) ?? null],
    enabled: !loading,
    retry: false,
    queryFn: async (): Promise<AdminSessionInfo | null> => {
      if (!user || !session) return null;
      try {
        return await callAdminApi<AdminSessionInfo>('check_admin_session');
      } catch {
        return null;
      }
    },
  });
}

export function useAdminDashboardStats(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return null;

      const [
        custRes,
        ownerRes,
        vehRes,
        bkRes,
        payoutRes,
        incRes,
        catRes,
        locRes,
        commRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id, account_status, created_at'),
        supabase.from('owner_profiles').select('id, verification_status, created_at'),
        supabase
          .from('vehicles')
          .select('id, city_slug, category_id, listing_status, is_paused, is_archived, available, vehicle_categories(name)'),
        supabase
          .from('bookings')
          .select('id, status, end_at, rental_total_paise, payment_status, created_at'),
        supabase
          .from('owner_payouts')
          .select('id, gross_rental_paise, commission_paise, net_payout_paise, payout_status'),
        supabase.from('shield_incidents').select('id, status, severity, incident_type'),
        supabase.from('vehicle_categories').select('id, name'),
        supabase.from('locations').select('slug, name'),
        supabase
          .from('platform_commission_config')
          .select('commission_bps')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
      ]);

      const customers = custRes.data ?? [];
      const owners = ownerRes.data ?? [];
      const vehicles = (vehRes.data ?? []).filter((v: any) => !v.is_archived);
      const bookings = bkRes.data ?? [];
      const payouts = payoutRes.data ?? [];
      const incidents = incRes.data ?? [];
      const commissionBps = Number(commRes.data?.commission_bps ?? 1800);

      const nowMs = Date.now();
      const pendingOwners = owners.filter((o: any) =>
        ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'DOCUMENTS_SUBMITTED', 'RESUBMISSION_REQUIRED'].includes(
          o.verification_status
        )
      ).length;
      const verifiedOwners = owners.filter((o: any) => o.verification_status === 'VERIFIED').length;

      const pendingVehicles = vehicles.filter((v: any) =>
        ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMISSION_REQUIRED'].includes(v.listing_status)
      ).length;
      const approvedVehicles = vehicles.filter((v: any) => v.listing_status === 'APPROVED').length;
      const suspendedListings = vehicles.filter(
        (v: any) => v.listing_status === 'SUSPENDED' || v.is_paused
      ).length;

      const activeBookings = bookings.filter((b: any) => b.status === 'active').length;
      const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;
      const overdueBookings = bookings.filter(
        (b: any) => b.status === 'active' && new Date(b.end_at).getTime() < nowMs
      ).length;

      const totalBookingValueINR = Math.round(
        bookings
          .filter((b: any) => !['cancelled', 'expired'].includes(b.status))
          .reduce((acc: number, b: any) => acc + Number(b.rental_total_paise), 0) / 100
      );

      const recordedCommissionINR = Math.round(
        payouts.reduce((acc: number, p: any) => acc + Number(p.commission_paise), 0) / 100
      );
      const pendingPayoutsINR = Math.round(
        payouts
          .filter((p: any) => !['settled', 'cancelled'].includes(p.payout_status))
          .reduce((acc: number, p: any) => acc + Number(p.net_payout_paise), 0) / 100
      );

      const openDisputes = incidents.filter(
        (i: any) => !['resolved', 'closed'].includes(i.status)
      ).length;
      const securityIncidents = incidents.filter((i: any) =>
        ['theft_report', 'fraud_report', 'unauthorised_driver'].includes(i.incident_type) ||
        i.severity === 'critical'
      ).length;

      // Charts driven 100% by real DB rows
      const locNameMap = new Map((locRes.data ?? []).map((l: any) => [l.slug, l.name]));
      const cityCountMap = new Map<string, number>();
      for (const v of vehicles as any[]) {
        const label = locNameMap.get(v.city_slug) || v.city_slug || 'Other';
        cityCountMap.set(label, (cityCountMap.get(label) ?? 0) + 1);
      }
      const cityInventoryChart = Array.from(cityCountMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

      const catCountMap = new Map<string, number>();
      for (const v of vehicles as any[]) {
        const label = v.vehicle_categories?.name || 'Uncategorized';
        catCountMap.set(label, (catCountMap.get(label) ?? 0) + 1);
      }
      const categoryChart = Array.from(catCountMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

      const monthMapRevenue = new Map<string, number>();
      const monthMapBookings = new Map<string, number>();
      for (const b of bookings as any[]) {
        const m = new Date(b.created_at).toISOString().slice(0, 7);
        monthMapBookings.set(m, (monthMapBookings.get(m) ?? 0) + 1);
        monthMapRevenue.set(
          m,
          (monthMapRevenue.get(m) ?? 0) + Math.round(Number(b.rental_total_paise) / 100)
        );
      }

      const monthMapOwners = new Map<string, number>();
      for (const o of owners as any[]) {
        const m = new Date(o.created_at).toISOString().slice(0, 7);
        monthMapOwners.set(m, (monthMapOwners.get(m) ?? 0) + 1);
      }

      return {
        kpis: {
          totalCustomers: customers.length,
          totalOwners: owners.length,
          pendingOwners,
          verifiedOwners,
          pendingVehicles,
          approvedVehicles,
          suspendedListings,
          activeBookings,
          completedBookings,
          overdueBookings,
          totalBookingValueINR,
          platformCommissionINR: recordedCommissionINR,
          estimatedCommissionRatePct: commissionBps / 100,
          pendingPayoutsINR,
          openDisputes,
          securityIncidents,
        },
        charts: {
          revenueTrends: Array.from(monthMapRevenue.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, value]) => ({ label, value })),
          bookingsOverTime: Array.from(monthMapBookings.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, value]) => ({ label, value })),
          cityInventory: cityInventoryChart,
          categoryDistribution: categoryChart,
          ownerRegistrations: Array.from(monthMapOwners.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, value]) => ({ label, value })),
        },
        categoriesCount: catRes.data?.length ?? 0,
      };
    },
  });
}

export function useAdminOwners(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-owners'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return [];
      const [profRes, addrRes, docRes] = await Promise.all([
        supabase.from('owner_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('owner_addresses').select('*'),
        supabase.from('owner_identity_documents').select('*'),
      ]);
      const addrByOwner = new Map((addrRes.data ?? []).map((a: any) => [a.owner_id, a]));
      const docsByOwner = new Map<string, any[]>();
      for (const d of docRes.data ?? []) {
        const list = docsByOwner.get(d.owner_id) ?? [];
        list.push(d);
        docsByOwner.set(d.owner_id, list);
      }
      return (profRes.data ?? []).map((p: any) => ({
        ...p,
        address: addrByOwner.get(p.id) ?? null,
        documents: docsByOwner.get(p.id) ?? [],
      }));
    },
  });
  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin-owners'] }),
  };
}

export function useAdminVehicles(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-vehicles'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return [];
      const [vehRes, subRes, docRes, photoRes, ownerRes] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*, vehicle_categories(name, slug)')
          .eq('is_archived', false)
          .order('created_at', { ascending: false }),
        supabase.from('vehicle_submissions').select('*'),
        supabase.from('vehicle_documents').select('*'),
        supabase.from('vehicle_submission_photos').select('*'),
        supabase.from('owner_profiles').select('id, full_legal_name, verification_status, mobile_number'),
      ]);

      const subByVeh = new Map((subRes.data ?? []).map((s: any) => [s.vehicle_id, s]));
      const docsByVeh = new Map<string, any[]>();
      for (const d of docRes.data ?? []) {
        const arr = docsByVeh.get(d.vehicle_id) ?? [];
        arr.push(d);
        docsByVeh.set(d.vehicle_id, arr);
      }
      const photosByVeh = new Map<string, any[]>();
      for (const p of photoRes.data ?? []) {
        const arr = photosByVeh.get(p.vehicle_id) ?? [];
        arr.push(p);
        photosByVeh.set(p.vehicle_id, arr);
      }
      const ownerById = new Map((ownerRes.data ?? []).map((o: any) => [o.id, o]));

      return (vehRes.data ?? []).map((v: any) => ({
        ...v,
        submission: subByVeh.get(v.id) ?? null,
        documents: docsByVeh.get(v.id) ?? [],
        photos: photosByVeh.get(v.id) ?? [],
        ownerProfile: v.owner_id ? ownerById.get(v.owner_id) ?? null : null,
      }));
    },
  });
  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] }),
  };
}

export function useAdminCustomers(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-customers'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return [];
      const [profRes, bkRes, tickRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('id, customer_id, status, rental_total_paise, created_at, vehicles(name)'),
        supabase.from('support_tickets').select('id, user_id, subject, status, created_at'),
      ]);
      const bByCust = new Map<string, any[]>();
      for (const b of bkRes.data ?? []) {
        const list = bByCust.get(b.customer_id) ?? [];
        list.push(b);
        bByCust.set(b.customer_id, list);
      }
      const tByCust = new Map<string, any[]>();
      for (const t of tickRes.data ?? []) {
        const list = tByCust.get(t.user_id) ?? [];
        list.push(t);
        tByCust.set(t.user_id, list);
      }
      return (profRes.data ?? []).map((p: any) => ({
        ...p,
        bookings: bByCust.get(p.id) ?? [],
        tickets: tByCust.get(p.id) ?? [],
      }));
    },
  });
  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin-customers'] }),
  };
}

export function useAdminBookings(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-bookings'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return [];
      const [bkRes, custRes, ownerRes, inspRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, vehicles(id, slug, name, location, city_slug, owner_id)')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, phone'),
        supabase.from('owner_profiles').select('id, full_legal_name, mobile_number'),
        supabase.from('inspections').select('*'),
      ]);

      const custMap = new Map((custRes.data ?? []).map((c: any) => [c.id, c]));
      const ownerMap = new Map((ownerRes.data ?? []).map((o: any) => [o.id, o]));
      const inspByBk = new Map<string, any[]>();
      for (const ins of inspRes.data ?? []) {
        const arr = inspByBk.get(ins.booking_id) ?? [];
        arr.push(ins);
        inspByBk.set(ins.booking_id, arr);
      }

      return (bkRes.data ?? []).map((b: any) => ({
        ...b,
        customer: custMap.get(b.customer_id) ?? null,
        owner: b.vehicles?.owner_id ? ownerMap.get(b.vehicles.owner_id) ?? null : null,
        inspections: inspByBk.get(b.id) ?? [],
      }));
    },
  });
  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
  };
}

export function useAdminFinance(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-finance'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return { bookings: [], payouts: [], commission: null };
      const [bkRes, payRes, cfgRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, rental_total_paise, deposit_paise, payment_status, status, created_at, vehicles(name, location)')
          .order('created_at', { ascending: false }),
        supabase
          .from('owner_payouts')
          .select('*, vehicles(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('platform_commission_config')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        bookings: bkRes.data ?? [],
        payouts: payRes.data ?? [],
        commission: cfgRes.data ?? null,
      };
    },
  });
  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin-finance'] }),
  };
}

export function useAdminIncidents(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-incidents'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return [];
      const [incRes, actRes] = await Promise.all([
        supabase
          .from('shield_incidents')
          .select('*, vehicles(name, location)')
          .order('created_at', { ascending: false }),
        supabase.from('shield_incident_actions').select('*').order('created_at', { ascending: false }),
      ]);
      const actMap = new Map<string, any[]>();
      for (const a of actRes.data ?? []) {
        const list = actMap.get(a.incident_id) ?? [];
        list.push(a);
        actMap.set(a.incident_id, list);
      }
      return (incRes.data ?? []).map((i: any) => ({
        ...i,
        actions: actMap.get(i.id) ?? [],
      }));
    },
  });
  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin-incidents'] }),
  };
}

export function useAdminCities(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-cities'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return [];
      const [locRes, vehRes] = await Promise.all([
        supabase.from('locations').select('*').order('sort_order', { ascending: true }),
        supabase.from('vehicles').select('city_slug').eq('is_archived', false),
      ]);
      const counts = new Map<string, number>();
      for (const v of vehRes.data ?? []) {
        if (v.city_slug) counts.set(v.city_slug, (counts.get(v.city_slug) ?? 0) + 1);
      }
      return (locRes.data ?? []).map((l: any) => ({
        ...l,
        vehicleCount: counts.get(l.slug) ?? 0,
      }));
    },
  });
  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin-cities'] }),
  };
}

export function useAdminNotifications(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-notifications'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from('admin_notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  };
}

export function useAdminAuditLogs(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-audit-logs'],
    enabled: enabled && Boolean(supabase),
    queryFn: async () => {
      if (!supabase) return { adminLogs: [], verificationLogs: [] };
      const [admRes, verRes] = await Promise.all([
        supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('verification_audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      return {
        adminLogs: admRes.data ?? [],
        verificationLogs: verRes.data ?? [],
      };
    },
  });
}
