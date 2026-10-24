require('./booth-model.js');
const {test}=require('node:test'),assert=require('node:assert/strict');require('./model.js');const M=globalThis.CubeModel;const cube=(x=0,y=0,z=0)=>({x,y,z,material:'mesh',color:'#53695e'});const design=(cubes)=>({schema:'cube-studio',version:1,name:'Test',width:35,height:35,depth:35,back:true,cubes});
test('one open cube has five panels and eight connector positions',()=>{const v=M.inventory(design([cube()]));assert.equal(v.panels,5);assert.equal(v.connectors,8);});
test('adjacent cubes share a side and corner connectors',()=>{const v=M.inventory(design([cube(),cube(1)]));assert.equal(v.panels,9);assert.equal(v.connectors,12);});
test('2x2 layout has sixteen panels and eighteen connector positions',()=>{const v=M.inventory(design([cube(),cube(1),cube(0,1),cube(1,1)]));assert.equal(v.panels,16);assert.equal(v.connectors,18);assert.equal(v.unsupported,0);});
test('missing support is reported and open backs remove panels',()=>{const s=design([cube(),cube(1,1)]);assert.equal(M.inventory(s).unsupported,1);s.back=false;assert.equal(M.inventory(s).panels,8);});
test('save/import preserves material and rejects overlaps and invalid dimensions',()=>{const s=design([cube()]);assert.deepEqual(M.validate(JSON.parse(JSON.stringify(s))),s);assert.throws(()=>M.validate({...s,cubes:[cube(),cube()]}),/Duplicate/);assert.throws(()=>M.validate({...s,width:0}),/dimensions/);assert.throws(()=>M.validate({...s,cubes:[cube(0,-1)]}),/position/);});

test('cube migration preserves panels and individual deletion stays deleted',()=>{const s=M.migrate(design([cube(),cube(1)]));assert.equal(s.version,2);assert.equal(s.panels.length,9);s.panels.splice(0,1);const restored=M.migrate(JSON.parse(JSON.stringify(s)));assert.equal(restored.panels.length,8);assert.equal(M.inventory(restored).panels,8);});
test('each attachment adds exactly one unique edge-connected panel',()=>{const s=M.migrate(design([cube()]));for(const type of ['side','back','shelf']){const targets=M.candidates(s,type);assert.ok(targets.length);const next=targets[0];assert.ok(!s.panels.some(p=>M.panelKey(p)===M.panelKey(next)));const before=s.panels.length;s.panels.push({...next,material:'plastic',color:'#112233'});assert.equal(M.validate(s).panels.length,before+1);assert.equal(M.inventory(s).panels,before+1);}});
test('empty panel designs can be saved and restarted in each orientation',()=>{const s=M.migrate(design([cube()]));s.panels=[];assert.equal(M.validate(s).panels.length,0);for(const type of ['side','back','shelf'])assert.deepEqual(M.candidates(s,type),[{type,x:0,y:0,z:0}]);});

test('edge extensions snap to halves and split into full plus half pieces',()=>{const p={type:'back',x:0,y:0,z:0,material:'mesh',color:'#112233'};const half=M.extension(p,'x',1,.45);assert.equal(half.length,1);assert.equal(half[0].u,.5);assert.equal(half[0].x,1);const long=M.extension(p,'x',1,1.5);assert.equal(long.length,2);assert.equal(long[0].u,1);assert.equal(long[1].u,.5);assert.equal(long[1].x,2);assert.equal(M.extension(p,'x',1,-1).length,0);assert.equal(M.extension(p,'y',-1,.5)[0].y,-.5);});
test('half panels round-trip and inventory measures actual sizes',()=>{const s={...M.migrate(design([cube()])),panels:[{type:'back',x:.5,y:0,z:0,u:.5,v:1,material:'mesh',color:'#112233'}]};const restored=M.migrate(JSON.parse(JSON.stringify(s)));assert.equal(restored.panels[0].u,.5);assert.deepEqual(M.inventory(restored).rows[0].dims,[35,17.5]);assert.equal(M.inventory(restored).connectors,4);assert.ok(M.overlaps(s.panels[0],{...s.panels[0],x:0,u:1}));assert.equal(M.overlaps(s.panels[0],{...s.panels[0],x:1}),false);});

test('edge dragging can turn a vertical backdrop into a horizontal shelf',()=>{const p=M.edgeExtension([[0,1,0],[1,1,0]],'z',1,.5)[0];assert.equal(p.type,'shelf');assert.equal(p.y,1);assert.equal(p.u,1);assert.equal(p.v,.5);});
test('half-width edges cannot create quarter panels and Shift creates full panels',()=>{const ends=[[0,0,0],[.5,0,0]];const normal=M.edgeExtension(ends,'y',1,.6);assert.equal(normal[0].u,.5);assert.equal(normal[0].v,1);assert.ok(normal.every(p=>p.u*p.v>=.5));const full=M.edgeExtension(ends,'y',1,1.2,true);assert.ok(full.every(p=>p.u===1&&p.v===1));const old=M.extension({type:'back',x:0,y:0,z:0,u:.5,v:1},'y',1,.6);assert.equal(old[0].v,1);});

