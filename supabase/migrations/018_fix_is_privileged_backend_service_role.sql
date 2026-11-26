-- Fix is_privileged_backend() to use auth.role() (which reads both request.jwt.claims JSON in PostgREST v12+ and legacy request.jwt.claim.role).
-- Keeps ordinary authenticated/anon callers blocked from self-verification while allowing service_role Edge Functions (admin-portal-api) to perform moderation updates.

CREATE OR REPLACE FUNCTION public.is_privileged_backend()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    coalesce(auth.role(), '') = 'service_role'
    OR (
      session_user IN ('postgres', 'supabase_admin')
      AND coalesce(current_setting('request.jwt.claims', true), '') = ''
    );
$$;
