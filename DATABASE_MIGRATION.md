# DATABASE UPDATE REQUIRED

You need to add these new columns to your Supabase `bookings` table:

## New Columns to Add:

1. **confirmed_date** (type: date, nullable: true)
   - Stores the actual confirmed date for the booking

2. **confirmed_time** (type: text, nullable: true)
   - Stores the confirmed time (e.g., "09:30", "14:00")

3. **viewed** (type: bool, default: false)
   - Tracks if admin has viewed the booking (for NEW badge)

## How to Add in Supabase:

1. Go to your Supabase dashboard
2. Click on "Table Editor" → select "bookings" table
3. Click "Add Column" for each:
   
   **Column 1:**
   - Name: `confirmed_date`
   - Type: `date`
   - Allow nullable: ✓ YES
   
   **Column 2:**
   - Name: `confirmed_time`
   - Type: `text`
   - Allow nullable: ✓ YES
   
   **Column 3:**
   - Name: `viewed`
   - Type: `bool`
   - Default value: `false`
   - Allow nullable: ✗ NO

4. Save changes

## Your Complete Table Schema Should Be:

- id (uuid, auto-generated)
- created_at (timestamp, auto-generated)
- name (text)
- email (text)
- phone (text)
- reg (text)
- date (date) - customer's requested date
- notes (text, nullable)
- status (text) - "pending" or "confirmed"
- viewed (bool, default: false)
- confirmed_date (date, nullable) - admin's confirmed date
- confirmed_time (text, nullable) - admin's confirmed time

Once you add these columns, everything will work perfectly!
