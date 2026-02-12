const SB="https://cxzapvieqzqfxzolqwoh.supabase.co";
const KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";
const H={"apikey":KEY,"Authorization":`Bearer ${KEY}`,"Content-Type":"application/json"};

async function dbGet(t,q=""){try{const r=await fetch(`${SB}/rest/v1/${t}?select=*${q}`,{headers:H});if(!r.ok)return[];return r.json();}catch(e){console.error(e);return[];}}
async function dbIns(t,d){const r=await fetch(`${SB}/rest/v1/${t}`,{method:"POST",headers:{...H,"Prefer":"return=representation"},body:JSON.stringify(d)});if(!r.ok)throw new Error(await r.text());return r.json();}
async function dbUpd(t,id,d){const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:H,body:JSON.stringify(d)});if(!r.ok)throw new Error(await r.text());}
async function dbDel(t,id){const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:H});if(!r.ok)throw new Error(await r.text());}

function openM(id){document.getElementById(id)?.classList.add("show");}
function closeM(id){document.getElementById(id)?.classList.remove("show");}
document.addEventListener("click",e=>{if(e.target.classList.contains("modal"))e.target.classList.remove("show");});

function showToast(msg,type="success"){
  const t=document.createElement("div");
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${type==="success"?"✓":"✕"}</span><span>${msg}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add("show"));
  setTimeout(()=>{t.classList.remove("show");setTimeout(()=>t.remove(),350);},3500);
}

function showError(msg){
  document.getElementById("errorMsg").textContent=msg;
  openM("mError");
}

function confirmDel(msg,cb){
  document.getElementById("mDelMsg").textContent=msg;
  document.getElementById("mDelBtn").onclick=()=>{closeM("mDel");cb();};
  openM("mDel");
}

document.addEventListener("DOMContentLoaded",()=>{
  const burger=document.querySelector(".sb-logo");
  const nav=document.querySelector(".sidebar nav");
  if(burger&&nav&&window.innerWidth<=768){
    burger.style.cursor="pointer";
    burger.addEventListener("click",()=>nav.classList.toggle("show"));
  }
});
// Shorthand toast function
function toast(msg,type="success"){showToast(msg,type==="in"?"info":type==="er"?"error":type);}

// Format helpers
function fmtD(d){if(!d)return"—";const dt=new Date(d);return dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});}
function fmtGBP(n){return"£"+(parseFloat(n)||0).toFixed(2);}
function today(){return new Date().toISOString().split("T")[0];}

// Enhanced modal with animations
function openM(id){
  const m=document.getElementById(id);
  if(!m)return;
  m.classList.add("show");
  const box=m.querySelector(".mbox");
  if(box)box.style.animation="slideUp .3s";
}
function closeM(id){
  const m=document.getElementById(id);
  if(!m)return;
  const box=m.querySelector(".mbox");
  if(box)box.style.animation="slideDown .2s";
  setTimeout(()=>m.classList.remove("show"),150);
}

// Click outside to close
document.addEventListener("click",e=>{
  if(e.target.classList.contains("modal")){
    const id=e.target.id;
    if(id)closeM(id);
  }
});

// Keyboard shortcuts
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    document.querySelectorAll(".modal.show").forEach(m=>closeM(m.id));
  }
  // Ctrl/Cmd+S to save
  if((e.ctrlKey||e.metaKey)&&e.key==="s"){
    e.preventDefault();
    const saveBtn=document.querySelector("[onclick*='saveData'],[onclick*='saveTx'],[onclick*='saveInv']");
    if(saveBtn)saveBtn.click();
  }
  // Ctrl/Cmd+N for new
  if((e.ctrlKey||e.metaKey)&&e.key==="n"){
    e.preventDefault();
    const newBtn=document.querySelector("[onclick*='openNew'],[onclick*='openNewInv']");
    if(newBtn)newBtn.click();
  }
});

// Enhanced search with highlighting
window.enhanceSearch=function(inputId,targetSelector){
  const input=document.getElementById(inputId);
  if(!input)return;
  input.addEventListener("input",()=>{
    const q=input.value.toLowerCase();
    document.querySelectorAll(targetSelector).forEach(el=>{
      if(!q){
        el.style.display="";
        el.style.opacity="1";
        return;
      }
      const text=el.textContent.toLowerCase();
      if(text.includes(q)){
        el.style.display="";
        el.style.opacity="1";
        // Highlight matches
        el.style.backgroundColor="rgba(255,102,0,.1)";
      }else{
        el.style.opacity=".3";
      }
    });
  });
};

// Sortable column headers
window.sortTable=function(table,colIndex,type="text"){
  const rows=[...table.querySelectorAll("tbody tr")];
  const isAsc=table.dataset.sortCol===colIndex&&!table.dataset.sortAsc;
  rows.sort((a,b)=>{
    let av=a.cells[colIndex]?.textContent.trim();
    let bv=b.cells[colIndex]?.textContent.trim();
    if(type==="number"){av=parseFloat(av)||0;bv=parseFloat(bv)||0;}
    if(type==="date"){av=new Date(av);bv=new Date(bv);}
    const cmp=av<bv?-1:av>bv?1:0;
    return isAsc?-cmp:cmp;
  });
  rows.forEach(r=>table.querySelector("tbody").appendChild(r));
  table.dataset.sortCol=colIndex;
  table.dataset.sortAsc=!isAsc;
  // Visual indicator
  table.querySelectorAll("th").forEach((h,i)=>{
    h.style.cursor="pointer";
    h.style.color=i==colIndex?'var(--ac)':'inherit';
    h.textContent+=i==colIndex?(isAsc?" ↓":" ↑"):"";
  });
};

