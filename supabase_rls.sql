-- supabase_rls.sql
-- Row Level Security (RLS) Policies for DeltaV Automotive
-- Run these commands in Supabase SQL Editor to enable RLS and policies

-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- For now, default public access policy (if users table is not implemented):
-- Users with JWT token can access all data. When you add user auth:
-- Replace these with policies that check auth.uid() or user roles.

-- BOOKINGS: Allow all authenticated users to read, admin to create/update
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE USING (true);

CREATE POLICY "bookings_delete" ON bookings
  FOR DELETE USING (true);

-- INVOICES: Allow read/write with basic auth
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (true);

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (true);

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (true);

-- INVENTORY: Similar public access
CREATE POLICY "inventory_select" ON inventory
  FOR SELECT USING (true);

CREATE POLICY "inventory_insert" ON inventory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "inventory_update" ON inventory
  FOR UPDATE USING (true);

CREATE POLICY "inventory_delete" ON inventory
  FOR DELETE USING (true);

-- PAYMENTS: Allow read/write
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (true);

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (true);

CREATE POLICY "payments_delete" ON payments
  FOR DELETE USING (true);

-- WORKERS: Allow read/write
CREATE POLICY "workers_select" ON workers
  FOR SELECT USING (true);

CREATE POLICY "workers_insert" ON workers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "workers_update" ON workers
  FOR UPDATE USING (true);

CREATE POLICY "workers_delete" ON workers
  FOR DELETE USING (true);

-- SUPPLIERS: Allow read/write
CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT USING (true);

CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE USING (true);

CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE USING (true);

-- QUOTES: Allow read/write
CREATE POLICY "quotes_select" ON quotes
  FOR SELECT USING (true);

CREATE POLICY "quotes_insert" ON quotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "quotes_update" ON quotes
  FOR UPDATE USING (true);

CREATE POLICY "quotes_delete" ON quotes
  FOR DELETE USING (true);

-- TASKS: Allow read/write
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (true);

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (true);

-- MESSAGES: Allow read/write
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (true);

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (true);

CREATE POLICY "messages_delete" ON messages
  FOR DELETE USING (true);

-- NOTE: These policies currently allow public access.
-- When user authentication is implemented:
-- 1. Create a users table with auth.uid() reference
-- 2. Add role columns (admin, staff, customer)
-- 3. Update policies to check: 
--    - Admins can do all operations
--    - Staff can update/read bookings, invoices, inventory
--    - Customers can only read their own bookings/invoices (via customer_email filter)

-- Example of stricter policy for future use:
-- CREATE POLICY "bookings_customer_view" ON bookings
--   FOR SELECT USING (email = auth.email());
