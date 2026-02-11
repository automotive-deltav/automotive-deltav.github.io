// Auth check
if (sessionStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

const SUPABASE_URL = "https://cxzapvieqzqfxzolqwoh.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";

let invoices         = [];
let currentInvoiceId = null;
let editMode         = false;

// ── Modal helpers ──────────────────────────────────────
function showNewInvoiceModal() {
  editMode         = false;
  currentInvoiceId = null;
  document.getElementById("modalTitle").textContent = "✨ New Invoice";
  clearForm();
  addPartRow();
  document.getElementById("invoiceModal").classList.add("show");
}

function hideInvoiceModal() { document.getElementById("invoiceModal").classList.remove("show"); }
function showDeleteModal()  { document.getElementById("deleteModal").classList.add("show"); }
function hideDeleteModal()  { document.getElementById("deleteModal").classList.remove("show"); }
function showLogoutModal()  { document.getElementById("logoutModal").classList.add("show"); }
function hideLogoutModal()  { document.getElementById("logoutModal").classList.remove("show"); }
function confirmLogout() { sessionStorage.removeItem("adminLoggedIn"); window.location.href = "index.html"; }

// ── Clear form ─────────────────────────────────────────
function clearForm() {
  document.getElementById("customerName").value  = "";
  document.getElementById("customerEmail").value = "";
  document.getElementById("invoiceDate").value   = new Date().toISOString().split("T")[0];
  document.getElementById("carReg").value        = "";
  document.getElementById("paymentStatus").value = "unpaid";
  document.getElementById("vatToggle").checked   = false;
  document.getElementById("partsContainer").innerHTML = "";
  document.getElementById("vatRow").style.display = "none";
  calculateTotal();
}

// ── Parts ──────────────────────────────────────────────
function addPartRow(data = {}) {
  const container = document.getElementById("partsContainer");
  const row = document.createElement("div");
  row.className = "part-item";

  const pn    = data.part_number  || "";
  const desc  = data.description  || "";
  const qty   = data.quantity     ?? 1;
  const price = data.unit_price   ?? "";

  row.innerHTML = `
    <input type="text"   class="pn"    placeholder="P-001"           value="${pn}"    title="Part number / code">
    <input type="text"   class="desc"  placeholder="Brake Pads - Front" value="${desc}" title="Description" required>
    <input type="number" class="qty"   placeholder="1"               value="${qty}"   min="1" step="1"    onchange="calculateTotal()" title="Quantity">
    <input type="number" class="price" placeholder="0.00"            value="${price}" min="0" step="0.01" onchange="calculateTotal()" title="Unit price £">
    <span  class="subtotal-display">£0.00</span>
    <button class="btn-remove-part" onclick="removePartRow(this)" title="Remove row">×</button>
  `;

  container.appendChild(row);
  calculateTotal();
}

function removePartRow(btn) {
  btn.closest(".part-item").remove();
  calculateTotal();
}

// ── VAT + Totals ───────────────────────────────────────
function calculateTotal() {
  const rows     = document.querySelectorAll(".part-item");
  let subtotal   = 0;

  rows.forEach(row => {
    const qty   = parseFloat(row.querySelector(".qty").value)   || 0;
    const price = parseFloat(row.querySelector(".price").value) || 0;
    const line  = qty * price;
    subtotal   += line;
    row.querySelector(".subtotal-display").textContent = "£" + line.toFixed(2);
  });

  const vatOn  = document.getElementById("vatToggle").checked;
  const vatAmt = vatOn ? subtotal * 0.20 : 0;
  const total  = subtotal + vatAmt;

  document.getElementById("subtotalAmount").textContent = subtotal.toFixed(2);
  document.getElementById("vatAmount").textContent      = vatAmt.toFixed(2);
  document.getElementById("totalAmount").textContent    = total.toFixed(2);
  document.getElementById("vatRow").style.display       = vatOn ? "flex" : "none";
}

// ── Save invoice ───────────────────────────────────────
async function saveInvoice() {
  const name   = document.getElementById("customerName").value.trim();
  const email  = document.getElementById("customerEmail").value.trim();
  const date   = document.getElementById("invoiceDate").value;
  const reg    = document.getElementById("carReg").value.trim();
  const status = document.getElementById("paymentStatus").value;
  const vatOn  = document.getElementById("vatToggle").checked;

  // Basic validation
  if (!name || !email || !date) {
    ["customerName","customerEmail","invoiceDate"].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) el.style.borderColor = "red";
    });
    return;
  }

  // Reset borders
  ["customerName","customerEmail","invoiceDate"].forEach(id => {
    document.getElementById(id).style.borderColor = "";
  });

  // Collect parts
  const parts = [];
  document.querySelectorAll(".part-item").forEach(row => {
    const pn    = row.querySelector(".pn").value.trim();
    const desc  = row.querySelector(".desc").value.trim();
    const qty   = parseFloat(row.querySelector(".qty").value)   || 0;
    const price = parseFloat(row.querySelector(".price").value) || 0;
    if (desc) parts.push({ part_number: pn, description: desc, quantity: qty, unit_price: price });
  });

  const subtotal     = parseFloat(document.getElementById("subtotalAmount").textContent);
  const vatAmount    = parseFloat(document.getElementById("vatAmount").textContent);
  const totalAmount  = parseFloat(document.getElementById("totalAmount").textContent);

  const payload = {
    customer_name:   name,
    customer_email:  email,
    invoice_date:    date,
    car_reg:         reg || null,
    parts:           parts,
    vat_applied:     vatOn,
    subtotal:        subtotal,
    vat_amount:      vatAmount,
    total_amount:    totalAmount,
    payment_status:  status
  };

  try {
    let res;
    if (editMode && currentInvoiceId) {
      res = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${currentInvoiceId}`, {
        method: "PATCH",
        headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: "POST",
        headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Save error:", errText);
      alert("Error saving invoice: " + errText);
      return;
    }

    hideInvoiceModal();
    fetchInvoices();
  } catch (err) {
    console.error(err);
  }
}

// ── Edit invoice ───────────────────────────────────────
function editInvoice(inv) {
  editMode         = true;
  currentInvoiceId = inv.id;
  document.getElementById("modalTitle").textContent = "✏️ Edit Invoice";

  document.getElementById("customerName").value  = inv.customer_name;
  document.getElementById("customerEmail").value = inv.customer_email;
  document.getElementById("invoiceDate").value   = inv.invoice_date;
  document.getElementById("carReg").value        = inv.car_reg || "";
  document.getElementById("paymentStatus").value = inv.payment_status;
  document.getElementById("vatToggle").checked   = inv.vat_applied || false;

  document.getElementById("partsContainer").innerHTML = "";
  if (inv.parts && inv.parts.length > 0) {
    inv.parts.forEach(p => addPartRow(p));
  } else {
    addPartRow();
  }

  calculateTotal();
  document.getElementById("invoiceModal").classList.add("show");
}

// ── Delete ─────────────────────────────────────────────
function deleteInvoice(id) {
  currentInvoiceId = id;
  showDeleteModal();
}

async function confirmDeleteInvoice() {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${currentInvoiceId}`, {
      method: "DELETE",
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
    });
    invoices = invoices.filter(i => i.id !== currentInvoiceId);
    renderInvoices();
    hideDeleteModal();
  } catch (err) { console.error(err); }
}

