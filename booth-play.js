/* Play layer: mode-aware sidebar, units, table manager, first-visit tour, booth readiness, shortcuts, visitor view. */
(()=>{
'use strict';
const planKey='cube-studio-plan',plan={units:'cm',productsLocked:false,kitPanels:0,kitConnectors:0,heightLimit:0,tableTopLimit:0,inwardFacing:false,pricePanel:0,priceConnector:0,coachDone:false};
try{Object.assign(plan,JSON.parse(localStorage.getItem(planKey)||'{}'));}catch{}
const savePlan=()=>{try{localStorage.setItem(planKey,JSON.stringify(plan));}catch{}};
const motionOff=()=>calm||reducedMotion.matches;

/* ---------- Products live in Build and Select; a lock keeps them out of the way ---------- */
const lock=$('#lockProducts');lock.checked=!!plan.productsLocked;globalThis.productsLocked=lock.checked;
lock.onchange=()=>{plan.productsLocked=lock.checked;globalThis.productsLocked=lock.checked;savePlan();$('#status').textContent=lock.checked?'Products locked: pulls and selections go through them.':'Products unlocked: drag items on the display to move them.';};
$('#productMode').onclick=()=>{document.querySelector('[data-mode="add"]').click();const tools=$('#productTools');tools.hidden=false;tools.scrollIntoView({block:'start',behavior:'smooth'});};

/* ---------- Mode-aware sidebar ---------- */
function syncSidebar(){document.querySelectorAll('[data-for-mode]').forEach(el=>{el.hidden=!el.dataset.forMode.split(' ').includes(mode);});document.querySelector('.sidebarBody').scrollTop=0;}
document.addEventListener('modechange',syncSidebar);syncSidebar();

/* ---------- Styles apply live to the selection ---------- */
function applyStyleToSelection(){if(mode!=='select')return;const keys=selectionKeys();if(!keys.size)return;change(()=>state.panels.forEach(p=>{if(keys.has(CubeModel.panelKey(p)))Object.assign(p,appearance());}),`Style applied to ${keys.size} panel(s).`);}
document.querySelectorAll('[data-material],.swatches button').forEach(b=>b.addEventListener('click',applyStyleToSelection));
$('#color').addEventListener('change',applyStyleToSelection);

/* ---------- Units: the model stays in cm; inputs and readings switch between cm and inches ---------- */
const CM_INPUTS=['width','height','depth','tableInset','bpWidth','bpHeight','bpDepth','bpY','heightLimit','tableTopLimit','tableWidth','tableDepth','tableHeight','tableX','tableZ'];
const valueProp=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'),labelText=new WeakMap();
function unitize(el,inches){if(!el||!!el.dataset.unitized===inches)return;if(inches){const cm=valueProp.get.call(el);el.dataset.unitized='1';Object.defineProperty(el,'value',{configurable:true,get(){const raw=valueProp.get.call(el);if(raw==='')return '';const n=Number(raw);return Number.isFinite(n)?String(+(n*2.54).toFixed(4)):raw;},set(v){if(v===''||v===null||v===undefined){valueProp.set.call(el,'');return;}const n=Number(v);valueProp.set.call(el,Number.isFinite(n)?String(+(n/2.54).toFixed(2)):String(v));}});el.value=cm;for(const a of ['min','max']){const v=el.getAttribute(a);if(v!==null){el.dataset['cm'+a]=v;el.setAttribute(a,String(+(Number(v)/2.54).toFixed(2)));}}el.dataset.cmstep=el.getAttribute('step')||'';el.setAttribute('step','any');}
 else{const cm=el.value;delete el.value;delete el.dataset.unitized;valueProp.set.call(el,cm);for(const a of ['min','max'])if(el.dataset['cm'+a]!==undefined){el.setAttribute(a,el.dataset['cm'+a]);delete el.dataset['cm'+a];}if(el.dataset.cmstep)el.setAttribute('step',el.dataset.cmstep);else el.removeAttribute('step');delete el.dataset.cmstep;}}
function relabel(){const inches=plan.units==='in';for(const el of document.querySelectorAll('label,.summary span,.planSettings summary,#section-layout p,#section-table p,#section-table h2,.readinessHead h2'))for(const node of el.childNodes){if(node.nodeType!==3)continue;if(!labelText.has(node))labelText.set(node,node.data);const original=labelText.get(node);node.data=inches?original.replace(/\bcm\b/g,'in').replace(/\bCM\b/g,'IN'):original;}
 document.querySelectorAll('[data-label-cm]').forEach(b=>{b.textContent=inches?b.dataset.labelIn:b.dataset.labelCm;});}
const lengthPattern=/(-?\d+(?:\.\d+)?(?:\s*[×,]\s*-?\d+(?:\.\d+)?)*)\s*cm\b/g;
const toInchText=text=>text.replace(lengthPattern,(m,nums)=>nums.replace(/-?\d+(?:\.\d+)?/g,n=>String(+(Number(n)/2.54).toFixed(1)))+' in');
function convertCards(){document.querySelectorAll('#itemCards small').forEach(s=>{if(s.dataset.cm===undefined)s.dataset.cm=s.textContent;const next=plan.units==='in'?toInchText(s.dataset.cm):s.dataset.cm;if(s.textContent!==next)s.textContent=next;});}
function applyUnits(){globalThis.displayUnits=plan.units;const inches=plan.units==='in';CM_INPUTS.forEach(id=>unitize($('#'+id),inches));relabel();convertCards();document.querySelectorAll('[data-units]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.units===plan.units)));$('#unitsToggle').textContent='Units: '+plan.units;}
function setUnits(units){plan.units=units;savePlan();applyUnits();render();readiness();syncTables();$('#status').textContent=units==='in'?'Showing inches. Designs are still stored in centimetres.':'Showing centimetres.';}
document.querySelectorAll('[data-units]').forEach(b=>b.onclick=()=>setUnits(b.dataset.units));
$('#unitsToggle').onclick=()=>setUnits(plan.units==='in'?'cm':'in');
const cards=$('#itemCards');if(cards)new MutationObserver(convertCards).observe(cards,{childList:true,subtree:true});
$('#printPlan')?.addEventListener('click',()=>{if(plan.units!=='in')return;const original=window.print;window.print=function(){window.print=original;const sheet=$('#printSheet');if(sheet){const walker=document.createTreeWalker(sheet,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))node.data=toInchText(node.data).replace(/Dimensions in cm\b/,'Dimensions in inches').replace(/Size · cm/,'Size · in');for(const td of sheet.querySelectorAll('table tr td:nth-child(3)'))td.textContent=td.textContent.replace(/-?\d+(?:\.\d+)?/g,n=>String(+(Number(n)/2.54).toFixed(1)));}original.call(window);};},true);

/* ---------- Table manager ---------- */
const TABLE_FIELDS=[['width','tableWidth',30,400],['depth','tableDepth',20,200],['height','tableHeight',30,120],['x','tableX',-1000,1000],['z','tableZ',-1000,1000]];
const defaultTable=()=>({width:183,depth:76,height:74,x:0,z:0,rotation:0});
function setTables(next,message){change(()=>{state.tables=next;},message);fit();}
function layoutName(ts){if(ts.length===1)return 'single';if(ts.length===2){if(ts[0].rotation===ts[1].rotation&&Math.abs(ts[0].z-ts[1].z)<1)return 'row';if(ts[0].rotation!==ts[1].rotation)return 'corner';}return '';}
function syncTables(){const ts=tablesOf();if(selectedTable>=ts.length)selectedTable=Math.max(0,ts.length-1);const list=$('#tableList');list.replaceChildren(...ts.map((t,i)=>{const b=document.createElement('button');b.setAttribute('role','listitem');b.setAttribute('aria-pressed',String(i===selectedTable));const name=document.createElement('span');name.textContent=`Table ${i+1}`;const info=document.createElement('small');info.textContent=`${fmtLen(t.width,0)} × ${fmtLen(t.depth,0)} ${lenUnit()}${t.rotation?' · turned':''} · at ${fmtLen(t.x,0)}, ${fmtLen(t.z,0)}`;b.append(name,info);b.onclick=()=>{selectedTable=i;renderTable();requestRender();syncTables();};return b;}));
 if(!ts.length){const p=document.createElement('p');p.textContent='No tables yet. Add one to plan against your space.';list.append(p);}
 const t=ts[selectedTable];$('#tableEditor').hidden=!t;if(t){$('#tableEditorTitle').textContent=ts.length>1?`Table ${selectedTable+1}`:'Table';for(const [key,id] of TABLE_FIELDS)$('#'+id).value=t[key];$('#tableRotation').value=String(t.rotation||0);}
 const layout=layoutName(ts);document.querySelectorAll('[data-table-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tableLayout===layout)));}
function updateSelected(patch,message){const ts=tablesOf();if(!ts[selectedTable])return;setTables(ts.map((t,i)=>i===selectedTable?{...t,...patch}:t),message);}
for(const [key,id,min,max] of TABLE_FIELDS)$('#'+id).onchange=e=>{const value=Number(e.target.value);if(!Number.isFinite(value)||value<min||value>max){e.target.value=tablesOf()[selectedTable]?.[key]??0;$('#status').textContent=`Choose a value between ${fmtLen(min,0)} and ${fmtLen(max,0)} ${lenUnit()}.`;return;}updateSelected({[key]:value},'Table updated.');};
$('#tableRotation').onchange=e=>updateSelected({rotation:Number(e.target.value)===90?90:0},'Table turned.');
document.querySelectorAll('[data-table-preset]').forEach(b=>b.onclick=()=>{const [width,depth]=b.dataset.tablePreset.split(',').map(Number);if(!tablesOf().length){setTables([{...defaultTable(),width,depth}],`Table added: ${fmtLen(width,0)} × ${fmtLen(depth,0)} ${lenUnit()}.`);return;}updateSelected({width,depth},`Table set to ${fmtLen(width,0)} × ${fmtLen(depth,0)} ${lenUnit()}.`);});
function addTable(place){const ts=tablesOf();if(ts.length>=8){$('#status').textContent='A design supports up to 8 tables.';return;}const base=ts[selectedTable]||ts[ts.length-1]||defaultTable(),tb=tablesBounds(),r=tableRect(base);let next={...base};
 if(!tb)next=defaultTable();
 else if(place==='right')next={...base,x:tb.maxX+r.w/2,z:base.z};
 else if(place==='front')next={...base,x:base.x,z:tb.maxZ+r.d/2};
 else if(place==='turned'){const rotation=base.rotation===90?0:90,w=base.rotation===90?base.width:base.depth,d=base.rotation===90?base.depth:base.width;next={...base,rotation,x:tb.maxX+w/2,z:tb.maxZ-d/2};}
 else next={...base,x:base.x+30,z:base.z+30};
 selectedTable=ts.length;setTables([...ts,next],ts.length?`Table ${ts.length+1} added. Drag it in Move mode to reposition.`:'Table added.');}
$('#addTableRight').onclick=()=>addTable('right');$('#addTableFront').onclick=()=>addTable('front');$('#addTableTurned').onclick=()=>addTable('turned');$('#addTableFree').onclick=()=>addTable('free');
$('#removeTable').onclick=()=>{const ts=tablesOf();if(!ts.length)return;setTables(ts.filter((t,i)=>i!==selectedTable),ts.length>1?'Table removed.':'Table removed. The display now floats at tabletop height.');};
function snapTableTo(t,index,ts,tolerance=5){const r=tableRect({...t});let bestX=null,bestZ=null;for(const [i,o] of ts.entries()){if(i===index)continue;const ro=tableRect(o);for(const shift of [ro.maxX-r.minX,ro.minX-r.maxX,ro.minX-r.minX,ro.maxX-r.maxX])if(Math.abs(shift)<=tolerance&&(bestX===null||Math.abs(shift)<Math.abs(bestX)))bestX=shift;for(const shift of [ro.maxZ-r.minZ,ro.minZ-r.maxZ,ro.minZ-r.minZ,ro.maxZ-r.maxZ])if(Math.abs(shift)<=tolerance&&(bestZ===null||Math.abs(shift)<Math.abs(bestZ)))bestZ=shift;}return {x:t.x+(bestX||0),z:t.z+(bestZ||0),snapped:bestX!==null||bestZ!==null};}
$('#snapTable').onclick=()=>{const ts=tablesOf(),t=ts[selectedTable];if(!t||ts.length<2)return;const s=snapTableTo(t,selectedTable,ts,25);if(!s.snapped){$('#status').textContent='No table edge within 25 cm to snap to. Move it closer first.';return;}updateSelected({x:Math.round(s.x),z:Math.round(s.z)},'Table snapped to its neighbour.');};
document.querySelectorAll('[data-table-edge]').forEach(button=>button.onclick=()=>{const t=tablesOf()[selectedTable];if(!t)return;const r=tableRect(t),next=CubeModel.alignTable(state,{...t,width:r.w,depth:r.d},button.dataset.tableEdge);if(Math.abs(next.x)>1000||Math.abs(next.z)>1000){$('#status').textContent='This alignment exceeds the table position range.';return;}updateSelected({x:next.x,z:next.z},`Display aligned to the ${button.dataset.tableEdge} edge of this table.`);});
$('#centerTable').onclick=()=>{const b=bounds();updateSelected({x:(b.minX+b.maxX)*state.width/2,z:(b.minZ+b.maxZ)*state.depth/2},'Table centred under the display.');};
document.querySelectorAll('[data-table-layout]').forEach(b=>b.onclick=()=>{const ts=tablesOf(),first={...(ts[0]||defaultTable()),rotation:0},r=tableRect(first);let next=[first];if(b.dataset.tableLayout==='row')next=[first,{...first,x:first.x+r.w}];else if(b.dataset.tableLayout==='corner')next=[first,{...first,rotation:90,x:first.x+r.w/2+first.depth/2,z:first.z+r.d/2-first.width/2}];selectedTable=0;setTables(next,{single:'One table.',row:'Two tables in a row.',corner:'L-shaped corner: the second table turns back from the right end.'}[b.dataset.tableLayout]);});
document.addEventListener('statechange',syncTables);

/* ---------- Drag tables in Move mode ---------- */
let tableDrag=null;const raycaster=new THREE.Raycaster();
function pointerRay(e){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1),camera);return raycaster;}
function groundAt(e){const ray=pointerRay(e).ray;if(Math.abs(ray.direction.y)<.08)return null;return ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),new THREE.Vector3());}
canvas.addEventListener('pointerdown',e=>{if(mode!=='move'||e.button!==0||tableDrag||hit(e))return;const h=pointerRay(e).intersectObjects(tableGroup.children,true)[0];if(!h)return;const point=groundAt(e);if(!point)return;e.preventDefault();e.stopImmediatePropagation();const index=h.object.userData.tableIndex,t=tablesOf()[index];selectedTable=index;tableDrag={id:e.pointerId,index,start:point,x:t.x,z:t.z,before:JSON.stringify(state.tables)};canvas.setPointerCapture(e.pointerId);renderTable();requestRender();syncTables();$('#tip').textContent='Drag the table · snaps to other tables · Esc cancels';},true);
canvas.addEventListener('pointermove',e=>{if(!tableDrag||e.pointerId!==tableDrag.id)return;e.stopImmediatePropagation();const point=groundAt(e);if(!point)return;const ts=state.tables,t=ts[tableDrag.index];t.x=Math.round(tableDrag.x+point.x-tableDrag.start.x);t.z=Math.round(tableDrag.z+point.z-tableDrag.start.z);const s=snapTableTo(t,tableDrag.index,ts);t.x=Math.round(s.x);t.z=Math.round(s.z);renderTable();requestRender();$('#tip').textContent=`Table at ${fmtLen(t.x,0)}, ${fmtLen(t.z,0)} ${lenUnit()}${s.snapped?' · snapped to a neighbour':''} · release to place`;},true);
function finishTableDrag(cancel=false){const d=tableDrag;if(!d)return;tableDrag=null;if(canvas.hasPointerCapture(d.id))canvas.releasePointerCapture(d.id);const after=JSON.stringify(state.tables);state.tables=JSON.parse(d.before);if(cancel||after===d.before){renderTable();requestRender();return;}change(()=>{state.tables=JSON.parse(after);},'Table moved. Undo puts it back.');}
canvas.addEventListener('pointerup',e=>{if(!tableDrag||e.pointerId!==tableDrag.id)return;e.stopImmediatePropagation();finishTableDrag();},true);
canvas.addEventListener('pointercancel',()=>finishTableDrag(true));window.addEventListener('blur',()=>finishTableDrag(true));window.addEventListener('keydown',e=>{if(tableDrag&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finishTableDrag(true);}},true);

/* ---------- Quick style chip on the viewer (touch and narrow screens) ---------- */
const quick=document.createElement('div');quick.className='quickStyle';quick.innerHTML='<button id="quickStyle" aria-expanded="false" aria-controls="quickTray" aria-label="Panel style"><i class="sample"></i><span></span></button><div id="quickTray" hidden><div class="quickSwatches" role="group" aria-label="Colours"></div><div class="quickMaterials" role="group" aria-label="Finish"></div></div>';
$('#viewer').append(quick);
const quickButton=$('#quickStyle'),quickTray=$('#quickTray'),quickSwatches=quick.querySelector('.quickSwatches'),quickMaterials=quick.querySelector('.quickMaterials');
for(const source of document.querySelectorAll('.swatches [data-color]')){const b=document.createElement('button');b.dataset.color=source.dataset.color;b.title=source.title;b.setAttribute('aria-label',source.title);b.style.setProperty('--swatch',source.dataset.color);b.onclick=()=>{source.click();};quickSwatches.append(b);}
for(const source of document.querySelectorAll('[data-material]')){const b=document.createElement('button');b.dataset.material=source.dataset.material;b.textContent=source.dataset.material==='mesh'?'Mesh':'Plastic';b.onclick=()=>{source.click();};quickMaterials.append(b);}
function syncQuick(){const style=appearance(),sample=quickButton.querySelector('.sample');sample.style.setProperty('--paint',style.color);sample.classList.toggle('mesh',style.material==='mesh');quickButton.querySelector('span').textContent=$('#styleSummary').textContent;quickSwatches.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===style.color)));quickMaterials.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.material===style.material)));quick.hidden=!['add','select'].includes(mode);}
new MutationObserver(syncQuick).observe($('#styleSummary'),{childList:true,characterData:true,subtree:true});document.addEventListener('modechange',syncQuick);syncQuick();
quickButton.onclick=()=>{const open=quickTray.hidden;quickTray.hidden=!open;quickButton.setAttribute('aria-expanded',String(open));};
document.addEventListener('pointerdown',e=>{if(!quickTray.hidden&&!e.target.closest('.quickStyle')){quickTray.hidden=true;quickButton.setAttribute('aria-expanded','false');}});

