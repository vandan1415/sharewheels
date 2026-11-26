-- Grant table privileges so RLS policies govern anon shared reads and authenticated owner CRUD
GRANT SELECT ON public.saved_journeys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_journeys TO authenticated;
