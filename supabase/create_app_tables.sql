-- =====================================================
-- Create tables for app.cartlink.id
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vptsxtlceielmajlpyda/sql
-- =====================================================

-- WARNING: This creates NEW tables for app.cartlink.id
-- It does NOT affect the existing cartlink.id tables (products, categories, orders)

-- Create Enum Types (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductType') THEN
        CREATE TYPE "ProductType" AS ENUM ('DIGITAL', 'PHYSICAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
        CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');
    END IF;
END $$;

-- Create User table for app.cartlink.id merchants
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "midtransServerKey" TEXT,
    "midtransClientKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Create Product table for app.cartlink.id
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'DIGITAL',
    "slug" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Product
CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");
CREATE INDEX IF NOT EXISTS "Product_userId_idx" ON "Product"("userId");
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");

-- Create Order table for app.cartlink.id
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "snapToken" TEXT,
    "transactionId" TEXT,
    "totalPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Order
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderId_key" ON "Order"("orderId");
CREATE INDEX IF NOT EXISTS "Order_productId_idx" ON "Order"("productId");
CREATE INDEX IF NOT EXISTS "Order_orderId_idx" ON "Order"("orderId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");

-- Add Foreign Keys
ALTER TABLE "Product" 
    DROP CONSTRAINT IF EXISTS "Product_userId_fkey",
    ADD CONSTRAINT "Product_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" 
    DROP CONSTRAINT IF EXISTS "Order_productId_fkey",
    ADD CONSTRAINT "Order_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Product', 'Order');
