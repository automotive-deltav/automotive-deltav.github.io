// Auth check
if (sessionStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

const SUPABASE_URL = "https://cxzapvieqzqfxzolqwoh.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";

const container  = document.getElementById("bookingsContainer");
const loading    = document.getElementById("loading");
const searchBar  = document.getElementById("searchBar");

let bookingsData       = [];
let currentBookingId   = null;
let currentConfirmId   = null;

// ── Modal helpers ─────────────────────────────────────
function showInspectModal()  { document.getElementById("inspectModal").classList.add("show"); }
function hideInspectModal()  { document.getElementById("inspectModal").classList.remove("show"); }
function showConfirmModal()  { document.getElementById("confirmModal").classList.add("show"); }
function hideConfirmModal()  { document.getElementById("confirmModal").classList.remove("show"); }
function showDeleteModal()   { document.getElementById("deleteModal").classList.add("show"); }
function hideDeleteModal()   { document.getElementById("deleteModal").classList.remove("show"); }
function showLogoutModal()   { document.getElementById("logoutModal").classList.add("show"); }
function hideLogoutModal()   { document.getElementById("logoutModal").classList.remove("show"); }

function confirmLogout() {
  sessionStorage.removeItem("adminLoggedIn");
  window.location.href = "index.html";
}

// ── Fetch bookings ─────────────────────────────────────
async function fetchBookings() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, {
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
    });
    if (!res.ok) {
      const text = await res.text();
      loading.textContent = "Error loading bookings: " + text;
      return;
    }
    bookingsData = await res.json();
    renderBookings();
  } catch (err) {
    loading.textContent = "Network error: " + err.message;
  }
}

