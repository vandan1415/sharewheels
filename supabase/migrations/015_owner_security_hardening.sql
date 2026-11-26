-- Fix function search_path warning and tighten SECURITY DEFINER trigger execution privileges.

CREATE OR REPLACE FUNCTION public.is_privileged_backend()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

REVOKE EXECUTE ON FUNCTION public.audit_owner_profile_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_vehicle_submission_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_owner_document_mutations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_owner_profile_mutations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_vehicle_document_mutations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_vehicle_owner_mutations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_vehicle_submission_mutations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_vehicle_reverification_on_doc() FROM PUBLIC, anon, authenticated;
