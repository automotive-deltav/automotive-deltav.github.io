-- supabase_booking_trigger.sql
-- Create trigger to send email when booking created

-- Create email queue table to track sent emails
CREATE TABLE IF NOT EXISTS booking_emails (
  id BIGSERIAL PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create function to handle new booking emails
CREATE OR REPLACE FUNCTION handle_booking_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a record into booking_emails table to mark for email sending
  INSERT INTO booking_emails (booking_id, customer_email, sent)
  VALUES (NEW.id, NEW.email, FALSE);
  
  -- Call the Supabase function to send email (it will pick up the record)
  -- This is called via HTTP webhook in the function itself
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS booking_email_trigger ON bookings;

-- Create trigger on bookings table
CREATE TRIGGER booking_email_trigger
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION handle_booking_email();

-- Create index for email queue
CREATE INDEX IF NOT EXISTS idx_booking_emails_sent ON booking_emails(sent);
CREATE INDEX IF NOT EXISTS idx_booking_emails_booking ON booking_emails(booking_id);
