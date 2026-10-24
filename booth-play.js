/* Play layer: mode-aware sidebar, first-visit tour, booth readiness, shortcuts, visitor view. */
(()=>{
'use strict';
const planKey='cube-studio-plan',plan={kitPanels:0,kitConnectors:0,heightLimit:0,pricePanel:0,priceConnector:0,coachDone:false};
try{Object.assign(plan,JSON.parse(localStorage.getItem(planKey)||'{}'));}catch{}
const savePlan=()=>{try{localStorage.setItem(planKey,JSON.stringify(plan));}catch{}};
const motionOff=()=>calm||reducedMotion.matches;
const tableOf=()=>state.table?.enabled?state.table:null;

/* ---------- Mode-aware sidebar ---------- */
function syncSidebar(){document.querySelectorAll('[data-for-mode]').forEach(el=>{el.hidden=!el.dataset.forMode.split(' ').includes(mode);});document.querySelector('.sidebarBody').scrollTop=0;}
document.addEventListener('modechange',syncSidebar);syncSidebar();

/* ---------- Styles apply live to the selection ---------- */
function applyStyleToSelection(){if(mode!=='select')return;const keys=selectionKeys();if(!keys.size)return;change(()=>state.panels.forEach(p=>{if(keys.has(CubeModel.panelKey(p)))Object.assign(p,appearance());}),`Style applied to ${keys.size} panel(s).`);}
document.querySelectorAll('[data-material],.swatches button').forEach(b=>b.addEventListener('click',applyStyleToSelection));
$('#color').addEventListener('change',applyStyleToSelection);

/* ---------- Table presets ---------- */
document.querySelectorAll('[data-table-preset]').forEach(b=>b.onclick=()=>{const [width,depth]=b.dataset.tablePreset.split(',').map(Number);change(()=>{state.table={...currentTable(),enabled:true,width,depth};},`Table set to ${width} × ${depth} cm.`);fit();});

/* ---------- Settings menu and help ---------- */
const settingsButton=$('#settingsButton'),settingsMenu=$('#settingsMenu');
settingsButton.onclick=()=>{const open=settingsMenu.hidden;settingsMenu.hidden=!open;settingsButton.setAttribute('aria-expanded',String(open));};
document.addEventListener('pointerdown',e=>{if(!settingsMenu.hidden&&!e.target.closest('.playOptions')){settingsMenu.hidden=true;settingsButton.setAttribute('aria-expanded','false');}});
const help=$('#helpDialog');
function toggleHelp(){if(help.open)help.close();else help.showModal();$('#helpButton').setAttribute('aria-expanded',String(help.open));}
$('#helpButton').onclick=toggleHelp;help.addEventListener('close',()=>$('#helpButton').setAttribute('aria-expanded','false'));

/* ---------- Keyboard shortcuts ---------- */
window.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='?'){e.preventDefault();toggleHelp();return;}if(help.open)return;const key=e.key.toLowerCase();const target={b:'[data-mode="add"]',v:'[data-mode="select"]',m:'#moveMode',p:'#productMode',f:'#fit'}[key];if(target&&!e.shiftKey){e.preventDefault();document.querySelector(target)?.click();}});