/* ---------- Kit settings, panel size, triangle corners ---------- */
const kit=()=>({half:true,triangle:false,...(state.kit||{})});
function syncKit(){const k=kit();$('#kitHalf').checked=k.half;$('#kitTriangle').checked=k.triangle;$('#triangleTools').hidden=!k.triangle;}
$('#kitHalf').onchange=e=>change(()=>{state.kit={...kit(),half:e.target.checked};},e.target.checked?'Half panels enabled: edge pulls snap to halves.':'Half panels off: edge pulls snap to whole panels.');
$('#kitTriangle').onchange=e=>change(()=>{state.kit={...kit(),triangle:e.target.checked};},e.target.checked?'Triangle panels enabled: pull an edge diagonally, or cut a selected panel.':'Triangle panels off.');
document.querySelectorAll('[data-grid-size]').forEach(b=>b.onclick=()=>{const [width,height,depth]=b.dataset.gridSize.split(',').map(Number);change(()=>{state.width=width;state.height=height;state.depth=depth;},`Panels set to ${fmtLen(width)} × ${fmtLen(height)} ${lenUnit()}, ${fmtLen(depth)} ${lenUnit()} deep.`);fit();});
$('#cutCorner').onclick=()=>{const keys=selectionKeys();if(!keys.size)return;let skipped=0;change(()=>state.panels.forEach(p=>{if(!keys.has(CubeModel.panelKey(p)))return;if((p.u||1)!==1||(p.v||1)!==1){skipped++;return;}p.cut=((p.cut??-1)+1)%4;}),`Corner cut on ${keys.size-skipped} panel(s)${skipped?` · ${skipped} half panel(s) skipped`:''}. Cut again to turn it.`);};
$('#squareAgain').onclick=()=>{const keys=selectionKeys();if(!keys.size)return;change(()=>state.panels.forEach(p=>{if(keys.has(CubeModel.panelKey(p)))delete p.cut;}),'Panels restored to full squares.');};
document.addEventListener('statechange',syncKit);syncKit();

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
document.querySelectorAll('[data-preset]').forEach(b=>{const shape=PRESET_SHAPES[b.dataset.preset];const thumb=b.querySelector('.thumb');if(thumb&&shape)thumb.innerHTML=isoThumb(b.dataset.preset==='single'?[]:(shape.thumb||shape.cubes));});

