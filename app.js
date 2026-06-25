let stations = JSON.parse(localStorage.getItem("stations") || "[]");

// ✅ récupération backup si crash
try {
const backup = JSON.parse(localStorage.getItem("stations_backup_full"));

if (backup && backup.data) {
    if (!stations || stations.length === 0) {
        stations = backup.data;
    }
}
} catch(e){
console.warn("Backup restore failed", e);
}

let currentStation = null;
let currentPoint = null;

/* ================= MIGRATION ================= */

stations.forEach(s=>{
if(!s.date) s.date="";
if(!s.operator) s.operator="";
if(!s.protocol) s.protocol="point";

// ✅ FIX CRASH
if(!s.points) s.points=[];

s.points.forEach(p=>{

// ✅ FIX CRASH
if(!p.fish) p.fish=[];

if(p.gpn && !p.gps){
p.gps = p.gpn;
delete p.gpn;
}
if(!p.granulometrie && p.granulo){
p.granulometrie = p.granulo;
delete p.granulo;
}
});
});

/* ================= LISTES ================= */

const positions=["RD","RG","Chenal"];
const faciesList = [
"Plat Lentique",
"Plat Courant",
"Radier",
"Chute",
"Mouille"
];
const habitatList = [
"Blocs",
"Racines",
"Chevelus",
"Embâcles",
"Herbiers"
];
const granulometrieList=[
"Limons","Sables","Graviers","Cailloux",
"Galets","Pierres","Blocs","Roche mère"
];

/* ================= PROTOCOLS ================= */

const PROTOCOLS = {

point:{
fields:[
{key:"num", label:"#"},
{key:"gps", label:"GPS N°"},
{key:"position", label:"Position"},
{key:"facies", label:"Faciès"},
{key:"habitat", label:"Habitat"},
{key:"granulometrie", label:"Granulométrie"},
{key:"depth", label:"Profondeur"}
]
},ambiance:{
fields:[
{key:"num", label:"Ambiance N°"},
{key:"gps", label:"GPS N°"},
{key:"longueur", label:"Longueur (m)"},
{key:"largeur", label:"Largeur (m)"},
{key:"profondeur", label:"Profondeur (m)"},
{key:"vitesse", label:"Vitesse"},
{key:"position", label:"Position"},
{key:"habitat", label:"Habitat"},
{key:"substrat", label:"Substrat"},
{key:"surface", label:"Surface (m²)"}
]
}

};

/* ================= SAVE ================= */

let saveTimeout;
let lastSaveStatus = "ok";
let lastSaveTime = 0;

function save(){
try {
const data = JSON.stringify(stations);

localStorage.setItem("stations", data);

// ✅ vérification lecture
const check = localStorage.getItem("stations");
if(check !== data){
throw new Error("Mismatch storage");
}

sessionStorage.setItem("stations_backup", data);

localStorage.setItem("stations_backup_full", JSON.stringify({
data: stations,
time: Date.now()
}));

lastSaveStatus = "ok";
lastSaveTime = Date.now();

} catch(e){
console.error("SAVE ERROR", e);
lastSaveStatus = "error";
}

updateSaveIndicator();
}

function scheduleSave(){
clearTimeout(saveTimeout);
save();
saveTimeout = setTimeout(save, 500);
}

function updateSaveIndicator(){
const el = document.getElementById("saveStatus");

if(!el) return;

if(lastSaveStatus === "ok"){
el.textContent = "💾 sauvegardé";
el.style.color = "green";
} else {
el.textContent = "⚠️ erreur sauvegarde";
el.style.color = "red";
}
}

/* ================= HOME ================= */

function renderHome(){

let html=`<div class="card" style="text-align:center;"><h2>Stations</h2></div>`;

stations.forEach(s=>{

let pts=s.points.length;
let fish=0;
s.points.forEach(p=>fish+=p.fish.length);

html+=`
<div class="card" style="text-align:center;">
<div class="big">${s.name}</div>
<div class="small">
${s.date || ""} ${s.operator ? " | "+s.operator : ""}<br>
Points: ${pts} | Poissons: ${fish}<br>
Protocole: ${s.protocol || "point"}
</div>

<button onclick="openStation(${s.id})">Ouvrir</button>
<button class="danger" onclick="deleteStation(${s.id})">Supprimer</button>
</div>`;
});

html+=`
<div class="card">
<button onclick="createStation()">+ Nouvelle station</button>
</div>
`;

document.getElementById("app").innerHTML=html;
}

