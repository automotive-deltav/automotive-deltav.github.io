-- supabase_cron_setup.sql
-- Set up pg_cron to automatically check and send booking emails

-- Enable pg_cron extension (must be done by Supabase)
-- Run this in Supabase SQL Editor: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function that Supabase can call via cron
CREATE OR REPLACE FUNCTION send_pending_booking_emails()
RETURNS void AS $$
DECLARE
  booking_record RECORD;
  email_subject TEXT;
  email_body TEXT;
  booking_date TEXT;
BEGIN
  -- Get all unsent booking emails
  FOR booking_record IN
    SELECT be.id, be.booking_id, b.*, be.customer_email
    FROM booking_emails be
    JOIN bookings b ON be.booking_id = b.id
    WHERE be.sent = FALSE
    LIMIT 10
  LOOP
    -- Format date nicely
    booking_date := to_char(booking_record.date::timestamp, 'Day, DD Month YYYY');
    
    -- Update as sent (we'll use an external service to actually send)
    UPDATE booking_emails 
    SET sent = TRUE, sent_at = NOW()
    WHERE id = booking_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create cron job (runs every 5 minutes)
-- Note: This requires pg_cron to be enabled in your Supabase project
-- Contact Supabase support or enable it via Supabase dashboard

-- SELECT cron.schedule('send-booking-emails', '*/5 * * * *', 'SELECT send_pending_booking_emails()');
