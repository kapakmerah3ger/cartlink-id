-- =====================================================
-- SQL RESTORE for cartlink.id
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vptsxtlceielmajlpyda/sql
-- =====================================================

-- Step 1: Drop existing Prisma tables (if any)
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "ProductType";
DROP TYPE IF EXISTS "OrderStatus";

-- Step 2: Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    description TEXT
);

-- Step 3: Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    original_price INTEGER,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    image TEXT,
    rating DECIMAL(2,1) DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    badge TEXT,
    featured BOOLEAN DEFAULT false,
    slug TEXT UNIQUE
);

-- Step 4: Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_info JSONB,
    items JSONB,
    total INTEGER,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Insert default categories
INSERT INTO categories (id, title, slug, icon, description) VALUES
    ('ebook', 'Ebook', 'ebook', '📚', 'Koleksi ebook digital berkualitas'),
    ('kelas', 'Kelas Digital', 'kelas-digital', '🎓', 'Kelas online dan kursus digital'),
    ('video', 'Video Animasi', 'video-animasi', '🎬', 'Video animasi dan konten multimedia'),
    ('template', 'Template', 'template', '📝', 'Template desain dan dokumen'),
    ('software', 'Software & Plugin', 'software-plugin', '💻', 'Software, tools, dan plugin'),
    ('audio', 'Audio & Musik', 'audio-musik', '🎵', 'Audio, musik, dan sound effect')
ON CONFLICT (id) DO NOTHING;

-- Step 6: Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for public read access
DROP POLICY IF EXISTS "Enable read access for all users on products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users on categories" ON categories;
DROP POLICY IF EXISTS "Enable all access for authenticated on products" ON products;
DROP POLICY IF EXISTS "Enable all access for authenticated on categories" ON categories;
DROP POLICY IF EXISTS "Enable all access for authenticated on orders" ON orders;

CREATE POLICY "Enable read access for all users on products" ON products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated on products" ON products FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated on orders" ON orders FOR ALL USING (true);

-- Done! Tables restored successfully.
