-- =====================================================
-- FIX RLS POLICIES for cartlink.id
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vptsxtlceielmajlpyda/sql
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Enable read access for all users on products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users on categories" ON categories;
DROP POLICY IF EXISTS "Enable all access for authenticated on products" ON products;
DROP POLICY IF EXISTS "Enable all access for authenticated on categories" ON categories;
DROP POLICY IF EXISTS "Enable all access for authenticated on orders" ON orders;
DROP POLICY IF EXISTS "Allow public read on products" ON products;
DROP POLICY IF EXISTS "Allow public read on categories" ON categories;
DROP POLICY IF EXISTS "Allow all on products" ON products;
DROP POLICY IF EXISTS "Allow all on categories" ON categories;
DROP POLICY IF EXISTS "Allow all on orders" ON orders;

-- Disable RLS temporarily to ensure access
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Re-enable with proper policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for ANON role (public access)
CREATE POLICY "Allow public read on products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on categories" ON categories FOR SELECT TO anon USING (true);

-- Create policies for authenticated users (full access)
CREATE POLICY "Allow all on products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anon to insert orders (for checkout)
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT TO anon USING (true);

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT, INSERT ON orders TO anon;
GRANT ALL ON products TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON orders TO authenticated;

-- Grant sequence permissions for auto-increment
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'RLS policies fixed successfully!' as status;
