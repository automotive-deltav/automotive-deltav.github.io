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