// ── Fetch + render ─────────────────────────────────────
async function fetchInvoices() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=*&order=invoice_date.desc`, {
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
    });

    if (!res.ok) { renderEmpty(); return; }

    invoices = await res.json();
    renderInvoices();
  } catch (err) {
    console.error(err);
    renderEmpty();
  }
}

function renderInvoices() {
  const container = document.getElementById("invoicesList");
  container.innerHTML = `
    <div class="list-header">
      <span>Customer</span>
      <span>Amount</span>
      <span>Status</span>
      <span style="text-align:right;">Actions</span>
    </div>
  `;

  if (invoices.length === 0) { renderEmpty(); return; }

  invoices.forEach(inv => {
    const num        = `INV-${String(inv.id).slice(-4).padStart(4,"0")}`;
    const statusCls  = inv.payment_status === "paid" ? "status-paid" : "status-unpaid";
    const statusIcon = inv.payment_status === "paid" ? "✓ PAID" : "○ UNPAID";
    const partsCount = (inv.parts || []).length;
    const vatTag     = inv.vat_applied ? " + VAT" : "";

    const row = document.createElement("div");
    row.className = "invoice-item";
    row.innerHTML = `
      <div class="inv-info">
        <h3><span class="inv-num">${num}</span>${inv.customer_name}</h3>
        <p>📅 ${inv.invoice_date}${inv.car_reg ? " · 🚗 " + inv.car_reg : ""} · ${partsCount} item${partsCount !== 1 ? "s" : ""}${vatTag}</p>
      </div>
      <div class="inv-amount">£${(inv.total_amount || 0).toFixed(2)}</div>
      <div><span class="inv-status ${statusCls}">${statusIcon}</span></div>
      <div class="inv-actions">
        <button class="btn-edit"   onclick='editInvoice(${JSON.stringify(inv).replace(/'/g,"\\'")})''>Edit</button>
        <button class="btn-delete" onclick="deleteInvoice('${inv.id}')">Delete</button>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderEmpty() {
  document.getElementById("invoicesList").innerHTML = `
    <div class="list-header">
      <span>Customer</span><span>Amount</span><span>Status</span><span style="text-align:right;">Actions</span>
    </div>
    <div class="empty-state">
      <h3>📄 No Invoices Yet</h3>
      <p>Click <strong>+ New Invoice</strong> to get started.</p>
    </div>
  `;
}

// Initial load
document.getElementById("invoiceDate").value = new Date().toISOString().split("T")[0];
fetchInvoices();
