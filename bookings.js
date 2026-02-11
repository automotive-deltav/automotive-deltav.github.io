// CHECK AUTHENTICATION
if (sessionStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

function logout() {
  sessionStorage.removeItem("adminLoggedIn");
  window.location.href = "login.html";
}

const SUPABASE_URL = "https://cxzapvieqzqfxzolqwoh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";

const container = document.getElementById("bookingsContainer");
const loading = document.getElementById("loading");
const searchBar = document.getElementById("searchBar");
const modal = document.getElementById("inspectModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const confirmModal = document.getElementById("confirmModal");
const closeConfirmModal = document.getElementById("closeConfirmModal");

let bookingsData = [];
let currentBookingId = null;

// Fetch bookings
async function fetchBookings() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, {
      headers: { 
        "apikey": SUPABASE_KEY, 
        "Authorization": `Bearer ${SUPABASE_KEY}` 
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Supabase error:", errorText);
      loading.textContent = "Error: " + errorText;
      return;
    }
    
    bookingsData = await res.json();
    console.log("Fetched bookings:", bookingsData);
    renderBookings();
  } catch(err) { 
    console.error(err); 
    loading.textContent = "Error loading bookings: " + err.message; 
  }
}

// Render cards
function renderBookings() {
  container.innerHTML = "";
  loading.style.display = "none";
  
  const search = searchBar.value.toLowerCase();
  const filtered = bookingsData.filter(b => 
    b.name.toLowerCase().includes(search) ||
    b.email.toLowerCase().includes(search) ||
    b.reg.toLowerCase().includes(search)
  );
  
  // Sort by status (pending first) then by date
  filtered.sort((a,b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    return new Date(b.date) - new Date(a.date);
  });
  
  if(filtered.length === 0) { 
    container.innerHTML = "<p>No bookings found.</p>"; 
    return; 
  }
  
  filtered.forEach(b => {
    const card = document.createElement("div");
    card.classList.add("booking-card");
    
    const safeId = b.id;
    const isNew = !b.viewed;
    const newBadge = isNew ? '<span class="new-badge">NEW</span>' : '';
    
    const statusClass = b.status === 'confirmed' ? 'status-confirmed' : 'status-pending';
    const statusBadge = `<span class="status-badge ${statusClass}">${b.status.toUpperCase()}</span>`;
    
    const confirmedInfo = b.status === 'confirmed' && b.confirmed_date ? 
      `<p><strong>Scheduled:</strong> ${b.confirmed_date} at ${b.confirmed_time || 'TBD'}</p>` : '';
    
    card.innerHTML = `
      <p><strong>Name:</strong> ${b.name} ${newBadge}</p>
      <p><strong>Email:</strong> ${b.email}</p>
      <p><strong>Car Reg:</strong> ${b.reg}</p>
      <p><strong>Requested Date:</strong> ${b.date}</p>
      ${confirmedInfo}
      <p class="status"><strong>Status:</strong> ${statusBadge}</p>
      <div style="margin-top: 15px;">
        <button onclick="inspectBooking('${safeId}')">Inspect</button>
        ${b.status === 'pending' ? 
          `<button onclick="openConfirmModal('${safeId}')">Confirm Booking</button>` : 
          `<button onclick="toggleStatus('${safeId}', '${b.status}')">Mark Pending</button>`}
      </div>
    `;
    container.appendChild(card);
  });
}

// Inspect booking details and mark as viewed
async function inspectBooking(id) {
  const booking = bookingsData.find(b => b.id == id);
  if(!booking) return;
  
  // Mark as viewed if not already
  if (!booking.viewed) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({viewed: true})
      });
      booking.viewed = true;
      renderBookings();
    } catch(err) {
      console.error("Failed to mark as viewed:", err);
    }
  }
  
  modalBody.innerHTML = `
    <p><strong>Name:</strong> ${booking.name}</p>
    <p><strong>Email:</strong> ${booking.email}</p>
    <p><strong>Phone:</strong> ${booking.phone}</p>
    <p><strong>Car Registration:</strong> ${booking.reg}</p>
    <p><strong>Notes:</strong> ${booking.notes || 'N/A'}</p>
    <p><strong>Requested Date:</strong> ${booking.date}</p>
    ${booking.confirmed_date ? `<p><strong>Confirmed Date:</strong> ${booking.confirmed_date}</p>` : ''}
    ${booking.confirmed_time ? `<p><strong>Confirmed Time:</strong> ${booking.confirmed_time}</p>` : ''}
    <p><strong>Status:</strong> ${booking.status}</p>
  `;
  modal.style.display = "flex";
}

// Close modals
closeModal.onclick = () => { modal.style.display = "none"; }
closeConfirmModal.onclick = () => { confirmModal.style.display = "none"; }
window.onclick = e => { 
  if(e.target == modal) modal.style.display = "none";
  if(e.target == confirmModal) confirmModal.style.display = "none";
}

// Open confirm modal
function openConfirmModal(id) {
  currentBookingId = id;
  const booking = bookingsData.find(b => b.id == id);
  
  // Pre-fill with requested date
  document.getElementById('confirmDate').value = booking.date;
  document.getElementById('confirmTime').value = '09:00'; // Default time
  
  confirmModal.style.display = "flex";
}

// Save confirmation with date/time
async function saveConfirmation() {
  const confirmDate = document.getElementById('confirmDate').value;
  const confirmTime = document.getElementById('confirmTime').value;
  
  if (!confirmDate || !confirmTime) {
    alert('Please select both date and time');
    return;
  }
  
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${currentBookingId}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "confirmed",
        confirmed_date: confirmDate,
        confirmed_time: confirmTime
      })
    });
    
    // Update local data
    const booking = bookingsData.find(b => b.id == currentBookingId);
    if (booking) {
      booking.status = "confirmed";
      booking.confirmed_date = confirmDate;
      booking.confirmed_time = confirmTime;
    }
    
    confirmModal.style.display = "none";
    renderBookings();
    alert('Booking confirmed!');
    
  } catch(err) { 
    alert("Error confirming booking: " + err.message); 
  }
}

// Toggle booking status back to pending
async function toggleStatus(id, currentStatus) {
  const newStatus = 'pending';
  
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({status: newStatus})
    });
    
    // Update local data
    const booking = bookingsData.find(b => b.id == id);
    if (booking) booking.status = newStatus;
    
    renderBookings();
  } catch(err) { 
    alert("Error updating status: " + err.message); 
  }
}

// Search input
searchBar.addEventListener("input", renderBookings);

// Auto refresh every 5 seconds
setInterval(fetchBookings, 5000);

// Initial load
fetchBookings();
