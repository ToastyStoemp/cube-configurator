const AccessoryViews=(()=>{
function build(group,p){const metal=new THREE.MeshStandardMaterial({color:'#b5bfc1',metalness:.85,roughness:.25}),acrylic=new THREE.MeshPhysicalMaterial({color:'#eef7f8',transparent:true,opacity:.18,roughness:.08,metalness:0,depthWrite:false,side:THREE.DoubleSide});
 function box(w,h,d,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),acrylic.clone());m.position.set(x,y,z);group.add(m);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:'#a1b4ba',transparent:true,opacity:.65}));edge.position.copy(m.position);group.add(edge);return m;}
 const solid=(w,h,d,x,y,z,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);group.add(m);return m;};
 const rod=(a,b,r,color)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),10),new THREE.MeshStandardMaterial({color,roughness:.5,metalness:color==='#b5bfc1'?.7:0}));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());group.add(m);return m;};
 const art=(w,h,x,y,z,tilt=0)=>{let material;if(p.image){const texture=new THREE.TextureLoader().load(p.image,()=>globalThis.requestRender?.());texture.colorSpace=THREE.SRGBColorSpace;material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});}else material=new THREE.MeshStandardMaterial({color:'#f1e8d2',side:THREE.DoubleSide,roughness:.9});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(x,y,z);m.rotation.x=tilt;group.add(m);if(!p.image){const edge=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:'#b89d6a'}));edge.position.copy(m.position);edge.rotation.copy(m.rotation);group.add(edge);}return m;};
 const V=(x,y,z)=>new THREE.Vector3(x,y,z),w=p.width,h=p.height,d=p.depth;
 if(p.kind==='banner'){solid(w,5,Math.max(6,d*.8),0,-h/2+2.5,0,'#4a4f4d');rod(V(0,-h/2+5,-d/2+1.5),V(0,h/2,-d/2+1.5),.8,'#b5bfc1');solid(w,1.2,1.2,0,h/2-.6,-d/2+1.5,'#b5bfc1');art(w-1,h-7,0,2,-d/2+2.6);}
 else if(p.kind==='gridwall'){const points=[];for(let x=-w/2;x<=w/2+.01;x+=5)points.push(V(x,-h/2,0),V(x,h/2,0));for(let y=-h/2;y<=h/2+.01;y+=5)points.push(V(-w/2,y,0),V(w/2,y,0));group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#303a35'})));for(const x of [-w/2+6,w/2-6])solid(3,2,Math.max(12,d),x,-h/2+1,0,'#303a35');}
 else if(p.kind==='easel'){const tilt=-.2,top=V(0,h/2,-h*.1),base=V(0,-h/2,d*.4);for(const x of [-w/2+1.5,w/2-1.5])rod(V(x,-h/2,d/2-1),V(x*.3,h/2+2,-d*.1),.6,'#8b6a3e');rod(V(0,-h/2,-d/2+1),V(0,h/2-2,-d*.15),.6,'#8b6a3e');solid(w,1.5,3,0,-h/2+.75,d/2-2,'#8b6a3e');art(w,h,0,.5,d*.15,tilt);}
 else if(p.kind==='sign'){solid(w*.7,1,d,0,-h/2+.5,0,'#dfe7e8');const back=new THREE.Mesh(new THREE.BoxGeometry(w,h-1,.3),acrylic.clone());back.position.set(0,.5,-.2);group.add(back);art(w-1,h-2,0,.5,.05);}
 else if(p.kind==='bin'){const c='#3b3b3b';solid(w,1,d,0,-h/2+.5,0,c);for(const x of [-w/2+.5,w/2-.5])solid(1,h,d,x,0,0,c);solid(w,h,1,0,0,-d/2+.5,c);solid(w,h*.55,1,0,-h/2+h*.275,d/2-.5,c);for(let i=0;i<4;i++){const m=art(w-4,h-4,0,-1+i*.6,-d/2+3+i*(d-6)/4,-.18);if(i)m.material=m.material.clone?m.material.clone():m.material;}}
 else if(p.kind==='riser'){solid(w,h-.6,d,0,-.3,0,'#c9b48f');const top=solid(w,.6,d,0,h/2-.3,0,'#d8c6a3');top.userData.shelfSurface=true;}
 else if(p.kind==='pvc'){const c='#f2f2ef',r=1.2;for(const x of [-w/2,w/2]){rod(V(x,-h/2,0),V(x,h/2,0),r,c);rod(V(x,-h/2,-d/2),V(x,-h/2,d/2),r,c);}rod(V(-w/2,h/2,0),V(w/2,h/2,0),r,c);rod(V(-w/2,0,0),V(w/2,0,0),r,c);for(const x of [-w*.25,w*.25])art(w*.42,h*.46,x,h/2-2-h*.23,1.4);}
 else if(p.kind==='rack'){const wood='#d9b77a',rail=1.4;for(const z of [-d/2+rail/2,d/2-rail/2])solid(w,rail,rail,0,-h/2+rail/2,z,wood);for(const x of [-w/2+rail/2,w/2-rail/2])solid(rail,rail,d,x,-h/2+rail/2,0,wood);const base=solid(w-2*rail,.4,d-2*rail,0,-h/2+rail-.2,0,'#e4caa0');base.userData.shelfSurface=true;const count=Math.max(4,Math.floor((w-4)/3));for(let i=0;i<count;i++){const x=-w/2+2+i*(w-4)/(count-1);for(const z of [-d/2+rail,d/2-rail])rod(V(x,-h/2+rail,z),V(x,h/2,z),.35,wood);}}
 else if(p.kind==='light'){solid(4,3,4,0,0,-d/2+2,'#303a35');rod(V(0,0,-d/2+4),V(0,h/2-1,d/2-3),.5,'#b5bfc1');const head=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.2,4,14),new THREE.MeshStandardMaterial({color:'#303a35',roughness:.4}));head.position.set(0,h/2-1,d/2-3);head.rotation.x=Math.PI/2+.35;group.add(head);const lamp=new THREE.Mesh(new THREE.CircleGeometry(2,14),new THREE.MeshBasicMaterial({color:'#fff2c4'}));lamp.position.set(0,h/2-1.7,d/2-1.2);lamp.rotation.x=-.35;group.add(lamp);}
 else if(p.kind==='hook'){const points=[new THREE.Vector3(0,p.height/2,-p.depth/2),new THREE.Vector3(0,-p.height/2,-p.depth/2),new THREE.Vector3(0,-p.height/2,p.depth/2-.5),new THREE.Vector3(0,-p.height/2+1,p.depth/2)];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],m=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,a.distanceTo(b),8),metal.clone());m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());group.add(m);}for(const x of [-p.width/2,p.width/2]){const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,1.4),metal.clone());m.position.set(x,p.height/2,-p.depth/2);group.add(m);}}
 else if(p.kind==='stand'&&p.mesh){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p.mesh,3));if(p.meshColors)geo.setAttribute('color',new THREE.Float32BufferAttribute(p.meshColors,3));geo.computeVertexNormals();geo.computeBoundingBox();const size=geo.boundingBox.getSize(new THREE.Vector3());geo.scale(p.width/Math.max(.001,size.x),p.height/Math.max(.001,size.y),p.depth/Math.max(.001,size.z));group.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:p.meshColors?'#ffffff':'#c8b28a',vertexColors:!!p.meshColors,side:THREE.DoubleSide,roughness:.8})));}
 else{
  // Separate shallow trays in a sloping frame, like a clear retail organiser.
  const n=p.levels||3,t=Math.min(.25,p.width/30,p.height/30,p.depth/30),lip=Math.min(2,p.height/(n+1)),step=p.depth/n;
  const rise=(p.height-lip-t)/(n),base=-p.height/2;
  for(let i=0;i<n;i++){
   const y=base+t/2+i*rise,z=p.depth/2-(i+.5)*step;
   box(p.width-2*t,t,step-t,0,y,z).userData.shelfSurface=true;
   for(const edge of [-1,1])box(p.width-2*t,lip,t,0,y+t/2+lip/2,z+edge*(step/2-t));
   for(const x of [-p.width/2+1.5*t,p.width/2-1.5*t])box(t,lip,step-t,x,y+t/2+lip/2,z);
  }
  const shape=new THREE.Shape();
  shape.moveTo(0,0);shape.lineTo(p.depth,0);shape.lineTo(p.depth,p.height);
  shape.lineTo(p.depth-step*.6,p.height);shape.lineTo(0,lip+t);shape.closePath();
  if(n>1){
   const hole=new THREE.Path(),d=p.depth,h=p.height;
   hole.moveTo(d*.39,h*.14);hole.quadraticCurveTo(d*.34,h*.14,d*.40,h*.22);
   hole.lineTo(d*.77,h*.56);hole.quadraticCurveTo(d*.84,h*.63,d*.84,h*.52);
   hole.lineTo(d*.84,h*.20);hole.quadraticCurveTo(d*.84,h*.14,d*.77,h*.14);hole.closePath();shape.holes.push(hole);
  }
  for(const x of [-p.width/2,p.width/2-t]){
   const geometry=new THREE.ExtrudeGeometry(shape,{depth:t,bevelEnabled:false,curveSegments:12});
   geometry.rotateY(Math.PI/2);geometry.translate(x,base,p.depth/2);
   group.add(new THREE.Mesh(geometry,acrylic.clone()));
   group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry,25),new THREE.LineBasicMaterial({color:'#a1b4ba',transparent:true,opacity:.7})));
  }
 }

 metal.dispose();acrylic.dispose();}
