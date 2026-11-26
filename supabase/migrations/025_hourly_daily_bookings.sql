-- SHAREWHEELS: Flexible Hourly & Daily Booking Architecture
-- Formula: Hourly Price = ROUND((Daily Price INR / 12) * 1.5) in paise (* 100)

CREATE OR REPLACE FUNCTION public.calculate_hourly_price_paise(daily_paise bigint)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(daily_paise, 0) <= 0 THEN 0::bigint
    ELSE (ROUND((ROUND(daily_paise::numeric / 100.0) / 12.0) * 1.5)::bigint * 100::bigint)
  END;
$$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS rental_mode text NOT NULL DEFAULT 'DAILY',
  ADD COLUMN IF NOT EXISTS billable_units integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS applied_rate_paise bigint NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_rental_mode_check CHECK (rental_mode IN ('DAILY', 'HOURLY'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_billable_units_check CHECK (billable_units >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_applied_rate_paise_check CHECK (applied_rate_paise >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill historical rows safely so duration and applied rate match existing bookings
UPDATE public.bookings b
SET
  billable_units = GREATEST(1, CEIL(EXTRACT(EPOCH FROM (b.end_at - b.start_at)) / 86400.0)::integer),
  applied_rate_paise = COALESCE(
    (SELECT v.price_per_day_paise FROM public.vehicles v WHERE v.id = b.vehicle_id),
    b.rental_total_paise
  )
WHERE b.applied_rate_paise = 0;

-- Replace inclusive overlap constraint [] with half-open [) so back-to-back hourly bookings
-- (e.g. 10 AM - 2 PM followed by 2 PM - 6 PM) are permitted while true overlaps (1 PM - 5 PM) are rejected.
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_vehicle_id_tstzrange_excl;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_vehicle_id_tstzrange_excl
  EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status = ANY (ARRAY['pending'::booking_status, 'accepted'::booking_status, 'confirmed'::booking_status, 'active'::booking_status]));
