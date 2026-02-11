// Auth check
if (sessionStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

const SUPABASE_URL = "https://cxzapvieqzqfxzolqwoh.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";

let inventoryData = [];
let currentItemId = null;
let editMode = false;

// Modal functions
function showNewItemModal() {
  editMode = false;
  currentItemId = null;
  document.getElementById('modalTitle').textContent = 'Add New Item';
  clearItemForm();
  document.getElementById('itemModal').classList.add('show');
}

function showEditItemModal(item) {
  editMode = true;
  currentItemId = item.id;
  document.getElementById('modalTitle').textContent = 'Edit Item';
  
  document.getElementById('purchaseDate').value = item.purchase_date;
  document.getElementById('itemCode').value = item.item_code;
  document.getElementById('itemName').value = item.item_name;
  document.getElementById('serialNumber').value = item.serial_number || '';
  document.getElementById('cost').value = item.cost;
  document.getElementById('supplier').value = item.supplier || '';
  
  document.getElementById('itemModal').classList.add('show');
}

function hideItemModal() {
  document.getElementById('itemModal').classList.remove('show');
}

function showDeleteModal() {
  document.getElementById('deleteModal').classList.add('show');
}

function hideDeleteModal() {
  document.getElementById('deleteModal').classList.remove('show');
}

function showLogoutModal() {
  document.getElementById('logoutModal').classList.add('show');
}

function hideLogoutModal() {
  document.getElementById('logoutModal').classList.remove('show');
}

function confirmLogout() {
  sessionStorage.removeItem("adminLoggedIn");
  window.location.href = "index.html";
}

// Clear form
function clearItemForm() {
  document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('itemCode').value = '';
  document.getElementById('itemName').value = '';
  document.getElementById('serialNumber').value = '';
  document.getElementById('cost').value = '';
  document.getElementById('supplier').value = '';
}

// Save item
async function saveItem() {
  const purchaseDate = document.getElementById('purchaseDate').value;
  const itemCode = document.getElementById('itemCode').value.trim();
  const itemName = document.getElementById('itemName').value.trim();
  const serialNumber = document.getElementById('serialNumber').value.trim();
  const cost = parseFloat(document.getElementById('cost').value);
  const supplier = document.getElementById('supplier').value.trim();
  
  if (!purchaseDate || !itemCode || !itemName || isNaN(cost)) {
    alert('Please fill in all required fields');
    return;
  }
  
  const itemData = {
    purchase_date: purchaseDate,
    item_code: itemCode,
    item_name: itemName,
    serial_number: serialNumber || null,
    cost: cost,
    supplier: supplier || null,
    status: 'active'
  };
  
  try {
    if (editMode && currentItemId) {
      // Update
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${currentItemId}`, {
        method: 'PATCH',
        headers: {
          'apikey': KEY,
          'Authorization': `Bearer ${KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });
      
      if (!res.ok) throw new Error('Update failed');
    } else {
      // Create
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, {
        method: 'POST',
        headers: {
          'apikey': KEY,
          'Authorization': `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(itemData)
      });
      
      if (!res.ok) throw new Error('Create failed');
    }
    
    hideItemModal();
    fetchInventory();
  } catch (err) {
    console.error('Error saving item:', err);
    alert('Failed to save item');
  }
}

// Toggle return status
async function toggleReturn(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'returned' : 'active';
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!res.ok) throw new Error('Update failed');
    
    const item = inventoryData.find(i => i.id == id);
    if (item) item.status = newStatus;
    
    renderInventory();
  } catch (err) {
    console.error('Error updating status:', err);
  }
}

// Delete item
function deleteItem(id) {
  currentItemId = id;
  showDeleteModal();
}

async function confirmDeleteItem() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${currentItemId}`, {
      method: 'DELETE',
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`
      }
    });
    
    if (!res.ok) throw new Error('Delete failed');
    
    inventoryData = inventoryData.filter(i => i.id != currentItemId);
    renderInventory();
    hideDeleteModal();
  } catch (err) {
    console.error('Error deleting item:', err);
    alert('Failed to delete item');
  }
}

// Fetch inventory
async function fetchInventory() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*&order=purchase_date.desc`, {
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`
      }
    });
    
    if (!res.ok) {
      // Table doesn't exist - show sample
      renderSampleInventory();
      return;
    }
    
    inventoryData = await res.json();
    renderInventory();
  } catch (err) {
    console.error('Error fetching inventory:', err);
    renderSampleInventory();
  }
}

// Render inventory
function renderInventory() {
  const tbody = document.getElementById('inventoryBody');
  const search = document.getElementById('searchBar').value.toLowerCase();
  
  const filtered = inventoryData.filter(item =>
    item.item_name.toLowerCase().includes(search) ||
    item.item_code.toLowerCase().includes(search) ||
    (item.serial_number && item.serial_number.toLowerCase().includes(search))
  );
  
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999; padding: 40px;">No items found</td></tr>';
    return;
  }
  
  filtered.forEach(item => {
    const statusClass = item.status === 'active' ? 'status-active' : 'status-returned';
    const returnBtnText = item.status === 'active' ? 'Mark Returned' : 'Mark Active';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.purchase_date}</td>
      <td><strong>${item.item_code}</strong></td>
      <td>${item.item_name}</td>
      <td>${item.serial_number || '—'}</td>
      <td>£${item.cost.toFixed(2)}</td>
      <td>${item.supplier || '—'}</td>
      <td><span class="status-badge ${statusClass}">${item.status.toUpperCase()}</span></td>
      <td>
        <button class="btn-sm btn-return" onclick="toggleReturn('${item.id}', '${item.status}')">${returnBtnText}</button>
        <button class="btn-sm btn-edit" onclick='editItem(${JSON.stringify(item).replace(/'/g, "\\'")})'Edit</button>
        <button class="btn-sm btn-delete" onclick="deleteItem('${item.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Sample inventory
function renderSampleInventory() {
  const tbody = document.getElementById('inventoryBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
        <h3 style="color: #1b2b3a; margin-bottom: 15px;">Inventory System Ready</h3>
        <p>Click "Add Item" to start tracking your inventory.</p>
        <p style="font-size: 0.9rem; margin-top: 10px; color: #999;">
          Note: Inventory items will be stored in your Supabase database.<br>
          Make sure you have an "inventory" table created.
        </p>
      </td>
    </tr>
  `;
}

function editItem(item) {
  showEditItemModal(item);
}

// Search
document.getElementById('searchBar').addEventListener('input', renderInventory);

// Set default date
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('purchaseDate').value = today;
});

// Initial load
fetchInventory();