// Auto-save with debounce
window.autoSave=function(inputs,saveCallback,delay=2000){
  let timeout;
  const handler=()=>{
    clearTimeout(timeout);
    timeout=setTimeout(()=>{
      const data={};
      inputs.forEach(id=>{
        const el=document.getElementById(id);
        if(el)data[id]=el.value;
      });
      saveCallback(data);
      toast("Auto-saved","in");
    },delay);
  };
  inputs.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener("input",handler);
  });
};

// Form validation
window.validateForm=function(formId){
  const form=document.getElementById(formId)||document.querySelector(formId);
  if(!form)return true;
  const required=form.querySelectorAll("[required]");
  let valid=true;
  required.forEach(el=>{
    if(!el.value.trim()){
      el.classList.add("input-error");
      el.closest(".fg")?.style.backgroundColor="rgba(220,53,69,.05)";
      valid=false;
    }else{
      el.classList.remove("input-error");
      el.closest(".fg")?.style.backgroundColor="";
    }
  });
  return valid;
};

// Real-time field validation
window.validateField=function(id,pattern){
  const el=document.getElementById(id);
  if(!el)return;
  el.addEventListener("input",()=>{
    const isValid=pattern.test(el.value);
    if(el.value){
      el.classList.toggle("input-success",isValid);
      el.classList.toggle("input-error",!isValid);
    }else{
      el.classList.remove("input-success","input-error");
    }
  });
};

// Expandable rows
window.makeExpandable=function(tableSelector){
  const table=document.querySelector(tableSelector);
  if(!table)return;
  table.querySelectorAll("tbody tr").forEach(row=>{
    const expandBtn=document.createElement("span");
    expandBtn.style.cssText="cursor:pointer;font-weight:bold;color:var(--ac)";
    expandBtn.textContent="▼";
    expandBtn.onclick=e=>{
      e.stopPropagation();
      const detail=row.nextElementSibling;
      if(detail&&detail.classList.contains("row-detail")){
        detail.style.display=detail.style.display==="none"?"":"none";
        expandBtn.textContent=detail.style.display==="none"?"▶":"▼";
      }
    };
    row.firstCell?.prepend(expandBtn);
  });
};

// Loading state manager
window.withLoading=async function(callback,btnElement){
  if(!btnElement)return callback();
  const original=btnElement.innerHTML;
  btnElement.innerHTML="⏳ Loading...";
  btnElement.disabled=true;
  try{
    await callback();
  }catch(e){
    console.error(e);
    toast("Error: "+e.message,"er");
  }finally{
    btnElement.innerHTML=original;
    btnElement.disabled=false;
  }
};

// Progressive data loading (infinite scroll)
window.infiniteScroll=function(containerId,loadMoreCallback,threshold=200){
  const container=document.getElementById(containerId);
  if(!container)return;
  window.addEventListener("scroll",()=>{
    if((window.innerHeight+window.scrollY)>=document.body.offsetHeight-threshold){
      loadMoreCallback();
    }
  });
};

// Filter utilities
window.filterData=function(data,query,fields){
  const q=query.toLowerCase();
  return data.filter(item=>
    fields.some(field=>(item[field]||"").toString().toLowerCase().includes(q))
  );
};

// Debounce search
window.debounceSearch=function(inputId,callback,delay=300){
  let timeout;
  const input=document.getElementById(inputId);
  if(!input)return;
  input.addEventListener("input",e=>{
    clearTimeout(timeout);
    timeout=setTimeout(()=>callback(e.target.value),delay);
  });
};

// Quick filter buttons
window.quickFilter=function(btnClass,filterAttr,dataAttr){
  document.querySelectorAll("."+btnClass).forEach(btn=>{
    btn.addEventListener("click",()=>{
      const filter=btn.getAttribute(filterAttr);
      document.querySelectorAll("["+dataAttr+"]").forEach(item=>{
        const itemFilter=item.getAttribute(dataAttr);
        item.style.display=(!filter||itemFilter===filter)?"":"none";
        item.style.opacity=(!filter||itemFilter===filter)?"1":"0.4";
      });
      // Highlight active button
      document.querySelectorAll("."+btnClass).forEach(b=>b.style.borderColor="var(--br)");
      btn.style.borderColor="var(--ac)";
    });
  });
};

// Batch operations
window.batchSelect=function(checkboxId,itemClass){
  const mainCheck=document.getElementById(checkboxId);
  if(!mainCheck)return;
  mainCheck.addEventListener("change",()=>{
    document.querySelectorAll("."+itemClass).forEach(item=>{
      const check=item.querySelector("input[type='checkbox']");
      if(check)check.checked=mainCheck.checked;
    });
  });
};

// Confirm before action
window.confirmAction=function(action,callback){
  const msg=`Are you sure you want to ${action}?`;
  if(confirm(msg))callback();
};

// Keyboard shortcuts help
window.showKeyboardHelp=function(){
  alert(`⌨️ Keyboard Shortcuts:\n\nEsc - Close modal\nCtrl+S - Save\nCtrl+N - New\nCtrl+F - Search`);
};