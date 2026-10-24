/* Sidebar tabs. View preferences are separate from design history. */
(()=>{
 const tabs=[...document.querySelectorAll('[data-section]')],body=document.querySelector('.sidebarBody');
 function openSection(name){tabs.forEach(button=>{const active=button.dataset.section===name;button.setAttribute('aria-pressed',String(active));document.getElementById('section-'+button.dataset.section).hidden=!active;});body.scrollTop=0;}
 tabs.forEach(button=>button.onclick=()=>openSection(button.dataset.section));
 document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>openSection('build')));
})();
