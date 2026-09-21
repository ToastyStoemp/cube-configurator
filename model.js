/* Grid coordinates describe cube cells; panels and connectors are shared. */
(function(scope){
const key=c=>`${c.x},${c.y},${c.z}`;
function validate(raw){
 if(raw?.schema!=='cube-studio'||![1,2].includes(raw.version))throw Error('Choose a Cube Studio design file.');
 for(const n of ['width','height','depth'])if(!Number.isFinite(raw[n])||raw[n]<10||raw[n]>100)throw Error('Cube dimensions must be between 10 and 100 cm.');
 if(raw.version===2)return validatePanels(raw);
 if(!Array.isArray(raw.cubes)||raw.cubes.length<1||raw.cubes.length>300)throw Error('A design must contain 1–300 cubes.');
 const seen=new Set(),cubes=raw.cubes.map(c=>{if(!c||![c.x,c.y,c.z].every(Number.isInteger)||Math.abs(c.x)>30||c.y<0||c.y>30||Math.abs(c.z)>30)throw Error('Invalid cube position.');if(seen.has(key(c)))throw Error('Duplicate cube position.');seen.add(key(c));if(!['mesh','plastic'].includes(c.material)||!/^#[0-9a-f]{6}$/i.test(c.color))throw Error('Invalid panel appearance.');return {x:c.x,y:c.y,z:c.z,material:c.material,color:c.color};});
 return {schema:'cube-studio',version:1,name:String(raw.name||'My cube setup').slice(0,80),width:raw.width,height:raw.height,depth:raw.depth,back:raw.back!==false,cubes};
}
function panels(state){
 if(state.version===2)return state.panels;
 const map=new Map();
 for(const c of state.cubes){const specs=[['side',c.x,c.y,c.z],['side',c.x+1,c.y,c.z],['shelf',c.x,c.y,c.z],['shelf',c.x,c.y+1,c.z]];if(state.back)specs.push(['back',c.x,c.y,c.z]);for(const [type,x,y,z] of specs){const id=`${type}:${x},${y},${z}`;if(!map.has(id))map.set(id,{type,x,y,z,material:c.material,color:c.color});}}
 return [...map.values()];
}
function inventory(state){
 const list=panels(state),rows=new Map(),corners=new Set();
 for(const p of list){const dims=p.type==='side'?[state.depth*(p.u||1),state.height*(p.v||1)]:p.type==='shelf'?[state.width*(p.u||1),state.depth*(p.v||1)]:[state.width*(p.u||1),state.height*(p.v||1)],id=[...dims.sort((a,b)=>b-a),p.material].join('|');const row=rows.get(id)||{dims,material:p.material,count:0};row.count++;rows.set(id,row);
 for(const v of vertices(p))corners.add(v.join(','));
 }
 const unsupported=(state.cubes||[]).filter(c=>c.y>0&&!state.cubes.some(q=>q.x===c.x&&q.y===c.y-1&&q.z===c.z)).length;
 return {panels:list.length,full:list.filter(p=>(p.u||1)*(p.v||1)===1).length,half:list.filter(p=>(p.u||1)*(p.v||1)===.5).length,connectors:corners.size,rows:[...rows.values()],unsupported};
}
const panelKey=p=>`${p.type}:${p.x},${p.y},${p.z}:${p.u||1},${p.v||1}`;
function vertices(p){const out=[];for(const a of [0,p.u||1])for(const b of [0,p.v||1])out.push(p.type==='side'?[p.x,p.y+a,p.z+b]:p.type==='shelf'?[p.x+a,p.y,p.z+b]:[p.x+a,p.y+b,p.z]);return out;}
function alignTable(state,table,edge){
 const points=state.panels.flatMap(vertices),xs=points.length?points.map(v=>v[0]*state.width):[0,state.width],zs=points.length?points.map(v=>v[2]*state.depth):[0,state.depth],result={...table};
 if(edge==='left')result.x=Math.min(...xs)+table.width/2;
 else if(edge==='right')result.x=Math.max(...xs)-table.width/2;
 else if(edge==='back')result.z=Math.min(...zs)+table.depth/2;
 else if(edge==='front')result.z=Math.max(...zs)-table.depth/2;
 else throw Error('Unknown table edge.');
 return result;
}
function tableSettings(raw){
 if(!raw||typeof raw.enabled!=='boolean')throw Error('Invalid table settings.');
 const result={enabled:raw.enabled};for(const [key,min,max] of [['width',30,400],['depth',20,200],['height',30,120],['x',-1000,1000],['z',-1000,1000]]){if(!Number.isFinite(raw[key])||raw[key]<min||raw[key]>max)throw Error('Invalid table '+key);result[key]=raw[key];}return result;
}
function validatePanels(raw){
 if(!Array.isArray(raw.panels)||raw.panels.length>1500)throw Error('A design supports up to 1500 panels.');
 const seen=new Set();const list=raw.panels.map(p=>{if(!p||!['side','shelf','back'].includes(p.type)||![p.x,p.y,p.z].every(v=>Number.isFinite(v))||![p.u??1,p.v??1].every(v=>v===.5||v===1)||Math.abs(p.x)>31||p.y<0||p.y>31||Math.abs(p.z)>31)throw Error('Invalid panel position.');if(!['mesh','plastic'].includes(p.material)||!/^#[0-9a-f]{6}$/i.test(p.color))throw Error('Invalid panel appearance.');const id=panelKey(p);if(seen.has(id))throw Error('Duplicate panel.');seen.add(id);return {type:p.type,x:p.x,y:p.y,z:p.z,material:p.material,color:p.color,...(p.u!==undefined?{u:p.u}:{}),...(p.v!==undefined?{v:p.v}:{})};});
 return {schema:'cube-studio',version:2,name:String(raw.name||'My booth display').slice(0,80),width:raw.width,height:raw.height,depth:raw.depth,panels:list,...(raw.products!==undefined?{products:BoothModel.validateProducts(raw.products)}:{}),...(raw.table!==undefined?{table:tableSettings(raw.table)}:{})};
}
function migrate(raw){const s=validate(raw);return s.version===2?s:{schema:s.schema,version:2,name:s.name,width:s.width,height:s.height,depth:s.depth,panels:panels(s)};}
function overlaps(a,b){if(a.type!==b.type)return false;const axes=a.type==='side'?['z','y','x']:a.type==='shelf'?['x','z','y']:['x','y','z'];const [u,v,n]=axes;return a[n]===b[n]&&a[u]<b[u]+(b.u||1)-1e-6&&a[u]+(a.u||1)>b[u]+1e-6&&a[v]<b[v]+(b.v||1)-1e-6&&a[v]+(a.v||1)>b[v]+1e-6;}
function extension(p,axis,sign,length){const axes=p.type==='side'?['z','y']:p.type==='shelf'?['x','z']:['x','y'];const dim=axis===axes[0]?'u':'v',out=[];let offset=0;const step=(p[dim==='u'?'v':'u']||1)===.5?1:.5;length=Math.min(10,Math.max(0,Math.round(length/step)*step));while(offset<length){const size=Math.min(1,length-offset),q={...p,u:p.u||1,v:p.v||1};q[axis]=sign>0?p[axis]+(p[dim]||1)+offset:p[axis]-offset-size;q[dim]=size;out.push(q);offset+=size;}return out;}
function edgeExtension(ends,axis,sign,length,full=false){
 const names=['x','y','z'],a=names.indexOf(axis),t=ends[0].findIndex((n,i)=>n!==ends[1][i]),normal=[0,1,2].find(i=>i!==a&&i!==t),type=['side','shelf','back'][normal],axes=type==='side'?[2,1]:type==='shelf'?[0,2]:[0,1],span=Math.abs(ends[1][t]-ends[0][t]),cross=full?1:span,step=full||cross===.5?1:.5;
 length=Math.min(10,Math.max(0,Math.round(length/step)*step));const out=[];
 for(let offset=0;offset<length;){const size=Math.min(1,length-offset),lo=ends[0].map((n,i)=>Math.min(n,ends[1][i]));lo[a]=ends[0][a]+(sign>0?offset:-offset-size);const dims=[];dims[a]=size;dims[t]=cross;out.push({type,x:lo[0],y:lo[1],z:lo[2],u:dims[axes[0]],v:dims[axes[1]]});offset+=size;}return out;
}
function addAndMerge(panels,additions){
 const result=panels.map(p=>({...p})),placed=[];let merged=0;
 for(const addition of additions){let p={...addition};const axes=p.type==='side'?['z','y','x']:p.type==='shelf'?['x','z','y']:['x','y','z'];
 for(const dim of ['u','v']){if((p[dim]||1)!==.5)continue;const axis=axes[dim==='u'?0:1],other=axes[dim==='u'?1:0],otherDim=dim==='u'?'v':'u';
 const index=result.findIndex(q=>q.type===p.type&&q.material===p.material&&q.color===p.color&&(q[dim]||1)===.5&&(q[otherDim]||1)===(p[otherDim]||1)&&q[other]===p[other]&&q[axes[2]]===p[axes[2]]&&Math.abs(Math.abs(q[axis]-p[axis])-.5)<1e-6);
 if(index>=0){const q=result.splice(index,1)[0];const old=placed.findIndex(v=>panelKey(v)===panelKey(q));if(old>=0)placed.splice(old,1);p[axis]=Math.min(p[axis],q[axis]);p[dim]=1;merged++;}}
 result.push(p);placed.push(p);
 }return {panels:result,placed,merged};
}
function retraction(panels,start,axis,outward,length){
 const axes=start.type==='side'?['z','y']:start.type==='shelf'?['x','z']:['x','y'],dim=axis===axes[0]?'u':'v',other=axes.find(a=>a!==axis),otherDim=dim==='u'?'v':'u',normal=['x','y','z'].find(a=>!axes.includes(a));
 let boundary=start[axis]+(outward>0?(start[dim]||1):0),travel=0;const result=[],visited=new Set();
 while(result.length<panels.length){const p=panels.find(q=>q.type===start.type&&q[normal]===start[normal]&&q[other]===start[other]&&(q[otherDim]||1)===(start[otherDim]||1)&&!visited.has(panelKey(q))&&Math.abs((outward>0?q[axis]+(q[dim]||1):q[axis])-boundary)<1e-6);if(!p)break;const size=p[dim]||1;if(length+1e-6<travel+size/2)break;result.push(p);visited.add(panelKey(p));travel+=size;boundary-=outward*size;}
 return result;
}
function candidates(state,type){
 const existing=new Set(state.panels.map(panelKey)),out=new Map();
 if(!state.panels.length)return [{type,x:0,y:0,z:0}];
 for(const p of state.panels){const corners=new Set(vertices(p).map(v=>v.join(',')));
 for(let x=p.x-1;x<=p.x+1;x++)for(let y=Math.max(0,p.y-1);y<=p.y+1;y++)for(let z=p.z-1;z<=p.z+1;z++){
 const q={type,x,y,z},id=panelKey(q);if(existing.has(id)||out.has(id)||Math.abs(x)>31||y>31||Math.abs(z)>31)continue;
 if(vertices(q).filter(v=>corners.has(v.join(','))).length>=2)out.set(id,q);
 }}return [...out.values()];
}
scope.CubeModel={key,validate,panels,inventory,panelKey,vertices,migrate,candidates,overlaps,extension,edgeExtension,retraction,addAndMerge,alignTable};
})(globalThis);
