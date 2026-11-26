-- 026_vehicle_passport_expansion.sql
-- Expand Vehicle Passport schema with optional spec/condition fields, append-only odometer logs,
-- maintenance/service records, extended inspection fields, and a sanitized public passport RPC.

-- 1. Additive spec & condition columns on public.vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS registration_year integer,
  ADD COLUMN IF NOT EXISTS horsepower text,
  ADD COLUMN IF NOT EXISTS torque text,
  ADD COLUMN IF NOT EXISTS exterior_condition text,
  ADD COLUMN IF NOT EXISTS interior_condition text,
  ADD COLUMN IF NOT EXISTS tyre_condition text,
  ADD COLUMN IF NOT EXISTS overall_condition text,
  ADD COLUMN IF NOT EXISTS odometer_updated_at timestamptz;

-- 2. Append-only odometer history log
CREATE TABLE IF NOT EXISTS public.vehicle_odometer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  odometer_km integer NOT NULL CHECK (odometer_km >= 0),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_type text NOT NULL CHECK (
    source_type IN (
      'owner_submission',
      'inspection_pickup',
      'inspection_return',
      'service_record',
      'admin_verified'
    )
  ),
  verified boolean NOT NULL DEFAULT false,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_vehicle_odometer_logs_vehicle_recorded
  ON public.vehicle_odometer_logs (vehicle_id, recorded_at DESC);

