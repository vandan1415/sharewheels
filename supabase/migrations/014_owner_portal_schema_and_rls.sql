-- SHAREWHEELS Owner Portal Schema, Private Storage Buckets, Backend Guard Triggers & RLS
-- Customer & Owner separation; Future Admin Portal compatible; zero admin accounts seeded.

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.owner_verification_status AS ENUM (
    'INCOMPLETE',
    'DOCUMENTS_SUBMITTED',
    'PENDING_VERIFICATION',
    'UNDER_REVIEW',
    'VERIFIED',
    'REJECTED',
    'RESUBMISSION_REQUIRED',
    'SUSPENDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vehicle_listing_status AS ENUM (
    'DRAFT',
    'PENDING_REVIEW',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'RESUBMISSION_REQUIRED',
    'SUSPENDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.document_review_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Dynamic Platform Commission Configuration (no hardcoded percentages in frontend)
CREATE TABLE IF NOT EXISTS public.platform_commission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  commission_bps integer NOT NULL CHECK (commission_bps >= 0 AND commission_bps <= 5000),
  gst_on_commission_bps integer NOT NULL DEFAULT 1800 CHECK (gst_on_commission_bps >= 0 AND gst_on_commission_bps <= 3000),
  tds_bps integer NOT NULL DEFAULT 0 CHECK (tds_bps >= 0 AND tds_bps <= 1000),
  min_daily_rate_paise bigint NOT NULL DEFAULT 50000,
  max_daily_rate_paise bigint NOT NULL DEFAULT 10000000,
  effective_from timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_commission_config (
  config_key,
  commission_bps,
  gst_on_commission_bps,
  tds_bps,
  min_daily_rate_paise,
  max_daily_rate_paise,
  is_active,
  notes
)
VALUES (
  'default_owner_rental',
  1800,
  1800,
  0,
  50000,
  10000000,
  true,
  'Default 18% SHAREWHEELS marketplace commission plus 18% GST on commission fee.'
)
ON CONFLICT (config_key) DO NOTHING;

-- 3. Owner Profiles (strictly separate from public vehicle listings)
CREATE TABLE IF NOT EXISTS public.owner_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_legal_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  mobile_number text NOT NULL DEFAULT '',
  date_of_birth date,
  pan_number_masked text,
  pan_number_hash text,
  verification_status public.owner_verification_status NOT NULL DEFAULT 'INCOMPLETE',
  consent_accepted boolean NOT NULL DEFAULT false,
  consent_accepted_at timestamptz,
  documents_submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  resubmission_notes text,
  draft_step integer NOT NULL DEFAULT 1 CHECK (draft_step >= 1 AND draft_step <= 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_profiles_status
  ON public.owner_profiles (verification_status);

-- 4. Owner Residential Addresses (private; never published)
CREATE TABLE IF NOT EXISTS public.owner_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid UNIQUE NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
  address_line_1 text NOT NULL DEFAULT '',
  address_line_2 text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  pin_code text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_addresses_owner
  ON public.owner_addresses (owner_id);

-- 5. Owner Identity Documents (metadata; binaries stored strictly in private buckets)
CREATE TABLE IF NOT EXISTS public.owner_identity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (
    document_type IN ('pan_card', 'gov_photo_id', 'live_selfie', 'address_proof')
  ),
  gov_id_subtype text,
  storage_bucket text NOT NULL DEFAULT 'owner-kyc-documents',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (
    mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf')
  ),
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880),
  review_status public.document_review_status NOT NULL DEFAULT 'PENDING',
  rejection_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  retention_delete_after timestamptz DEFAULT (now() + interval '5 years'),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_owner_identity_docs_owner
  ON public.owner_identity_documents (owner_id, review_status);

-- 6. Extend existing public.vehicles with Owner Submission & Moderation columns
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS colour text,
  ADD COLUMN IF NOT EXISTS kilometres_driven integer,
  ADD COLUMN IF NOT EXISTS engine_capacity text,
  ADD COLUMN IF NOT EXISTS pickup_area text,
  ADD COLUMN IF NOT EXISTS min_rental_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_rental_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS available_days text[] NOT NULL DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  ADD COLUMN IF NOT EXISTS pickup_preferences text,
  ADD COLUMN IF NOT EXISTS listing_status public.vehicle_listing_status NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS is_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS idx_vehicles_owner_status
  ON public.vehicles (owner_id, listing_status)
  WHERE owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_public_visibility
  ON public.vehicles (city_slug, listing_status, is_paused, available, is_archived);

-- 7. Private Vehicle Submissions (registration plate, exact pickup instructions, condition, pricing consent)
CREATE TABLE IF NOT EXISTS public.vehicle_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid UNIQUE NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
  registration_number text NOT NULL DEFAULT '',
  registration_state text NOT NULL DEFAULT '',
  pickup_city text NOT NULL DEFAULT '',
  pickup_state text NOT NULL DEFAULT '',
  pickup_pin_code text NOT NULL DEFAULT '',
  pickup_locality text NOT NULL DEFAULT '',
  exact_pickup_instructions text NOT NULL DEFAULT '',
  overall_condition text NOT NULL DEFAULT 'Excellent',
  existing_scratches_dents text NOT NULL DEFAULT 'None reported',
  tyre_condition text NOT NULL DEFAULT 'Good',
  interior_condition text NOT NULL DEFAULT 'Clean & well-maintained',
  service_history_available boolean NOT NULL DEFAULT true,
  known_mechanical_issues text NOT NULL DEFAULT 'None reported',
  existing_modifications text NOT NULL DEFAULT 'Stock condition',
  additional_remarks text NOT NULL DEFAULT '',
  damage_disclosure_confirmed boolean NOT NULL DEFAULT false,
  photos_authenticity_confirmed boolean NOT NULL DEFAULT false,
  commission_bps_snapshot integer,
  commission_disclosed_accepted boolean NOT NULL DEFAULT false,
  submission_status public.vehicle_listing_status NOT NULL DEFAULT 'DRAFT',
  draft_step integer NOT NULL DEFAULT 1 CHECK (draft_step >= 1 AND draft_step <= 6),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_submissions_owner
  ON public.vehicle_submissions (owner_id, submission_status);

-- 8. Private Vehicle Documents (RC, Motor Insurance, PUC, Permit, Fitness, Additional)
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (
    document_type IN ('rc', 'insurance', 'puc', 'permit', 'fitness', 'additional')
  ),
  is_mandatory boolean NOT NULL DEFAULT true,
  document_number text,
  issue_date date,
  expiry_date date,
  commercial_rental_coverage_flag boolean NOT NULL DEFAULT false,
  storage_bucket text NOT NULL DEFAULT 'owner-vehicle-documents',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (
    mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf')
  ),
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  review_status public.document_review_status NOT NULL DEFAULT 'PENDING',
  rejection_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle
  ON public.vehicle_documents (vehicle_id, document_type, review_status);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_owner
  ON public.vehicle_documents (owner_id);

-- 9. Private Vehicle Submission Photos (controlled until Admin approval)
CREATE TABLE IF NOT EXISTS public.vehicle_submission_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
  slot_type text NOT NULL CHECK (
    slot_type IN (
      'front',
      'rear',
      'left_side',
      'right_side',
      'dashboard',
      'front_seats',
      'rear_seats',
      'odometer',
      'registration_plate',
      'additional'
    )
  ),
  storage_bucket text NOT NULL DEFAULT 'owner-vehicle-photos',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (
    mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp')
  ),
  file_size_bytes integer NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 8388608),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_submission_photos_vehicle
  ON public.vehicle_submission_photos (vehicle_id, slot_type, sort_order);

