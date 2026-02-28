// DeltaV shared utilities - namespaced, cleaned and backward-compatible
(function(win){
  const DeltaV = win.DeltaV = win.DeltaV || {};

  // Supabase REST endpoint and key (kept for compatibility)
  DeltaV.SB = "https://cxzapvieqzqfxzolqwoh.supabase.co";
  DeltaV.KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";
  DeltaV.H = {"apikey":DeltaV.KEY,"Authorization":`Bearer ${DeltaV.KEY}`,"Content-Type":"application/json; charset=utf-8"};

  // Central fetch helper with JSON response handling
  DeltaV._fetch = async function(url, opts={}){
    try{
      const res = await fetch(url, {...opts, headers: {...opts.headers||{}, 'Accept': 'application/json; charset=utf-8'}});
      if(!res.ok){
        const txt = await res.text().catch(()=>res.statusText||"Error");
        throw new Error(txt || res.statusText || 'Request failed');
      }
      // Some Supabase endpoints return empty body on success
      const ct = res.headers.get('content-type') || '';
      if(ct.includes('application/json')){
        let data = await res.json();
        // Fix corrupted emojis in database responses
        data = DeltaV._fixEncodingIssues(data);
        return data;
      }
      return null;
    }catch(err){
      console.error('Fetch error',url,err);
      throw err;
    }
  };

  // Fix UTF-8 encoding issues in database responses
  DeltaV._fixEncodingIssues = function(data){
    if(!data) return data;
    if(typeof data === 'string'){
      // Try to fix mojibake (broken UTF-8 displayed as Latin1)
      try{
        return decodeURIComponent(escape(data));
      }catch(e){
        return data;
      }
    }
    if(Array.isArray(data)){
      return data.map(item => DeltaV._fixEncodingIssues(item));
    }
    if(typeof data === 'object'){
      const fixed = {};
      for(let key in data){
        fixed[key] = DeltaV._fixEncodingIssues(data[key]);
      }
      return fixed;
    }
    return data;
  };

  // DB wrappers (return or throw for callers to manage)
  DeltaV.dbGet = async function(table, query=""){ return await DeltaV._fetch(`${DeltaV.SB}/rest/v1/${table}?select=*${query}`,{headers:DeltaV.H}).catch(()=>[]); };
  DeltaV.dbIns = async function(table, data){ return await DeltaV._fetch(`${DeltaV.SB}/rest/v1/${table}`,{method:'POST',headers:{...DeltaV.H,'Prefer':'return=representation'},body:JSON.stringify(data)}); };
  DeltaV.dbUpd = async function(table,id,data){ return await DeltaV._fetch(`${DeltaV.SB}/rest/v1/${table}?id=eq.${id}`,{method:'PATCH',headers:DeltaV.H,body:JSON.stringify(data)}); };
  DeltaV.dbDel = async function(table,id){ return await DeltaV._fetch(`${DeltaV.SB}/rest/v1/${table}?id=eq.${id}`,{method:'DELETE',headers:DeltaV.H}); };

  // Authentication & Authorization functions
  DeltaV.getUser = function(){
    try{
      const u=sessionStorage.getItem("dv_admin_user");
      return u?JSON.parse(u):null;
    }catch(e){return null;}
  };
  
  DeltaV.isLoggedIn = function(){
    return DeltaV.getUser()!==null;
  };
  
  DeltaV.hasRole = function(allowedRoles){
    const user=DeltaV.getUser();
    if(!user) return false;
    if(typeof allowedRoles==='string') allowedRoles=[allowedRoles];
    return allowedRoles.includes(user.role);
  };
  
  DeltaV.requireLogin = function(){
    if(!DeltaV.isLoggedIn()){
      sessionStorage.removeItem('dv_admin_user');
      sessionStorage.removeItem('dv_admin');
      location.href='login.html';
    }
  };
  
  DeltaV.requireRole = function(allowedRoles){
    DeltaV.requireLogin();
    if(!DeltaV.hasRole(allowedRoles)){
      DeltaV.toast('Access denied: insufficient permissions','error');
      setTimeout(()=>location.href='dashboard.html',1500);
    }
  };
  
  DeltaV.logout = function(){
    sessionStorage.removeItem('dv_admin_user');
    sessionStorage.removeItem('dv_admin');
    location.href='login.html';
  };

  // Unified toast (small, non-blocking notifications)
  DeltaV.toast = function(msg, type='success'){
    // normalize legacy type aliases: 'er' -> 'error', 'in' -> 'info'
    const map = {er:'error', in:'info', error:'error', success:'success'};
    const ttype = map[type] || type || 'success';
    const t = document.createElement('div');
    t.className = `toast ${ttype}`;
    t.innerHTML = `<span class="ico">${ttype==='success'?'✓':ttype==='error'?'✕':'ℹ'}</span><span class="msg">${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),350); }, 3500);
  };

  DeltaV.showError = function(msg){
    const el = document.getElementById('errorMsg');
    if(el) el.textContent = msg;
    DeltaV.openM('mError');
  };

  // Modal helpers with animation
  DeltaV.openM = function(id){
    const m = document.getElementById(id); if(!m) return;
    m.classList.add('show');
    const box = m.querySelector('.mbox'); if(box) box.style.animation = 'slideUp .28s ease-out';
  };
  DeltaV.closeM = function(id){
    const m = document.getElementById(id); if(!m) return;
    const box = m.querySelector('.mbox'); if(box) box.style.animation = 'slideDown .18s ease-in';
    setTimeout(()=>m.classList.remove('show'), 160);
  };
  // click outside to close
  document.addEventListener('click', e => { if(e.target.classList && e.target.classList.contains('modal')) DeltaV.closeM(e.target.id); });

  // Confirm delete modal helper
  DeltaV.confirmDel = function(msg, cb){
    const mMsg = document.getElementById('mDelMsg');
    const btn = document.getElementById('mDelBtn');
    if(mMsg) mMsg.textContent = msg;
    if(btn){ btn.onclick = async ()=>{ DeltaV.closeM('mDel'); try{ await cb(); }catch(e){ DeltaV.toast('Action failed','error'); console.error(e); } }; }
    DeltaV.openM('mDel');
  };

  // Small helpers
  DeltaV.fmtD = function(d){ if(!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); };
  DeltaV.fmtGBP = function(n){ return '£'+(parseFloat(n)||0).toFixed(2); };
  DeltaV.today = function(){ return new Date().toISOString().split('T')[0]; };

  // Autocomplete attach (lightweight)
  // Autocomplete attach (lightweight)
  // Accepts: (inputElement, suggestionsArray, onSelectCallback?)
  DeltaV.attachAC = function(input, suggestions, onSelect){
    if(!input) return;
    suggestions = Array.isArray(suggestions) ? suggestions : [];
    let list = null;
    const close = ()=>{ if(list){ list.remove(); list=null; } };
    const ensureList = ()=>{
      if(!list){ list = document.createElement('div'); list.style.cssText = 'position:absolute;left:0;right:0;background:#fff;border:1px solid #e6eef8;border-radius:6px;max-height:240px;overflow:auto;z-index:1100';
        // ensure container positioning
        const p = input.parentElement; if(p) p.style.position = p.style.position || 'relative'; p.appendChild(list);
      }
    };
    input.addEventListener('input', e => {
      const v = (e.target.value||'').trim().toLowerCase();
      if(!v){ close(); return; }
      const matches = suggestions.filter(s=>String(s).toLowerCase().includes(v)).slice(0,20);
      if(!matches.length){ close(); return; }
      ensureList();
      list.innerHTML = matches.map(m=>`<div class="ac-item" style="padding:8px 12px;cursor:pointer">${m}</div>`).join('');
      list.querySelectorAll('.ac-item').forEach(it=>{ it.onmouseenter=()=>it.style.background='#f8fafb'; it.onmouseleave=()=>it.style.background=''; it.onclick=()=>{ input.value = it.textContent; input.dispatchEvent(new Event('input')); if(typeof onSelect==='function') onSelect(it.textContent); close(); }; });
    });
    document.addEventListener('click', e => { if(e.target!==input && (!list || !list.contains(e.target))) close(); });
  };

  // Utilities exposed on window for compatibility (shorthand names)
  win.dbGet = DeltaV.dbGet; win.dbIns = DeltaV.dbIns; win.dbUpd = DeltaV.dbUpd; win.dbDel = DeltaV.dbDel;
  win.toast = DeltaV.toast; win.showError = DeltaV.showError; win.confirmDel = DeltaV.confirmDel;
  win.openM = DeltaV.openM; win.closeM = DeltaV.closeM; win.attachAC = DeltaV.attachAC;
  win.fmtD = DeltaV.fmtD; win.fmtGBP = DeltaV.fmtGBP; win.today = DeltaV.today;

  // Dark Mode Theme Toggle
  DeltaV.toggleDarkMode = function(){
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('dv_theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('darkModeToggle');
    if(btn) btn.textContent = isDark ? '☀️' : '🌙';
    return isDark;
  };

  DeltaV.initDarkMode = function(){
    const savedTheme = localStorage.getItem('dv_theme') || 'light';
    if(savedTheme === 'dark'){
      document.body.classList.add('dark-mode');
      const btn = document.getElementById('darkModeToggle');
      if(btn) btn.textContent = '☀️';
    }
  };

  // Window exports for dark mode
  win.toggleDarkMode = DeltaV.toggleDarkMode;
  win.initDarkMode = DeltaV.initDarkMode;

  // Other helpers preserved as DeltaV methods
  DeltaV.enhanceSearch = function(inputId, selector){
    const input = document.getElementById(inputId); if(!input) return;
    input.addEventListener('input', ()=>{
      const q = input.value.toLowerCase(); document.querySelectorAll(selector).forEach(el=>{
        if(!q){ el.style.display=''; el.style.opacity='1'; el.style.background=''; return; }
        const t = el.textContent.toLowerCase(); if(t.includes(q)){ el.style.display=''; el.style.opacity='1'; el.style.background='rgba(96,165,250,.06)'; } else { el.style.opacity='.3'; }
      });
    });
  };

  DeltaV.debounce = function(fn, wait=250){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; };

  DeltaV.autoSave = function(ids, saveCb, delay=2000){
    const handler = DeltaV.debounce(()=>{
      const data = {}; ids.forEach(id=>{ const el=document.getElementById(id); if(el) data[id]=el.value; });
      saveCb(data);
      DeltaV.toast('Auto-saved','in');
    }, delay);
    ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', handler); });
  };

  // Simple infinite scroll helper
  DeltaV.infiniteScroll = function(containerId, loadMore, threshold=200){
    const onScroll = ()=>{ if((window.innerHeight + window.scrollY) >= document.body.offsetHeight - threshold) loadMore(); };
    window.addEventListener('scroll', onScroll);
    return ()=>window.removeEventListener('scroll', onScroll);
  };

  // Keyboard shortcuts (global)
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') document.querySelectorAll('.modal.show').forEach(m=>DeltaV.closeM(m.id));
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 's'){ e.preventDefault(); const btn=document.querySelector('[onclick*="saveData"],[onclick*="saveTx"],[onclick*="saveInv"]'); if(btn) btn.click(); }
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'n'){ e.preventDefault(); const btn=document.querySelector('[onclick*="openNew"],[onclick*="openNewInv"]'); if(btn) btn.click(); }
  });

  // Surface uncaught errors and promise rejections to the UI so missing functions are visible
  window.addEventListener('error', function(e){ try{ DeltaV.toast(e.message || 'Error occurred','error'); }catch(_){ console.error(e); } });
  window.addEventListener('unhandledrejection', function(ev){ try{ DeltaV.toast((ev.reason && ev.reason.message) || 'Unhandled rejection','error'); }catch(_){ console.error(ev); } });

  // Create custom scroll buttons
  function initScrollButtons(){
    if(document.getElementById('scrollControls')) return; // Already created
    const container = document.createElement('div');
    container.id = 'scrollControls';
    container.className = 'scroll-controls';
    container.innerHTML = `
      <button class="scroll-btn" id="scrollUp" title="Scroll up">↑</button>
      <button class="scroll-btn" id="scrollDown" title="Scroll down">↓</button>
    `;
    document.body.appendChild(container);
    
    const upBtn = document.getElementById('scrollUp');
    const downBtn = document.getElementById('scrollDown');
    
    upBtn.addEventListener('click', () => {
      window.scrollBy({top: -300, behavior: 'smooth'});
    });
    downBtn.addEventListener('click', () => {
      window.scrollBy({top: 300, behavior: 'smooth'});
    });
    
    // Hide buttons when at top/bottom
    window.addEventListener('scroll', () => {
      upBtn.style.opacity = window.scrollY > 100 ? '1' : '0.3';
      downBtn.style.opacity = (window.scrollY < document.documentElement.scrollHeight - window.innerHeight - 100) ? '1' : '0.3';
    });
  }
  
  // Save/restore sidebar navigation scroll position
  DeltaV.saveScrollPosition = function(){
    const nav = document.querySelector('.sidebar nav');
    if(nav) sessionStorage.setItem('sidebarScrollPos', nav.scrollTop);
  };
  DeltaV.restoreScrollPosition = function(){
    const nav = document.querySelector('.sidebar nav');
    if(nav){
      const pos = sessionStorage.getItem('sidebarScrollPos');
      if(pos) nav.scrollTop = parseInt(pos);
    }
  };
  
  // Initialize scroll buttons when DOM is ready
  window.addEventListener('DOMContentLoaded', initScrollButtons);
  // Also init immediately in case DOM is already loaded
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{
      initScrollButtons();
      DeltaV.restoreScrollPosition();
    });
  }else{
    initScrollButtons();
    DeltaV.restoreScrollPosition();
  }
  
  // Save scroll position before leaving page
  window.addEventListener('beforeunload', DeltaV.saveScrollPosition);

  // Mobile menu toggle
  DeltaV.toggleMobileMenu = function(){
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if(sidebar) sidebar.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
  };
  
  DeltaV.closeMobileMenu = function(){
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.classList.remove('active');
  };
  
  // Initialize mobile menu on DOM ready
  window.addEventListener('DOMContentLoaded', ()=>{
    // Create hamburger button if it doesn't exist
    if(!document.querySelector('.hamburger')){
      const hamburger = document.createElement('button');
      hamburger.className = 'hamburger';
      hamburger.innerHTML = '☰';
      hamburger.onclick = DeltaV.toggleMobileMenu;
      hamburger.title = 'Toggle menu';
      document.body.insertBefore(hamburger, document.body.firstChild);
    }
    
    // Create overlay if it doesn't exist
    if(!document.querySelector('.sidebar-overlay')){
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.onclick = DeltaV.closeMobileMenu;
      document.body.insertBefore(overlay, document.body.firstChild);
    }
    
    // Close mobile menu when clicking a nav link
    const navLinks = document.querySelectorAll('.sidebar nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', DeltaV.closeMobileMenu);
    });
  });

  // NOTIFICATION SYSTEM
  DeltaV.showNotification = function(title, message, type='warning', items=[], autoDismiss=6000){
    // Remove existing notification
    const existing = document.querySelector('.notification-banner');
    if(existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.className = `notification-banner ${type}`;
    
    const icons = { warning: '⚠️', error: '❌', success: '✓', info: 'ℹ️' };
    
    let itemsHtml = '';
    if(items.length > 0){
      itemsHtml = `<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.3);padding-top:8px">
        ${items.map(item => `<div class="notification-item"><span class="notification-item-icon">${item.icon||'•'}</span><span class="notification-item-text">${item.text}</span></div>`).join('')}
      </div>`;
    }
    
    banner.innerHTML = `
      <div class="notification-icon">${icons[type]}</div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
        ${itemsHtml}
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
    document.body.classList.add('with-notification');
    
    if(autoDismiss){
      setTimeout(()=>{
        banner.classList.add('removing');
        setTimeout(()=>{
          banner.remove();
          if(!document.querySelector('.notification-banner')){
            document.body.classList.remove('with-notification');
          }
        }, 300);
      }, autoDismiss);
    }
  };
  
  // Check for alerts and show notifications
  DeltaV.checkNotifications = async function(){
    try{
      const [invoices, inventory, bookings] = await Promise.all([
        dbGet("invoices"),
        dbGet("inventory"),
        dbGet("bookings")
      ]);
      
      const alerts = [];
      const today = new Date();
      today.setHours(0,0,0,0);
      
      // Check for overdue invoices
      const overdue = invoices.filter(inv => {
        if(inv.payment_status === 'paid') return false;
        const invDate = new Date(inv.created_at);
        const daysOld = Math.floor((today - invDate) / (1000*60*60*24));
        return daysOld > 30;
      });
      
      if(overdue.length > 0){
        alerts.push({
          title: `${overdue.length} Overdue Invoice${overdue.length > 1 ? 's' : ''}`,
          message: `You have ${overdue.length} invoice${overdue.length > 1 ? 's' : ''} overdue for payment. Follow up with customers to collect payment.`,
          type: 'error',
          items: overdue.slice(0, 3).map(inv => ({ icon: '💰', text: `${inv.customer_name} - £${inv.total}` }))
        });
      }
      
      // Check for low stock
      const lowStock = inventory.filter(item => {
        const qty = parseInt(item.quantity) || 0;
        const reorder = parseInt(item.reorder_point) || 0;
        return qty <= reorder && qty > 0;
      });
      
      if(lowStock.length > 0){
        alerts.push({
          title: `${lowStock.length} Item${lowStock.length > 1 ? 's' : ''} Low on Stock`,
          message: `${lowStock.length} item${lowStock.length > 1 ? 's' : ''} are running low and should be reordered soon.`,
          type: 'warning',
          items: lowStock.slice(0, 3).map(item => ({ icon: '📦', text: `${item.name} (${item.quantity} left)` }))
        });
      }
      
      // Check for pending bookings
      const pending = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
      
      if(pending.length > 0){
        alerts.push({
          title: `${pending.length} Booking${pending.length > 1 ? 's' : ''} Awaiting Action`,
          message: `${pending.length} booking${pending.length > 1 ? 's' : ''} need confirmation or scheduling.`,
          type: 'info',
          items: pending.slice(0, 3).map(b => ({ icon: '📅', text: `${b.name} - ${b.service || 'General'}` }))
        });
      }
      
      // Show first alert if any
      if(alerts.length > 0){
        const alert = alerts[0];
        DeltaV.showNotification(alert.title, alert.message, alert.type, alert.items);
      }
    }catch(e){
      console.error('Notification check error:', e);
    }
  };
  
  // Auto-check notifications on dashboard page load
  window.addEventListener('DOMContentLoaded', ()=>{
    const isDashboard = window.location.pathname.includes('dashboard.html');
    if(isDashboard){
      setTimeout(DeltaV.checkNotifications, 500);
    }
  });

  // Delay creating no-op stubs until DOM is ready so page scripts can define real handlers first
  const _stubs = ['openNewInv','saveInv','loadInv','addPart','calcT','editInv','delInv','exportInv','pdfInv','togPay','dupInv','openNew'];
  window.addEventListener('DOMContentLoaded', ()=>{
    _stubs.forEach(n=>{
      if(!win[n]){
        win[n]=function(){ DeltaV.toast(`Action '${n}' not available right now`,'error'); console.warn('Missing function',n); };
      }
    });
  });

  // Invoice numbering - continuous sequential counter (never resets)
  DeltaV.getNextInvoiceNum = function(){
    let counter = parseInt(localStorage.getItem('dv_invoice_counter') || '0');
    counter++;
    localStorage.setItem('dv_invoice_counter', counter.toString());
    return String(counter).padStart(6, '0');
  };

  DeltaV.formatInvoiceNum = function(num){
    return 'INV-' + String(num).slice(-6);
  };

  // Company settings sync - now uses Supabase as source of truth
  DeltaV.getCompanySettingsFromDB = async function(){
    try{
      const res = await DeltaV._fetch(`${DeltaV.SB}/rest/v1/company_settings?id=eq.1&limit=1`,{headers:DeltaV.H});
      return res && res.length > 0 ? res[0] : null;
    }catch(e){
      console.error('Error fetching settings from DB',e);
      return null;
    }
  };

  DeltaV.saveCompanySettingsToDB = async function(data){
    try{
      const existing = await DeltaV.getCompanySettingsFromDB();
      if(existing){
        // Update existing
        return await DeltaV._fetch(`${DeltaV.SB}/rest/v1/company_settings?id=eq.1`,{
          method:'PATCH',
          headers:DeltaV.H,
          body:JSON.stringify(data)
        });
      }else{
        // Create new with id=1
        return await DeltaV._fetch(`${DeltaV.SB}/rest/v1/company_settings`,{
          method:'POST',
          headers:{...DeltaV.H,'Prefer':'return=representation'},
          body:JSON.stringify({id:1,...data})
        });
      }
    }catch(e){
      console.error('Error saving settings to DB',e);
      throw e;
    }
  };

  // Backwards-compatible getters (now fetch from Supabase)
  let _cachedSettings = null;

  DeltaV.getCompanySettingsAsync = async function(){
    if(!_cachedSettings){
      const dbSettings = await DeltaV.getCompanySettingsFromDB();
      _cachedSettings = dbSettings || {};
    }
    return _cachedSettings;
  };

  DeltaV.setCompanySettings = function(data){
    _cachedSettings = data || {};
    DeltaV.saveCompanySettingsToDB(data).catch(e=>console.error('DB save failed',e));
  };

  DeltaV.getCompanySettings = function(){
    try{
      return _cachedSettings || JSON.parse(localStorage.getItem('dv_company_settings') || '{}');
    }catch(e){ return {}; }
  };

  DeltaV.setCompanyName = function(name){
    const s = DeltaV.getCompanySettings();
    s.name = name || 'DeltaV Automotive';
    DeltaV.setCompanySettings(s);
  };

  DeltaV.getCompanyName = function(){
    return DeltaV.getCompanySettings().name || 'DeltaV Automotive';
  };

  DeltaV.setCompanyPhone = function(phone){
    const s = DeltaV.getCompanySettings();
    s.phone = phone || '0121 5650888';
    DeltaV.setCompanySettings(s);
  };

  DeltaV.getCompanyPhone = function(){
    return DeltaV.getCompanySettings().phone || '0121 5650888';
  };

  DeltaV.setCompanyEmail = function(email){
    const s = DeltaV.getCompanySettings();
    s.email = email || 'automotive.deltav@yahoo.com';
    DeltaV.setCompanySettings(s);
  };

  DeltaV.getCompanyEmail = function(){
    return DeltaV.getCompanySettings().email || 'automotive.deltav@yahoo.com';
  };

  DeltaV.setCompanyAddress = function(addr){
    const s = DeltaV.getCompanySettings();
    s.address = addr || '106 Rolfe Street\nSmethwick, West Midlands, B66 2B4';
    DeltaV.setCompanySettings(s);
  };

  DeltaV.getCompanyAddress = function(){
    return DeltaV.getCompanySettings().address || '106 Rolfe Street\nSmethwick, West Midlands, B66 2B4';
  };

  DeltaV.setCompanyVAT = function(vat){
    const s = DeltaV.getCompanySettings();
    s.vat = vat || 'GB XXX XXXX XX';
    DeltaV.setCompanySettings(s);
  };

  DeltaV.getCompanyVAT = function(){
    return DeltaV.getCompanySettings().vat || 'GB XXX XXXX XX';
  };

  // INVENTORY DEDUCTION SYSTEM
  // Main function to deduct from inventory with confirmation
  DeltaV.deductFromInventory = async function(partNumber, quantity, referenceType, referenceId){
    try{
      // Get product from inventory
      const products = await DeltaV.dbGet("inventory", "&item_code=eq."+encodeURIComponent(partNumber)+"&limit=1");
      if(!products || products.length === 0){
        DeltaV.toast("⚠️ Product not in inventory: "+partNumber, "warning");
        return {success: false, reason: "not_found"};
      }
      
      const product = products[0];
      const currentQty = product.quantity || 0;
      const neededQty = parseInt(quantity) || 1;
      
      // Check if sufficient stock
      if(currentQty < neededQty){
        return new Promise((resolve)=>{
          const msg = `⚠️ WARNING: Only ${currentQty} units of "${product.item_name}" in stock, but selling ${neededQty}. Continue anyway?`;
          if(confirm(msg)){
            // User confirmed to continue anyway (oversell)
            DeltaV._doDeduction(product.id, neededQty, referenceType, referenceId).then(resolve);
          } else {
            resolve({success: false, reason: "user_cancelled"});
          }
        });
      }
      
      // Sufficient stock - proceed with deduction
      return await DeltaV._doDeduction(product.id, neededQty, referenceType, referenceId);
    }catch(e){
      console.error("Deduction error:", e);
      DeltaV.toast("Error checking inventory", "error");
      return {success: false, reason: "error", error: e.message};
    }
  };
  
  // Internal deduction handler
  DeltaV._doDeduction = async function(inventoryId, quantity, referenceType, referenceId){
    try{
      const product = await DeltaV.dbGet("inventory", "&id=eq."+inventoryId+"&limit=1");
      if(!product || product.length === 0) return {success: false, reason: "not_found"};
      
      const p = product[0];
      const newQty = Math.max(0, (p.quantity || 0) - quantity);
      
      // Update inventory
      await DeltaV.dbUpd("inventory", inventoryId, {quantity: newQty});
      
      // Log transaction
      await DeltaV.logInventoryTransaction(inventoryId, "deduct", quantity, referenceType, referenceId, `Deducted ${quantity} units from sale`);
      
      return {success: true, newQuantity: newQty, productName: p.item_name};
    }catch(e){
      console.error("Deduction failed:", e);
      return {success: false, reason: "error", error: e.message};
    }
  };
  
  // Log inventory transactions
  DeltaV.logInventoryTransaction = async function(inventoryId, transactionType, quantityChanged, referenceType, referenceId, notes){
    try{
      const data = {
        inventory_id: inventoryId,
        transaction_type: transactionType,
        quantity_changed: quantityChanged,
        reference_type: referenceType || null,
        reference_id: referenceId || null,
        notes: notes || null,
        created_by: (DeltaV.getUser() || {}).name || "System"
      };
      await DeltaV.dbIns("inventory_transactions", data);
    }catch(e){
      console.warn("Could not log transaction:", e);
      // Non-critical, don't throw
    }
  };
  
  // Bulk deduction for invoice/finance (checks all items)
  DeltaV.deductForSale = async function(parts, referenceType, referenceId){
    if(!Array.isArray(parts) || parts.length === 0){
      return {success: true, deducted: []};
    }
    
    const results = [];
    const warnings = [];
    
    // Pre-check all items
    for(const part of parts){
      if(!part.part_number || !part.quantity) continue;
      try{
        const products = await DeltaV.dbGet("inventory", "&item_code=eq."+encodeURIComponent(part.part_number)+"&limit=1");
        if(!products || products.length === 0){
          warnings.push(`❌ ${part.part_number} not in inventory`);
        } else {
          const available = products[0].quantity || 0;
          const needed = parseInt(part.quantity) || 1;
          if(available < needed){
            warnings.push(`⚠️ ${products[0].item_name}: only ${available} available (need ${needed})`);
          }
        }
      }catch(e){}
    }
    
    // Show warnings if any
    if(warnings.length > 0){
      const msg = "Stock Issues:\n\n" + warnings.join("\n") + "\n\nContinue with deduction?";
      const proceed = await new Promise(resolve => {
        resolve(confirm(msg));
      });
      
      if(!proceed){
        return {success: false, reason: "user_cancelled", warnings: warnings};
      }
    }
    
    // Deduct all items
    for(const part of parts){
      if(!part.part_number || !part.quantity) continue;
      try{
        const result = await DeltaV.deductFromInventory(part.part_number, part.quantity, referenceType, referenceId);
        if(result.success){
          results.push({partNumber: part.part_number, quantity: part.quantity, newQty: result.newQuantity});
        } else if(result.reason !== "user_cancelled"){
          // Already handled with warning
        }
      }catch(e){
        console.error(`Failed to deduct ${part.part_number}:`, e);
      }
    }
    
    return {success: true, deducted: results, warnings: warnings};
  };

  // Update schema.org telephone in JSON-LD
  DeltaV.updateSchemaPhone = function(phone){
    const schemas = document.querySelectorAll('script[type="application/ld+json"]');
    schemas.forEach(script=>{
      try{
        const data = JSON.parse(script.textContent);
        if(data.telephone) data.telephone = phone;
        if(data.mainEntity && data.mainEntity.telephone) data.mainEntity.telephone = phone;
        if(Array.isArray(data.service)){
          data.service.forEach(s=>{
            if(s.provider && s.provider.telephone) s.provider.telephone = phone;
          });
        }
        script.textContent = JSON.stringify(data);
      }catch(e){}
    });
  };

  // PAGE DATA WITH DETAILED INFO
  DeltaV._pageData = [
    {icon:'📊',name:'Dashboard',url:'dashboard.html',desc:'Overview and quick stats',details:'Central hub showing key metrics: bookings, revenue, inventory alerts, staff performance, upcoming tasks. View daily/weekly/monthly summaries. Quick access to recent activity, pending actions, and system status.',keywords:'dashboard overview stats metrics'},
    {icon:'📅',name:'Bookings',url:'admin.html',desc:'Manage customer bookings',details:'Book appointments, track customer requests, assign time slots. Manage booking status (pending, confirmed, completed). View customer vehicle details and service requirements. Send confirmations and reminders.',keywords:'bookings appointments schedule'},
    {icon:'🗓️',name:'Schedule',url:'schedule.html',desc:'Weekly/monthly schedule view',details:'Visual calendar view of all appointments and tasks. Drag-and-drop scheduling, color-coded by status/staff. See team availability and avoid double-bookings. Export and print schedule.',keywords:'schedule calendar weekly monthly'},
    {icon:'👥',name:'Customers',url:'customers.html',desc:'Customer database',details:'Complete customer profiles including contact info, vehicle history, booking history, service records, preferences. Segment customers, track loyalty status, manage communication preferences.',keywords:'customers contacts people profiles'},
    {icon:'📧',name:'Contact Inquiries',url:'contact_inquiries.html',desc:'Email inquiries and leads',details:'Manage inbound customer inquiries from website. Track response status, assign to staff, convert to bookings. Templates for common replies. Track conversion rates.',keywords:'contacts emails inquiries leads'},
    {icon:'💰',name:'Invoices',url:'invoices.html',desc:'Create and track invoices',details:'Generate professional invoices with auto-numbering. Add line items, apply discounts, calculate taxes. Track payment status, send reminders, view aging reports. Support partial payments.',keywords:'invoices billing payments'},
    {icon:'📦',name:'Inventory',url:'inventory.html',desc:'Parts and stock management',details:'Manage parts, tools, supplies. Set stock levels, reorder points, cost/sell prices. Track stock movements, set alerts for low stock. Categorize items. Calculate profit margins and stock value.',keywords:'inventory stock parts supplies products'},
    {icon:'💳',name:'Payments',url:'payments.html',desc:'Payment tracking',details:'Record customer and supplier payments. Multiple payment methods (cash, card, bank transfer). Match payments to invoices. Track payment terms and discounts. Aging analysis.',keywords:'payments transactions money'},
    {icon:'📈',name:'Finance',url:'finance.html',desc:'Financial overview',details:'Income/expense tracking, profit and loss statements, cash flow analysis. Budget vs actual comparisons. Tax reporting summaries. Financial trends and forecasts.',keywords:'finance money accounting budget'},
    {icon:'👷',name:'Workers',url:'workers.html',desc:'Staff management',details:'Employee profiles, roles, permissions. Work assignments and performance tracking. Certifications and qualifications. Contact info and emergency contacts.',keywords:'workers staff employees team'},
    {icon:'🔩',name:'Jobs',url:'jobs.html',desc:'Job cards and work orders',details:'Create detailed job cards for each service. Track progress, parts used, labor hours, completion status. Attach photos and notes. Link to customer and vehicle records.',keywords:'jobs work orders cards'},
    {icon:'📋',name:'Quotes',url:'quotes.html',desc:'Customer quotes',details:'Generate professional quotes with itemized services/parts. Track quote status and expiration. Convert quotes to jobs/invoices. Compare quote vs actual costs.',keywords:'quotes estimates pricing'},
    {icon:'🏭',name:'Suppliers',url:'suppliers.html',desc:'Supplier contacts',details:'Supplier database with contact info, payment terms, lead times. Track supplier performance and reliability. Manage supplier agreements and contracts.',keywords:'suppliers vendors contacts'},
    {icon:'🧾',name:'Expenses',url:'expenses.html',desc:'Track expenses',details:'Record business expenses (utilities, materials, rent, etc). Categorize expenses for tax purposes. Attach receipts and supporting docs. Monthly expense summaries.',keywords:'expenses costs spending'},
    {icon:'📉',name:'Reports',url:'reports.html',desc:'Reports and analytics',details:'Generate custom reports: revenue, expenses, parts usage, staff performance, customer trends. Filter by date, category, customer. Export to PDF/Excel. Scheduled reports.',keywords:'reports analytics data statistics'},
    {icon:'💬',name:'Messages',url:'messages.html',desc:'Internal messages',details:'Team communication and collaboration. Thread-based messaging. Notifications and read receipts. Search message history. Mention colleagues.',keywords:'messages chat communication'},
    {icon:'📝',name:'Notes',url:'notes.html',desc:'Quick notes and memos',details:'Quick note-taking for reminders and observations. Pin important notes. Tag for organization. Search and filter notes. Set reminders.',keywords:'notes memos reminders'},
    {icon:'🔔',name:'Reminders',url:'reminders.html',desc:'Task reminders',details:'Create task reminders with due dates. Set priority levels. Get notifications before deadline. Recurring reminders. Mark complete when done.',keywords:'reminders tasks deadlines'},
    {icon:'🚗',name:'Vehicles',url:'vehicles.html',desc:'Vehicle database',details:'Complete vehicle records: make/model/year, registration, VIN, color, owner. Service history, warranty info. MOT dates. Parts compatibility reference.',keywords:'vehicles cars registration vin'},
    {icon:'✅',name:'Tasks',url:'tasks.html',desc:'Task management',details:'Create and assign tasks to team. Set due dates, priority, descriptions. Track progress with status updates. Subtasks and dependencies. Task templates for recurring work.',keywords:'tasks todo projects assignments'},
    {icon:'⏱️',name:'Timesheets',url:'timesheets.html',desc:'Employee timesheets',details:'Track employee work hours daily/weekly. Record breaks and overtime. Approve timesheets. Export for payroll. Labor cost analysis.',keywords:'timesheets hours payroll labor'},
    {icon:'🛡️',name:'Warranties',url:'warranties.html',desc:'Warranty tracking',details:'Record warranty details on parts and services. Track expiration dates. Process warranty claims. Supplier warranty coverage. Customer warranty notifications.',keywords:'warranties claims coverage protection'},
    {icon:'🎁',name:'Promotions',url:'promotions.html',desc:'Customer promotions',details:'Create and manage promotional offers. Set discount codes, expiration dates, customer eligibility. Track redemption. Campaign performance analytics.',keywords:'promotions discounts offers codes'},
    {icon:'⭐',name:'Feedback',url:'feedback.html',desc:'Customer feedback',details:'Collect customer ratings and reviews. Track satisfaction scores. Manage complaints and follow-ups. Sentiment analysis. Feedback trends.',keywords:'feedback reviews ratings satisfaction'},
    {icon:'↩️',name:'Returns',url:'returns.html',desc:'Return management',details:'Process product returns and refunds. Track return reasons and disposition. Authorize returns. Restocking and warranty evaluation.',keywords:'returns refunds exchanges'},
    {icon:'⏳',name:'Waiting List',url:'waiting.html',desc:'Customer waiting list',details:'Track customers on waiting list for services/products. Priority order. Notification when available. Auto-notify features.',keywords:'waiting list waitlist queue'},
    {icon:'☑️',name:'Checklists',url:'checklist.html',desc:'Service checklists',details:'Pre-defined inspection checklists for quality control. Customize for different service types. Photo documentation. Pass/fail items. Compliance tracking.',keywords:'checklists inspection quality'},
    {icon:'🎯',name:'Targets',url:'targets.html',desc:'Sales targets',details:'Set individual and team sales targets. Track progress against targets. Monthly/quarterly goals. Performance bonuses. Target forecasting.',keywords:'targets sales goals performance'},
    {icon:'🔍',name:'Audit Log',url:'audit.html',desc:'System audit trail',details:'Complete audit trail of all system changes. View who changed what and when. Track user logins, data modifications, deletions. Compliance reporting.',keywords:'audit log history changes tracking'},
    {icon:'📸',name:'Gallery',url:'gallery_mgr.html',desc:'Photo and media gallery',details:'Upload and organize photos/videos of work. Before/after gallery. Link to job cards. Organize by customer, vehicle, or service. Generate media reports.',keywords:'gallery photos media images'},
    {icon:'📱',name:'SMS/Email',url:'sms.html',desc:'SMS and email messaging',details:'Send SMS and email to customers. Templates for common messages. Booking reminders, promotional messages, payment reminders. Delivery tracking.',keywords:'sms email messaging notifications'},
    {icon:'🏅',name:'Loyalty',url:'loyalty.html',desc:'Loyalty program',details:'Reward repeat customers with points/tier benefits. Define point rules and redemptions. Track member progress. Generate loyalty reports. Referral bonuses.',keywords:'loyalty rewards points members'},
    {icon:'🛒',name:'Parts Orders',url:'parts_orders.html',desc:'Parts ordering',details:'Order parts from suppliers. Track supply orders, delivery status. Stock on order. Auto-reorder when low stock. Supplier lead times and costs.',keywords:'orders parts suppliers purchasing'},
    {icon:'🔖',name:'MOT Tracker',url:'MOT.html',desc:'MOT tracking',details:'Track MOT test dates and results. Set reminders before expiry. Document failures and retests. Link to customer vehicles. Bulk notification.',keywords:'mot testing vehicle inspection'},
    {icon:'📜',name:'Service History',url:'service_history.html',desc:'Vehicle service history',details:'Complete service records for each vehicle. Maintenance intervals and schedules. Parts and labor used. Service cost analysis. Warranty claims.',keywords:'service history maintenance vehicles'},
    {icon:'📆',name:'Staff Rota',url:'staff_rota.html',desc:'Staff scheduling',details:'Create work schedules for team members. Shift planning and roster management. Manage availability and time-off. Notify staff of schedule changes.',keywords:'rota schedule shifts staffing'},
    {icon:'⏰',name:'Hours',url:'hours.html',desc:'Opening hours',details:'Set and manage business opening hours. Holiday closures. Location-specific hours. Publish on website and map services. Auto customer notifications.',keywords:'hours opening closing times'}
  ];

  // Update suggestions as user types
  DeltaV._updateNavSuggestions = function(){
    const search = document.getElementById('quickNavSearch');
    const dropdown = document.getElementById('navSuggestionsDropdown');
    if(!search || !dropdown) return;
    
    const query = search.value.toLowerCase().trim();
    if(!query){
      dropdown.style.display = 'none';
      return;
    }
    
    const matches = DeltaV._pageData.filter(p => 
      p.name.toLowerCase().includes(query) || p.keywords.includes(query)
    ).slice(0, 10);
    
    if(!matches.length){
      dropdown.style.display = 'none';
      return;
    }
    
    dropdown.innerHTML = matches.map(m => `
      <div onclick="quickNav('${m.url}')" style="padding:10px 12px;background:white;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:all .15s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
        <div style="font-weight:500;color:#1b2b3a;margin-bottom:2px">${m.icon} ${m.name}</div>
        <div style="font-size:.75rem;color:#94a3b8">${m.desc}</div>
      </div>
    `).join('');
    
    dropdown.style.display = 'block';
  };

  // Show suggestions dropdown
  DeltaV._showNavSuggestions = function(){
    const dropdown = document.getElementById('navSuggestionsDropdown');
    if(!dropdown) return;
    const search = document.getElementById('quickNavSearch');
    if(search && search.value) DeltaV._updateNavSuggestions();
  };

  // Quick navigation with autocomplete
  DeltaV.quickNav = function(specificUrl){
    const search = document.getElementById('quickNavSearch');
    const dropdown = document.getElementById('navSuggestionsDropdown');
    
    // If called with url (from suggestion), navigate directly
    if(specificUrl){
      window.location.href = specificUrl;
      return;
    }
    
    // Otherwise search manually
    if(!search) return;
    const query = search.value.toLowerCase().trim();
    if(!query){
      DeltaV.toast('Enter a page name','wa');
      return;
    }
    
    const match = DeltaV._pageData.find(p => p.name.toLowerCase().includes(query));
    if(match){
      dropdown.style.display = 'none';
      window.location.href = match.url;
    }else{
      DeltaV.toast('Page not found','wa');
    }
  };

  // MASSIVELY EXPANDED PAGE GUIDE
  DeltaV.showPageGuide = function(){
    // Remove any existing guide modal
    const existing = document.getElementById('deltavGuideModal');
    if(existing) existing.remove();
    // Also close shortcuts if open
    const shortcuts = document.getElementById('deltavShortcutsModal');
    if(shortcuts) shortcuts.remove();
    
    const pages = DeltaV._pageData;
    
    const html = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
        ${pages.map(p=>`
          <div style="padding:20px;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-radius:10px;border:1px solid #cbd5e1;cursor:pointer;transition:all .3s;box-shadow:0 1px 3px rgba(0,0,0,.08)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 16px rgba(0,0,0,.15)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,.08)'" onclick="location.href='${p.url}'">
            <div style="font-size:2.5rem;margin-bottom:12px">${p.icon}</div>
            <div style="font-weight:700;color:#0f172a;margin-bottom:8px;font-size:1.1rem">${p.name}</div>
            <div style="font-size:.9rem;color:#334155;margin-bottom:12px;line-height:1.5">${p.desc}</div>
            <div style="font-size:.85rem;color:#64748b;line-height:1.6;padding-top:12px;border-top:1px solid #cbd5e1">${p.details}</div>
          </div>
        `).join('')}
      </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.id = 'deltavGuideModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;backdrop-filter:blur(2px)';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:white;border-radius:14px;padding:40px;max-width:1200px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.3);pointer-events:auto';
    modalContent.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #e2e8f0;position:sticky;top:0;background:white;z-index:10">
        <h2 style="margin:0;color:#0f172a;font-size:1.8rem">📚 DeltaV System Guide</h2>
        <button id="guideCloseBtn" style="border:none;background:none;font-size:2.2rem;cursor:pointer;color:#64748b;padding:0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;transition:all .2s" onmouseover="this.style.color='#1b2b3a';this.style.transform='scale(1.1)'" onmouseout="this.style.color='#64748b';this.style.transform='scale(1)'">&times;</button>
      </div>
      
      <div style="background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:28px;display:flex;gap:12px;align-items:center">
        <div style="font-size:1.8rem">⌨️</div>
        <div>
          <div style="font-weight:700;color:#92400e;margin-bottom:4px">💡 Pro Tip: Press Ctrl+Shift+? to see all keyboard shortcuts</div>
          <div style="font-size:.9rem;color:#b45309">You can navigate and work faster with keyboard shortcuts available throughout the system!</div>
        </div>
      </div>
      
      <p style="color:#475569;margin-bottom:24px;font-size:.95rem">Click any section below for comprehensive information about each feature area. Navigate between modules seamlessly to manage your entire business operations.</p>
      ${html}
    `;
    
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);
    
    // Close handlers - overlay click and button click
    overlay.addEventListener('click', function(e){
      if(e.target === overlay){
        overlay.remove();
      }
    });
    
    document.getElementById('guideCloseBtn').addEventListener('click', function(e){
      e.stopPropagation();
      overlay.remove();
    });
    
    // Allow Escape key to close
    const closeOnEscape = function(e){
      if(e.key === 'Escape'){
        overlay.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
  };

  // Enhanced keyboard shortcuts system
  DeltaV.showShortcuts = function(){
    // Remove any existing shortcuts modal
    const existing = document.getElementById('deltavShortcutsModal');
    if(existing) existing.remove();
    // Also close guide if open
    const guide = document.getElementById('deltavGuideModal');
    if(guide) guide.remove();
    
    const shortcuts = [
      { keys: 'Ctrl+K / Cmd+K', action: 'Quick search & navigation', icon: '🔍' },
      { keys: 'Ctrl+G / Cmd+G', action: 'Show page guide', icon: '📚' },
      { keys: 'Ctrl+Home', action: 'Go to dashboard', icon: '📊' },
      { keys: 'Ctrl+N / Cmd+N', action: 'Create new item (context)', icon: '✨' },
      { keys: 'Ctrl+S / Cmd+S', action: 'Save/submit form', icon: '💾' },
      { keys: 'Escape', action: 'Close modal or guide', icon: '❌' },
      { keys: 'Ctrl+Shift+?', action: 'Show this shortcuts list', icon: '⌨️' }
    ];
    
    const overlay = document.createElement('div');
    overlay.id = 'deltavShortcutsModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(2px)';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:#fff;border-radius:12px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;box-shadow:0 25px 50px rgba(0,0,0,.3)';
    
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h2 style="margin:0;color:#1b2b3a;font-size:1.5rem">⌨️ Keyboard Shortcuts</h2>
        <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#94a3b8">×</button>
      </div>
      <div style="display:grid;gap:12px">
        ${shortcuts.map(s => `
          <div style="display:flex;gap:12px;padding:12px;background:#f8f9fb;border-radius:8px;align-items:center">
            <span style="font-size:1.4rem">${s.icon}</span>
            <div style="flex:1">
              <div style="font-weight:600;color:#1b2b3a;font-family:monospace;font-size:.85rem">${s.keys}</div>
              <div style="color:#64748b;font-size:.85rem">${s.action}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:20px;padding:12px;background:#fffaf0;border-left:3px solid #ffc107;border-radius:6px;font-size:.85rem;color:#744210">
        💡 <strong>Tip:</strong> Use Ctrl+K to quickly search and navigate to any page
      </div>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) overlay.remove();
    });
  };

  // Enhanced keyboard shortcuts (global)
  document.addEventListener('keydown', e => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrl = isMac ? e.metaKey : e.ctrlKey;
    
    // Escape: Close modals and guide
    if(e.key === 'Escape'){
      document.querySelectorAll('.modal.show').forEach(m => DeltaV.closeM(m.id));
      const overlay = document.querySelector('div[style*="z-index:9999"]');
      if(overlay) overlay.remove();
    }
    
    // Ctrl+K (Cmd+K on Mac): Focus search
    if(isCtrl && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      const search = document.getElementById('quickNavSearch');
      if(search){
        search.focus();
        search.select();
      }
    }
    
    // Ctrl+G (Cmd+G on Mac): Show guide
    if(isCtrl && e.key.toLowerCase() === 'g'){
      e.preventDefault();
      DeltaV.showPageGuide();
    }
    
    // Ctrl+Home: Go to dashboard
    if(isCtrl && e.key === 'Home'){
      e.preventDefault();
      window.location.href = 'dashboard.html';
    }
    
    // Ctrl+Shift+?: Show shortcuts
    if(isCtrl && e.shiftKey && e.key === '?'){
      e.preventDefault();
      DeltaV.showShortcuts();
    }
    
    // Ctrl+S (Cmd+S on Mac): Save form
    if(isCtrl && e.key.toLowerCase() === 's'){
      e.preventDefault();
      const saveBtn = document.querySelector('[onclick*="saveData"],[onclick*="saveTx"],[onclick*="saveInv"],[onclick*="saveSettings"]');
      if(saveBtn){
        saveBtn.click();
        DeltaV.toast('💾 Saved!','ok');
      }
    }
    
    // Ctrl+N (Cmd+N on Mac): Create new
    if(isCtrl && e.key.toLowerCase() === 'n'){
      e.preventDefault();
      const newBtn = document.querySelector('[onclick*="openNew"],[onclick*="openNewInv"],[onclick*="addRow"]');
      if(newBtn){
        newBtn.click();
      }
    }
  });

  // Window exports
  win.getNextInvoiceNum = DeltaV.getNextInvoiceNum;
  win.formatInvoiceNum = DeltaV.formatInvoiceNum;
  win.setCompanySettings = DeltaV.setCompanySettings;
  win.getCompanySettings = DeltaV.getCompanySettings;
  win.setCompanyName = DeltaV.setCompanyName;
  win.getCompanyName = DeltaV.getCompanyName;
  win.setCompanyPhone = DeltaV.setCompanyPhone;
  win.getCompanyPhone = DeltaV.getCompanyPhone;
  win.setCompanyEmail = DeltaV.setCompanyEmail;
  win.getCompanyEmail = DeltaV.getCompanyEmail;
  win.setCompanyAddress = DeltaV.setCompanyAddress;
  win.getCompanyAddress = DeltaV.getCompanyAddress;
  win.setCompanyVAT = DeltaV.setCompanyVAT;
  win.getCompanyVAT = DeltaV.getCompanyVAT;
  win.updateSchemaPhone = DeltaV.updateSchemaPhone;
  win.getCompanySettingsFromDB = DeltaV.getCompanySettingsFromDB;
  win.saveCompanySettingsToDB = DeltaV.saveCompanySettingsToDB;
  win.deductFromInventory = DeltaV.deductFromInventory;
  win.deductForSale = DeltaV.deductForSale;
  win.logInventoryTransaction = DeltaV.logInventoryTransaction;
  win.quickNav = DeltaV.quickNav;
  win.showPageGuide = DeltaV.showPageGuide;

  // Initialize dark mode on page load
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', DeltaV.initDarkMode);
  } else {
    DeltaV.initDarkMode();
  }

  // Auto-load company settings from Supabase on page load
  window.addEventListener('DOMContentLoaded', async function(){
    try{
      const dbSettings = await DeltaV.getCompanySettingsFromDB();
      if(dbSettings){
        _cachedSettings = dbSettings;
      }
    }catch(e){
      console.warn('Could not load settings from Supabase, using defaults',e);
    }
  });

})(window);
