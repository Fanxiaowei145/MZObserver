// Preview and live telemetry share the same renderer.
(()=>{
 const DISPLAY_MS=10000;
 const colors={scientist:'#f4cd50',ntf:'#69b2ff',guard:'#bac1cb',scp:'#ff5369'};
 const host=document.createElement('section');host.id='killfeed';host.setAttribute('aria-label','击杀播报');document.getElementById('stage').append(host);
 let entries=[],paused=false,last=performance.now(),serial=0;
 const glyphSource=id=>window.MZ_ASSETS?.['killfeed/'+id+'.svg']||'../assets/killfeed/'+id+'.svg';
 function icon(key,kind='attack'){
  const img=new Image();img.className='kf-icon '+kind;img.alt=key;
  img.src=key.startsWith('item:')?itemIconSource(key.slice(5)):glyphSource(key);
  if(key.startsWith('item:')&&MZ_ITEMS[key.slice(5)]?.wide)img.classList.add('wide');
  return img;
 }
 function person(p){const n=document.createElement('span');n.className='kf-name';n.style.color=colors[p.role]||colors.scp;n.textContent=MZDisplayName(p.name);n.title=MZDisplayName(p.name);return n;}
 function row(event){
  const el=document.createElement('div');el.className='kf-row';
  if(event.suicide){el.append(icon(event.icon==='item:SCP207'?event.icon:'suicide'),person(event.victim));el.classList.add('kf-suicide');return el;}
  el.append(person(event.killer));
  for(const a of event.assists||[]){const group=document.createElement('span');group.className='kf-assistant';const plus=document.createElement('span');plus.className='kf-plus';plus.textContent='+';group.append(plus);for(const k of a.icons||[a.icon])if(k)group.append(icon(k,'assist'));group.append(person(a));el.append(group);}
  const weapon=document.createElement('span');weapon.className='kf-method';for(const k of event.icons||[event.icon])if(k)weapon.append(icon(k));el.append(weapon,person(event.victim));return el;
 }
 function add(event,{pinned=false,remaining=DISPLAY_MS}={}){
  if(!event||event.type==='role-change')return null;
  const el=row(event),id=++serial;host.append(el);entries.push({id,el,remaining,pinned});
  while(entries.length>6)entries.shift().el.remove();return id;
 }
 function clear(){entries.forEach(e=>e.el.remove());entries=[];}
 let liveEpoch=null,highest=0;
 function accept(s){
  if(!s.killfeedEpoch||!Number.isFinite(s.serverTimeMs))return;
  if(liveEpoch!==s.killfeedEpoch){clear();highest=0;liveEpoch=s.killfeedEpoch;}
  for(const e of (s.killfeed||[]).slice().sort((a,b)=>a.id-b.id)){
   if(!Number.isSafeInteger(e.id)||e.id<=highest)continue;highest=e.id;
   const age=Math.max(0,s.serverTimeMs-e.atMs);
   if(!Number.isFinite(age)||age>=DISPLAY_MS||!e.victim||(!e.suicide&&!e.killer))continue;
   add(e,{remaining:DISPLAY_MS-age});
  }
 }
 function frame(now){const delta=now-last;last=now;if(!paused){entries=entries.filter(e=>{if(e.pinned)return true;e.remaining-=delta;if(e.remaining<=250)e.el.style.opacity=String(Math.max(0,e.remaining/250));if(e.remaining<=0){e.el.remove();return false;}return true;});}requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
 window.MZKillfeed={add,clear,row,icon,accept,pause(v){paused=!!v;},get paused(){return paused;},get count(){return entries.length;},duration:DISPLAY_MS};
})();
