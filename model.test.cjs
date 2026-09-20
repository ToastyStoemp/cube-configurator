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
test('half panels round-trip and inventory measures actual sizes',()=>{const s={...M.migrate(design([cube()])),panels:[{type:'back',x:.5,y:0,z:0,u:.5,v:1,material:'mesh',color:'#112233'}]};const restored=M.migrate(JSON.parse(JSON.stringify(s)));assert.equal(restored.panels[0].u,.5);assert.deepEqual(M.inventory(restored).rows[0].dims,[17.5,35]);assert.equal(M.inventory(restored).connectors,4);assert.ok(M.overlaps(s.panels[0],{...s.panels[0],x:0,u:1}));assert.equal(M.overlaps(s.panels[0],{...s.panels[0],x:1}),false);});

test('edge dragging can turn a vertical backdrop into a horizontal shelf',()=>{const p=M.edgeExtension([[0,1,0],[1,1,0]],'z',1,.5)[0];assert.equal(p.type,'shelf');assert.equal(p.y,1);assert.equal(p.u,1);assert.equal(p.v,.5);});
test('half-width edges cannot create quarter panels and Shift creates full panels',()=>{const ends=[[0,0,0],[.5,0,0]];const normal=M.edgeExtension(ends,'y',1,.6);assert.equal(normal[0].u,.5);assert.equal(normal[0].v,1);assert.ok(normal.every(p=>p.u*p.v>=.5));const full=M.edgeExtension(ends,'y',1,1.2,true);assert.ok(full.every(p=>p.u===1&&p.v===1));const old=M.extension({type:'back',x:0,y:0,z:0,u:.5,v:1},'y',1,.6);assert.equal(old[0].v,1);});

test('inward drag retracts contiguous panels after their centres and stops at gaps',()=>{const p={type:'back',x:2,y:0,z:0,u:1,v:1,material:'mesh',color:'#112233'},half={...p,x:1.5,u:.5},far={...p,x:0};assert.equal(M.retraction([p,half,far],p,'x',1,.4).length,0);assert.deepEqual(M.retraction([p,half,far],p,'x',1,.5),[p]);assert.deepEqual(M.retraction([p,half,far],p,'x',1,1.25),[p,half]);assert.deepEqual(M.retraction([p,half,far],p,'x',1,10),[p,half]);});
test('retraction in the other direction preserves neighbouring rows and perpendicular panels',()=>{const p={type:'back',x:0,y:0,z:0},next={...p,x:1},above={...p,y:1},side={...p,type:'side'};assert.deepEqual(M.retraction([p,next,above,side],p,'x',-1,2),[p,next]);});

test('extending halves merges into one full panel in either direction and orientation',()=>{for(const type of ['side','shelf','back'])for(const dim of ['u','v'])for(const sign of [-1,1]){const axes=type==='side'?['z','y']:type==='shelf'?['x','z']:['x','y'],axis=axes[dim==='u'?0:1],p={type,x:1,y:1,z:1,u:1,v:1,material:'mesh',color:'#112233'};p[dim]=.5;const next={...p,[axis]:p[axis]+sign*.5},result=M.addAndMerge([p],[next]);assert.equal(result.panels.length,1);assert.equal(result.panels[0][dim],1);assert.equal(result.panels[0][axis],Math.min(p[axis],next[axis]));assert.equal(result.merged,1);assert.equal(p[dim],.5);}});
test('merge preserves differing finishes and ignores nonadjacent half panels',()=>{const p={type:'back',x:0,y:0,z:0,u:.5,v:1,material:'mesh',color:'#112233'};for(const next of [{...p,x:.5,material:'plastic'},{...p,x:1},{...p,x:.5,y:1}])assert.equal(M.addAndMerge([p],[next]).merged,0);});