/* ================= STATION ================= */

let selectedProtocol = "point";

/* ✅ alias pour éviter l'erreur */
function createStation(){
openCreateStationPopup();
}

function openCreateStationPopup(){

const today = new Date().toISOString().split("T")[0];

document.getElementById("app").innerHTML = `
<div class="card">

<h2>Nouvelle station</h2>

<label>Nom</label>
<input id="name" placeholder="Nom station">

<label>Date</label>
<input type="date" id="date" value="${today}">

<label>Opérateur</label>
<input id="operator" placeholder="Opérateur">

<label>Protocole</label>
<div id="protocolSelect">
  <button onclick="selectProtocol('point', event)">Point</button>
  <button onclick="selectProtocol('ambiance', event)">Ambiance</button>
  <button onclick="selectProtocol('autre', event)">Autre</button>
</div>

<br>

<button onclick="validateStation()">✅ Créer</button>

<button onclick="renderHome()">❌ Annuler</button>

</div>
`;
}

function selectProtocol(p, e){
  selectedProtocol = p;

  document.querySelectorAll("#protocolSelect button").forEach(btn=>{
    btn.style.background = "";
  });

  if(e) e.target.style.background = "#4CAF50";
}

function validateStation(){

let name = document.getElementById("name").value;
if(!name) return alert("Nom requis");

let date = document.getElementById("date").value;
let operator = document.getElementById("operator").value;

stations.push({
id: Date.now() + Math.random(),
name,
date,
operator,
protocol: selectedProtocol,
points:[]
});

save();
renderHome();
}

function deleteStation(id){
if(!confirm("Supprimer station ?"))return;
stations=stations.filter(s=>s.id!==id);
save();
renderHome();
}

function openStation(id){
currentStation=stations.find(s=>s.id===id);
renderStation();
}

/* ================= STATION VIEW ================= */

function renderStation(){

let pts=currentStation.points.length;
let fish=0;

currentStation.points.forEach(p=>fish+=p.fish.length);

let proto = PROTOCOLS[currentStation.protocol || "point"];

document.getElementById("app").innerHTML=`

<div class="card">
<h3>${currentStation.name}</h3>
<div class="small">
${currentStation.date || ""} ${currentStation.operator ? " | "+currentStation.operator : ""}<br>
Points: ${pts} | Poissons: ${fish}<br>
${getStats()}
</div>
</div>

<div class="layout">

<div class="sidebar">
<button onclick="addPoint()">+ Point vierge</button>
<button onclick="duplicatePoint()">Dupliquer point</button>
<button onclick="exportCSV()">Export CSV</button>
<button onclick="renderHome()">← Accueil</button>
</div>

<div class="content">

<div class="card">
<table>
<tr>
${proto.fields.map(f=>`<th>${f.label}</th>`).join("")}
<th>Poissons</th>
</tr>

<tbody>
${currentStation.points.map(p=>`
<tr onclick="editPoint(${p.id})">
${proto.fields.map(f=>`<td>${p[f.key] || "-"}</td>`).join("")}
<td>${p.fish.length}</td>
</tr>
`).join("")}
</tbody>
</table>
</div>
`;
}

/* ================= STATS ================= */

function getStats(){

let speciesCount = {};
let totalSize = 0;
let totalFish = 0;

currentStation.points.forEach(p=>{
p.fish.forEach(f=>{
totalFish++;
totalSize += Number(f.size) || 0;

if(!speciesCount[f.sp]) speciesCount[f.sp]=0;
speciesCount[f.sp]++;
});
});

let avg = totalFish ? Math.round(totalSize/totalFish) : 0;

let speciesTxt = Object.entries(speciesCount)
.map(([k,v]) => `${k}:${v}`)
.join(" | ");

return `Taille moy: ${avg} mm<br>${speciesTxt}`;
}