// ── Render booking cards ───────────────────────────────
function renderBookings() {
  container.innerHTML = "";
  loading.style.display = "none";

  const q = searchBar.value.toLowerCase();
  const filtered = bookingsData.filter(b =>
    (b.name  || "").toLowerCase().includes(q) ||
    (b.email || "").toLowerCase().includes(q) ||
    (b.reg   || "").toLowerCase().includes(q)
  );

  filtered.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return new Date(b.date) - new Date(a.date);
  });

  if (filtered.length === 0) {
    container.innerHTML = "<p style='text-align:center;color:#999;padding:60px;grid-column:1/-1;'>No bookings found.</p>";
    return;
  }

  filtered.forEach(b => {
    const card = document.createElement("div");
    card.className = "booking-card";

    const isNew       = !b.viewed;
    const newBadge    = isNew ? '<span class="new-badge">NEW</span>' : "";
    const statusClass = b.status === "confirmed" ? "status-confirmed" : "status-pending";

    // Confirmed appointment row (only if admin has set one)
    let confirmedRow = "";
    if (b.confirmed_date && b.confirmed_time) {
      confirmedRow = `
        <div class="card-row confirmed-appt">
          <span class="lbl">📅 Appt:</span>
          ${b.confirmed_date} at ${b.confirmed_time}
        </div>`;
    }

    // Which action button to show
    const actionBtn = b.status === "confirmed"
      ? `<button class="btn-pending" onclick="markPending('${b.id}')">Mark Pending</button>`
      : `<button class="btn-confirm" onclick="openConfirmModal('${b.id}')">Confirm</button>`;

    card.innerHTML = `
      <div class="card-header">
        <span class="customer-name">${b.name}${newBadge}</span>
        <span class="reg-plate">${b.reg}</span>
      </div>
      <div class="card-body">
        <div class="card-row">
          <span class="lbl">📧</span> ${b.email}
        </div>
        <div class="card-row">
          <span class="lbl">📞</span> ${b.phone || "—"}
        </div>
        <div class="card-row pref-date">
          <span class="lbl">Preferred:</span> ${b.date} (customer's request)
        </div>
        ${confirmedRow}
        <div class="card-row">
          <span class="lbl">Status:</span>
          <span class="status-badge ${statusClass}">${b.status.toUpperCase()}</span>
        </div>
        ${b.notes ? `<div class="card-row" style="border-left-color:#aab0b8;"><span class="lbl">Notes:</span> ${b.notes}</div>` : ""}
      </div>
      <div class="card-footer">
        <button class="btn-inspect" onclick="inspectBooking('${b.id}')">Inspect</button>
        ${actionBtn}
        <button class="btn-delete" onclick="deleteBooking('${b.id}')">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── Inspect ────────────────────────────────────────────
async function inspectBooking(id) {
  const b = bookingsData.find(x => x.id == id);
  if (!b) return;

  if (!b.viewed) {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
      method: "PATCH",
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ viewed: true })
    });
    b.viewed = true;
    renderBookings();
  }

  document.getElementById("inspectBody").innerHTML = `
    <div class="detail-row"><span class="lbl">Name:</span> ${b.name}</div>
    <div class="detail-row"><span class="lbl">Email:</span> ${b.email}</div>
    <div class="detail-row"><span class="lbl">Phone:</span> ${b.phone || "—"}</div>
    <div class="detail-row"><span class="lbl">Reg:</span> ${b.reg}</div>
    <div class="detail-row"><span class="lbl">Preferred Date:</span> ${b.date}</div>
    ${b.confirmed_date ? `<div class="detail-row" style="background:#eafaf1;"><span class="lbl">✅ Confirmed:</span> ${b.confirmed_date} at ${b.confirmed_time}</div>` : ""}
    <div class="detail-row"><span class="lbl">Status:</span> ${b.status}</div>
    ${b.notes ? `<div class="detail-row"><span class="lbl">Notes:</span> ${b.notes}</div>` : ""}
  `;
  showInspectModal();
}

// ── Confirm modal (admin picks date & time) ────────────
function openConfirmModal(id) {
  const b = bookingsData.find(x => x.id == id);
  if (!b) return;
  currentConfirmId = id;

  // Show the customer's preferred date for reference
  document.getElementById("preferredDateText").textContent = b.date;

  // Pre-fill with preferred date as a convenience starting point
  document.getElementById("confirmDate").value = b.confirmed_date || b.date;
  document.getElementById("confirmTime").value = b.confirmed_time || "09:00";

  showConfirmModal();
}

async function submitConfirm() {
  const date = document.getElementById("confirmDate").value;
  const time = document.getElementById("confirmTime").value;

  if (!date || !time) {
    document.getElementById("confirmDate").style.borderColor = "red";
    document.getElementById("confirmTime").style.borderColor = "red";
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${currentConfirmId}`, {
      method: "PATCH",
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed", confirmed_date: date, confirmed_time: time })
    });
    if (!res.ok) throw new Error(await res.text());

    const b = bookingsData.find(x => x.id == currentConfirmId);
    if (b) { b.status = "confirmed"; b.confirmed_date = date; b.confirmed_time = time; }

    renderBookings();
    hideConfirmModal();
  } catch (err) {
    console.error("Confirm error:", err);
  }
}

// ── Mark as pending ────────────────────────────────────
async function markPending(id) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
      method: "PATCH",
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending", confirmed_date: null, confirmed_time: null })
    });
    const b = bookingsData.find(x => x.id == id);
    if (b) { b.status = "pending"; b.confirmed_date = null; b.confirmed_time = null; }
    renderBookings();
  } catch (err) { console.error(err); }
}

// ── Delete ─────────────────────────────────────────────
function deleteBooking(id) {
  currentBookingId = id;
  showDeleteModal();
}

async function confirmDelete() {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${currentBookingId}`, {
      method: "DELETE",
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
    });
    bookingsData = bookingsData.filter(b => b.id != currentBookingId);
    renderBookings();
    hideDeleteModal();
  } catch (err) { console.error(err); }
}

searchBar.addEventListener("input", renderBookings);
setInterval(fetchBookings, 15000);
fetchBookings();
