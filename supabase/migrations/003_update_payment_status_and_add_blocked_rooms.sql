-- First, update existing payment_status values to match new schema
-- Map 'confirmed' to 'paid' and 'cancelled' to 'unpaid'
UPDATE bookings 
SET payment_status = CASE 
  WHEN payment_status = 'confirmed' THEN 'paid'
  WHEN payment_status = 'cancelled' THEN 'unpaid'
  ELSE 'unpaid'  -- Default any other unexpected values to 'unpaid'
END
WHERE payment_status NOT IN ('paid', 'credit', 'unpaid');

-- Now update payment_status constraint to support new values
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE bookings 
  ADD CONSTRAINT bookings_payment_status_check 
  CHECK (payment_status IN ('paid', 'credit', 'unpaid'));

-- Update default payment status
ALTER TABLE bookings 
  ALTER COLUMN payment_status SET DEFAULT 'unpaid';

-- Create blocked_rooms table for room maintenance/repairs
CREATE TABLE IF NOT EXISTS blocked_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number INTEGER NOT NULL CHECK (room_number >= 1 AND room_number <= 4),
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_number, blocked_date)
);

-- Create indexes for blocked_rooms
CREATE INDEX IF NOT EXISTS blocked_rooms_room_number_idx ON blocked_rooms(room_number);
CREATE INDEX IF NOT EXISTS blocked_rooms_blocked_date_idx ON blocked_rooms(blocked_date);

-- Create trigger to automatically update updated_at for blocked_rooms
CREATE TRIGGER update_blocked_rooms_updated_at
  BEFORE UPDATE ON blocked_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
