/* View preferences are separate from design history. */
(()=>{
 const tabs=[...document.querySelectorAll('[data-section]')],body=document.querySelector('.sidebarBody');
 function openSection(name){tabs.forEach(button=>{const active=button.dataset.section===name;button.setAttribute('aria-pressed',String(active));document.getElementById('section-'+button.dataset.section).hidden=!active;});body.scrollTop=0;}
 tabs.forEach(button=>button.onclick=()=>openSection(button.dataset.section));
 document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>openSection('build')));
 const view=document.getElementById('viewer'),handle=document.getElementById('viewerResize'),expand=document.getElementById('viewerExpand');let drag=null,previousHeight=null;
 function setHeight(value,save=false){const height=Math.round(Math.max(300,Math.min(1200,value)));view.style.setProperty('--viewer-height',height+'px');handle.setAttribute('aria-label',`Resize 3D viewer, ${height} pixels high. Drag or use arrow keys; double-click resets.`);if(save)try{localStorage.setItem('cube-viewer-height',String(height));}catch{}return height;}
 try{const saved=Number(localStorage.getItem('cube-viewer-height'));if(saved>=300&&saved<=1200)setHeight(saved);}catch{}
 handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag={id:e.pointerId,y:e.clientY,height:view.getBoundingClientRect().height};handle.setPointerCapture(e.pointerId);document.body.classList.add('resizingView');});
 handle.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)setHeight(drag.height+e.clientY-drag.y);});
 function finish(cancel=false){if(!drag)return;const old=drag;drag=null;if(cancel)setHeight(old.height);else setHeight(view.getBoundingClientRect().height,true);document.body.classList.remove('resizingView');if(handle.hasPointerCapture(old.id))handle.releasePointerCapture(old.id);}
 handle.addEventListener('pointerup',()=>finish());handle.addEventListener('pointercancel',()=>finish(true));handle.addEventListener('lostpointercapture',()=>finish(true));window.addEventListener('blur',()=>finish(true));
 handle.addEventListener('keydown',e=>{if(e.key==='Escape'){finish(true);return;}if(['ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();setHeight(e.key==='Home'?530:view.getBoundingClientRect().height+(e.key==='ArrowUp'?-1:1)*(e.shiftKey?100:25),true);}});
 handle.ondblclick=()=>setHeight(matchMedia('(max-width:650px)').matches?430:530,true);
 expand.onclick=()=>{if(previousHeight===null){previousHeight=view.getBoundingClientRect().height;setHeight(Math.max(530,window.innerHeight-150),true);expand.textContent='Restore height';}else{setHeight(previousHeight,true);previousHeight=null;expand.textContent='Expand view';}};
})();