/* ================= POINT ================= */

function newPoint(dup){

let pts=currentStation.points;
let base=dup?pts[pts.length-1]:null;

let nextNum = Math.max(0, ...pts.map(p => p.num || 0)) + 1;

let p={
id:Date.now() + Math.random(),
num:nextNum,
gps:"",
position:base?.position||"",
facies:base?.facies||"",
habitat:base?.habitat||"",
granulometrie:base?.granulometrie||"",
depth:"",
largeur:"",
longueur:"",
substrat:"",
ombrage:"",
remarque:"",
profondeur:"",
vitesse:"",
surface:"",
fish:[]
};

pts.push(p);

save();
editPoint(p.id);
}

function addPoint(){
newPoint(false);
}

/* ================= EDIT POINT ================= */

function editPoint(id){

currentPoint=currentStation.points.find(p=>p.id===id);

let proto = PROTOCOLS[currentStation.protocol || "point"];

document.getElementById("app").innerHTML=`

<div class="card">
<h3>Point ${currentPoint.num}</h3>
<button onclick="renderStation()">⬅ Retour station</button>
</div>

<div class="card">

${proto.fields.map(f=>{

if(f.key==="num") return "";

if(currentStation.protocol==="point"){

if(f.key==="position"){
return `<label>${f.label}</label>
<input id="position" list="pos" value="${currentPoint.position}">
<datalist id="pos">${positions.map(v=>`<option value="${v}">`).join("")}</datalist>`;
}

if(f.key==="facies"){
return `<label>${f.label}</label>
<input id="facies" list="fac" value="${currentPoint.facies}">
<datalist id="fac">${faciesList.map(v=>`<option value="${v}">`).join("")}</datalist>`;
}

if(f.key==="habitat"){
return `<label>${f.label}</label>
<input id="habitat" list="hab" value="${currentPoint.habitat}">
<datalist id="hab">${habitatList.map(v=>`<option value="${v}">`).join("")}</datalist>`;
}

if(f.key==="granulometrie"){
return `<label>${f.label}</label>
<input id="granulometrie" list="gra" value="${currentPoint.granulometrie}">
<datalist id="gra">${granulometrieList.map(v=>`<option value="${v}">`).join("")}</datalist>`;
}

}

// ✅ PROTOCOLE AMBIANCE
if(currentStation.protocol==="ambiance"){

if(f.key==="position"){
return `<label>${f.label}</label>
<input id="position" list="pos" value="${currentPoint.position}">
<datalist id="pos">${positions.map(v=>`<option value="${v}">`).join("")}</datalist>`;
}

if(f.key==="vitesse"){
const vitesses=["nulle","faible","moyenne","forte","très forte"];
return `<label>${f.label}</label>
<input id="vitesse" list="vit" value="${currentPoint.vitesse}">
<datalist id="vit">${vitesses.map(v=>`<option value="${v}">`).join("")}</datalist>`;
}

if(f.key==="habitat"){
return `<label>${f.label}</label>
<input id="habitat" list="hab" value="${currentPoint.habitat}">
<datalist id="hab">${habitatList.map(v=>`<option value="${v}">`).join("")}</datalist>`;
}

if(f.key==="substrat"){
return `<label>${f.label}</label>
<input id="substrat" list="gra" value="${currentPoint.substrat}">
<datalist id="gra">${granulometrieList.map(v=>`<option value="${v}">`).join("")}</datalist>`;
}

if(f.key==="surface"){
return `<label>${f.label}</label>
<input id="surface" value="${currentPoint.surface||""}" disabled>`;
}

}

return `<label>${f.label}</label>
<input id="${f.key}" value="${currentPoint[f.key]||""}">`;

}).join("")}

</div>

<div class="card">

<h3>Poissons</h3>

<div class="flex">
<input id="sp" list="species" placeholder="Espèce">
<datalist id="species">
<option value="TRF"><option value="CHE"><option value="BRO"><option value="SAN">
<option value="PER"><option value="GAR"><option value="ANG">
</datalist><input id="size" placeholder="mm">
<input id="weight" placeholder="g">
</div>

<button onclick="addFish()">Ajouter poisson</button>

<ul>
${currentPoint.fish.map((f,i)=>`
<li>
${f.sp} | ${f.size} mm | ${f.weight} g
<button onclick="deleteFish(${i})">❌</button>
</li>
`).join("")}
</ul>

</div>

<div class="card">
<button onclick="savePoint()">✔ Retour station</button>
<button onclick="saveAndNext()">➡️ Point suivant</button>
<button onclick="duplicateAndNext()">↪ Dupliquer + suivant</button>
<button class="danger" onclick="deletePoint()">Supprimer point</button>
</div>
`;

bindPointAutosaveFixed();
}