test('plastic half-panel extensions retain half dimensions and merge into full plastic panels',()=>{const p={...M.edgeExtension([[0,0,0],[1,0,0]],'y',1,.5)[0],material:'plastic',color:'#112233'};assert.equal(p.u,1);assert.equal(p.v,.5);const next={...p,y:.5},s=M.migrate(design([cube()]));s.panels=[p];assert.deepEqual(M.inventory(s).rows[0].dims,[35,17.5]);const merged=M.addAndMerge([p],[next]);assert.equal(merged.panels.length,1);assert.equal(merged.panels[0].v,1);assert.equal(merged.panels[0].material,'plastic');});

test('inventory counts full and half panels separately across materials and orientations',()=>{const s=M.migrate(design([cube()]));s.panels=[{type:'back',x:0,y:0,z:0,material:'mesh',color:'#112233'},{type:'side',x:1,y:0,z:0,u:.5,v:1,material:'plastic',color:'#112233'},{type:'shelf',x:0,y:1,z:0,u:1,v:.5,material:'mesh',color:'#112233'}];const inv=M.inventory(s);assert.equal(inv.full,1);assert.equal(inv.half,2);assert.equal(inv.panels,3);});
test('Undo restores the layout without changing camera framing',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('app.js','utf8');const start=source.indexOf('function history('),end=source.indexOf("$('#undo').onclick",start),ctx=vm.createContext({state:{name:'after'},selected:'panel',render:()=>{},fit:()=>{throw Error('Camera must not reset');},$:()=>({textContent:''})});vm.runInContext(source.slice(start,end),ctx);vm.runInContext(`history(['{"name":"before"}'],[])`,ctx);assert.equal(ctx.state.name,'before');});

test('table saves dimensions and offsets without affecting panel counts',()=>{const s=M.migrate(design([cube()]));s.table={enabled:true,width:180,depth:75,height:74,x:30,z:10};const restored=M.migrate(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.table,s.table);assert.equal(M.inventory(restored).panels,5);assert.throws(()=>M.validate({...s,table:{...s.table,width:-1}}),/table width/);});

test('table edge alignment is flush, supports corners, and preserves the other axis',()=>{const s=M.migrate(design([cube(-1,0,1),cube(0,0,1)])),t={enabled:true,width:180,depth:75,height:74,x:12,z:8};const left=M.alignTable(s,t,'left');assert.equal(left.x-left.width/2,-35);assert.equal(left.z,8);const right=M.alignTable(s,t,'right');assert.equal(right.x+right.width/2,35);const back=M.alignTable(s,left,'back');assert.equal(back.z-back.depth/2,35);assert.equal(back.x,left.x);const front=M.alignTable(s,t,'front');assert.equal(front.z+front.depth/2,70);assert.equal(t.x,12);assert.equal(s.panels.length,9);});
test('table alignment supports half panels and an empty starter grid',()=>{const s=M.migrate(design([cube()]));s.panels=[{type:'back',x:.5,y:0,z:0,u:.5,v:1,material:'mesh',color:'#112233'}];const t={width:180,depth:75,x:0,z:0};assert.equal(M.alignTable(s,t,'left').x-90,17.5);s.panels=[];assert.equal(M.alignTable(s,t,'right').x+90,35);});

test('a paint stroke applies only to brushed panels in a single edit, or cancels cleanly',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('app.js','utf8'),start=source.indexOf('function finishPaint('),end=source.indexOf("canvas.addEventListener('pointerdown'",start);for(const cancel of [false,true]){let edits=0;const panels=[{type:'back',x:0,y:0,z:0,material:'mesh',color:'#112233'},{type:'back',x:1,y:0,z:0,material:'mesh',color:'#112233'}],ctx=vm.createContext({paintStroke:{id:1,keys:new Set([M.panelKey(panels[0])]),style:{material:'plastic',color:'#ffffff'}},canvas:{hasPointerCapture:()=>false},state:{panels},CubeModel:M,change:fn=>{edits++;fn();},render:()=>{}});vm.runInContext(source.slice(start,end),ctx);vm.runInContext(`finishPaint(${cancel})`,ctx);assert.equal(edits,cancel?0:1);assert.equal(panels[0].color,cancel?'#112233':'#ffffff');assert.equal(panels[1].color,'#112233');assert.equal(ctx.paintStroke,null);}});

