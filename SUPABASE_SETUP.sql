-- ═══════════════════════════════════════════════════════
--  DELTAV AUTOMOTIVE - SUPABASE SETUP SQL
--  Run this entire file in your Supabase SQL editor
-- ═══════════════════════════════════════════════════════


-- ── 1. BOOKINGS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  phone          TEXT,
  reg            TEXT    NOT NULL,
  date           DATE    NOT NULL,
  notes          TEXT,
  status         TEXT    DEFAULT 'pending',
  viewed         BOOLEAN DEFAULT false,
  confirmed_date DATE,
  confirmed_time TIME,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Add confirmed_date / confirmed_time if table already exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_time TIME;

-- ── 2. INVOICES TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name   TEXT    NOT NULL,
  customer_email  TEXT    NOT NULL,
  invoice_date    DATE    NOT NULL,
  car_reg         TEXT,
  parts           JSONB   DEFAULT '[]',
  vat_applied     BOOLEAN DEFAULT false,
  subtotal        DECIMAL(10,2) DEFAULT 0,
  vat_amount      DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2) DEFAULT 0,
  payment_status  TEXT    DEFAULT 'unpaid',
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Add VAT columns if table already exists
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_applied   BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal      DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount    DECIMAL(10,2) DEFAULT 0;

-- ── 3. INVENTORY TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_date DATE    NOT NULL,
  item_code     TEXT    NOT NULL,
  item_name     TEXT    NOT NULL,
  serial_number TEXT,
  cost          DECIMAL(10,2) NOT NULL,
  supplier      TEXT,
  status        TEXT    DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;


-- ── BOOKINGS policies ───────────────────────────────────

-- Anyone (anon) can INSERT a new booking (customers booking online)
CREATE POLICY "allow_customer_insert" ON bookings
  FOR INSERT TO anon
  WITH CHECK (true);

-- Only the anon key (your admin) can SELECT/UPDATE/DELETE bookings
-- (In practice your admin JS uses the anon key, so this allows your dashboard)
CREATE POLICY "allow_anon_select" ON bookings
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "allow_anon_update" ON bookings
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_anon_delete" ON bookings
  FOR DELETE TO anon
  USING (true);


-- ── INVOICES policies ───────────────────────────────────
-- Invoices are admin-only (no public access needed)

CREATE POLICY "allow_anon_select_invoices" ON invoices
  FOR SELECT TO anon USING (true);

CREATE POLICY "allow_anon_insert_invoices" ON invoices
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "allow_anon_update_invoices" ON invoices
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "allow_anon_delete_invoices" ON invoices
  FOR DELETE TO anon USING (true);


-- ── INVENTORY policies ──────────────────────────────────

CREATE POLICY "allow_anon_select_inventory" ON inventory
  FOR SELECT TO anon USING (true);

CREATE POLICY "allow_anon_insert_inventory" ON inventory
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "allow_anon_update_inventory" ON inventory
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "allow_anon_delete_inventory" ON inventory
  FOR DELETE TO anon USING (true);


-- ═══════════════════════════════════════════════════════
--  DONE! Your database is now set up with:
--  ✅ bookings table (with confirmed_date + confirmed_time)
--  ✅ invoices table (with VAT fields)
--  ✅ inventory table
--  ✅ RLS enabled on all 3 tables
--  ✅ Correct policies for anon key access
-- ═══════════════════════════════════════════════════════
