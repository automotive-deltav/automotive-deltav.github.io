-- supabase_init.sql
-- Create core tables for DeltaV Automotive (Postgres / Supabase)

BEGIN;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  reg TEXT,
  phone TEXT,
  date DATE,
  slot TEXT,
  status TEXT DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  invoice_date DATE,
  car_reg TEXT,
  parts JSONB DEFAULT '[]'::jsonb,
  vat_applied BOOLEAN DEFAULT FALSE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  item_code TEXT,
  item_name TEXT,
  description TEXT,
  quantity INTEGER DEFAULT 0,
  unit_price NUMERIC(12,2) DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, sold, retired, damaged, returned
  purchase_date DATE,
  supplier TEXT,
  serial_number TEXT,
  car_reg TEXT,
  vin_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE DEFAULT now(),
  method TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  quote_date DATE,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assignee BIGINT REFERENCES workers(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  subject TEXT,
  body TEXT,
  sender TEXT,
  recipients TEXT[],
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  vehicle_reg TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_reg ON inventory(car_reg);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- Add missing columns to bookings if they don't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing columns to inventory if they don't exist
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS car_reg TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS vin_number TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS item_code TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS cost NUMERIC(12,2) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;

-- Now create the indexes after columns exist
CREATE INDEX IF NOT EXISTS idx_inventory_vin ON inventory(vin_number);

COMMIT;
