-- Add payment_method column to bookings for tracking how guests paid
-- and make it configurable via database constraints.

-- 1) Add the new column if it doesn't exist
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2) Backfill existing rows with a sensible default
UPDATE bookings
SET payment_method = COALESCE(payment_method, 'transfer');

-- 3) Ensure only allowed payment methods are used
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('card', 'transfer'));

-- 4) Set a default payment method for new bookings
ALTER TABLE bookings
  ALTER COLUMN payment_method SET DEFAULT 'transfer';