test('inward drag retracts contiguous panels after their centres and stops at gaps',()=>{const p={type:'back',x:2,y:0,z:0,u:1,v:1,material:'mesh',color:'#112233'},half={...p,x:1.5,u:.5},far={...p,x:0};assert.equal(M.retraction([p,half,far],p,'x',1,.4).length,0);assert.deepEqual(M.retraction([p,half,far],p,'x',1,.5),[p]);assert.deepEqual(M.retraction([p,half,far],p,'x',1,1.25),[p,half]);assert.deepEqual(M.retraction([p,half,far],p,'x',1,10),[p,half]);});
test('retraction in the other direction preserves neighbouring rows and perpendicular panels',()=>{const p={type:'back',x:0,y:0,z:0},next={...p,x:1},above={...p,y:1},side={...p,type:'side'};assert.deepEqual(M.retraction([p,next,above,side],p,'x',-1,2),[p,next]);});

test('extending halves merges into one full panel in either direction and orientation',()=>{for(const type of ['side','shelf','back'])for(const dim of ['u','v'])for(const sign of [-1,1]){const axes=type==='side'?['z','y']:type==='shelf'?['x','z']:['x','y'],axis=axes[dim==='u'?0:1],p={type,x:1,y:1,z:1,u:1,v:1,material:'mesh',color:'#112233'};p[dim]=.5;const next={...p,[axis]:p[axis]+sign*.5},result=M.addAndMerge([p],[next]);assert.equal(result.panels.length,1);assert.equal(result.panels[0][dim],1);assert.equal(result.panels[0][axis],Math.min(p[axis],next[axis]));assert.equal(result.merged,1);assert.equal(p[dim],.5);}});
test('merge preserves differing finishes and ignores nonadjacent half panels',()=>{const p={type:'back',x:0,y:0,z:0,u:.5,v:1,material:'mesh',color:'#112233'};for(const next of [{...p,x:.5,material:'plastic'},{...p,x:1},{...p,x:.5,y:1}])assert.equal(M.addAndMerge([p],[next]).merged,0);});

test('plastic half-panel extensions retain half dimensions and merge into full plastic panels',()=>{const p={...M.edgeExtension([[0,0,0],[1,0,0]],'y',1,.5)[0],material:'plastic',color:'#112233'};assert.equal(p.u,1);assert.equal(p.v,.5);const next={...p,y:.5},s=M.migrate(design([cube()]));s.panels=[p];assert.deepEqual(M.inventory(s).rows[0].dims,[35,17.5]);const merged=M.addAndMerge([p],[next]);assert.equal(merged.panels.length,1);assert.equal(merged.panels[0].v,1);assert.equal(merged.panels[0].material,'plastic');});

test('inventory counts full and half panels separately across materials and orientations',()=>{const s=M.migrate(design([cube()]));s.panels=[{type:'back',x:0,y:0,z:0,material:'mesh',color:'#112233'},{type:'side',x:1,y:0,z:0,u:.5,v:1,material:'plastic',color:'#112233'},{type:'shelf',x:0,y:1,z:0,u:1,v:.5,material:'mesh',color:'#112233'}];const inv=M.inventory(s);assert.equal(inv.full,1);assert.equal(inv.half,2);assert.equal(inv.panels,3);});
test('Undo restores the layout without changing camera framing',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('app.js','utf8');const start=source.indexOf('function history('),end=source.indexOf("$('#undo').onclick",start),ctx=vm.createContext({state:{name:'after'},selected:'panel',render:()=>{},fit:()=>{throw Error('Camera must not reset');},$:()=>({textContent:''})});vm.runInContext(source.slice(start,end),ctx);vm.runInContext(`history(['{"name":"before"}'],[])`,ctx);assert.equal(ctx.state.name,'before');});

