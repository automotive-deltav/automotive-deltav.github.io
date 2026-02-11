// --- SUPABASE CONFIG ---
const SUPABASE_URL = "https://cxzapvieqzqfxzolqwoh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";

// EmailJS Configuration
const EMAIL_SERVICE = "service_hi4mpao";
const EMAIL_TEMPLATE = "template_aj5l14u";
const EMAIL_PUBLIC = "R2O3dhHwzD8kLNqo3";

// Initialize EmailJS
emailjs.init(EMAIL_PUBLIC);

// ---------------------
const form = document.getElementById("bookingForm");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const customer_name = document.getElementById("name").value.trim();
  const customer_email = document.getElementById("email").value.trim();
  const customer_phone = document.getElementById("phone").value.trim();
  const reg_number = document.getElementById("reg").value.trim();
  const reason = document.getElementById("reason").value.trim();
  const preferred_date = document.getElementById("date").value;
  
  const data = {
    customer_name,
    customer_email,
    customer_phone,
    reg_number,
    reason,
    preferred_date,
    status: "pending"
  };
  
  try {
    // --- SAVE TO SUPABASE ---
    const response = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      // --- SEND EMAIL ---
      emailjs.send(EMAIL_SERVICE, EMAIL_TEMPLATE, {
        customer_name,
        customer_email,
        reg_number,
        preferred_date
      })
      .then(() => {
        status.textContent = "Booking submitted! Confirmation email sent.";
        form.reset();
      }, (err) => {
        status.textContent = "Booking saved but email failed: " + err.text;
      });
    } else {
      status.textContent = "Something went wrong. Please try again.";
    }
  } catch (err) {
    status.textContent = "Error: " + err.message;
  }
});
