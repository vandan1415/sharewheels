-- Fix is_privileged_backend() so SECURITY DEFINER trigger functions never mistake PostgREST authenticated callers for postgres.

CREATE OR REPLACE FUNCTION public.is_privileged_backend()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    OR (
      session_user IN ('postgres', 'supabase_admin')
      AND coalesce(current_setting('request.jwt.claims', true), '') = ''
    );
$$;