test('tables save dimensions, offsets and rotation without affecting panel counts, and legacy single tables migrate',()=>{const s=M.migrate(design([cube()]));s.tables=[{width:180,depth:75,height:74,x:30,z:10,rotation:0},{width:183,depth:76,height:74,x:160,z:-40,rotation:90}];const restored=M.migrate(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.tables,s.tables);assert.equal(M.inventory(restored).panels,5);assert.throws(()=>M.validate({...s,tables:[{...s.tables[0],width:-1}]}),/table width/);assert.throws(()=>M.validate({...s,tables:new Array(9).fill(s.tables[0])}),/up to 8 tables/);
const legacy=M.migrate({...JSON.parse(JSON.stringify(s)),tables:undefined,table:{enabled:true,width:180,depth:75,height:74,x:30,z:10}});assert.deepEqual(legacy.tables,[{width:180,depth:75,height:74,x:30,z:10,rotation:0}]);assert.equal(legacy.table,undefined,'the legacy field is dropped');
const off=M.migrate({...JSON.parse(JSON.stringify(s)),tables:undefined,table:{enabled:false,width:180,depth:75,height:74,x:30,z:10}});assert.deepEqual(off.tables,[]);
assert.deepEqual(M.tableItem({width:100,depth:50}),{width:100,depth:50,height:74,x:0,z:0,rotation:0},'missing height, position and rotation get defaults');assert.equal(M.tableItem({width:100,depth:50,rotation:45}).rotation,0,'only 0 and 90 degree turns are kept');});
test('section snapping considers every table edge, including turned tables',()=>{const s=M.migrate(design([cube()]));s.tables=[{width:100,depth:60,height:74,x:0,z:0,rotation:0},{width:100,depth:60,height:74,x:80,z:-80,rotation:90}];const chosen=s.panels;
const left=BoothModel.snap(s,chosen,{x:-50/s.width,y:0,z:0});assert.ok(left.label.includes('Left edge'),left.label);assert.ok(Math.abs(left.delta.x*s.width-(-50))<1e-6,'snaps to the first table\'s left edge at x=-50');
const turnedRight=BoothModel.snap(s,chosen,{x:(110-s.width)/s.width,y:0,z:0});assert.ok(turnedRight.label.includes('Right edge'),turnedRight.label);assert.ok(Math.abs(turnedRight.delta.x*s.width-(110-s.width))<1e-6,'the turned table is 60 wide, so its right edge is at x=110');});


test('table edge alignment is flush, supports corners, and preserves the other axis',()=>{const s=M.migrate(design([cube(-1,0,1),cube(0,0,1)])),t={enabled:true,width:180,depth:75,height:74,x:12,z:8};const left=M.alignTable(s,t,'left');assert.equal(left.x-left.width/2,-35);assert.equal(left.z,8);const right=M.alignTable(s,t,'right');assert.equal(right.x+right.width/2,35);const back=M.alignTable(s,left,'back');assert.equal(back.z-back.depth/2,35);assert.equal(back.x,left.x);const front=M.alignTable(s,t,'front');assert.equal(front.z+front.depth/2,70);assert.equal(t.x,12);assert.equal(s.panels.length,9);});
test('table alignment supports half panels and an empty starter grid',()=>{const s=M.migrate(design([cube()]));s.panels=[{type:'back',x:.5,y:0,z:0,u:.5,v:1,material:'mesh',color:'#112233'}];const t={width:180,depth:75,x:0,z:0};assert.equal(M.alignTable(s,t,'left').x-90,17.5);s.panels=[];assert.equal(M.alignTable(s,t,'right').x+90,35);});

test('a selection brush keeps the brushed panels, or cancels back to the previous selection',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('app.js','utf8'),start=source.indexOf('function finishBrush('),end=source.indexOf("canvas.addEventListener('pointerdown'",start);
for(const cancel of [false,true]){const panels=[{type:'back',x:0,y:0,z:0,material:'mesh',color:'#112233'},{type:'back',x:1,y:0,z:0,material:'mesh',color:'#112233'}],a=M.panelKey(panels[0]),b=M.panelKey(panels[1]),multiSelection=new Set([a,b]),ctx=vm.createContext({brushSel:{id:1,keys:new Set([b]),before:[a],selected:a},multiSelection,selected:b,canvas:{hasPointerCapture:()=>false},render:()=>{}});vm.runInContext(source.slice(start,end),ctx);vm.runInContext(`finishBrush(${cancel})`,ctx);assert.deepEqual([...multiSelection].sort(),cancel?[a]:[a,b].sort());assert.equal(ctx.selected,cancel?a:b);assert.equal(ctx.brushSel,null);}});
test('group movement is atomic, collision checked, and duplication retains originals',()=>{const s=M.migrate(design([cube()])),keys=new Set(s.panels.map(M.panelKey));const result=BoothModel.move(s.panels,keys,{x:3,y:0,z:0},true);assert.equal(result.panels.length,10);assert.equal(s.panels.length,5);assert.ok(BoothModel.move(s.panels,keys,{x:0,y:0,z:0},true).error);assert.ok(BoothModel.move(s.panels,keys,{x:0,y:-1,z:0}).error);});
test('group snapping respects table inset and permits saved non-grid positions',()=>{const s=M.migrate(design([cube()]));s.table={enabled:true,width:100,depth:60,x:0,z:0};const snap=BoothModel.snap(s,s.panels,{x:.4,y:0,z:0},2);assert.ok(snap.label.includes('Right'));assert.equal(snap.delta.x,(50-2-35)/35);const moved=BoothModel.move(s.panels,new Set(s.panels.map(M.panelKey)),snap.delta);assert.equal(M.validate({...s,panels:moved.panels,table:undefined}).panels.length,5);});
test('products preserve dimensions and positions in designs and reject unsafe images',()=>{const s=M.migrate(design([cube()])),p={id:'print',name:'Art print',width:21,height:29.7,depth:.3,x:0,y:30,z:0,image:''};s.products=[p];assert.deepEqual(M.migrate(JSON.parse(JSON.stringify(s))).products,[p]);assert.throws(()=>BoothModel.validateProducts([{...p,image:'https://example.com/x.png'}]),/image/);assert.throws(()=>BoothModel.validateProducts([{...p,width:-1}]),/size/);});

