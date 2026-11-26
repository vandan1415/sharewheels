-- Razorpay 50% Advance Booking Columns & Server-Only Payment Gateway Config

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS advance_paid_paise bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due_paise bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS razorpay_signature text,
  ADD COLUMN IF NOT EXISTS razorpay_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id
  ON public.bookings (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- Server-only gateway secrets table (never readable by anon or authenticated roles)
CREATE TABLE IF NOT EXISTS public.payment_gateway_config (
  provider text PRIMARY KEY,
  mode text NOT NULL DEFAULT 'test',
  key_id text NOT NULL,
  key_secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateway_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.payment_gateway_config FROM PUBLIC, anon, authenticated;
