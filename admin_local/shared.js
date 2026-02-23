// DeltaV shared utilities - namespaced, cleaned and backward-compatible
(function(win){
  const DeltaV = win.DeltaV = win.DeltaV || {};

  // Supabase REST endpoint and key (kept for compatibility)
  DeltaV.SB = "https://cxzapvieqzqfxzolqwoh.supabase.co";
  DeltaV.KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";
  DeltaV.H = {"apikey":DeltaV.KEY,"Authorization":`Bearer ${DeltaV.KEY}`,"Content-Type":"application/json"};

  // Central fetch helper with JSON response handling
  DeltaV._fetch = async function(url, opts={}){
    try{
      const res = await fetch(url, opts);
      if(!res.ok){
        const txt = await res.text().catch(()=>res.statusText||"Error");
        throw new Error(txt || res.statusText || 'Request failed');
      }
      // Some Supabase endpoints return empty body on success
      const ct = res.headers.get('content-type') || '';
      return ct.includes('application/json') ? await res.json() : null;
    }catch(err){
      console.error('Fetch error',url,err);
      throw err;
    }
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

  // Company phone number sync - stored in localStorage, synced from settings
  DeltaV.setCompanyPhone = function(phone){
    localStorage.setItem('dv_company_phone', phone || '0121 XXX XXXX');
  };

  DeltaV.getCompanyPhone = function(){
    return localStorage.getItem('dv_company_phone') || '0121 XXX XXXX';
  };

  // Window exports
  win.getNextInvoiceNum = DeltaV.getNextInvoiceNum;
  win.formatInvoiceNum = DeltaV.formatInvoiceNum;
  win.setCompanyPhone = DeltaV.setCompanyPhone;
  win.getCompanyPhone = DeltaV.getCompanyPhone;

})(window);