/* ---------- Visitor view ---------- */
$('#visitor').onclick=()=>{const b=bounds(),tb=tablesBounds(),cx=(b.minX+b.maxX)/2*state.width,cz=(b.minZ+b.maxZ)/2*state.depth,cy=Math.max(10,b.maxY*state.height*.45),frontZ=tb?tb.maxZ:b.maxZ*state.depth,eye=155-(tb?tb.height:74),dz=frontZ+120-cz,dist=Math.hypot(dz,eye-cy);target.set(cx,cy,cz);orbit.yaw=0;orbit.pitch=Math.asin((eye-cy)/dist);orbit.distance=dist;camera.zoom=1;pan.set(0,0);updateCamera();$('#tip').textContent=`Visitor view · standing eye level, ${fmtLen(120,0)} ${lenUnit()} in front of the table`;};

/* ---------- Merge flash ---------- */
document.addEventListener('panelsmerged',e=>{if(motionOff())return;const keys=new Set(e.detail.map(CubeModel.panelKey)),targets=[];root.children.forEach(o=>{if(keys.has(o.userData.panelKey))o.traverse(n=>{if(n.material?.emissive)targets.push(n.material);});});if(!targets.length)return;const start=performance.now();(function frame(now){const t=Math.min(1,(now-start)/450),glow=Math.sin(t*Math.PI)*.7;for(const m of targets){m.emissive.set('#e0a94a');m.emissiveIntensity=glow;}renderer.render(scene,camera);if(t<1)requestAnimationFrame(frame);else{for(const m of targets)m.emissiveIntensity=0;requestRender();}})(start);});