/* ---------- Template thumbnails ---------- */
function isoThumb(cubes){const s=9,P=(x,y,z)=>[(x-z)*s*.866,(x+z)*s*.5-y*s];if(!cubes.length)return '<svg viewBox="-30 -30 60 60" aria-hidden="true"><rect x="-22" y="-14" width="44" height="28" rx="4" fill="none" stroke="currentColor" stroke-dasharray="3 3"/></svg>';
 const faces=[];for(const [x,y,z] of [...cubes].sort((a,b)=>(a[0]+a[2])-(b[0]+b[2])||a[1]-b[1])){faces.push([[P(x,y+1,z),P(x+1,y+1,z),P(x+1,y+1,z+1),P(x,y+1,z+1)],'#dfe8d6'],[[P(x,y,z+1),P(x+1,y,z+1),P(x+1,y+1,z+1),P(x,y+1,z+1)],'#9db39b'],[[P(x+1,y,z),P(x+1,y,z+1),P(x+1,y+1,z+1),P(x+1,y+1,z)],'#5f7a66']);}
 const pts=faces.flatMap(f=>f[0]),minX=Math.min(...pts.map(p=>p[0]))-3,minY=Math.min(...pts.map(p=>p[1]))-3,w=Math.max(...pts.map(p=>p[0]))-minX+3,h=Math.max(...pts.map(p=>p[1]))-minY+3,size=Math.max(w,h);
 return `<svg viewBox="${minX-(size-w)/2} ${minY-(size-h)/2} ${size} ${size}" aria-hidden="true">${faces.map(([poly,fill])=>`<polygon points="${poly.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="#2d5143" stroke-width=".7" stroke-linejoin="round"/>`).join('')}</svg>`;}
document.querySelectorAll('[data-preset]').forEach(b=>{const shape=PRESET_SHAPES[b.dataset.preset];const thumb=b.querySelector('.thumb');if(thumb&&shape)thumb.innerHTML=isoThumb(b.dataset.preset==='single'?[]:shape.cubes);});

/* ---------- Pull handles on free edges ---------- */
const handles=new THREE.Group();scene.add(handles);
const dotTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,4,32,32,30);r.addColorStop(0,'rgba(217,153,47,.95)');r.addColorStop(.55,'rgba(217,153,47,.45)');r.addColorStop(1,'rgba(217,153,47,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const dotMaterial=new THREE.SpriteMaterial({map:dotTexture,transparent:true,depthTest:false,opacity:.9});
function freeEdges(panels,all){const counts=new Map(),edges=[];for(const p of all){const v=CubeModel.vertices(p);for(const [i,j] of [[0,1],[0,2],[1,3],[2,3]]){const key=p.type+':'+[v[i],v[j]].map(x=>x.join(',')).sort().join('|');counts.set(key,(counts.get(key)||0)+1);}}
 for(const p of panels){const v=CubeModel.vertices(p);for(const [i,j] of [[0,1],[0,2],[1,3],[2,3]]){const key=p.type+':'+[v[i],v[j]].map(x=>x.join(',')).sort().join('|');if(counts.get(key)===1)edges.push(v[i].map((n,k)=>(n+v[j][k])/2));}}return edges;}
let handleKey='';
function showHandles(panels){const key=mode!=='add'?'':panels.map(CubeModel.panelKey).join(';');if(key===handleKey)return;handleKey=key;dispose(handles);if(!key)return requestRender();const unit=Math.min(state.width,state.height,state.depth)*.16;for(const mid of freeEdges(panels,state.panels).slice(0,400)){const sprite=new THREE.Sprite(dotMaterial);sprite.position.copy(world(mid));sprite.scale.set(unit,unit,1);sprite.renderOrder=9;handles.add(sprite);}requestRender();}
function hoverHandles(e){if(mode!=='add'||down||pinch){if(!down&&!pinch)return;return showHandles([]);}if(touchUI)return;const h=hit(e);showHandles(h?[h.object.userData.cell]:[]);}
canvas.addEventListener('pointermove',hoverHandles);canvas.addEventListener('pointerleave',()=>{if(!touchUI)showHandles([]);});canvas.addEventListener('pointerup',()=>{if(touchUI)showHandles(state.panels);});
function touchHandles(){if(touchUI)showHandles(mode==='add'?state.panels:[]);else if(mode!=='add')showHandles([]);}
document.addEventListener('modechange',touchHandles);document.addEventListener('statechange',touchHandles);touchHandles();

/* ---------- Visitor view ---------- */
$('#visitor').onclick=()=>{const b=bounds(),t=tableOf(),cx=(b.minX+b.maxX)/2*state.width,cz=(b.minZ+b.maxZ)/2*state.depth,cy=Math.max(10,b.maxY*state.height*.45),frontZ=t?t.z+t.depth/2:b.maxZ*state.depth,eye=155-(t?t.height:74),dz=frontZ+120-cz,dist=Math.hypot(dz,eye-cy);target.set(cx,cy,cz);orbit.yaw=0;orbit.pitch=Math.asin((eye-cy)/dist);orbit.distance=dist;camera.zoom=1;pan.set(0,0);updateCamera();$('#tip').textContent='Visitor view · standing eye level, 120 cm in front of the table';};

/* ---------- Merge flash ---------- */
document.addEventListener('panelsmerged',e=>{if(motionOff())return;const keys=new Set(e.detail.map(CubeModel.panelKey)),targets=[];root.children.forEach(o=>{if(keys.has(o.userData.panelKey))o.traverse(n=>{if(n.material?.emissive)targets.push(n.material);});});if(!targets.length)return;const start=performance.now();(function frame(now){const t=Math.min(1,(now-start)/450),glow=Math.sin(t*Math.PI)*.7;for(const m of targets){m.emissive.set('#e0a94a');m.emissiveIntensity=glow;}renderer.render(scene,camera);if(t<1)requestAnimationFrame(frame);else{for(const m of targets)m.emissiveIntensity=0;requestRender();}})(start);});

/* ---------- Autosave indicator and count-up meters ---------- */
const saveState=$('#saveState');
function markSaved(){const t=new Date();saveState.textContent='Saved locally · '+t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
const shown={count:null,panels:null,connectors:null},tweens={};
function countUp(id){const el=$('#'+id),next=Number(el.textContent);if(!Number.isFinite(next)){shown[id]=null;return;}const from=shown[id];shown[id]=next;if(from===null||from===next||motionOff())return;cancelAnimationFrame(tweens[id]);const start=performance.now();(function frame(now){const t=Math.min(1,(now-start)/380),eased=1-Math.pow(1-t,3);el.textContent=String(Math.round(from+(next-from)*eased));if(t<1)tweens[id]=requestAnimationFrame(frame);else el.textContent=String(next);})(start);}

/* ---------- Booth readiness ---------- */
const inputs={kitPanels:'#kitPanels',kitConnectors:'#kitConnectors',heightLimit:'#heightLimit',pricePanel:'#pricePanel',priceConnector:'#priceConnector'};
for(const [key,sel] of Object.entries(inputs)){const el=$(sel);el.value=plan[key]||'';el.addEventListener('input',()=>{plan[key]=Math.max(0,Number(el.value)||0);savePlan();readiness();});}
const limitPlane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#c25a46',transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}));limitPlane.rotation.x=-Math.PI/2;limitPlane.visible=false;scene.add(limitPlane);
function footprintIssues(){const t=tableOf();if(!t)return {panels:0,products:0};const xs=[t.x-t.width/2,t.x+t.width/2],zs=[t.z-t.depth/2,t.z+t.depth/2],out=v=>v[0]<xs[0]-.5||v[0]>xs[1]+.5||v[2]<zs[0]-.5||v[2]>zs[1]+.5;const panels=state.panels.filter(p=>CubeModel.vertices(p).some(v=>out([v[0]*state.width,0,v[2]*state.depth]))).length,products=(state.products||[]).filter(p=>!p.hookId&&!p.trayStandId&&(p.x-p.width/2<xs[0]-.5||p.x+p.width/2>xs[1]+.5||p.z-p.depth/2<zs[0]-.5||p.z+p.depth/2>zs[1]+.5)).length;return {panels,products};}
function stability(){const panels=state.panels,shelves=panels.filter(p=>p.type==='shelf'&&p.y>0);let unsupported=0,weak=0;
 for(const s of shelves){const u=s.u||1,v=s.v||1;let supports=0;for(const p of panels){if(p.type==='side'){const pu=p.u||1,pv=p.v||1;if((Math.abs(p.x-s.x)<1e-6||Math.abs(p.x-(s.x+u))<1e-6)&&p.y<s.y&&p.y+pv>=s.y-1e-6&&p.z<s.z+v-1e-6&&p.z+pu>s.z+1e-6)supports++;}else if(p.type==='back'){const pu=p.u||1,pv=p.v||1;if((Math.abs(p.z-s.z)<1e-6||Math.abs(p.z-(s.z+v))<1e-6)&&p.y<s.y&&p.y+pv>=s.y-1e-6&&p.x<s.x+u-1e-6&&p.x+pu>s.x+1e-6)supports++;}}if(!supports)unsupported++;else if(supports===1)weak++;}
 let towers=0;const columns=new Map();for(const p of panels)if(p.type==='back'){const key=p.x+','+p.z;columns.set(key,(columns.get(key)||[]).concat(p));}
 for(const [key,list] of columns){const ys=new Set(list.map(p=>Math.floor(p.y)));let run=0,best=0;for(let y=0;y<=32;y++){run=ys.has(y)?run+1:0;best=Math.max(best,run);}if(best<3)continue;const [x,z]=key.split(',').map(Number);const braced=panels.some(p=>p.type==='side'&&(Math.abs(p.x-x)<1e-6||Math.abs(p.x-(x+1))<1e-6)&&p.y>=1&&Math.abs(p.z-z)<1+1e-6);if(!braced)towers++;}
 return {unsupported,weak,towers};}
function topHeight(){const b=bounds(),t=tableOf(),base=t?t.height:0;let top=state.panels.length?b.maxY*state.height:0;for(const p of state.products||[])top=Math.max(top,p.y+p.height);return {top:top+base,base};}
function updateLimitPlane(){const t=tableOf(),limit=plan.heightLimit;if(!limit){limitPlane.visible=false;return;}const {top,base}=topHeight(),y=limit-base;limitPlane.visible=top>limit+1e-6;if(!limitPlane.visible)return;const b=bounds(),w=Math.max(60,(b.maxX-b.minX)*state.width+40,t?t.width:0),d=Math.max(60,(b.maxZ-b.minZ)*state.depth+40,t?t.depth:0);limitPlane.scale.set(w,d,1);limitPlane.position.set(t?t.x:(b.minX+b.maxX)/2*state.width,y,t?t.z:(b.minZ+b.maxZ)/2*state.depth);}
const fmt=n=>n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
function readiness(){const inv=CubeModel.inventory(state),products=state.products||[],rows=[];
 const t=tableOf(),fp=footprintIssues();
 rows.push(!t?{state:'off',title:'Fits the table',detail:'Turn on the table in the Table tab to check the footprint.'}:fp.panels||fp.products?{state:'fail',title:'Fits the table',detail:`${fp.panels?fp.panels+' panel(s)':''}${fp.panels&&fp.products?' and ':''}${fp.products?fp.products+' item(s)':''} extend past the ${t.width} × ${t.depth} cm table.`}:{state:'ok',title:'Fits the table',detail:`Everything sits within the ${t.width} × ${t.depth} cm table.`});
 const kitSet=plan.kitPanels>0||plan.kitConnectors>0,overPanels=plan.kitPanels>0&&inv.panels>plan.kitPanels,overConnectors=plan.kitConnectors>0&&inv.connectors>plan.kitConnectors;
 rows.push(!kitSet?{state:'off',title:'Within your kit',detail:'Enter how many panels and connectors you own below.'}:{state:overPanels||overConnectors?'fail':'ok',title:'Within your kit',detail:[plan.kitPanels>0?`${inv.panels} of ${plan.kitPanels} panels`:`${inv.panels} panels`,plan.kitConnectors>0?`${inv.connectors} of ${plan.kitConnectors} connectors`:`${inv.connectors} connectors`].join(' · ')+(overPanels||overConnectors?' · over budget':'')});
 const {top}=topHeight();
 rows.push(!plan.heightLimit?{state:'off',title:'Under the height limit',detail:`Top of the display is ${Math.round(top)} cm from the floor. Set your convention's limit below.`}:{state:top>plan.heightLimit+1e-6?'fail':'ok',title:'Under the height limit',detail:`Top at ${Math.round(top)} cm · limit ${plan.heightLimit} cm from the floor.`});
 const floating=products.filter(p=>!p.hookId&&!p.trayStandId&&p.y>0&&!state.panels.some(s=>s.type==='shelf'&&Math.abs(s.y*state.height-p.y)<1.5)).length;
 rows.push(!products.length?{state:'off',title:'Stocked with products',detail:'Open Products and drag a card onto a shelf or the table.'}:{state:floating?'warn':'ok',title:'Stocked with products',detail:`${products.length} item(s) placed${floating?` · ${floating} floating above a surface`:''}.`});
 const s=stability(),stable=s.unsupported?'fail':s.weak||s.towers?'warn':'ok';
 rows.push({state:state.panels.length?stable:'off',title:'Stable enough',detail:!state.panels.length?'Add panels to check support.':stable==='ok'?'Every raised shelf has support on two or more edges.':[s.unsupported?`${s.unsupported} shelf(s) with no panel underneath`:'',s.weak?`${s.weak} shelf(s) held on one edge`:'',s.towers?`${s.towers} column(s) three high with no side bracing`:''].filter(Boolean).join(' · ')+'. A heuristic, not a load test.'});
 const ok=rows.filter(r=>r.state==='ok').length,blocked=rows.some(r=>r.state==='fail'||r.state==='warn'),ready=!blocked&&rows[0].state==='ok'&&rows[3].state==='ok'&&rows[4].state==='ok';
 rows.push({state:ready?'ok':'off',title:'Print sheet ready',detail:ready?'Print setup sheet gives you numbered views and a parts list for build day.':'Turns green once the table, stocking and stability rows are green and nothing is over a limit.'});
 $('#readyList').replaceChildren(...rows.map(r=>{const li=document.createElement('li');li.className='ready-'+r.state;const dot=document.createElement('i');dot.className='dot';const b=document.createElement('b');b.textContent=r.title;const span=document.createElement('span');span.textContent=r.detail;li.append(dot,b,span);return li;}));
 $('#readyCount').textContent=`${ok} of 5`;$('#readyBar').style.width=(ok/5*100)+'%';$('#readyBar').className=ok===5?'done':'';
 const print=$('#printPlan');if(print)print.classList.toggle('primary',ready);
 $('#countKit').textContent=plan.kitPanels>0?`of ${plan.kitPanels} owned`:'';$('#connectorKit').textContent=plan.kitConnectors>0?`of ${plan.kitConnectors} owned`:'';
 for(const [meter,used,owned] of [['#countMeter',inv.panels,plan.kitPanels],['#connectorMeter',inv.connectors,plan.kitConnectors]]){const el=$(meter);el.hidden=!(owned>0);if(owned>0){el.style.setProperty('--fill',Math.min(1,used/owned)*100+'%');el.classList.toggle('over',used>owned);}}
 const cost=inv.panels*plan.pricePanel+inv.connectors*plan.priceConnector;$('#estimate').textContent=plan.pricePanel||plan.priceConnector?`Estimated kit cost: ${fmt(cost)} (${inv.panels} panels × ${fmt(plan.pricePanel)} + ${inv.connectors} connectors × ${fmt(plan.priceConnector)}).`:'Add prices to estimate what this layout costs to buy.';
 updateLimitPlane();requestRender();}
document.addEventListener('statechange',()=>{markSaved();['count','panels','connectors'].forEach(countUp);readiness();});
['count','panels','connectors'].forEach(id=>shown[id]=Number($('#'+id).textContent));
readiness();

/* ---------- First-visit tour ---------- */
const coach=$('#coach'),viewer=$('#viewer');
const steps=[
 {title:'Pick your table',text:'Every booth starts with the table you were assigned. Choose a size in the Table tab, or keep the 6 ft default.',action:'Open Table tab',run:()=>document.querySelector('[data-section="table"]').click(),done:snap=>snap.table!==steps.start.table},
 {title:'Pull an edge',text:'In Build mode, hover a panel edge and drag outward to add panels in half steps. Drag inward to take them away.',action:'Switch to Build',run:()=>document.querySelector('[data-mode="add"]').click(),done:snap=>snap.panels!==steps.start.panels},
 {title:'Stock it',text:'Switch to Products and drag a card onto a shelf or the table. Tap a card to drop it on the table.',action:'Open Products',run:()=>$('#productMode').click(),done:snap=>snap.products>steps.start.products},
 {title:'You are set',text:'Booth readiness below tracks table fit, your kit budget, height limits and stability as you build. Press ? any time for shortcuts.',action:'Done',run:()=>endCoach(),done:()=>false},
];
let step=-1;
const snapshot=()=>({table:JSON.stringify(state.table||null),panels:state.panels.length,products:(state.products||[]).length});
function showStep(i){step=i;const s=steps[i];steps.start=snapshot();$('#coachTitle').textContent=s.title;$('#coachText').textContent=s.text;$('#coachAction').textContent=s.action;$('#coachProgress').textContent=i<3?`Step ${i+1} of 3`:'';$('#coachNext').hidden=i===3;coach.hidden=false;viewer.classList.add('coaching');}
function endCoach(){coach.hidden=true;viewer.classList.remove('coaching');plan.coachDone=true;savePlan();step=-1;}
$('#coachAction').onclick=()=>steps[step]?.run();
$('#coachNext').onclick=()=>{if(step<steps.length-1)showStep(step+1);else endCoach();};
$('#coachSkip').onclick=endCoach;
document.addEventListener('statechange',()=>{if(step<0||step>=3)return;if(steps[step].done(snapshot()))showStep(step+1);});
if(!plan.coachDone)showStep(0);
})();