/* ================= AUTOSAVE ================= */

function syncPoint(){

if(!currentPoint) return;

let proto = PROTOCOLS[currentStation.protocol || "point"];

proto.fields.forEach(f=>{
let el=document.getElementById(f.key);
if(el){
currentPoint[f.key]=el.value;
}
});

// ✅ calcul surface ambiance
if(currentStation.protocol==="ambiance"){
let L = parseFloat(currentPoint.longueur) || 0;
let l = parseFloat(currentPoint.largeur) || 0;
currentPoint.surface = +(L*l).toFixed(2);
}

scheduleSave();
}

function bindPointAutosaveFixed(){

setTimeout(()=>{
let proto = PROTOCOLS[currentStation.protocol || "point"];

proto.fields.forEach(f=>{
let el=document.getElementById(f.key);
if(el) el.oninput = syncPoint;
});
},0);
}

/* ================= SAVE FLOW ================= */

function savePoint(){
syncPoint();
renderStation();
}

function saveAndNext(){
syncPoint();
newPoint(false);
}

function duplicateAndNext(){
syncPoint();
newPoint(true);
}

/* ================= FISH ================= */

function addFish(){

const spEl = document.getElementById("sp");
const sizeEl = document.getElementById("size");
const weightEl = document.getElementById("weight");

if(!spEl.value || !sizeEl.value) return;

currentPoint.fish.push({
sp: spEl.value,
size: sizeEl.value,
weight: weightEl.value
});

save();
editPoint(currentPoint.id);
}

function deleteFish(i){
if(!confirm("Supprimer poisson ?")) return;
currentPoint.fish.splice(i,1);
save();
editPoint(currentPoint.id);
}

/* ================= DELETE POINT ================= */

function deletePoint(){

if(!confirm("Supprimer point ?")) return;

currentStation.points = currentStation.points.filter(p=>p.id!==currentPoint.id);

save();
renderStation();
}

/* ================= EXPORT ================= */

function exportCSV(csv){

const fileName = `station_${currentStation.name}.csv`;

// 🥇 PARTAGE NATIF
if (navigator.canShare) {
  try {
    const file = new File([csv], fileName, { type: "text/csv" });

    if (navigator.canShare({ files: [file] })) {
      navigator.share({
        title: "Export CSV",
        text: "Données pêche électrique",
        files: [file]
      });

      return;
    }
  } catch (e) {
    console.log("share error", e);
  }
}

// 🥈 COPIE PRESSE-PAPIER
if (navigator.clipboard) {
  navigator.clipboard.writeText(csv)
  .then(()=>{
    alert("✅ CSV copié !\nColle-le dans Excel ou Notes");
  })
  .catch(()=>{
    fallback();
  });
} else {
  fallback();
}

// 🥉 FALLBACK FINAL
function fallback(){
  let win = window.open();
  win.document.write(`<textarea style="width:100%;height:100%">${csv}</textarea>`);
}

}


/* ================= INIT ================= */

window.addEventListener("beforeunload", () => {
save();
});

setInterval(()=>{
save();
}, 5000);

document.addEventListener("visibilitychange", () => {
if(document.visibilityState === "hidden"){
save();
}
});

renderHome();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("SW OK"))
      .catch(err => console.log("SW error", err));
  });
}