-- 10. Owner Payouts (transparent commission & net payout ledger)
CREATE TABLE IF NOT EXISTS public.owner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  gross_rental_paise bigint NOT NULL CHECK (gross_rental_paise >= 0),
  commission_bps integer NOT NULL,
  commission_paise bigint NOT NULL CHECK (commission_paise >= 0),
  tax_deduction_paise bigint NOT NULL DEFAULT 0 CHECK (tax_deduction_paise >= 0),
  net_payout_paise bigint NOT NULL CHECK (net_payout_paise >= 0),
  payout_status text NOT NULL DEFAULT 'pending_settlement_architecture' CHECK (
    payout_status IN ('pending_settlement_architecture', 'scheduled', 'settled', 'on_hold', 'cancelled')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_payouts_owner
  ON public.owner_payouts (owner_id, created_at DESC);

-- 11. Verification Audit Logs (written securely by triggers / privileged admin actions)
CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (
    entity_type IN ('owner_profile', 'owner_document', 'vehicle_submission', 'vehicle_document')
  ),
  entity_id uuid NOT NULL,
  owner_id uuid NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  from_status text,
  to_status text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_audit_owner
  ON public.verification_audit_logs (owner_id, created_at DESC);

-- 12. Security Helper & Trigger Functions

-- Helper used inside vehicles public RLS policy without exposing owner_profiles or vehicle_documents to callers
CREATE OR REPLACE FUNCTION public.is_vehicle_publicly_verified(_vehicle_id uuid, _owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _owner_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.owner_profiles op
      WHERE op.id = _owner_id
        AND op.verification_status = 'VERIFIED'::public.owner_verification_status
    )
    AND EXISTS (
      SELECT 1 FROM public.vehicle_documents vd_rc
      WHERE vd_rc.vehicle_id = _vehicle_id
        AND vd_rc.document_type = 'rc'
        AND vd_rc.review_status = 'APPROVED'::public.document_review_status
        AND (vd_rc.expiry_date IS NULL OR vd_rc.expiry_date >= CURRENT_DATE)
    )
    AND EXISTS (
      SELECT 1 FROM public.vehicle_documents vd_ins
      WHERE vd_ins.vehicle_id = _vehicle_id
        AND vd_ins.document_type = 'insurance'
        AND vd_ins.review_status = 'APPROVED'::public.document_review_status
        AND (vd_ins.expiry_date IS NULL OR vd_ins.expiry_date >= CURRENT_DATE)
    )
    AND EXISTS (
      SELECT 1 FROM public.vehicle_documents vd_puc
      WHERE vd_puc.vehicle_id = _vehicle_id
        AND vd_puc.document_type = 'puc'
        AND vd_puc.review_status = 'APPROVED'::public.document_review_status
        AND (vd_puc.expiry_date IS NULL OR vd_puc.expiry_date >= CURRENT_DATE)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.vehicle_documents vd_bad
      WHERE vd_bad.vehicle_id = _vehicle_id
        AND vd_bad.is_mandatory = true
        AND (
          vd_bad.review_status <> 'APPROVED'::public.document_review_status
          OR (vd_bad.expiry_date IS NOT NULL AND vd_bad.expiry_date < CURRENT_DATE)
        )
    );
$$;

-- Helper: true only when running from backend SQL/admin/service_role context
CREATE OR REPLACE FUNCTION public.is_privileged_backend()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

-- Trigger: Protect owner_profiles verification status and review fields from self-verification
CREATE OR REPLACE FUNCTION public.guard_owner_profile_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF public.is_privileged_backend() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Cannot create an owner profile for another user.';
    END IF;
    NEW.verification_status := 'INCOMPLETE';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.rejection_reason := NULL;
    NEW.resubmission_notes := NULL;
    RETURN NEW;
  END IF;

  -- Preserve review fields
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.resubmission_notes := OLD.resubmission_notes;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    IF NEW.verification_status IN ('VERIFIED', 'UNDER_REVIEW', 'REJECTED', 'SUSPENDED', 'RESUBMISSION_REQUIRED') THEN
      RAISE EXCEPTION 'Owners cannot self-assign verification status %.', NEW.verification_status;
    END IF;

    IF NOT (
      (OLD.verification_status = 'INCOMPLETE' AND NEW.verification_status IN ('DOCUMENTS_SUBMITTED', 'PENDING_VERIFICATION'))
      OR (OLD.verification_status = 'DOCUMENTS_SUBMITTED' AND NEW.verification_status = 'PENDING_VERIFICATION')
      OR (OLD.verification_status IN ('REJECTED', 'RESUBMISSION_REQUIRED') AND NEW.verification_status = 'PENDING_VERIFICATION')
    ) THEN
      RAISE EXCEPTION 'Invalid owner verification transition from % to %.', OLD.verification_status, NEW.verification_status;
    END IF;
  END IF;

  IF NEW.verification_status = 'PENDING_VERIFICATION' AND OLD.verification_status IS DISTINCT FROM 'PENDING_VERIFICATION' THEN
    NEW.documents_submitted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Audit log trigger on owner_profiles status changes
CREATE OR REPLACE FUNCTION public.audit_owner_profile_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
    INSERT INTO public.verification_audit_logs (
      entity_type, entity_id, owner_id, actor_id, action, from_status, to_status, notes
    )
    VALUES (
      'owner_profile',
      NEW.id,
      NEW.id,
      coalesce(auth.uid(), NEW.reviewed_by, NEW.id),
      CASE WHEN TG_OP = 'INSERT' THEN 'owner_profile_created' ELSE 'owner_status_changed' END,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.verification_status::text END,
      NEW.verification_status::text,
      NEW.rejection_reason
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Protect owner_identity_documents from self-approval
CREATE OR REPLACE FUNCTION public.guard_owner_document_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_backend() THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot upload identity documents for another owner.';
  END IF;

  NEW.review_status := 'PENDING';
  NEW.rejection_reason := NULL;
  NEW.reviewed_by := NULL;
  NEW.reviewed_at := NULL;
  NEW.submitted_at := now();
  RETURN NEW;
END;
$$;

-- Trigger: Enforce verified owner + protect vehicle listing_status & sensitive re-verification
CREATE OR REPLACE FUNCTION public.guard_vehicle_owner_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_status public.owner_verification_status;
BEGIN
  NEW.updated_at := now();

  IF public.is_privileged_backend() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_id IS NULL OR NEW.owner_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Vehicle owner_id must match authenticated owner.';
    END IF;

    SELECT verification_status INTO v_owner_status
    FROM public.owner_profiles
    WHERE id = auth.uid();

    IF v_owner_status IS DISTINCT FROM 'VERIFIED' THEN
      RAISE EXCEPTION 'Only verified owners can create vehicle listings.';
    END IF;

    NEW.is_demo := false;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.rejection_reason := NULL;
    IF NEW.listing_status NOT IN ('DRAFT', 'PENDING_REVIEW') THEN
      NEW.listing_status := 'DRAFT';
    END IF;
    IF NEW.listing_status = 'PENDING_REVIEW' THEN
      NEW.submitted_at := now();
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE by owner
  IF OLD.owner_id IS DISTINCT FROM auth.uid() OR OLD.is_demo = true THEN
    RAISE EXCEPTION 'You do not have permission to update this vehicle.';
  END IF;

  NEW.owner_id := OLD.owner_id;
  NEW.is_demo := OLD.is_demo;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.rejection_reason := OLD.rejection_reason;

  IF NEW.listing_status IS DISTINCT FROM OLD.listing_status THEN
    IF NEW.listing_status NOT IN ('DRAFT', 'PENDING_REVIEW') THEN
      RAISE EXCEPTION 'Owners cannot self-assign vehicle listing status %.', NEW.listing_status;
    END IF;
    IF NEW.listing_status = 'PENDING_REVIEW' THEN
      NEW.submitted_at := now();
    END IF;
  END IF;

  -- Changes to core vehicle identity/specifications on an APPROVED listing trigger re-verification
  IF OLD.listing_status = 'APPROVED' AND (
    NEW.brand IS DISTINCT FROM OLD.brand
    OR NEW.model IS DISTINCT FROM OLD.model
    OR NEW.variant IS DISTINCT FROM OLD.variant
    OR NEW.year IS DISTINCT FROM OLD.year
    OR NEW.category_id IS DISTINCT FROM OLD.category_id
    OR NEW.fuel_type IS DISTINCT FROM OLD.fuel_type
    OR NEW.transmission IS DISTINCT FROM OLD.transmission
    OR NEW.seats IS DISTINCT FROM OLD.seats
    OR NEW.drivetrain IS DISTINCT FROM OLD.drivetrain
    OR NEW.city_slug IS DISTINCT FROM OLD.city_slug
  ) THEN
    NEW.listing_status := 'PENDING_REVIEW';
    NEW.submitted_at := now();
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Lock registration_number & transfer after submission; prevent self-approval
CREATE OR REPLACE FUNCTION public.guard_vehicle_submission_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF public.is_privileged_backend() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Submission owner_id must match authenticated user.';
    END IF;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.rejection_reason := NULL;
    IF NEW.submission_status NOT IN ('DRAFT', 'PENDING_REVIEW') THEN
      NEW.submission_status := 'DRAFT';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot update another owner submission.';
  END IF;

  NEW.owner_id := OLD.owner_id;
  NEW.vehicle_id := OLD.vehicle_id;
  NEW.reviewed_by := OLD.reviewed_by;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.rejection_reason := OLD.rejection_reason;

  IF OLD.submitted_at IS NOT NULL AND (
    NEW.registration_number IS DISTINCT FROM OLD.registration_number
    OR NEW.registration_state IS DISTINCT FROM OLD.registration_state
  ) THEN
    RAISE EXCEPTION 'Registration details cannot be modified after submission without formal re-verification.';
  END IF;

  IF NEW.submission_status IS DISTINCT FROM OLD.submission_status THEN
    IF NEW.submission_status NOT IN ('DRAFT', 'PENDING_REVIEW') THEN
      RAISE EXCEPTION 'Owners cannot self-assign submission status %.', NEW.submission_status;
    END IF;
    IF NEW.submission_status = 'PENDING_REVIEW' THEN
      NEW.submitted_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Audit vehicle_submissions transitions
CREATE OR REPLACE FUNCTION public.audit_vehicle_submission_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (OLD.submission_status IS DISTINCT FROM NEW.submission_status) THEN
    INSERT INTO public.verification_audit_logs (
      entity_type, entity_id, owner_id, actor_id, action, from_status, to_status, notes
    )
    VALUES (
      'vehicle_submission',
      NEW.id,
      NEW.owner_id,
      coalesce(auth.uid(), NEW.reviewed_by, NEW.owner_id),
      CASE WHEN TG_OP = 'INSERT' THEN 'vehicle_submission_created' ELSE 'vehicle_submission_status_changed' END,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.submission_status::text END,
      NEW.submission_status::text,
      NEW.rejection_reason
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Force PENDING review & trigger parent vehicle re-verification on document replacement
CREATE OR REPLACE FUNCTION public.guard_vehicle_document_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_backend() THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot upload vehicle documents for another owner.';
  END IF;

  NEW.review_status := 'PENDING';
  NEW.rejection_reason := NULL;
  NEW.reviewed_by := NULL;
  NEW.reviewed_at := NULL;
  NEW.submitted_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_vehicle_reverification_on_doc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_privileged_backend() THEN
    UPDATE public.vehicles
    SET listing_status = 'PENDING_REVIEW',
        submitted_at = now(),
        reviewed_by = NULL,
        reviewed_at = NULL
    WHERE id = NEW.vehicle_id
      AND listing_status = 'APPROVED';

    UPDATE public.vehicle_submissions
    SET submission_status = 'PENDING_REVIEW',
        submitted_at = coalesce(submitted_at, now()),
        reviewed_by = NULL,
        reviewed_at = NULL
    WHERE vehicle_id = NEW.vehicle_id
      AND submission_status = 'APPROVED';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach triggers idempotently (DROP TRIGGER IF EXISTS not needed via DO block or pg_trigger check)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_owner_profile_mutations') THEN
    CREATE TRIGGER trg_guard_owner_profile_mutations
      BEFORE INSERT OR UPDATE ON public.owner_profiles
      FOR EACH ROW EXECUTE FUNCTION public.guard_owner_profile_mutations();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_owner_profile_status') THEN
    CREATE TRIGGER trg_audit_owner_profile_status
      AFTER INSERT OR UPDATE ON public.owner_profiles
      FOR EACH ROW EXECUTE FUNCTION public.audit_owner_profile_status();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_owner_document_mutations') THEN
    CREATE TRIGGER trg_guard_owner_document_mutations
      BEFORE INSERT OR UPDATE ON public.owner_identity_documents
      FOR EACH ROW EXECUTE FUNCTION public.guard_owner_document_mutations();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_vehicle_owner_mutations') THEN
    CREATE TRIGGER trg_guard_vehicle_owner_mutations
      BEFORE INSERT OR UPDATE ON public.vehicles
      FOR EACH ROW EXECUTE FUNCTION public.guard_vehicle_owner_mutations();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_vehicle_submission_mutations') THEN
    CREATE TRIGGER trg_guard_vehicle_submission_mutations
      BEFORE INSERT OR UPDATE ON public.vehicle_submissions
      FOR EACH ROW EXECUTE FUNCTION public.guard_vehicle_submission_mutations();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_vehicle_submission_status') THEN
    CREATE TRIGGER trg_audit_vehicle_submission_status
      AFTER INSERT OR UPDATE ON public.vehicle_submissions
      FOR EACH ROW EXECUTE FUNCTION public.audit_vehicle_submission_status();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_vehicle_document_mutations') THEN
    CREATE TRIGGER trg_guard_vehicle_document_mutations
      BEFORE INSERT OR UPDATE ON public.vehicle_documents
      FOR EACH ROW EXECUTE FUNCTION public.guard_vehicle_document_mutations();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reverify_on_vehicle_doc') THEN
    CREATE TRIGGER trg_reverify_on_vehicle_doc
      AFTER INSERT OR UPDATE ON public.vehicle_documents
      FOR EACH ROW EXECUTE FUNCTION public.trigger_vehicle_reverification_on_doc();
  END IF;
END $$;

-- 13. Enable RLS on all new tables
ALTER TABLE public.platform_commission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_submission_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

-- 14. Explicit Schema & Table Grants
GRANT SELECT ON public.platform_commission_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.owner_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.owner_addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_identity_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vehicle_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_submission_photos TO authenticated;
GRANT SELECT ON public.owner_payouts TO authenticated;
GRANT SELECT ON public.verification_audit_logs TO authenticated;
GRANT INSERT ON public.user_roles TO authenticated;

GRANT ALL ON public.platform_commission_config TO service_role;
GRANT ALL ON public.owner_profiles TO service_role;
GRANT ALL ON public.owner_addresses TO service_role;
GRANT ALL ON public.owner_identity_documents TO service_role;
GRANT ALL ON public.vehicle_submissions TO service_role;
GRANT ALL ON public.vehicle_documents TO service_role;
GRANT ALL ON public.vehicle_submission_photos TO service_role;
GRANT ALL ON public.owner_payouts TO service_role;
GRANT ALL ON public.verification_audit_logs TO service_role;

-- 15. Strict RLS Policies

-- Update existing public vehicle read policy to enforce approved + verified + valid docs rule
ALTER POLICY "Public read vehicles" ON public.vehicles
USING (
  is_archived = false
  AND available = true
  AND is_paused = false
  AND listing_status = 'APPROVED'::public.vehicle_listing_status
  AND (
    is_demo = true
    OR public.is_vehicle_publicly_verified(id, owner_id)
  )
);

-- Update existing public vehicle images read policy so unapproved vehicle images are never leaked
ALTER POLICY "Public read vehicle images" ON public.vehicle_images
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = vehicle_images.vehicle_id
      AND v.is_archived = false
      AND v.available = true
      AND v.is_paused = false
      AND v.listing_status = 'APPROVED'::public.vehicle_listing_status
      AND (v.is_demo = true OR public.is_vehicle_publicly_verified(v.id, v.owner_id))
  )
);

DO $$ BEGIN
  CREATE POLICY "Commission config read active"
    ON public.platform_commission_config FOR SELECT
    TO authenticated
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner profile read own"
    ON public.owner_profiles FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner profile insert own"
    ON public.owner_profiles FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner profile update own"
    ON public.owner_profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner address read own"
    ON public.owner_addresses FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner address insert own"
    ON public.owner_addresses FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner address update own"
    ON public.owner_addresses FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = owner_id)
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner identity docs select own"
    ON public.owner_identity_documents FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner identity docs insert own"
    ON public.owner_identity_documents FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner identity docs update own"
    ON public.owner_identity_documents FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = owner_id)
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner identity docs delete own"
    ON public.owner_identity_documents FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners read own vehicles"
    ON public.vehicles FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Verified owners insert own vehicles"
    ON public.vehicles FOR INSERT
    TO authenticated
    WITH CHECK (
      (select auth.uid()) = owner_id
      AND is_demo = false
      AND EXISTS (
        SELECT 1 FROM public.owner_profiles op
        WHERE op.id = (select auth.uid())
          AND op.verification_status = 'VERIFIED'::public.owner_verification_status
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners update own vehicles"
    ON public.vehicles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = owner_id AND is_demo = false)
    WITH CHECK ((select auth.uid()) = owner_id AND is_demo = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner vehicle submissions select own"
    ON public.vehicle_submissions FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner vehicle submissions insert own"
    ON public.vehicle_submissions FOR INSERT
    TO authenticated
    WITH CHECK (
      (select auth.uid()) = owner_id
      AND EXISTS (
        SELECT 1 FROM public.owner_profiles op
        WHERE op.id = (select auth.uid())
          AND op.verification_status = 'VERIFIED'::public.owner_verification_status
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner vehicle submissions update own"
    ON public.vehicle_submissions FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = owner_id)
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner vehicle docs select own"
    ON public.vehicle_documents FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner vehicle docs insert own"
    ON public.vehicle_documents FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner vehicle docs update own"
    ON public.vehicle_documents FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = owner_id)
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner vehicle docs delete own"
    ON public.vehicle_documents FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner submission photos select own"
    ON public.vehicle_submission_photos FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner submission photos insert own"
    ON public.vehicle_submission_photos FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner submission photos update own"
    ON public.vehicle_submission_photos FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = owner_id)
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner submission photos delete own"
    ON public.vehicle_submission_photos FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner payouts select own"
    ON public.owner_payouts FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner verification audit select own"
    ON public.verification_audit_logs FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners read bookings for own vehicles"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.vehicles v
        WHERE v.id = bookings.vehicle_id
          AND v.owner_id = (select auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users add own owner role"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
      (select auth.uid()) = user_id
      AND role = 'owner'::public.app_role
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 16. Private Supabase Storage Buckets & RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'owner-kyc-documents',
    'owner-kyc-documents',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'owner-vehicle-documents',
    'owner-vehicle-documents',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'owner-vehicle-photos',
    'owner-vehicle-photos',
    false,
    8388608,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  CREATE POLICY "Owners read own private objects"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id IN ('owner-kyc-documents', 'owner-vehicle-documents', 'owner-vehicle-photos')
      AND (storage.foldername(name))[1] = (select auth.uid())::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners upload own private objects"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id IN ('owner-kyc-documents', 'owner-vehicle-documents', 'owner-vehicle-photos')
      AND (storage.foldername(name))[1] = (select auth.uid())::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners update own private objects"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id IN ('owner-kyc-documents', 'owner-vehicle-documents', 'owner-vehicle-photos')
      AND (storage.foldername(name))[1] = (select auth.uid())::text
    )
    WITH CHECK (
      bucket_id IN ('owner-kyc-documents', 'owner-vehicle-documents', 'owner-vehicle-photos')
      AND (storage.foldername(name))[1] = (select auth.uid())::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners delete own private objects"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id IN ('owner-kyc-documents', 'owner-vehicle-documents', 'owner-vehicle-photos')
      AND (storage.foldername(name))[1] = (select auth.uid())::text
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
