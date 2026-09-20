const AccessoryViews=(()=>{
function build(group,p){const metal=new THREE.MeshStandardMaterial({color:'#b5bfc1',metalness:.85,roughness:.25}),acrylic=new THREE.MeshPhysicalMaterial({color:'#eef7f8',transparent:true,opacity:.18,roughness:.08,metalness:0,depthWrite:false,side:THREE.DoubleSide});
 function box(w,h,d,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),acrylic.clone());m.position.set(x,y,z);group.add(m);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:'#a1b4ba',transparent:true,opacity:.65}));edge.position.copy(m.position);group.add(edge);return m;}
 if(p.kind==='hook'){const points=[new THREE.Vector3(0,p.height/2,-p.depth/2),new THREE.Vector3(0,-p.height/2,-p.depth/2),new THREE.Vector3(0,-p.height/2,p.depth/2-.5),new THREE.Vector3(0,-p.height/2+1,p.depth/2)];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],m=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,a.distanceTo(b),8),metal.clone());m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());group.add(m);}for(const x of [-p.width/2,p.width/2]){const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,1.4),metal.clone());m.position.set(x,p.height/2,-p.depth/2);group.add(m);}}
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
