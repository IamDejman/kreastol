-- Ensure all existing blocked rooms have a non-null reason
UPDATE blocked_rooms
SET reason = 'Maintenance'
WHERE reason IS NULL;

-- Make reason column required
ALTER TABLE blocked_rooms
  ALTER COLUMN reason SET NOT NULL;

