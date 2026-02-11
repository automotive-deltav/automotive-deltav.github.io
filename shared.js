const SB="https://cxzapvieqzqfxzolqwoh.supabase.co";
const KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emFwdmllcXpxZnh6b2xxd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjU4MzgsImV4cCI6MjA4NjE0MTgzOH0.x_F07XpdThY6EqwaP8jJGgdBIMTHdYfTr99IMOpSq_E";
const H={"apikey":KEY,"Authorization":`Bearer ${KEY}`,"Content-Type":"application/json"};

async function dbGet(t,q=""){const r=await fetch(`${SB}/rest/v1/${t}?select=*${q}`,{headers:H});if(!r.ok)throw new Error(await r.text());return r.json();}
async function dbIns(t,d){const r=await fetch(`${SB}/rest/v1/${t}`,{method:"POST",headers:{...H,"Prefer":"return=representation"},body:JSON.stringify(d)});if(!r.ok)throw new Error(await r.text());return r.json();}
async function dbUpd(t,id,d){const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"PATCH",headers:H,body:JSON.stringify(d)});if(!r.ok)throw new Error(await r.text());}
async function dbDel(t,id){const r=await fetch(`${SB}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:H});if(!r.ok)throw new Error(await r.text());}

function openM(id){document.getElementById(id)?.classList.add("show");}
function closeM(id){document.getElementById(id)?.classList.remove("show");}
document.addEventListener("click",e=>{if(e.target.classList.contains("modal"))e.target.classList.remove("show");});

function toast(msg,type="ok"){
  const el=document.createElement("div");
  el.className=`toast t-${type}`;
  el.textContent=msg;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("show"));
  setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),320);},3000);
}

const today=()=>new Date().toISOString().split("T")[0];
const fmtD=d=>d?new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"—";
const fmtGBP=n=>"£"+(parseFloat(n)||0).toFixed(2);
const fmtT=t=>t?t.slice(0,5):"—";
const inv_num=id=>"INV-"+String(id).padStart(4,"0").slice(-4);

function attachAC(input,list,onPick){
  let drop=input.parentElement.querySelector(".ac-drop");
  if(!drop){drop=document.createElement("div");drop.className="ac-drop";input.parentElement.appendChild(drop);}
  input.addEventListener("input",()=>{
    const q=input.value.toLowerCase().trim();drop.innerHTML="";
    if(!q){drop.style.display="none";return;}
    const hits=list.filter(s=>String(s).toLowerCase().includes(q)).slice(0,8);
    if(!hits.length){drop.style.display="none";return;}
    hits.forEach(m=>{const d=document.createElement("div");d.className="ac-item";d.textContent=m;d.onmousedown=()=>{input.value=m;drop.style.display="none";if(onPick)onPick(m);};drop.appendChild(d);});
    drop.style.display="block";
  });
  input.addEventListener("blur",()=>setTimeout(()=>{drop.style.display="none";},160));
}

// Professional confirm delete modal
function confirmDel(msg,cb){
  document.getElementById("mDelMsg").textContent=msg;
  document.getElementById("mDelBtn").onclick=()=>{closeM("mDel");cb();};
  openM("mDel");
}

// Professional prompt modal
function showPrompt(title, message, placeholder, callback){
  if(!document.getElementById("mPrompt")){
    const m=document.createElement("div");
    m.className="modal";
    m.id="mPrompt";
    m.innerHTML=`<div class="mbox" style="max-width:450px">
      <h3 id="mPromptTitle"></h3>
      <p id="mPromptMsg" style="color:#666;margin-bottom:14px"></p>
      <div class="fg">
        <input type="text" id="mPromptInput" placeholder="" style="width:100%">
      </div>
      <div class="mfoot">
        <button class="btn btn-ghost" onclick="closeM('mPrompt')">Cancel</button>
        <button class="btn btn-primary" id="mPromptBtn">Submit</button>
      </div>
    </div>`;
    document.body.appendChild(m);
  }
  document.getElementById("mPromptTitle").textContent=title;
  document.getElementById("mPromptMsg").textContent=message;
  document.getElementById("mPromptInput").placeholder=placeholder;
  document.getElementById("mPromptInput").value="";
  document.getElementById("mPromptBtn").onclick=()=>{
    const val=document.getElementById("mPromptInput").value.trim();
    if(val){closeM("mPrompt");callback(val);}
  };
  openM("mPrompt");
  setTimeout(()=>document.getElementById("mPromptInput").focus(),100);
}

// Professional alert modal
function showAlert(title, message, type="info"){
  if(!document.getElementById("mAlert")){
    const m=document.createElement("div");
    m.className="modal";
    m.id="mAlert";
    m.innerHTML=`<div class="mbox" style="max-width:450px">
      <h3 id="mAlertTitle"></h3>
      <p id="mAlertMsg" style="color:#666;margin-bottom:14px;line-height:1.7"></p>
      <div class="mfoot">
        <button class="btn btn-primary btn-fw" onclick="closeM('mAlert')">OK</button>
      </div>
    </div>`;
    document.body.appendChild(m);
  }
  const icons={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"};
  document.getElementById("mAlertTitle").textContent=(icons[type]||"")+title;
  document.getElementById("mAlertMsg").textContent=message;
  openM("mAlert");
}

// Mobile menu toggle
document.addEventListener("DOMContentLoaded",()=>{
  const sidebar=document.querySelector(".sidebar");
  const nav=sidebar?.querySelector("nav");
  
  if(sidebar&&window.innerWidth<=768){
    sidebar.addEventListener("click",(e)=>{
      if(e.target===sidebar||e.target.closest(".sb-logo")){
        nav?.classList.toggle("show");
        document.body.classList.toggle("menu-open");
      }
    });
    
    document.addEventListener("click",(e)=>{
      if(!sidebar.contains(e.target)&&nav?.classList.contains("show")){
        nav.classList.remove("show");
        document.body.classList.remove("menu-open");
      }
    });
    
    nav?.querySelectorAll("a").forEach(link=>{
      link.addEventListener("click",()=>{
        nav.classList.remove("show");
        document.body.classList.remove("menu-open");
      });
    });
  }
  
  // Public header mobile menu
  const pubHeader=document.querySelector(".pub-h");
  const pubNav=pubHeader?.querySelector(".pub-nav");
  
  if(pubHeader&&pubNav&&window.innerWidth<=768){
    const burger=document.createElement("button");
    burger.innerHTML="☰";
    burger.style.cssText="position:absolute;right:16px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;font-size:1.6rem;cursor:pointer;padding:8px";
    pubHeader.appendChild(burger);
    
    burger.addEventListener("click",(e)=>{
      e.stopPropagation();
      pubNav.classList.toggle("show");
    });
    
    document.addEventListener("click",(e)=>{
      if(!pubHeader.contains(e.target)&&pubNav.classList.contains("show")){
        pubNav.classList.remove("show");
      }
    });
    
    pubNav.querySelectorAll("a").forEach(link=>{
      link.addEventListener("click",()=>{
        pubNav.classList.remove("show");
      });
    });
  }
});
