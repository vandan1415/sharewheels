-- SHAREWHEELS Admin Portal Schema, SUPER_ADMIN Phone Bootstrap Allowlist,
-- SHIELD Incident Centre, Immutable Audit Logs & Admin RLS Policies.

-- 1. Role Check Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role IN ('admin'::public.app_role, 'super_admin'::public.app_role)
    );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.role = 'super_admin'::public.app_role
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

-- 2. Trusted SUPER_ADMIN Phone Bootstrap Allowlist (strictly service_role only)
CREATE TABLE IF NOT EXISTS public.admin_bootstrap_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text UNIQUE NOT NULL,
  target_role public.app_role NOT NULL CHECK (target_role IN ('super_admin', 'admin')),
  claimed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.admin_bootstrap_allowlist (phone_e164, target_role, is_active, notes)
VALUES (
  '+919803722777',
  'super_admin'::public.app_role,
  true,
  'Initial designated SUPER_ADMIN phone (requires verified Supabase Phone OTP before bootstrap).'
)
ON CONFLICT (phone_e164) DO NOTHING;

ALTER TABLE public.admin_bootstrap_allowlist ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_bootstrap_allowlist FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_bootstrap_allowlist TO service_role;

-- 3. Customer Account Suspension Columns & Guard Trigger
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
  ON public.profiles (account_status);

CREATE OR REPLACE FUNCTION public.guard_profile_suspension()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_backend() OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  NEW.account_status := OLD.account_status;
  NEW.suspended_reason := OLD.suspended_reason;
  NEW.suspended_at := OLD.suspended_at;
  NEW.suspended_by := OLD.suspended_by;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_suspension() FROM PUBLIC, anon, authenticated;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_profile_suspension') THEN
    CREATE TRIGGER trg_guard_profile_suspension
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.guard_profile_suspension();
  END IF;
END $$;

-- 4. Booking Admin Notes Extension
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- 5. SHIELD Incident & Dispute Management Centre
CREATE SEQUENCE IF NOT EXISTS public.shield_incident_seq START 1001;

CREATE TABLE IF NOT EXISTS public.shield_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text UNIQUE NOT NULL,
  incident_type text NOT NULL CHECK (
    incident_type IN (
      'theft_report',
      'overdue_return',
      'damage_dispute',
      'fraud_report',
      'unauthorised_driver',
      'customer_complaint'
    )
  ),
  severity text NOT NULL DEFAULT 'medium' CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  status text NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'investigating', 'awaiting_evidence', 'escalated', 'resolved', 'closed')
  ),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  reported_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shield_incidents_status
  ON public.shield_incidents (status, severity, created_at DESC);

CREATE TABLE IF NOT EXISTS public.shield_incident_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.shield_incidents(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  notes text,
  from_status text,
  to_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shield_incident_actions_incident
  ON public.shield_incident_actions (incident_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.assign_shield_case_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.case_id IS NULL OR btrim(NEW.case_id) = '' THEN
    NEW.case_id := 'SHD-' || extract(year FROM now())::int::text || '-' ||
      lpad(nextval('public.shield_incident_seq')::text, 4, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_shield_case_id() FROM PUBLIC, anon, authenticated;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assign_shield_case_id') THEN
    CREATE TRIGGER trg_assign_shield_case_id
      BEFORE INSERT OR UPDATE ON public.shield_incidents
      FOR EACH ROW EXECUTE FUNCTION public.assign_shield_case_id();
  END IF;
END $$;

-- 6. Admin Notifications Broadcast History
CREATE TABLE IF NOT EXISTS public.admin_notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by uuid NOT NULL REFERENCES auth.users(id),
  audience text NOT NULL CHECK (
    audience IN ('single_user', 'all_owners', 'all_customers', 'all_users')
  ),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notif_logs_created
  ON public.admin_notification_logs (created_at DESC);

-- 7. Immutable Admin Activity & Sensitive Document Access Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text NOT NULL DEFAULT 'admin',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created
  ON public.admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity
  ON public.admin_audit_logs (entity_type, entity_id);

CREATE OR REPLACE FUNCTION public.prevent_admin_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_logs is strictly immutable; UPDATE and DELETE are forbidden.';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_admin_audit_mutation() FROM PUBLIC, anon, authenticated;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_admin_audit_mutation') THEN
    CREATE TRIGGER trg_prevent_admin_audit_mutation
      BEFORE UPDATE OR DELETE ON public.admin_audit_logs
      FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_audit_mutation();
  END IF;
END $$;

-- 8. Enable RLS & Explicit Grants on Admin Tables
ALTER TABLE public.shield_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shield_incident_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.shield_incidents TO authenticated;
GRANT SELECT, INSERT ON public.shield_incident_actions TO authenticated;
GRANT SELECT ON public.admin_notification_logs TO authenticated;
GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT INSERT, UPDATE ON public.platform_commission_config TO authenticated;
GRANT INSERT, UPDATE ON public.locations TO authenticated;
GRANT DELETE ON public.user_roles TO authenticated;

GRANT ALL ON public.shield_incidents TO service_role;
GRANT ALL ON public.shield_incident_actions TO service_role;
GRANT ALL ON public.admin_notification_logs TO service_role;
GRANT ALL ON public.admin_audit_logs TO service_role;
GRANT USAGE ON SEQUENCE public.shield_incident_seq TO authenticated, service_role;

-- 9. Strict Admin-Only RLS Policies Across Marketplace Tables
DO $$ BEGIN
  CREATE POLICY "Admins manage shield incidents"
    ON public.shield_incidents FOR ALL
    TO authenticated
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read and insert incident actions"
    ON public.shield_incident_actions FOR ALL
    TO authenticated
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read notification logs"
    ON public.admin_notification_logs FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read immutable audit logs"
    ON public.admin_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all user roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Super admins grant admin roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
      public.is_super_admin((select auth.uid()))
      AND role = 'admin'::public.app_role
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Super admins revoke admin roles"
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (
      public.is_super_admin((select auth.uid()))
      AND role = 'admin'::public.app_role
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all owner profiles"
    ON public.owner_profiles FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all owner addresses"
    ON public.owner_addresses FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all owner identity docs"
    ON public.owner_identity_documents FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all vehicles"
    ON public.vehicles FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all vehicle submissions"
    ON public.vehicle_submissions FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all vehicle docs"
    ON public.vehicle_documents FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all vehicle photos"
    ON public.vehicle_submission_photos FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all inspections"
    ON public.inspections FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all owner payouts"
    ON public.owner_payouts FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all support tickets"
    ON public.support_tickets FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read all verification audits"
    ON public.verification_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage locations"
    ON public.locations FOR ALL
    TO authenticated
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage commission config"
    ON public.platform_commission_config FOR ALL
    TO authenticated
    USING (public.is_admin((select auth.uid())))
    WITH CHECK (public.is_admin((select auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
