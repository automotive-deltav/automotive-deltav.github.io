-- Create company_settings table in Supabase
-- Run this SQL in your Supabase dashboard (SQL Editor) to create the table

CREATE TABLE IF NOT EXISTS company_settings (
  id INT PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'DeltaV Automotive',
  phone TEXT DEFAULT '0121 XXX XXXX',
  email TEXT DEFAULT 'info@deltavautomotive.co.uk',
  address TEXT DEFAULT 'Unit 5, Industrial Estate
Smethwick, West Midlands, B66 2XX',
  vat TEXT DEFAULT 'GB XXX XXXX XX',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Public can READ company settings (for displaying on website)
CREATE POLICY "public_read_settings"
  ON company_settings FOR SELECT
  USING (true);

-- Only admins (with special token) can UPDATE
CREATE POLICY "admin_update_settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default row
INSERT INTO company_settings (id, name, phone, email, address, vat)
VALUES (
  1,
  'DeltaV Automotive',
  '0121 XXX XXXX',
  'info@deltavautomotive.co.uk',
  'Unit 5, Industrial Estate
Smethwick, West Midlands, B66 2XX',
  'GB XXX XXXX XX'
)
ON CONFLICT (id) DO NOTHING;