/* ---------- Autosave indicator and count-up meters ---------- */
const saveState=$('#saveState');
function markSaved(){const t=new Date();saveState.textContent='Saved locally · '+t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
const shown={count:null,panels:null,connectors:null},tweens={};
function countUp(id){const el=$('#'+id),next=Number(el.textContent);if(!Number.isFinite(next)){shown[id]=null;return;}const from=shown[id];shown[id]=next;if(from===null||from===next||motionOff())return;cancelAnimationFrame(tweens[id]);const start=performance.now();(function frame(now){const t=Math.min(1,(now-start)/380),eased=1-Math.pow(1-t,3);el.textContent=String(Math.round(from+(next-from)*eased));if(t<1)tweens[id]=requestAnimationFrame(frame);else el.textContent=String(next);})(start);}

/* ---------- Booth readiness ---------- */
const inputs={kitPanels:'#kitPanels',kitConnectors:'#kitConnectors',heightLimit:'#heightLimit',tableTopLimit:'#tableTopLimit',pricePanel:'#pricePanel',priceConnector:'#priceConnector'};
for(const [key,sel] of Object.entries(inputs)){const el=$(sel);el.value=plan[key]||'';el.addEventListener('input',()=>{plan[key]=Math.max(0,Number(el.value)||0);savePlan();readiness();});}
$('#inwardFacing').checked=!!plan.inwardFacing;$('#inwardFacing').onchange=e=>{plan.inwardFacing=e.target.checked;savePlan();readiness();};
const limitPlane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#c25a46',transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}));limitPlane.rotation.x=-Math.PI/2;limitPlane.visible=false;scene.add(limitPlane);
function footprintIssues(){if(!tablesOf().length)return {panels:0,products:0};const panels=state.panels.filter(p=>CubeModel.vertices(p).some(v=>!onTables(v[0]*state.width,v[2]*state.depth,.5))).length,products=(state.products||[]).filter(p=>!p.hookId&&!p.trayStandId&&[[-1,-1],[1,-1],[-1,1],[1,1]].some(([sx,sz])=>!onTables(p.x+sx*p.width/2,p.z+sz*p.depth/2,.5))).length;return {panels,products};}
function stability(){const panels=state.panels,shelves=panels.filter(p=>p.type==='shelf'&&p.y>0);let unsupported=0,weak=0;
 for(const s of shelves){const u=s.u||1,v=s.v||1;let supports=0;for(const p of panels){if(p.type==='side'){const pu=p.u||1,pv=p.v||1;if((Math.abs(p.x-s.x)<1e-6||Math.abs(p.x-(s.x+u))<1e-6)&&p.y<s.y&&p.y+pv>=s.y-1e-6&&p.z<s.z+v-1e-6&&p.z+pu>s.z+1e-6)supports++;}else if(p.type==='back'){const pu=p.u||1,pv=p.v||1;if((Math.abs(p.z-s.z)<1e-6||Math.abs(p.z-(s.z+v))<1e-6)&&p.y<s.y&&p.y+pv>=s.y-1e-6&&p.x<s.x+u-1e-6&&p.x+pu>s.x+1e-6)supports++;}}if(!supports)unsupported++;else if(supports===1)weak++;}
 let towers=0;const columns=new Map();for(const p of panels)if(p.type==='back'){const key=p.x+','+p.z;columns.set(key,(columns.get(key)||[]).concat(p));}
 for(const [key,list] of columns){const ys=new Set(list.map(p=>Math.floor(p.y)));let run=0,best=0;for(let y=0;y<=32;y++){run=ys.has(y)?run+1:0;best=Math.max(best,run);}if(best<3)continue;const [x,z]=key.split(',').map(Number);const braced=panels.some(p=>p.type==='side'&&(Math.abs(p.x-x)<1e-6||Math.abs(p.x-(x+1))<1e-6)&&p.y>=1&&Math.abs(p.z-z)<1+1e-6);if(!braced)towers++;}
 return {unsupported,weak,towers};}
function topHeight(){const b=bounds(),tb=tablesBounds(),base=tb?tb.height:0;let top=state.panels.length?b.maxY*state.height:0;for(const p of state.products||[])top=Math.max(top,p.y+p.height);return {top:top+base,base,aboveTable:top};}
function updateLimitPlane(){const tb=tablesBounds(),{top,base,aboveTable}=topHeight();let y=null;if(plan.heightLimit&&top>plan.heightLimit+1e-6)y=plan.heightLimit-base;if(plan.tableTopLimit&&aboveTable>plan.tableTopLimit+1e-6)y=y===null?plan.tableTopLimit:Math.min(y,plan.tableTopLimit);limitPlane.visible=y!==null;if(y===null)return;const b=bounds(),w=Math.max(60,(b.maxX-b.minX)*state.width+40,tb?tb.maxX-tb.minX:0),d=Math.max(60,(b.maxZ-b.minZ)*state.depth+40,tb?tb.maxZ-tb.minZ:0);limitPlane.scale.set(w,d,1);limitPlane.position.set(tb?(tb.minX+tb.maxX)/2:(b.minX+b.maxX)/2*state.width,y,tb?(tb.minZ+tb.maxZ)/2:(b.minZ+b.maxZ)/2*state.depth);}
const fmt=n=>n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),len=(cm,d=0)=>`${fmtLen(cm,d)} ${lenUnit()}`;
function readiness(){const inv=CubeModel.inventory(state),products=state.products||[],rows=[];
 const ts=tablesOf(),tb=tablesBounds(),fp=footprintIssues(),tableLabel=ts.length>1?`${ts.length} tables`:ts.length?`${fmtLen(tableRect(ts[0]).w,0)} × ${fmtLen(tableRect(ts[0]).d,0)} ${lenUnit()} table`:'';
 rows.push(!ts.length?{state:'off',title:'Fits the table',detail:'Add a table in the Table tab to check the footprint.'}:fp.panels||fp.products?{state:'fail',title:'Fits the table',detail:`${fp.panels?fp.panels+' panel(s)':''}${fp.panels&&fp.products?' and ':''}${fp.products?fp.products+' item(s)':''} extend past the ${tableLabel}.`}:{state:'ok',title:'Fits the table',detail:`Everything sits within the ${tableLabel}.`});
 const kitSet=plan.kitPanels>0||plan.kitConnectors>0,overPanels=plan.kitPanels>0&&inv.panels>plan.kitPanels,overConnectors=plan.kitConnectors>0&&inv.connectors>plan.kitConnectors;
 rows.push(!kitSet?{state:'off',title:'Within your kit',detail:'Enter how many panels and connectors you own below.'}:{state:overPanels||overConnectors?'fail':'ok',title:'Within your kit',detail:[plan.kitPanels>0?`${inv.panels} of ${plan.kitPanels} panels`:`${inv.panels} panels`,plan.kitConnectors>0?`${inv.connectors} of ${plan.kitConnectors} connectors`:`${inv.connectors} connectors`].join(' · ')+(overPanels||overConnectors?' · over budget':'')});
 const {top,aboveTable}=topHeight();
 rows.push(!plan.heightLimit?{state:'off',title:'Under the height limit',detail:`Top of the display is ${len(top)} from the floor. Set your convention's limit below.`}:{state:top>plan.heightLimit+1e-6?'fail':'ok',title:'Under the height limit',detail:`Top at ${len(top)} · limit ${len(plan.heightLimit)} from the floor.`});
 if(plan.tableTopLimit)rows.push({state:aboveTable>plan.tableTopLimit+1e-6?'fail':'ok',title:'Under the tabletop limit',detail:`${len(aboveTable)} above the tabletop · limit ${len(plan.tableTopLimit)}.`});
 if(plan.inwardFacing){const sideways=products.filter(p=>Math.cos(p.rotation||0)<.5).length;rows.push({state:sideways?'warn':'ok',title:'Facing the aisle',detail:sideways?`${sideways} item(s) face sideways or backwards. Turn them toward the front.`:'Every item faces the aisle.'});}
 const floating=products.filter(p=>!p.hookId&&!p.trayStandId&&p.y>0&&!state.panels.some(s=>s.type==='shelf'&&Math.abs(s.y*state.height-p.y)<1.5)).length;
 rows.push(!products.length?{state:'off',title:'Stocked with products',detail:'Open Products and drag a card onto a shelf or the table.'}:{state:floating?'warn':'ok',title:'Stocked with products',detail:`${products.length} item(s) placed${floating?` · ${floating} floating above a surface`:''}.`});
 const s=stability(),stable=s.unsupported?'fail':s.weak||s.towers?'warn':'ok';
 rows.push({state:state.panels.length?stable:'off',title:'Stable enough',detail:!state.panels.length?'Add panels to check support.':stable==='ok'?'Every raised shelf has support on two or more edges.':[s.unsupported?`${s.unsupported} shelf(s) with no panel underneath`:'',s.weak?`${s.weak} shelf(s) held on one edge`:'',s.towers?`${s.towers} column(s) three high with no side bracing`:''].filter(Boolean).join(' · ')+'. A heuristic, not a load test.'});
 const total=rows.length,ok=rows.filter(r=>r.state==='ok').length,blocked=rows.some(r=>r.state==='fail'||r.state==='warn'),stocked=rows.find(r=>r.title==='Stocked with products'),stableRow=rows.find(r=>r.title==='Stable enough'),ready=!blocked&&rows[0].state==='ok'&&stocked.state==='ok'&&stableRow.state==='ok';
 rows.push({state:ready?'ok':'off',title:'Print sheet ready',detail:ready?'Print setup sheet gives you numbered views and a parts list for build day.':'Turns green once the table, stocking and stability rows are green and nothing is over a limit.'});
 $('#readyList').replaceChildren(...rows.map(r=>{const li=document.createElement('li');li.className='ready-'+r.state;const dot=document.createElement('i');dot.className='dot';const b=document.createElement('b');b.textContent=r.title;const span=document.createElement('span');span.textContent=r.detail;li.append(dot,b,span);return li;}));
 $('#readyCount').textContent=`${ok} of ${total}`;$('#readyBar').style.width=(ok/total*100)+'%';$('#readyBar').className=ok===total?'done':'';
 const print=$('#printPlan');if(print)print.classList.toggle('primary',ready);
 $('#countKit').textContent=plan.kitPanels>0?`of ${plan.kitPanels} owned`:'';$('#connectorKit').textContent=plan.kitConnectors>0?`of ${plan.kitConnectors} owned`:'';
 for(const [meter,used,owned] of [['#countMeter',inv.panels,plan.kitPanels],['#connectorMeter',inv.connectors,plan.kitConnectors]]){const el=$(meter);el.hidden=!(owned>0);if(owned>0){el.style.setProperty('--fill',Math.min(1,used/owned)*100+'%');el.classList.toggle('over',used>owned);}}
 const cost=inv.panels*plan.pricePanel+inv.connectors*plan.priceConnector;$('#estimate').textContent=plan.pricePanel||plan.priceConnector?`Estimated kit cost: ${fmt(cost)} (${inv.panels} panels × ${fmt(plan.pricePanel)} + ${inv.connectors} connectors × ${fmt(plan.priceConnector)}).`:'Add prices to estimate what this layout costs to buy.';
 updateLimitPlane();requestRender();}
