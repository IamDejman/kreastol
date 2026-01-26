-- Disable Row Level Security for public access
-- Note: In production, you should enable RLS and create proper policies

-- Allow public access to bookings table (for this demo app)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Allow public access to users table (for authentication)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to enable RLS with permissive policies instead:
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON bookings FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON bookings FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update" ON bookings FOR UPDATE USING (true);
--
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);
