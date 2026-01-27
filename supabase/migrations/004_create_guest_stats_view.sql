-- Create a view that aggregates bookings per guest
-- This mirrors the "Guests" owner dashboard in the app.

CREATE OR REPLACE VIEW guest_stats AS
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