test('print views include numbered panels, table and product footprints',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('booth-tools.js','utf8'),start=source.indexOf('function planSVG('),end=source.indexOf("$('#printPlan').onclick",start),state=M.migrate(design([cube()]));state.table={enabled:true,width:180,depth:75,height:74,x:0,z:0};state.products=[{x:10,y:0,z:10,width:21,height:29.7,depth:.3}];const ctx=vm.createContext({state,CubeModel:M});vm.runInContext(source.slice(start,end),ctx);for(const top of [true,false]){const svg=vm.runInContext(`planSVG(${top})`,ctx);assert.match(svg,/<svg viewBox=/);assert.match(svg,/>1<\/text>/);assert.match(svg,/fill="#f1d7a4"/);assert.ok(!svg.includes('NaN'));}});

test('accessory dimensions, tiers, rotation and stand mesh survive save/import',()=>{const base={id:'a',name:'Stand',width:30,height:15,depth:24,x:0,y:0,z:0,image:''};for(const kind of ['hook','acrylic','stand']){const p={...base,kind,levels:4,rotation:Math.PI/2,...(kind==='stand'?{mesh:[0,0,0,1,0,0,0,1,0]}:{})};assert.deepEqual(BoothModel.validateProducts([p])[0],p);}assert.throws(()=>BoothModel.validateProducts([{...base,kind:'acrylic',levels:9}]),/levels/);});
test('surface snapping rests products on shelves and orients them against vertical panels',()=>{const fs=require('node:fs'),vm=require('node:vm'),ctx=vm.createContext({});vm.runInContext(fs.readFileSync('display-editor/product-placement.js','utf8'),ctx);vm.runInContext(fs.readFileSync('accessories.js','utf8')+';globalThis.views=AccessoryViews;',ctx);const p={height:10,depth:2};const snap=(type,normal)=>ctx.views.snap(p,{object:{userData:{cell:{type}}},face:{normal},point:{x:20,y:30,z:40}});assert.equal(snap('shelf',{y:1}).y,30.3);const back=snap('back',{z:1});assert.equal(back.z,41.3);assert.equal(back.y,25);const side=snap('side',{x:-1});assert.equal(side.x,18.7);assert.equal(side.rotation,-Math.PI/2);});

test('stand vertex colours round-trip and reject malformed arrays',()=>{const p={id:'stand',name:'Stand',width:30,height:30,depth:30,x:0,y:0,z:0,image:'',kind:'stand',mesh:[0,0,0,1,0,0,0,1,0],meshColors:[1,0,0,0,1,0,0,0,1]};assert.deepEqual(BoothModel.validateProducts([p])[0].meshColors,p.meshColors);assert.throws(()=>BoothModel.validateProducts([{...p,meshColors:[1]}]),/colours/);});


test('palette keeps one card per preset or custom variant regardless of placed copies',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('booth-tools.js','utf8');
 const start=source.indexOf('function paletteItems('),end=source.indexOf('function refreshItemPalette(',start);
 for(const paletteTab of ['product','hook','acrylic']){
  const state={products:[]},ctx=vm.createContext({state,paletteTab});vm.runInContext(source.slice(start,end),ctx);
  const defaults=ctx.paletteItems(),preset=defaults[0];
  state.products=[{...preset,id:'a',x:1,y:2,z:3},{...preset,id:'b',x:40,y:20,z:10,rotation:Math.PI}];
  assert.equal(ctx.paletteItems().length,defaults.length);
  const custom={...preset,name:'Custom size',width:preset.width+1};state.products.push({...custom,id:'c'},{...custom,id:'d'});
  assert.equal(ctx.paletteItems().length,defaults.length+1);
 }
});


test('hook attachments survive saves, follow translation and rotation, and detach independently',()=>{
 const hook={id:'h',kind:'hook',name:'Hook',width:3,height:4,depth:15,x:10,y:30,z:20,rotation:0,image:''};
 const item={id:'p',kind:'product',name:'Print',width:5,height:8,depth:.2,image:''};
 Object.assign(item,BoothModel.hang(item,hook,4));
 const saved=BoothModel.validateProducts(JSON.parse(JSON.stringify([hook,item])));
 assert.equal(saved[1].hookId,'h');assert.equal(saved[1].z,24);
 const moved=BoothModel.moveProduct(saved,'h',{x:50,y:40,z:60,rotation:Math.PI/2});
 assert.equal(moved[1].x,54);assert.equal(moved[1].z,60);assert.equal(moved[1].y,32.5);
 assert.equal(saved[1].x,10);
 const detached=BoothModel.moveProduct(moved,'p',{x:0,y:0,z:0,rotation:0});
 assert.equal(detached[1].hookId,undefined);
 assert.equal(BoothModel.moveProduct(detached,'h',{x:100,y:40,z:60})[1].x,0);
});