test('group movement is atomic, collision checked, and duplication retains originals',()=>{const s=M.migrate(design([cube()])),keys=new Set(s.panels.map(M.panelKey));const result=BoothModel.move(s.panels,keys,{x:3,y:0,z:0},true);assert.equal(result.panels.length,10);assert.equal(s.panels.length,5);assert.ok(BoothModel.move(s.panels,keys,{x:0,y:0,z:0},true).error);assert.ok(BoothModel.move(s.panels,keys,{x:0,y:-1,z:0}).error);});
test('group snapping respects table inset and permits saved non-grid positions',()=>{const s=M.migrate(design([cube()]));s.table={enabled:true,width:100,depth:60,x:0,z:0};const snap=BoothModel.snap(s,s.panels,{x:.4,y:0,z:0},2);assert.ok(snap.label.includes('Right'));assert.equal(snap.delta.x,(50-2-35)/35);const moved=BoothModel.move(s.panels,new Set(s.panels.map(M.panelKey)),snap.delta);assert.equal(M.validate({...s,panels:moved.panels,table:undefined}).panels.length,5);});
test('products preserve dimensions and positions in designs and reject unsafe images',()=>{const s=M.migrate(design([cube()])),p={id:'print',name:'Art print',width:21,height:29.7,depth:.3,x:0,y:30,z:0,image:''};s.products=[p];assert.deepEqual(M.migrate(JSON.parse(JSON.stringify(s))).products,[p]);assert.throws(()=>BoothModel.validateProducts([{...p,image:'https://example.com/x.png'}]),/image/);assert.throws(()=>BoothModel.validateProducts([{...p,width:-1}]),/size/);});

test('print views include numbered panels, table and product footprints',()=>{const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('booth-tools.js','utf8'),start=source.indexOf('function planSVG('),end=source.indexOf("$('#printPlan').onclick",start),state=M.migrate(design([cube()]));state.table={enabled:true,width:180,depth:75,height:74,x:0,z:0};state.products=[{x:10,y:0,z:10,width:21,height:29.7,depth:.3}];const ctx=vm.createContext({state,CubeModel:M});vm.runInContext(source.slice(start,end),ctx);for(const top of [true,false]){const svg=vm.runInContext(`planSVG(${top})`,ctx);assert.match(svg,/<svg viewBox=/);assert.match(svg,/>1<\/text>/);assert.match(svg,/fill="#f1d7a4"/);assert.ok(!svg.includes('NaN'));}});

test('accessory dimensions, tiers, rotation and stand mesh survive save/import',()=>{const base={id:'a',name:'Stand',width:30,height:15,depth:24,x:0,y:0,z:0,image:''};for(const kind of ['hook','acrylic','stand']){const p={...base,kind,levels:4,rotation:Math.PI/2,...(kind==='stand'?{mesh:[0,0,0,1,0,0,0,1,0]}:{})};assert.deepEqual(BoothModel.validateProducts([p])[0],p);}assert.throws(()=>BoothModel.validateProducts([{...base,kind:'acrylic',levels:9}]),/levels/);});
test('surface snapping rests products on shelves and orients them against vertical panels',()=>{const fs=require('node:fs'),vm=require('node:vm'),ctx=vm.createContext({});vm.runInContext(fs.readFileSync('accessories.js','utf8')+';globalThis.views=AccessoryViews;',ctx);const p={height:10,depth:2};const snap=(type,normal)=>ctx.views.snap(p,{object:{userData:{cell:{type}}},face:{normal},point:{x:20,y:30,z:40}});assert.equal(snap('shelf',{y:1}).y,30.3);const back=snap('back',{z:1});assert.equal(back.z,41.3);assert.equal(back.y,25);const side=snap('side',{x:-1});assert.equal(side.x,18.7);assert.equal(side.rotation,-Math.PI/2);});

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
