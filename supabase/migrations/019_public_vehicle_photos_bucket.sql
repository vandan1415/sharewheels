-- Public read-only Storage bucket for verified marketplace vehicle photographs
-- Writes are restricted strictly to trusted service_role Edge Functions upon Admin vehicle approval.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-vehicle-photos',
  'public-vehicle-photos',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read approved vehicle photos"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'public-vehicle-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
