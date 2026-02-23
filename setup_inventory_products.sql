-- Create inventory products table for DeltaV
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL UNIQUE,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  purchase_date DATE,
  supplier TEXT,
  cost_price NUMERIC(10,2) NOT NULL,
  sell_price NUMERIC(10,2) NOT NULL,
  serial_number TEXT,
  car_reg TEXT,
  vin_number TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory transaction log (for tracking deductions)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add', 'deduct', 'return', 'adjust')),
  quantity_changed INTEGER NOT NULL,
  reference_type TEXT, -- 'invoice', 'finance', 'manual'
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Enable RLS if needed
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for inventory (allow all authenticated users)
CREATE POLICY "Allow authenticated users to view and edit inventory"
ON inventory
FOR ALL
USING (true)
WITH CHECK (true);

-- Create RLS policy for transactions
CREATE POLICY "Allow authenticated users to view and log transactions"
ON inventory_transactions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_transactions_inventory ON inventory_transactions(inventory_id);
