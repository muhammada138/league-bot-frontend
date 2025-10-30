
// ====== tiny state ======
const DEFAULT_API = "https://league-bot-backend.onrender.com";
const LS = {
  api: "keema.api",
  key: "keema.key"
};
function getApi(){ return localStorage.getItem(LS.api) || DEFAULT_API; }
function getKey(){ return localStorage.getItem(LS.key) || ""; }
function setApi(v){ localStorage.setItem(LS.api, v); }
function setKey(v){ localStorage.setItem(LS.key, v); }

// ====== helpers ======
const $ = (q, el=document)=> el.querySelector(q);
const $$ = (q, el=document)=> Array.from(el.querySelectorAll(q));
function el(tag, cls){ const n=document.createElement(tag); if(cls) n.className=cls; return n; }
function fmtPct(x){ return (x*100).toFixed(1)+"%"; }
function fmtFixed(x, d=2){ return Number(x).toFixed(d); }
function badge(winrate){
  if(winrate >= .6) return `<span class="badge win">${fmtPct(winrate)}</span>`;
  if(winrate < .4)  return `<span class="badge lose">${fmtPct(winrate)}</span>`;
  return fmtPct(winrate);
}

async function apiGet(path){
  const res = await fetch(`${getApi()}${path}`);
  if(!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}
async function apiPost(path, body){
  const res = await fetch(`${getApi()}${path}`, {
    method: "POST",
    headers: { "X-Admin-Key": getKey() },
    body
  });
  if(!res.ok){
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json().catch(_=>({ok:true}));
}

// ====== renderers ======
function renderTable(container, columns, rows){
  container.innerHTML = "";
  const tpl = $("#tableTemplate").content.cloneNode(true);
  const table = tpl.querySelector("table");
  // header
  const thead = table.querySelector("thead");
  const trh = el("tr");
  columns.forEach(c=>{
    const th = el("th");
    th.textContent = c.label;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  // body
  const tbody = table.querySelector("tbody");
  rows.forEach(r=>{
    const tr = el("tr");
    columns.forEach(c=>{
      const td = el("td");
      td.innerHTML = c.render ? c.render(r) : (r[c.key] ?? "");
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  container.appendChild(table);
}

// ====== scoreboard ======
async function loadScoreboard(){
  $("#scoreboardContainer").innerHTML = "Loading…";
  try{
    const data = await apiGet("/scoreboard");
    renderTable($("#scoreboardContainer"), [
      { label:"Summoner", key:"name" },
      { label:"Games", render:r=> r.games },
      { label:"WR", render:r=> badge(r.winrate) },
      { label:"KDA", render:r=> fmtFixed(r.kda, 2) },
      { label:"Score", render:r=> fmtFixed(r.score, 2) },
    ], data.rows || data);
  }catch(e){
    $("#scoreboardContainer").innerHTML = `<span class="badge lose">Failed</span> ${e.message}`;
  }
}

// ====== champions ======
async function loadChampions(){
  $("#championsContainer").innerHTML = "Loading…";
  try{
    const data = await apiGet("/champions");
    renderTable($("#championsContainer"), [
      { label:"Champion", key:"champion" },
      { label:"Games", key:"games" },
      { label:"WR", render:r=> badge(r.winrate) },
      { label:"KDA", render:r=> fmtFixed(r.kda, 2) },
      { label:"GPM", render:r=> fmtFixed(r.gpm, 1) },
      { label:"Score", render:r=> fmtFixed(r.score, 2) },
    ], data.rows || data);
  }catch(e){
    $("#championsContainer").innerHTML = `<span class="badge lose">Failed</span> ${e.message}`;
  }
}

// ====== upload ======
async function doUpload(ev){
  ev.preventDefault();
  const file = $("#roflFile").files[0];
  const status = $("#uploadStatus");
  if(!file){ status.textContent = "Pick a .rofl file first"; return; }
  status.textContent = "Uploading…";
  try{
    const fd = new FormData();
    fd.append("file", file, file.name);
    const res = await apiPost("/upload", fd);
    status.innerHTML = `<span class="badge win">OK</span> Uploaded.`;
  }catch(e){
    status.innerHTML = `<span class="badge lose">Error</span> ${e.message}`;
  }
}
async function approveRefresh(){
  const status = $("#uploadStatus");
  status.textContent = "Rebuilding…";
  try{
    await apiPost("/refresh", null);
    status.innerHTML = `<span class="badge win">OK</span> Ingested approved replays.`;
    await Promise.all([loadScoreboard(), loadChampions()]);
  }catch(e){
    status.innerHTML = `<span class="badge lose">Error</span> ${e.message}`;
  }
}

// ====== tabs & settings ======
function initTabs(){
  $$(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      $$(".tab").forEach(b=> b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      $$(".panel").forEach(p=> p.classList.remove("active"));
      $("#"+tab).classList.add("active");
      if(tab==="scoreboard") loadScoreboard();
      if(tab==="champions") loadChampions();
    });
  });
}

function initSettings(){
  $("#apiBase").value = getApi();
  $("#adminKey").value = getKey();
  $("#settingsForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    setApi($("#apiBase").value.trim() || DEFAULT_API);
    setKey($("#adminKey").value.trim());
    $("#apiBadge").textContent = getApi();
  });
  $("#btnReset").addEventListener("click", ()=>{
    localStorage.removeItem(LS.api);
    localStorage.removeItem(LS.key);
    $("#apiBase").value = DEFAULT_API;
    $("#adminKey").value = "";
    $("#apiBadge").textContent = getApi();
  });
  $("#apiBadge").textContent = getApi();
}

// ====== boot ======
window.addEventListener("DOMContentLoaded", ()=>{
  initTabs();
  initSettings();
  $("#uploadForm").addEventListener("submit", doUpload);
  $("#btnApproveRefresh").addEventListener("click", approveRefresh);
  $("#refreshScoreboard").addEventListener("click", loadScoreboard);
  $("#refreshChampions").addEventListener("click", loadChampions);
  loadScoreboard();
});