test('stands snap against both corner walls, accounting for rotation and wall extents',()=>{
 const state={width:30,height:30,depth:30,panels:[{type:'side',x:0,y:0,z:0},{type:'back',x:0,y:0,z:0}]};
 const p={kind:'acrylic',width:12,height:15,depth:8,x:10,z:10};
 const a=BoothModel.snapStand(state,p,{x:2,y:0,z:2,rotation:0});assert.equal(a.x,6.5);assert.equal(a.z,4.5);
 const b=BoothModel.snapStand(state,p,{x:2,y:0,z:2,rotation:Math.PI/2});assert.ok(Math.abs(b.x-4.5)<1e-9);assert.ok(Math.abs(b.z-6.5)<1e-9);
 assert.equal(BoothModel.snapStand(state,p,{x:2,y:40,z:2,rotation:0}).x,2);
 assert.equal(BoothModel.snapStand(state,p,{x:2,y:0,z:60,rotation:0}).x,2);
});

test('removing a hook detaches its items without deleting them or mutating undo history',()=>{const hook={id:'h',kind:'hook'},item={id:'p',hookId:'h',hookOffset:2,x:4};const result=BoothModel.removeProduct([hook,item],'h');assert.equal(result.length,1);assert.equal(result[0].id,'p');assert.equal(result[0].hookId,undefined);assert.equal(result[0].x,4);assert.equal(item.hookId,'h');assert.equal(BoothModel.removeProduct([hook,item],'p').length,1);});


test('products land on real acrylic and imported stand shelves, including rotated tiers',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),ctx=vm.createContext({console,AbortController});
 vm.runInContext(fs.readFileSync('three.js','utf8')+';globalThis.T=THREE;',ctx);
 vm.runInContext(fs.readFileSync('display-editor/product-placement.js','utf8'),ctx);vm.runInContext(fs.readFileSync('accessories.js','utf8')+';globalThis.A=AccessoryViews;',ctx);
 const T=ctx.T,group=new T.Group(),ray=new T.Raycaster();ctx.productGroup=group;ctx.ray=ray;
 const source=fs.readFileSync('booth-tools.js','utf8');vm.runInContext(source.slice(source.indexOf('function standTarget('),source.indexOf('function hookTarget(')),ctx);
 const product={kind:'product',width:5,height:8,depth:1};
 for(const rotation of [0,Math.PI/2]){
  group.clear();const stand={id:'s',kind:'acrylic',width:30,height:15,depth:24,levels:3,rotation},g=new T.Group();g.userData.productId='s';g.position.y=7.5;g.rotation.y=rotation;ctx.A.build(g,stand);group.add(g);ctx.state={products:[stand]};
  ray.set(new T.Vector3(Math.sin(rotation)*8,50,Math.cos(rotation)*8),new T.Vector3(0,-1,0));
  const hit=ctx.standTarget(product);assert.ok(hit);assert.ok(Math.abs(hit.y-.29)<.001);assert.equal(hit.rotation,rotation);
  assert.equal(ctx.standTarget({...product,width:40}),null);
 }
 group.clear();const mesh=Array.from(new T.BoxGeometry(30,10,20).toNonIndexed().attributes.position.array),stand={id:'custom',kind:'stand',width:30,height:10,depth:20,mesh},g=new T.Group();g.userData.productId='custom';g.position.y=5;ctx.A.build(g,stand);group.add(g);ctx.state={products:[stand]};
 ray.set(new T.Vector3(0,50,0),new T.Vector3(0,-1,0));const hit=ctx.standTarget(product);assert.ok(hit);assert.ok(Math.abs(hit.y-10.04)<.001);
 // The floor extends beyond inset side panels; products must stop at inner faces.
 const floorGeo=new T.BoxGeometry(30,1,20).toNonIndexed(),leftGeo=new T.BoxGeometry(.4,10,20).toNonIndexed(),rightGeo=leftGeo.clone();leftGeo.translate(-13,4.5,0);rightGeo.translate(13,4.5,0);
 const walled={...stand,height:10,mesh:[...floorGeo.attributes.position.array,...leftGeo.attributes.position.array,...rightGeo.attributes.position.array]};
 group.clear();const wg=new T.Group();wg.userData.productId='custom';ctx.A.build(wg,walled);group.add(wg);ctx.state={products:[walled]};ray.set(new T.Vector3(11,50,0),new T.Vector3(0,-1,0));const inside=ctx.standTarget(product);assert.ok(inside&&!inside.invalid);assert.ok(inside.x+product.width/2<12.8,'product stays inside the side wall');const cachedHit=ctx.standTarget(product);assert.equal(cachedHit.x,inside.x);assert.ok(wg.children[0].geometry.userData.trayBounds.size>0);ray.set(new T.Vector3(25,4,0),new T.Vector3(-1,0,0));assert.equal(ctx.standTarget(product),null,'vertical wall is not a shelf');
 // The editor exports inclined floors, not just horizontal boxes.
 const tilted=new T.BoxGeometry(30,.4,20).toNonIndexed();tilted.rotateX(Math.PI/6);tilted.computeBoundingBox();const dims=tilted.boundingBox.getSize(new T.Vector3());
 group.clear();const inclined={...stand,width:dims.x,height:dims.y,depth:dims.z,mesh:Array.from(tilted.attributes.position.array)},tiltGroup=new T.Group();tiltGroup.userData.productId='custom';ctx.A.build(tiltGroup,inclined);group.add(tiltGroup);ctx.state={products:[inclined]};
 ray.set(new T.Vector3(0,50,0),new T.Vector3(0,-1,0));const tiltHit=ctx.standTarget(product);assert.ok(tiltHit,'inclined imported floor must accept products');assert.ok(Number.isFinite(tiltHit.y));assert.ok(Math.abs(tiltHit.tilt-Math.PI/6)<.001);assert.equal(tiltHit.trayStandId,'custom');const restored=BoothModel.validateProducts([{...product,...tiltHit,id:'lean',name:'Lean',image:''}])[0];assert.equal(restored.tilt,tiltHit.tilt);

});



