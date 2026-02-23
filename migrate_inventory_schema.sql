-- Migration: Add missing columns to inventory table
-- Run this if inventory table exists but is missing category and other columns

-- Drop existing tables if you want to start fresh (WARNING: deletes all data)
-- DROP TABLE IF EXISTS inventory_transactions CASCADE;
-- DROP TABLE IF EXISTS inventory CASCADE;

-- Add missing columns if they don't exist
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS sell_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create inventory_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add', 'deduct', 'return', 'adjust')),
  quantity_changed INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_transactions_inventory ON inventory_transactions(inventory_id);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to view and edit inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to view and log transactions" ON inventory_transactions;

CREATE POLICY "Allow authenticated users to view and edit inventory"
ON inventory FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view and log transactions"
ON inventory_transactions FOR ALL USING (true) WITH CHECK (true);