function snap(p,hit){const panel=hit.object.userData.cell,n=hit.face.normal,point=hit.point;let x=point.x,y=point.y,z=point.z,rotation=0;if(panel.type==='shelf'){y=point.y+.3;}else if(panel.type==='back'){rotation=n.z<0?Math.PI:0;z+=Math.sign(n.z||1)*(p.depth/2+.3);y-=p.kind==='hook'?p.height:p.height/2;}else{rotation=n.x<0?-Math.PI/2:Math.PI/2;x+=Math.sign(n.x||1)*(p.depth/2+.3);y-=p.kind==='hook'?p.height:p.height/2;}return {x,y:Math.max(0,y),z,rotation};}
function connect(add){const dialog=document.createElement('dialog');dialog.className='standEditor';dialog.innerHTML='<div><strong>Display-stand editor</strong><button id="transferStand">Add current stand to booth</button><button id="closeStand">Close</button></div><iframe title="Display-stand editor" src="display-editor/index.html?v=colors"></iframe>';document.body.append(dialog);document.querySelector('#openStandEditor').onclick=()=>dialog.showModal();dialog.querySelector('#closeStand').onclick=()=>dialog.close();dialog.querySelector('#transferStand').onclick=()=>dialog.querySelector('iframe').contentWindow.postMessage({type:'booth-export'},location.origin);window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==dialog.querySelector('iframe').contentWindow||e.data?.type!=='booth-stand')return;try{const p=BoothModel.validateProducts([{...e.data.product,id:crypto.randomUUID(),x:0,y:0,z:0,image:'',kind:'stand'}])[0];add(p);dialog.close();}catch(error){alert(error.message);}});}
return {build,snap,connect};})();