test('drag placement detects the tabletop below raised items and respects nearer panels',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),ctx=vm.createContext({console,AbortController});
 vm.runInContext(fs.readFileSync('three.js','utf8')+';globalThis.T=THREE;',ctx);const T=ctx.T;
 ctx.state={table:{enabled:true}};ctx.tableGroup=new T.Group();const top=new T.Mesh(new T.BoxGeometry(180,3,75),new T.MeshBasicMaterial());top.position.y=-1.5;ctx.tableGroup.add(top);
 ctx.ray=new T.Raycaster(new T.Vector3(20,60,10),new T.Vector3(0,-1,0));ctx.hit=()=>null;
 const source=fs.readFileSync('booth-tools.js','utf8');vm.runInContext(source.slice(source.indexOf('function placementSurface('),source.indexOf('function groundPoint(')),ctx);
 const h=ctx.placementSurface({});assert.equal(h.point.y,0);assert.equal(h.object.userData.tabletop,true);
 const panel={distance:30,object:{userData:{cell:{type:'shelf'}}}};ctx.hit=()=>panel;assert.equal(ctx.placementSurface({}),panel);
 ctx.state.table.enabled=false;ctx.hit=()=>null;assert.equal(ctx.placementSurface({}),null);
});

test('stand moves carry attached items through translation and rotation without changing tilt',()=>{const stand={id:'s',kind:'stand',x:10,y:5,z:20,rotation:0},item={id:'p',trayStandId:'s',trayPlane:2,x:13,y:8,z:24,rotation:0,tilt:.3};const result=BoothModel.moveProduct([stand,item],'s',{x:50,y:10,z:60,rotation:Math.PI/2});assert.equal(result[1].x,54);assert.equal(result[1].z,57);assert.equal(result[1].y,13);assert.equal(result[1].tilt,.3);assert.equal(result[1].rotation,Math.PI/2);assert.equal(item.x,13);assert.equal(BoothModel.removeProduct(result,'s')[0].trayStandId,undefined);});

test('back-only tray snapping stays at the rear while allowing sideways placement',()=>{require('./display-editor/product-placement.js');const G={model:{sideX:150},thick:1},s={t:{depth:100}},p={id:'p',width:30,depth:2,gap:2},rear=ProductPlacement.limits(G,s,p).minZ;for(const z of [0,50,99]){const at=ProductPlacement.candidate(G,s,p,{x:0,z},[],[p],null,1,true);assert.equal(at.z,rear);assert.equal(at.reason,'');}const others=[{id:'other',productId:'p',x:0,z:rear}],at=ProductPlacement.candidate(G,s,p,{x:31,z:rear},others,[p],null,1,true);assert.equal(at.z,rear);assert.equal(at.x,32);assert.equal(at.reason,'');});

test('hooks use the cursor ray while trays retain the offset placement ray',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('booth-tools.js','utf8');let direct=false;const line={value:'offset',clone(){return {value:this.value}},copy(q){this.value=q.value}};const ctx=vm.createContext({ray:{ray:line},hit:()=>{line.value='cursor'},standBoundary:()=>false,hookTarget:()=>direct?{hookId:'h'}:null,standTarget:()=>line.value==='offset'?{trayStandId:'s'}:null});vm.runInContext(source.slice(source.indexOf('function accessoryTarget('),source.indexOf('function hookTarget(')),ctx);assert.equal(ctx.accessoryTarget({},{}).tier.trayStandId,'s');assert.equal(line.value,'offset');direct=true;assert.equal(ctx.accessoryTarget({},{}).hook.hookId,'h');assert.equal(line.value,'offset');});

