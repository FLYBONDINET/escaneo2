// ==========================================================
//  APP.JS — VERSIÓN REARMADA, LIMPIA Y CORREGIDA (FOCO FIJO)
// ==========================================================

(function(){

let flights = [];
let currentFlightId = null;
let lastFlightId = null;
let allCodesGlobal = new Set();
let confirming = false;

const $ = s => document.querySelector(s);

function getFlight(id){
  return flights.find(f => f.id === id) || null;
}

// ----------------------------------------------------------
// Crear vuelos desde formulario
// ----------------------------------------------------------
function buildFlightsFromForm(){
  flights = [];
  allCodesGlobal = new Set();

  const rows = document.querySelectorAll('#flightRows .flight-row');
  let i = 0;

  rows.forEach(r=>{
    const n = r.querySelector('.flight-num')?.value.trim();
    const d = r.querySelector('.flight-dest')?.value.trim();

    if(!n) return;

    flights.push({
      id: "f"+(i++)+"_"+Date.now(),
      number: n,
      dest: d || "",
      codes: [],
      babies: 0,
      totalFinal: 0,
      closed: false,
      saved: false
    });
  });
}

// ----------------------------------------------------------
// Iniciar escaneo
// ----------------------------------------------------------
function iniciar(){
  const dia = $("#dia").value.trim();
  const mal = $("#maletero").value.trim();

  if(!dia || !mal){
    alert("Completá día y maletero");
    return;
  }

  buildFlightsFromForm();

  if(flights.length === 0){
    alert("Agregá un vuelo");
    return;
  }

  currentFlightId = flights[0].id;
  lastFlightId = flights[0].id;

  $("#form").style.display = "none";
  $("#scanner").style.display = "block";

  renderFlightsPanel();
  actualizarContador();

  focusBarcodeInput();
}

// ----------------------------------------------------------
function renderFlightsPanel(){
  const box = $("#flightsPanel");
  box.innerHTML = "";

  flights.filter(f=>!f.closed).forEach(f=>{
    const div = document.createElement("div");
    div.className = "flight-pill";
    div.dataset.id = f.id;
    div.innerHTML = `
      <div class="flight-pill-header">
        <span>${f.number}</span>
        <span class="flight-pill-dest">${f.dest}</span>
      </div>
      <div class="flight-pill-count">Bolsas: ${f.codes.length}</div>
    `;
    div.onclick = ()=>{ currentFlightId = f.id; lastFlightId = f.id; actualizarContador(); };
    box.appendChild(div);
  });
}

// ----------------------------------------------------------
function actualizarContador(){
  const f = getFlight(currentFlightId);
  if(!f){
    $("#badgeVuelo").textContent = "Sin vuelo";
    $("#badgeContador").textContent = "0 valijas";
    return;
  }
  $("#badgeVuelo").textContent = "Vuelo " + f.number + (f.dest ? ` (${f.dest})` : "");
  $("#badgeContador").textContent = `${f.codes.length} valijas`;
}

// ----------------------------------------------------------
// Procesar código del scanner
// ----------------------------------------------------------
function handleScannedCode(raw){
<<<<<<< HEAD
  if (!raw || confirming) return;
=======
  if (!raw) return;
  if (confirming) return;
>>>>>>> parent of 5bb123a (ds)

  let v = String(raw);
  v = v.replace(/[^\x20-\x7E]/g, "");
  v = v.replace(/\s+/g, "");
  v = v.replace(/\D/g, "");

  if (v.length < 10){
    v = v.padStart(10, "0");
  }
  if (v.length > 10){
    v = v.slice(0, 10);
  }

  if (!v) return;

  $("#codeEdit").value = v;
  updateFlightSelectInModal();

  $("#dupWarn").style.display = allCodesGlobal.has(v) ? "block" : "none";

  confirming = true;
  $("#confirmModal").style.display = "flex";
  $("#codeEdit").focus();
  $("#codeEdit").select();
}

// ----------------------------------------------------------
function acceptCode(){
  const code = ($("#codeEdit").value || "").trim();
  const flightId = $("#codeFlightSelect").value;
  const flight = getFlight(flightId);

  if(!code || !flight) return;

  if(allCodesGlobal.has(code)){
    alert("Código duplicado en esta sesión");
    return;
  }

  allCodesGlobal.add(code);
  flight.codes.push({ code });

  currentFlightId = flight.id;
  lastFlightId = flight.id;

  renderFlightsPanel();
  actualizarContador();

  confirming = false;
  $("#confirmModal").style.display = "none";

  focusBarcodeInput();
}

// ----------------------------------------------------------
async function guardarVueloEnSheet(f){
  const dia = $("#dia").value.trim();
  const mal = $("#maletero").value.trim();

  const payload = {
    day: dia,
    porter: mal,
    flight: f.number,
    destination: f.dest,
    total: f.codes.length,
    totalFinal: f.codes.length,
    codes: f.codes.map(c => String(c.code))
  };

  try{
    const res = await fetch(WEBAPP_URL,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(payload)
    });
    const data = await res.json();
    if(data.ok) return true;
    alert("Error en WebApp");
    return false;
  }catch(e){
    alert("No se pudo enviar");
    return false;
  }
}

// ----------------------------------------------------------
async function onCloseFlight(){
  const f = getFlight(currentFlightId);
  if(!f) return;

  const ok = await guardarVueloEnSheet(f);
  if(ok){
    f.closed = true;
    f.saved = true;
    alert("Vuelo guardado ✔️");
  }

  renderFlightsPanel();
  actualizarContador();
}

// ----------------------------------------------------------
// INPUT INVISIBLE PARA SCANNER
// ----------------------------------------------------------
function ensureInput(){
  let i = document.getElementById("barcodeInput");
  if(i) return i;

  i = document.createElement("input");
  i.type = "text";
  i.id = "barcodeInput";
  i.style.opacity = "0";
  i.style.position = "absolute";
  i.style.left = "-9999px";
  document.body.appendChild(i);
  return i;
}

function focusBarcodeInput(){
  const i = ensureInput();
  try{ i.focus(); }catch{}
}

function attachBarcodeListeners(){
  const i = ensureInput();

  // ENTER → código completo
  i.addEventListener("keydown", e=>{
    if(e.key === "Enter"){
      const v = i.value.trim();
      i.value = "";
      if(v) handleScannedCode(v);
      e.preventDefault();
    }
  });

  // Tiempo sin teclear → se considera código completo
  let t = null;
  i.addEventListener("input", ()=>{
    if(t) clearTimeout(t);
    t = setTimeout(()=>{
      const v = i.value.trim();
      if(v){
        handleScannedCode(v);
        i.value = "";
      }
    },80);
  });

  // ⚠️ SE ELIMINÓ el listener global que robaba el foco
}

// ----------------------------------------------------------
function updateFlightSelectInModal(){
  const sel = $("#codeFlightSelect");
  sel.innerHTML = "";

  flights.filter(f=>!f.closed).forEach(f=>{
    const o = document.createElement("option");
    o.value = f.id;
    o.textContent = f.number;
    sel.appendChild(o);
  });

  sel.value = lastFlightId || sel.firstChild?.value;
}

// ----------------------------------------------------------
document.addEventListener("DOMContentLoaded",()=>{

  $("#btnStart").addEventListener("click", iniciar);
  $("#btnAccept").addEventListener("click", acceptCode);

  $("#btnRetry").addEventListener("click", ()=>{
    confirming=false;
    $("#confirmModal").style.display="none";
    focusBarcodeInput();
  });

  $("#btnFinish").addEventListener("click", onCloseFlight);
  $("#btnCancel").addEventListener("click", ()=>location.reload());

  $("#btnAddFlightRow").addEventListener("click", ()=>{
    const c = $("#flightRows");
    const r = document.createElement("div");
    r.className = "flight-row";
    r.innerHTML = `
      <input class="flight-num" placeholder="5000">
      <input class="flight-dest" placeholder="COR">
      <button type="button" onclick="this.parentNode.remove()">🗑️</button>
    `;
    c.appendChild(r);
  });

  // activar lector
  attachBarcodeListeners();
});

})();
