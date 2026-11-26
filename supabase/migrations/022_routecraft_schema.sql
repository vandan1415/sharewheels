-- SHAREWHEELS ROUTECRAFT: Saved Journeys & Customer Itineraries with Strict RLS

CREATE TABLE IF NOT EXISTS public.saved_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  is_shared boolean NOT NULL DEFAULT false,
  title text NOT NULL,
  origin_label text NOT NULL,
  origin_lat double precision,
  origin_lng double precision,
  origin_place_id text,
  destination_label text NOT NULL,
  destination_lat double precision,
  destination_lng double precision,
  destination_place_id text,
  stops jsonb NOT NULL DEFAULT '[]'::jsonb,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_slug text,
  departure_date date,
  return_date date,
  departure_time text NOT NULL DEFAULT '07:00',
  passengers integer NOT NULL DEFAULT 2 CHECK (passengers >= 1 AND passengers <= 20),
  preferences text[] NOT NULL DEFAULT ARRAY[]::text[],
  max_budget_inr integer,
  route_preference text NOT NULL DEFAULT 'fastest',
  distance_km numeric(10,2),
  duration_minutes integer,
  route_summary text,
  budget_assumptions jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_journeys_user_updated
  ON public.saved_journeys (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_journeys_share_token
  ON public.saved_journeys (share_token)
  WHERE is_shared = true;

ALTER TABLE public.saved_journeys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users select own saved journeys"
    ON public.saved_journeys
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read shared journeys"
    ON public.saved_journeys
    FOR SELECT
    TO anon, authenticated
    USING (is_shared = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own saved journeys"
    ON public.saved_journeys
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own saved journeys"
    ON public.saved_journeys
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users delete own saved journeys"
    ON public.saved_journeys
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
