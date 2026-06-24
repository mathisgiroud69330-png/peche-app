
let stations = JSON.parse(localStorage.getItem("stations") || "[]");

let currentStation = null;
let currentPoint = null;

/* ================= LISTES ================= */

const positions=["RD","RG","Chenal"];
const faciesList=["Radier","Plat","Mouille","Cascade"];
const habitatList=["Blocs","Racines","Végétation"];
const granuloList=["Limons","Sable","Graviers","Cailloux","Galets","Blocs"];

/* ================= SAVE ROBUSTE ================= */

function save(){
localStorage.setItem("stations", JSON.stringify(stations));
sessionStorage.setItem("stations_backup", JSON.stringify(stations));
}

/* autosave global sécurité */
setInterval(save, 1000);

window.addEventListener("beforeunload", save);

document.addEventListener("visibilitychange", ()=>{
if(document.visibilityState === "hidden") save();
});

/* ================= HOME ================= */

function renderHome(){

let html=`<div class="card"><h2>Stations</h2></div>`;

stations.forEach(s=>{

let pts=s.points.length;
let fish=0;

s.points.forEach(p=>fish+=p.fish.length);

html+=`
<div class="card">
<div class="big">${s.name}</div>
<div class="small">Points: ${pts} | Poissons: ${fish}</div>

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

stations.push({
id:Date.now(),
name,
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
<div class="small">Points: ${pts} | Poissons: ${fish}</div>
</div>

<div class="card">
<button onclick="newPoint(false)">+ Point vierge</button>
<button onclick="newPoint(true)">↪ Dupliquer point</button>
<button onclick="exportCSV()">📤 Export CSV</button>
<button onclick="renderHome()">⬅ Accueil</button>
</div>

<div class="card">
<table>
<tr>
<th>#</th>
<th>Pos</th>
<th>Fac</th>
<th>Hab</th>
<th>🐟</th>
</tr>

<tbody>
${currentStation.points.map(p=>`
<tr onclick="editPoint(${p.id})">
<td><strong>${p.num}</strong></td>
<td>${p.position||"-"}</td>
<td>${p.facies||"-"}</td>
<td>${p.habitat||"-"}</td>
<td><strong>${p.fish.length}</strong></td>
</tr>
`).join("")}
</tbody>
</table>
</div>

`;
}

/* ================= POINT ================= */

function newPoint(dup){

let pts=currentStation.points;
let base=dup?pts[pts.length-1]:null;

let p={
id:Date.now(),
num:pts.length+1,
gpn:"",
position:base?.position||"",
facies:base?.facies||"",
habitat:base?.habitat||"",
granulo:base?.granulo||"",
depth:"",
fish:[]
};

pts.push(p);

save();
editPoint(p.id);
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

<label>GPN</label>
<input id="gpn" value="${currentPoint.gpn}">

<label>Position</label>
<input id="position" list="pos" value="${currentPoint.position}">
<datalist id="pos">${positions.map(v=>`<option value="${v}">`).join("")}</datalist>

<label>Faciès</label>
<input id="facies" list="fac" value="${currentPoint.facies}">
<datalist id="fac">${faciesList.map(v=>`<option value="${v}">`).join("")}</datalist>

<label>Habitat</label>
<input id="habitat" list="hab" value="${currentPoint.habitat}">
<datalist id="hab">${habitatList.map(v=>`<option value="${v}">`).join("")}</datalist>

<label>Granulo</label>
<input id="granulo" list="gra" value="${currentPoint.granulo}">
<datalist id="gra">${granuloList.map(v=>`<option value="${v}">`).join("")}</datalist>

<label>Profondeur</label>
<input id="depth" value="${currentPoint.depth}">

</div>

<div class="card">

<h3>Poissons</h3>

<div class="flex">
<input id="sp" placeholder="Espèce">
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
<button class="danger" onclick="deletePoint()">Supprimer point</button>
</div>

`;

/* ===== FIX AUTOSAVE POINT ===== */
bindPointAutosaveFixed();
}

/* ================= AUTOSAVE FIX ================= */

function syncPoint(){

if(!currentPoint) return;

currentPoint.gpn = document.getElementById("gpn")?.value || "";
currentPoint.position = document.getElementById("position")?.value || "";
currentPoint.facies = document.getElementById("facies")?.value || "";
currentPoint.habitat = document.getElementById("habitat")?.value || "";
currentPoint.granulo = document.getElementById("granulo")?.value || "";
currentPoint.depth = document.getElementById("depth")?.value || "";

save();
}

/* bind inputs propre */
function bindPointAutosaveFixed(){

setTimeout(()=>{

["gpn","position","facies","habitat","granulo","depth"].forEach(id=>{

let el=document.getElementById(id);
if(!el) return;

el.oninput = syncPoint;

});

},0);
}

/* ================= SAVE POINT ================= */

function savePoint(){
syncPoint();
save();
renderStation();
}

/* ================= FISH ================= */

function addFish(){

if(!sp.value || !size.value) return;

currentPoint.fish.push({
sp:sp.value,
size:size.value,
weight:weight.value
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

let csv="station,point,gpn,position,facies,habitat,granulo,depth,espece,taille,poids\n";

currentStation.points.forEach(p=>{

if(p.fish.length===0){
csv+=`${currentStation.name},${p.num},${p.gpn},${p.position},${p.facies},${p.habitat},${p.granulo},${p.depth},,,\n`;
}

p.fish.forEach(f=>{
csv+=`${currentStation.name},${p.num},${p.gpn},${p.position},${p.facies},${p.habitat},${p.granulo},${p.depth},${f.sp},${f.size},${f.weight}\n`;
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

renderHome();