test('inventory combines orientations, colours and swapped dimensions, splitting only size and material',()=>{const state={version:2,width:30,height:30,depth:30,panels:[{type:'back',x:0,y:0,z:0,u:1,v:.5,material:'mesh',color:'#111111'},{type:'side',x:1,y:0,z:0,u:.5,v:1,material:'mesh',color:'#ffffff'},{type:'shelf',x:0,y:1,z:0,u:1,v:.5,material:'mesh',color:'#123456'},{type:'back',x:1,y:1,z:0,u:1,v:.5,material:'plastic',color:'#111111'},{type:'back',x:2,y:1,z:0,material:'mesh',color:'#111111'}]};const inv=M.inventory(state);assert.equal(inv.rows.length,3);assert.equal(inv.rows.find(r=>r.material==='mesh'&&r.dims[1]===15).count,3);assert.equal(inv.rows.find(r=>r.material==='plastic').count,1);assert.equal(inv.panels,5);});

test('40 by 30 kits count matching shelf and back panels together',()=>{const state={...M.migrate(design([cube()])),width:40,height:30,depth:30};const rows=M.inventory(state).rows;assert.equal(rows.find(r=>r.dims[0]===40&&r.dims[1]===30).count,3);assert.equal(rows.find(r=>r.dims[0]===30&&r.dims[1]===30).count,2);});

test('side half panel corners match visible depth and height dimensions',()=>{for(const [u,v] of [[.5,1],[1,.5]]){const p={type:'side',x:2,y:3,z:4,u,v};const points=M.vertices(p);assert.equal(Math.max(...points.map(p=>p[1]))-3,v);assert.equal(Math.max(...points.map(p=>p[2]))-4,u);assert.ok(points.every(p=>p[0]===2));const next=M.extension(p,'z',1,.5);if(next.length)assert.equal(Math.min(...M.vertices(next[0]).map(p=>p[2])),4+u);}});

test('wheel zoom magnifies the view without moving the camera into the booth',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('app.js','utf8'),start=source.indexOf("canvas.addEventListener('wheel',"),end=source.indexOf('gesture=null;});',start)+16,zoomStart=source.indexOf('function setZoom('),zoomEnd=source.indexOf('}',zoomStart)+1;const listeners={};const camera={zoom:1},orbit={distance:400},pan={x:0,y:0};const ctx=vm.createContext({canvas:{addEventListener:(name,fn)=>listeners[name]=fn},camera,orbit,pan,down:null,innerHeight:900,updateCamera:()=>{}});vm.runInContext(source.slice(zoomStart,zoomEnd)+';'+source.slice(start,end),ctx);const wheel=o=>listeners.wheel({preventDefault(){},deltaX:0,deltaY:0,deltaMode:0,...o});wheel({deltaY:-600});assert.ok(camera.zoom>1);assert.equal(orbit.distance,400);for(let i=0;i<200;i++)wheel({deltaY:-100000});assert.equal(camera.zoom,8);for(let i=0;i<200;i++)wheel({deltaY:100000});assert.equal(camera.zoom,.15);camera.zoom=1;wheel({deltaY:-4,ctrlKey:true});const pinch=camera.zoom;camera.zoom=1;wheel({deltaY:-4});assert.ok(pinch>camera.zoom,'trackpad pinch zooms faster than the same scroll delta');camera.zoom=1;wheel({deltaY:-3,deltaMode:1});const lines=camera.zoom;camera.zoom=1;wheel({deltaY:-48});assert.equal(lines,camera.zoom,'line deltas are normalised to 16 px');camera.zoom=1;wheel({deltaX:30,deltaY:2});assert.deepEqual([pan.x,pan.y,camera.zoom],[30,0,1],'horizontal scroll pans sideways');wheel({deltaY:12,shiftKey:true});assert.deepEqual([pan.x,pan.y,camera.zoom],[30,12,1],'shift-scroll pans vertically');listeners.gesturestart({preventDefault(){}});listeners.gesturechange({preventDefault(){},scale:2});assert.equal(camera.zoom,2,'Safari gesture events scale the zoom');wheel({deltaY:-4,ctrlKey:true});assert.equal(camera.zoom,2,'ctrl-wheel is ignored while a gesture is active');listeners.gestureend({preventDefault(){}});});

