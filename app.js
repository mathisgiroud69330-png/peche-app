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

s.points.forEach(p=>{
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

/* ================= SAVE ================= */

let saveTimeout;

function save(){
const data = JSON.stringify(stations);

localStorage.setItem("stations", data);
sessionStorage.setItem("stations_backup", data);

// ✅ backup crash-proof avec timestamp
localStorage.setItem("stations_backup_full", JSON.stringify({
data: stations,
time: Date.now()
}));
}

function scheduleSave(){
clearTimeout(saveTimeout);

// ✅ sauvegarde immédiate (anti crash)
save();

saveTimeout = setTimeout(save, 500);
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
Points: ${pts} | Poissons: ${fish}
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

function createStation(){

let name=prompt("Nom station ?");
if(!name)return;

let date=prompt("Date ?");
let operator=prompt("Opérateur ?");

stations.push({
id:Date.now(),
name,
date,
operator,
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
<th>#</th>
<th>GPS N°</th>
<th>Position</th>
<th>Faciès</th>
<th>Habitats</th>
<th>Poissons</th>
</tr>

<tbody>
${currentStation.points.map(p=>`
<tr onclick="editPoint(${p.id})">
<td>${p.num}</td>
<td>${p.gps || "-"}</td>
<td>${p.position || "-"}</td>
<td>${p.facies || "-"}</td>
<td>${p.habitat || "-"}</td>
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
id:Date.now(),
num:nextNum,
gps:"",
position:base?.position||"",
facies:base?.facies||"",
habitat:base?.habitat||"",
granulometrie:base?.granulometrie||"",
depth:"",
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

document.getElementById("app").innerHTML=`

<div class="card">
<h3>Point ${currentPoint.num}</h3>
<button onclick="renderStation()">⬅ Retour station</button>
</div>

<div class="card">

<label>GPS N°</label>
<input id="gps" value="${currentPoint.gps}">

<label>Position</label>
<input id="position" list="pos" value="${currentPoint.position}">
<datalist id="pos">${positions.map(v=>`<option value="${v}">`).join("")}</datalist>

<label>Faciès</label>
<input id="facies" list="fac" value="${currentPoint.facies}">
<datalist id="fac">${faciesList.map(v=>`<option value="${v}">`).join("")}</datalist>

<label>Habitat</label>
<input id="habitat" list="hab" value="${currentPoint.habitat}">
<datalist id="hab">${habitatList.map(v=>`<option value="${v}">`).join("")}</datalist>

<label>Granulométrie</label>
<input id="granulometrie" list="gra" value="${currentPoint.granulometrie}">
<datalist id="gra">${granulometrieList.map(v=>`<option value="${v}">`).join("")}</datalist>

<label>Profondeur (cm)</label>
<input id="depth" value="${currentPoint.depth}">

</div>

<div class="card">

<h3>Poissons</h3>

<div class="flex">
<input id="sp" list="species" placeholder="Espèce">
<datalist id="species">
<option value="TRF"><option value="CHE"><option value="BRO"><option value="SAN">
<option value="PER"><option value="GAR"><option value="ANG">
</datalist>

<input id="size" placeholder="mm">
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

currentPoint.gps = document.getElementById("gps")?.value || "";
currentPoint.position = document.getElementById("position")?.value || "";
currentPoint.facies = document.getElementById("facies")?.value || "";
currentPoint.habitat = document.getElementById("habitat")?.value || "";
currentPoint.granulometrie = document.getElementById("granulometrie")?.value || "";
currentPoint.depth = document.getElementById("depth")?.value || "";

scheduleSave();
}

function bindPointAutosaveFixed(){

setTimeout(()=>{
["gps","position","facies","habitat","granulometrie","depth"].forEach(id=>{
let el=document.getElementById(id);
if(!el) return;
el.oninput = syncPoint;
});
},0);
}

/* ================= SAVE FLOW ================= */

function savePoint(){
syncPoint();
save();
renderStation();
}

function saveAndNext(){
syncPoint();
save();
newPoint(false);
}

function duplicateAndNext(){
syncPoint();
save();
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

function exportCSV(){

let csv="station,point,gps,position,facies,habitat,granulometrie,depth,espece,taille,poids\n";

currentStation.points.forEach(p=>{

if(p.fish.length===0){
csv+=`${currentStation.name},${p.num},${p.gps},${p.position},${p.facies},${p.habitat},${p.granulometrie},${p.depth},,,\n`;
}

p.fish.forEach(f=>{
csv+=`${currentStation.name},${p.num},${p.gps},${p.position},${p.facies},${p.habitat},${p.granulometrie},${p.depth},${f.sp},${f.size},${f.weight}\n`;
});

});

let blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
let url=URL.createObjectURL(blob);

let a=document.createElement("a");
a.href=url;
a.download=`station_${currentStation.name}.csv`;
a.click();
}

/* ================= INIT ================= */

// ✅ sauvegarde avant fermeture / crash
window.addEventListener("beforeunload", () => {
save();
});

renderHome();
// ✅ PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("SW OK"))
      .catch(err => console.log("SW error", err));
  });
}