ALTER TABLE public.vehicle_odometer_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view odometer logs of approved vehicles" ON public.vehicle_odometer_logs;
CREATE POLICY "Public can view odometer logs of approved vehicles"
  ON public.vehicle_odometer_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_odometer_logs.vehicle_id
        AND (
          (v.is_archived = false AND v.listing_status = 'APPROVED')
          OR v.owner_id = auth.uid()
          OR public.is_admin(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Owners and admins can insert odometer logs" ON public.vehicle_odometer_logs;
CREATE POLICY "Owners and admins can insert odometer logs"
  ON public.vehicle_odometer_logs
  FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_odometer_logs.vehicle_id
        AND v.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update odometer log verification" ON public.vehicle_odometer_logs;
CREATE POLICY "Admins can update odometer log verification"
  ON public.vehicle_odometer_logs
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.vehicle_odometer_logs TO anon, authenticated;
GRANT INSERT ON public.vehicle_odometer_logs TO authenticated;
GRANT UPDATE ON public.vehicle_odometer_logs TO authenticated;

-- 3. Maintenance & Service Records
CREATE TABLE IF NOT EXISTS public.vehicle_service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  odometer_km integer CHECK (odometer_km IS NULL OR odometer_km >= 0),
  service_centre text,
  service_type text NOT NULL,
  maintenance_performed text NOT NULL,
  next_recommended_service_date date,
  next_recommended_odometer_km integer CHECK (next_recommended_odometer_km IS NULL OR next_recommended_odometer_km >= 0),
  is_verified boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_service_records_vehicle_date
  ON public.vehicle_service_records (vehicle_id, service_date DESC, created_at DESC);

ALTER TABLE public.vehicle_service_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view service records of approved vehicles" ON public.vehicle_service_records;
CREATE POLICY "Public can view service records of approved vehicles"
  ON public.vehicle_service_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_service_records.vehicle_id
        AND (
          (v.is_archived = false AND v.listing_status = 'APPROVED')
          OR v.owner_id = auth.uid()
          OR public.is_admin(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Owners and admins can insert service records" ON public.vehicle_service_records;
CREATE POLICY "Owners and admins can insert service records"
  ON public.vehicle_service_records
  FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_service_records.vehicle_id
        AND v.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update service record verification" ON public.vehicle_service_records;
CREATE POLICY "Admins can update service record verification"
  ON public.vehicle_service_records
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.vehicle_service_records TO anon, authenticated;
GRANT INSERT ON public.vehicle_service_records TO authenticated;
GRANT UPDATE ON public.vehicle_service_records TO authenticated;

-- 4. Extend public.inspections to link directly to vehicles & structured metrics
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS odometer_km integer CHECK (odometer_km IS NULL OR odometer_km >= 0),
  ADD COLUMN IF NOT EXISTS fuel_level text,
  ADD COLUMN IF NOT EXISTS damage_observations text,
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_created
  ON public.inspections (vehicle_id, created_at DESC);

UPDATE public.inspections i
SET vehicle_id = b.vehicle_id
FROM public.bookings b
WHERE i.booking_id = b.id
  AND i.vehicle_id IS NULL;

-- 5. Privacy masking helper for registration plates (never exposes full unmasked registration publicly)
CREATE OR REPLACE FUNCTION public.mask_registration_number(raw_reg text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  clean text;
BEGIN
  IF raw_reg IS NULL OR btrim(raw_reg) = '' THEN
    RETURN NULL;
  END IF;
  clean := upper(regexp_replace(raw_reg, '[^A-Za-z0-9]', '', 'g'));
  IF length(clean) < 6 THEN
    RETURN '••• ' || right(clean, 2);
  END IF;
  RETURN left(clean, 2) || ' ' || substr(clean, 3, 2) || ' •••• ' || right(clean, 4);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mask_registration_number(text) TO anon, authenticated;

-- 6. Sanitized Public Vehicle Passport RPC (SECURITY DEFINER; zero PII or private file URLs)
CREATE OR REPLACE FUNCTION public.get_public_vehicle_passport(p_vehicle_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_sub RECORD;
  v_latest_odo integer;
  v_latest_odo_at timestamptz;
  v_odo_logs jsonb;
  v_service_records jsonb;
  v_inspections jsonb;
  v_events jsonb;
  v_doc_statuses jsonb;
  v_owner_verified boolean := false;
  v_docs_verified boolean := false;
  v_inspected boolean := false;
  v_odo_updated boolean := false;
  v_maint_available boolean := false;
  v_inspection_count integer := 0;
  v_last_inspection_at timestamptz := NULL;
BEGIN
  SELECT
    v.*,
    vc.name AS category_name
  INTO v_row
  FROM public.vehicles v
  LEFT JOIN public.vehicle_categories vc ON vc.id = v.category_id
  WHERE (v.slug = p_vehicle_slug OR v.id::text = p_vehicle_slug)
    AND v.is_archived = false
    AND v.listing_status = 'APPROVED'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Latest submission (only sanitized non-PII fields)
  SELECT
    public.mask_registration_number(vs.registration_number) AS masked_registration,
    vs.overall_condition,
    vs.tyre_condition,
    vs.interior_condition,
    vs.existing_scratches_dents,
    vs.known_mechanical_issues,
    vs.service_history_available
  INTO v_sub
  FROM public.vehicle_submissions vs
  WHERE vs.vehicle_id = v_row.id
  ORDER BY vs.created_at DESC
  LIMIT 1;

  -- Latest odometer log + full sanitized list
  SELECT ol.odometer_km, ol.recorded_at
  INTO v_latest_odo, v_latest_odo_at
  FROM public.vehicle_odometer_logs ol
  WHERE ol.vehicle_id = v_row.id
  ORDER BY ol.recorded_at DESC
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ol.id,
        'odometer_km', ol.odometer_km,
        'recorded_at', ol.recorded_at,
        'source_type', ol.source_type,
        'verified', ol.verified,
        'notes', ol.notes
      )
      ORDER BY ol.recorded_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_odo_logs
  FROM public.vehicle_odometer_logs ol
  WHERE ol.vehicle_id = v_row.id;

  -- Maintenance & Service timeline
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', sr.id,
        'service_date', sr.service_date,
        'odometer_km', sr.odometer_km,
        'service_centre', sr.service_centre,
        'service_type', sr.service_type,
        'maintenance_performed', sr.maintenance_performed,
        'next_recommended_service_date', sr.next_recommended_service_date,
        'next_recommended_odometer_km', sr.next_recommended_odometer_km,
        'is_verified', sr.is_verified,
        'created_at', sr.created_at
      )
      ORDER BY sr.service_date DESC, sr.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_service_records
  FROM public.vehicle_service_records sr
  WHERE sr.vehicle_id = v_row.id;

  -- Inspections linked by vehicle_id or bookings.vehicle_id (no customer/booking PII)
  SELECT
    COUNT(*)::integer,
    MAX(i.created_at),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'phase', i.phase,
          'odometer_km', i.odometer_km,
          'fuel_level', i.fuel_level,
          'damage_observations', i.damage_observations,
          'notes', i.notes,
          'photo_urls', COALESCE(i.photo_urls, '{}'::text[]),
          'created_at', i.created_at
        )
        ORDER BY i.created_at DESC
      ),
      '[]'::jsonb
    )
  INTO v_inspection_count, v_last_inspection_at, v_inspections
  FROM public.inspections i
  LEFT JOIN public.bookings b ON b.id = i.booking_id
  WHERE COALESCE(i.vehicle_id, b.vehicle_id) = v_row.id
    AND i.is_public = true;

  -- Existing passport timeline events
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', pe.id,
        'event_date', pe.event_date,
        'title', pe.title,
        'summary', pe.summary,
        'source_label', pe.source_label,
        'sort_order', pe.sort_order
      )
      ORDER BY pe.sort_order ASC, pe.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_events
  FROM public.vehicle_passport_events pe
  WHERE pe.vehicle_id = v_row.id;

  -- Sanitized document statuses (strictly NO paths, filenames, doc numbers, or owner PII)
  WITH expected_docs(document_type, label, sort_idx) AS (
    VALUES
      ('rc', 'Registration Certificate (RC)', 1),
      ('insurance', 'Commercial / Motor Insurance', 2),
      ('puc', 'Pollution Under Control (PUC)', 3),
      ('fitness', 'Fitness Certificate', 4),
      ('permit', 'Tourist / Commercial Permit', 5)
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'document_type', ed.document_type,
      'label', ed.label,
      'status',
        CASE
          WHEN vd.id IS NULL THEN 'Not submitted'
          WHEN vd.review_status::text <> 'APPROVED' THEN 'Pending verification'
          WHEN vd.expiry_date IS NOT NULL AND vd.expiry_date < CURRENT_DATE THEN 'Expired'
          WHEN vd.expiry_date IS NOT NULL AND vd.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')::date THEN 'Expiring soon'
          ELSE 'Valid'
        END,
      'expiry_month_year',
        CASE
          WHEN vd.expiry_date IS NOT NULL AND vd.review_status::text = 'APPROVED'
            THEN to_char(vd.expiry_date, 'Mon YYYY')
          ELSE NULL
        END
    )
    ORDER BY ed.sort_idx ASC
  )
  INTO v_doc_statuses
  FROM expected_docs ed
  LEFT JOIN LATERAL (
    SELECT d.id, d.review_status, d.expiry_date
    FROM public.vehicle_documents d
    WHERE d.vehicle_id = v_row.id
      AND d.document_type = ed.document_type
    ORDER BY d.submitted_at DESC NULLS LAST, d.created_at DESC
    LIMIT 1
  ) vd ON true;

  -- Genuine verification indicators (never fabricated)
  IF v_row.owner_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.owner_profiles op
      WHERE op.id = v_row.owner_id
        AND op.verification_status::text = 'VERIFIED'
    ) INTO v_owner_verified;
  END IF;

  SELECT (
    EXISTS (
      SELECT 1 FROM public.vehicle_documents vd
      WHERE vd.vehicle_id = v_row.id AND vd.document_type = 'rc' AND vd.review_status::text = 'APPROVED'
    )
    AND EXISTS (
      SELECT 1 FROM public.vehicle_documents vd
      WHERE vd.vehicle_id = v_row.id AND vd.document_type = 'insurance' AND vd.review_status::text = 'APPROVED'
    )
  ) INTO v_docs_verified;

  v_inspected := (v_inspection_count > 0);
  v_odo_updated := (v_latest_odo IS NOT NULL OR v_row.kilometres_driven IS NOT NULL);
  v_maint_available := (jsonb_array_length(v_service_records) > 0);

  RETURN jsonb_build_object(
    'vehicle', jsonb_build_object(
      'id', v_row.id,
      'slug', v_row.slug,
      'name', v_row.name,
      'brand', v_row.brand,
      'model', v_row.model,
      'variant', v_row.variant,
      'year', v_row.year,
      'registration_year', v_row.registration_year,
      'masked_registration_number', v_sub.masked_registration,
      'registration_city', v_row.registration_city,
      'location', v_row.location,
      'city_slug', v_row.city_slug,
      'category', COALESCE(v_row.category_name, 'Vehicle'),
      'colour', v_row.colour,
      'fuel_type', v_row.fuel_type,
      'transmission', v_row.transmission,
      'seats', v_row.seats,
      'engine_capacity', v_row.engine_capacity,
      'horsepower', v_row.horsepower,
      'torque', v_row.torque,
      'drivetrain', v_row.drivetrain,
      'mileage_or_range', v_row.mileage_or_range,
      'image_url', v_row.image_url,
      'is_demo', v_row.is_demo,
      'verification_status', v_row.verification_status,
      'listing_status', v_row.listing_status::text
    ),
    'usage', jsonb_build_object(
      'total_distance_km', COALESCE(v_latest_odo, v_row.kilometres_driven),
      'last_updated_at', COALESCE(v_latest_odo_at, v_row.odometer_updated_at),
      'odometer_logs', v_odo_logs
    ),
    'condition', jsonb_build_object(
      'overall_condition', COALESCE(v_row.overall_condition, v_sub.overall_condition),
      'exterior_condition', v_row.exterior_condition,
      'interior_condition', COALESCE(v_row.interior_condition, v_sub.interior_condition),
      'tyre_condition', COALESCE(v_row.tyre_condition, v_sub.tyre_condition),
      'inspection_count', v_inspection_count,
      'last_inspection_at', v_last_inspection_at,
      'documented_damage', COALESCE(v_sub.existing_scratches_dents, v_sub.known_mechanical_issues)
    ),
    'service_records', v_service_records,
    'inspections', v_inspections,
    'passport_events', v_events,
    'document_statuses', v_doc_statuses,
    'trust_indicators', jsonb_build_object(
      'owner_identity_verified', v_owner_verified,
      'vehicle_documents_verified', v_docs_verified,
      'vehicle_inspected', v_inspected,
      'odometer_updated', v_odo_updated,
      'maintenance_history_available', v_maint_available
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_vehicle_passport(text) TO anon, authenticated;
