# Booking Email System Setup Guide

## Overview
This system automatically sends booking confirmation emails when customers submit the booking form. It uses Supabase Edge Functions + Brevo SMTP API.

## Setup Steps

### 1. **Deploy the SQL Trigger** (One-time)
Run the contents of `supabase_booking_trigger.sql` in your Supabase SQL Editor:
- Go to https://supabase.com → Your Project → SQL Editor
- Create new query
- Copy & paste the contents of `supabase_booking_trigger.sql`
- Run it

This creates:
- `booking_emails` table (tracks email sending status)
- `handle_booking_email()` function (triggers on new bookings)
- `booking_email_trigger` trigger (fires automatically)

### 2. **Deploy the Edge Function** (One-time)
Deploy the `supabase_send_booking_email.ts` file to Supabase Functions:

**Option A: Via Supabase CLI**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase@latest

# Link your project
supabase link --project-ref <your-project-ref>

# Create functions directory if it doesn't exist
mkdir -p supabase/functions/send-booking-email

# Copy the function file
cp supabase_send_booking_email.ts supabase/functions/send-booking-email/index.ts

# Deploy
supabase functions deploy send-booking-email --no-verify

# Set environment variables in Supabase Dashboard:
# - Go to Project Settings → Functions
# - Add secrets: BREVO_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
```

**Option B: Via Supabase Dashboard**
- Create new Function at https://supabase.com → Project → Edge Functions
- Name: `send-booking-email`
- Copy the TypeScript code from `supabase_send_booking_email.ts`
- Click Deploy
- Add secrets in Project Settings → Functions

### 3. **Get Brevo API Key** (One-time)
- Sign up at https://www.brevo.com (free tier available)
- Go to Settings → API keys → Create new API key
- Copy the API key
- Set it as `BREVO_API_KEY` secret in Supabase

### 4. **Set Up Automated Sending** (Choose one option)

**Option A: Cron Job (Recommended)**
Run `supabase_cron_setup.sql` queries to set up pg_cron:
- Contact Supabase support to enable `pg_cron` extension
- Once enabled, run the cron setup SQL
- This will call the email function every 5 minutes automatically

**Option B: Manual Webhook Trigger**
Call the Edge Function from a scheduler (Zapier, Make, AWS Lambda, etc.):
```bash
POST https://<your-project>.supabase.co/functions/v1/send-booking-email
Headers:
  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
  Content-Type: application/json
```

**Option C: Call from Admin Dashboard**
Add a button in admin dashboard to manually send pending emails:
```javascript
async function sendPendingEmails() {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/send-booking-email`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const result = await response.json();
  console.log(result);
}
```

## How It Works

1. **Customer submits booking** → booking saved to `bookings` table
2. **Database trigger fires** → inserts record into `booking_emails` table
3. **Cron job runs** (every 5 min) → calls Edge Function
4. **Edge Function** → reads `booking_emails`, sends via Brevo API, marks as sent
5. **Customer receives email** with booking details

## Monitoring

Check email sending status in Supabase:
```sql
-- View all booking emails
SELECT * FROM booking_emails ORDER BY created_at DESC;

-- View unsent emails
SELECT * FROM booking_emails WHERE sent = FALSE;

-- View emails with errors
SELECT * FROM booking_emails WHERE error IS NOT NULL;
```

## Troubleshooting

**Emails not sending?**
- Check `booking_emails` table - are rows being created?
- Verify Brevo API key is set correctly
- Check Edge Function logs in Supabase Dashboard
- Test Brevo API key: `curl -X GET https://api.brevo.com/v3/account -H "api-key: YOUR_KEY"`

**Sent but not arriving?**
- Check Brevo email logs at brevo.com
- Verify email address is not caught by spam filter
- Check that "From" address is authorized for Brevo account

## Future Improvements

- Add email templates for better styling
- Add SMS notifications as alternative/backup
- Add email retry logic for failed sends
- Add customer dashboard to track booking status
- Add admin notification emails (to you) when booking received
