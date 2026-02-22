// supabase/functions/send-booking-email/index.ts
// Supabase Edge Function to send booking confirmation emails via Brevo

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string;
  reg: string;
  date: string;
  slot: string;
  notes: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    // Fetch unsent booking emails
    const { data: emails, error: fetchError } = await supabase
      .from("booking_emails")
      .select("*, bookings(*)")
      .eq("sent", false)
      .limit(10);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    let sentCount = 0;
    let errorCount = 0;

    // Send email for each unsent booking
    for (const emailRecord of emails || []) {
      try {
        const booking = emailRecord.bookings as Booking;

        // Format the booking date nicely
        const bookingDate = new Date(booking.date).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Build email content
        const emailContent = `
Dear ${booking.name},

Thank you for booking a service with DeltaV Automotive!

**Booking Confirmation**
Reference: REF-${booking.id}
Date: ${bookingDate}
Service: ${booking.slot}
Vehicle: ${booking.reg}
Phone: ${booking.phone}

${booking.notes ? `Additional Notes: ${booking.notes}` : ""}

We'll contact you shortly to confirm the time slot and any details we need.

Best regards,
DeltaV Automotive Team
Smethwick, West Midlands
`;

        // Send via Brevo API
        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": BREVO_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: "DeltaV Automotive",
              email: "noreply@deltavautomotive.co.uk",
            },
            to: [
              {
                email: booking.email,
                name: booking.name,
              },
            ],
            subject: `Booking Confirmed - DeltaV Automotive (Ref: REF-${booking.id})`,
            htmlContent: `
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #60a5fa;">Booking Confirmation</h2>
      <p>Dear ${booking.name},</p>
      <p>Thank you for booking a service with <strong>DeltaV Automotive</strong>!</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Reference:</strong> REF-${booking.id}</p>
        <p><strong>Date:</strong> ${bookingDate}</p>
        <p><strong>Service:</strong> ${booking.slot}</p>
        <p><strong>Vehicle:</strong> ${booking.reg}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ""}
      </div>
      
      <p>We'll contact you shortly to confirm the time slot and any details we need.</p>
      
      <p>Best regards,<br>
      <strong>DeltaV Automotive Team</strong><br>
      Smethwick, West Midlands</p>
    </div>
  </body>
</html>
`,
            textContent: emailContent,
          }),
        });

        if (brevoResponse.ok) {
          // Mark as sent
          const { error: updateError } = await supabase
            .from("booking_emails")
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq("id", emailRecord.id);

          if (!updateError) {
            sentCount++;
          }
        } else {
          throw new Error(
            `Brevo API error: ${brevoResponse.status} ${brevoResponse.statusText}`
          );
        }
      } catch (emailError) {
        errorCount++;
        // Log error
        const { error: errorLogError } = await supabase
          .from("booking_emails")
          .update({ error: (emailError as Error).message })
          .eq("id", emailRecord.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${emails?.length || 0} emails. Sent: ${sentCount}, Errors: ${errorCount}`,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
