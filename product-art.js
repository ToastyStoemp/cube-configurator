// Built-in artwork is drawn locally and embedded as PNG when products are saved.
const DefaultProductArt=(()=>{
 const cache=new Map();
 function make(type){if(cache.has(type))return cache.get(type);
 const canvas=document.createElement('canvas');canvas.width=360;canvas.height=510;const c=canvas.getContext('2d');
 const colors={forest:['#f6ecd7','#385e51','#e3ae69'],night:['#202e53','#6378a0','#f2d99b'],stickers:['#faf0e8','#cf7f89','#608b73'],charm:['#ede6f6','#9680b3','#efbc73'],bookmark:['#f7edda','#506f62','#c58e64'],pins:['#e8f0ed','#5a7e79','#e6aa78']};
 const [bg,ink,accent]=colors[type]||colors.forest;c.fillStyle=bg;c.fillRect(0,0,360,510);
 const circle=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 const star=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,d=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);}c.closePath();c.fill();};
 const label=(text,y,size=22,color=ink)=>{c.fillStyle=color;c.font=`${size}px Georgia, serif`;c.textAlign='center';c.fillText(text,180,y);};
 const cat=(x,y,r,color)=>{circle(x,y,r,color);c.fillStyle=color;c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r,y-r*1.3);c.lineTo(x,y-r*.5);c.lineTo(x+r,y-r*1.3);c.lineTo(x+r,y);c.fill();circle(x-r*.32,y,3,'#283c3d');circle(x+r*.32,y,3,'#283c3d');};
 if(type==='forest'||type==='night'){
  circle(260,115,43,accent);if(type==='night')for(let i=0;i<20;i++)star(30+(i*71)%300,35+(i*43)%245,3,accent);
  for(let layer=0;layer<3;layer++){c.fillStyle=[ink,type==='night'?'#445878':'#71917c',type==='night'?'#182941':'#294f46'][layer];c.beginPath();c.moveTo(0,360);for(let x=0;x<=360;x+=10)c.lineTo(x,280+layer*40+Math.sin(x/75+layer*2)*35);c.lineTo(360,445);c.lineTo(0,445);c.fill();}
  for(const x of [65,115,290]){c.fillStyle=type==='night'?'#182941':'#294f46';c.beginPath();c.moveTo(x,210);c.lineTo(x-34,370);c.lineTo(x+34,370);c.fill();}
  label(type==='night'?'MIDNIGHT WANDER':'THE QUIET WOODS',480,20,type==='night'?accent:ink);
 }else if(type==='stickers'){
  label('little joys',55,30);for(let i=0;i<6;i++){const x=105+(i%2)*150,y=150+Math.floor(i/2)*125;circle(x,y,48,'#ffffff');if(i%3===0)cat(x,y,30,ink);else if(i%3===1)star(x,y,34,accent);else{circle(x,y,29,accent);circle(x+14,y-10,25,'#ffffff');}}label('STICKER CLUB',490,17);
 }else if(type==='charm'){
  label('tiny companion',55,28);circle(180,105,9,'#ffffff');c.strokeStyle='#a3a5ae';c.lineWidth=8;c.beginPath();c.arc(180,175,35,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(180,210);c.lineTo(180,260);c.stroke();cat(180,325,70,ink);star(230,385,22,accent);label('ACRYLIC CHARM',478,18);
 }else if(type==='bookmark'){
  c.fillStyle=ink;c.fillRect(100,25,160,450);circle(180,60,7,bg);for(let i=0;i<7;i++){c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.moveTo(180,110+i*40);c.quadraticCurveTo(i%2?245:115,95+i*40,180,145+i*40);c.stroke();}label('ONE MORE PAGE',440,14,bg);
 }else{label('small treasures',58,29);for(const [x,y,color] of [[110,210,ink],[250,210,accent],[180,355,'#ac8db3']]){circle(x,y,54,'#c4aa72');circle(x,y,47,color);star(x,y,29,'#fff2cc');}label('ENAMEL PIN SET',475,19);}
 const result=canvas.toDataURL('image/png');cache.set(type,result);return result;
 }
 return {make};
})();
