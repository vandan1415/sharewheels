-- Explicitly grant service_role read/write on server-only payment_gateway_config while keeping anon/authenticated revoked.

GRANT SELECT, INSERT, UPDATE ON TABLE public.payment_gateway_config TO service_role;
