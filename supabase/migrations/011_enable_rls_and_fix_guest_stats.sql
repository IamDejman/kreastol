-- Enable Row Level Security on all public tables.
-- No policies are created for anon, so direct PostgREST access with anon key sees no rows.
-- API routes use the service role key (which bypasses RLS) for all database access.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Recreate guest_stats with SECURITY INVOKER so it runs with the invoker's permissions
-- and does not bypass RLS (fixes security_definer_view linter finding).
DROP VIEW IF EXISTS guest_stats;
CREATE VIEW guest_stats WITH (security_invoker = true) AS
SELECT
  LOWER(guest_email) AS guest_email_key,
  guest_name,
  guest_email,
  guest_phone,
  COUNT(*)        AS total_bookings,
  SUM(nights)     AS total_nights,
  SUM(total_amount) AS total_revenue,
  MIN(check_in)   AS first_stay,
  MAX(check_out)  AS last_stay
FROM bookings
GROUP BY
  LOWER(guest_email),
  guest_name,
  guest_email,
  guest_phone;