document.addEventListener('statechange',()=>{markSaved();['count','panels','connectors'].forEach(countUp);readiness();});
['count','panels','connectors'].forEach(id=>shown[id]=Number($('#'+id).textContent));
applyUnits();syncTables();readiness();

/* ---------- First-visit tour ---------- */
const coach=$('#coach'),viewer=$('#viewer');
const steps=[
 {title:'Pick your table',text:'Every booth starts with the table you were assigned. Choose a size in the Table tab, add a second table, or keep the 6 ft default.',action:'Open Table tab',run:()=>document.querySelector('[data-section="table"]').click(),done:snap=>snap.tables!==steps.start.tables},
 {title:'Pull an edge',text:'In Build mode, hover a panel edge and drag outward to add panels in half steps. Drag inward to take them away.',action:'Switch to Build',run:()=>document.querySelector('[data-mode="add"]').click(),done:snap=>snap.panels!==steps.start.panels},
 {title:'Stock it',text:'Drag a card from Stock your booth onto a shelf or the table, or tap a card to drop it on the table. Items can be dragged around the display afterwards.',action:'Show the palette',run:()=>$('#productMode').click(),done:snap=>snap.products>steps.start.products},
 {title:'You are set',text:'Booth readiness below tracks table fit, your kit budget, height limits and stability as you build. Press ? any time for shortcuts.',action:'Done',run:()=>endCoach(),done:()=>false},
];
let step=-1;
const snapshot=()=>({tables:JSON.stringify(state.tables||null),panels:state.panels.length,products:(state.products||[]).length});
function showStep(i){step=i;const s=steps[i];steps.start=snapshot();$('#coachTitle').textContent=s.title;$('#coachText').textContent=s.text;$('#coachAction').textContent=s.action;$('#coachProgress').textContent=i<3?`Step ${i+1} of 3`:'';$('#coachNext').hidden=i===3;coach.hidden=false;viewer.classList.add('coaching');}
function endCoach(){coach.hidden=true;viewer.classList.remove('coaching');plan.coachDone=true;savePlan();step=-1;}
$('#coachAction').onclick=()=>steps[step]?.run();
$('#coachNext').onclick=()=>{if(step<steps.length-1)showStep(step+1);else endCoach();};
$('#coachSkip').onclick=endCoach;
document.addEventListener('statechange',()=>{if(step<0||step>=3)return;if(steps[step].done(snapshot()))showStep(step+1);});
if(!plan.coachDone)showStep(0);
})();