test('triangle panels keep three connector corners, count separately and survive save/import; kit settings round-trip',()=>{const base={schema:'cube-studio',version:2,name:'tri',width:30,height:30,depth:30,panels:[{type:'back',x:0,y:0,z:0,material:'mesh',color:'#53695e',cut:3},{type:'shelf',x:0,y:0,z:0,material:'plastic',color:'#53695e'}],kit:{half:false,triangle:true}};
const s=M.migrate(base);assert.equal(s.panels[0].cut,3);assert.deepEqual(s.kit,{half:false,triangle:true});assert.equal(M.corners(s.panels[0]).length,3);assert.equal(M.vertices(s.panels[0]).length,4);
const inv=M.inventory(s);assert.equal(inv.triangles,1);assert.equal(inv.full,1);assert.equal(inv.panels,2);assert.equal(inv.connectors,5,'the cut corner of the back panel is not a joint, the shelf still has four');assert.ok(inv.rows.some(r=>r.shape==='triangle'&&r.count===1));assert.ok(inv.rows.some(r=>r.shape===undefined&&r.count===1));
assert.throws(()=>M.migrate({...base,panels:[{...base.panels[0],cut:4}]}),/cut corner/);assert.throws(()=>M.migrate({...base,panels:[{...base.panels[0],u:.5,cut:0}]}),/full size/);assert.throws(()=>M.migrate({...base,kit:'yes'}),/kit/i);
const noKit=M.migrate({...base,kit:undefined});assert.equal(noKit.kit,undefined);
const ends=[[1,0,0],[1,1,0]];assert.deepEqual(M.edgeExtension(ends,'x',1,1.4,true).map(p=>p.u||1),[1],'without half panels a 1.4 pull snaps to one whole panel');assert.deepEqual(M.edgeExtension(ends,'x',1,1.4,false).map(p=>p.u||1),[1,.5],'with half panels it adds a half');});

test('corner pulls pick the panel by pull direction, cut inward and restore outward',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('app.js','utf8'),start=source.indexOf('function cornerChoice('),end=source.indexOf('function cornerMarker(',start),ctx=vm.createContext({});vm.runInContext(source.slice(start,end),ctx);const choose=(c,x,y)=>vm.runInContext('cornerChoice',ctx)(c,x,y);
const right={type:'back',x:0,y:0,z:0},down={type:'shelf',x:0,y:0,z:0},candidates=[{p:right,index:0,dx:60,dy:-60},{p:down,index:1,dx:60,dy:60}];
assert.equal(choose(candidates,3,-3),null,'a tiny movement does nothing');
assert.equal(choose(candidates,40,-40).p,right,'pulling up and right picks the panel whose centre lies that way');assert.equal(choose(candidates,40,-40).inward,true);assert.ok(choose(candidates,18,-18).progress<1,'a short pull is not committed');assert.equal(choose(candidates,40,-40).progress,1,'a long pull commits');
assert.equal(choose(candidates,40,40).p,down,'pulling down and right picks the shelf');
assert.equal(choose(candidates,40,0),null,'a pull between two diagonals is ambiguous');
assert.equal(choose(candidates,-40,40),null,'pulling outward from a square corner does nothing');
const cut=[{p:{...right,cut:0},index:0,dx:60,dy:-60}];assert.equal(choose(cut,40,-40),null,'pulling a cut corner inward does nothing');assert.equal(choose(cut,-40,40).inward,false,'pulling a cut corner outward restores');});

test('a diagonal edge pull adds one full triangle with the cut on the side away from the pull',()=>{const ends=[[1,0,0],[1,1,0]];
const up=M.trianglePull(ends,'x',1,1);assert.deepEqual([up.type,up.x,up.y,up.z,up.u,up.v],['back',1,0,0,1,1]);assert.equal(up.cut,2,'pulling toward the top end keeps the top far corner, so the bottom far corner (2,0,0) is cut');assert.deepEqual(M.corners(up).map(v=>v.join()),['1,0,0','1,1,0','2,1,0']);
const down=M.trianglePull(ends,'x',1,0);assert.equal(down.cut,3,'pulling toward the bottom end cuts the top far corner (2,1,0)');
const back=M.trianglePull(ends,'x',-1,1);assert.equal(back.x,0,'negative pulls extend the other way');assert.equal(back.cut,0,'the cut corner is on the far (x=0) side at the bottom');
assert.deepEqual(M.inventory({schema:'cube-studio',version:2,width:30,height:30,depth:30,panels:[up]}).rows[0].shape,'triangle');});

test('units are detected from the device timezone, with language as a fallback',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('booth-play.js','utf8'),start=source.indexOf('const US_ZONES='),end=source.indexOf('let unitsNote='),ctx=vm.createContext({});vm.runInContext(source.slice(start,end),ctx);const detect=(z,l)=>vm.runInContext('detectUnits',ctx)(z,l);
for(const zone of ['America/New_York','America/Chicago','America/Los_Angeles','America/Phoenix','America/Indiana/Indianapolis','America/Kentucky/Louisville','America/Anchorage','Pacific/Honolulu','America/Puerto_Rico'])assert.equal(detect(zone,'en-US').units,'in',zone);
for(const zone of ['Europe/Amsterdam','Europe/London','America/Toronto','America/Mexico_City','America/Sao_Paulo','Asia/Tokyo','Australia/Sydney','UTC'])assert.equal(detect(zone,'en-US').units,'cm',zone+' is metric even with a US language');
assert.equal(detect('','en-US').units,'in','no timezone: US English means inches');assert.equal(detect('','nl-BE').units,'cm');assert.equal(detect('','').units,'cm');assert.match(detect('America/Chicago','').reason,/timezone America\/Chicago/);});
