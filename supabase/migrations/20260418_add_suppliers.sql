-- 1. Create Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, name)
);

-- 2. Add supplier_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- 3. Initial Migration: Move existing supplier names to the new table
-- Run this once to populate the new table with current names
INSERT INTO suppliers (store_id, name, notes)
SELECT DISTINCT store_id, supplier_name, 'Initial migration from products table'
FROM products
WHERE supplier_name IS NOT NULL
ON CONFLICT (store_id, name) DO NOTHING;

-- 4. Update products to link to the new suppliers
-- This links existing products to their corresponding record in the new table
UPDATE products p
SET supplier_id = s.id
FROM suppliers s
WHERE p.supplier_name = s.name AND p.store_id = s.store_id;
