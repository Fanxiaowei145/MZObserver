(()=>{
 const render=window.updateCard,active=new Map();let timer=null;
 function layout(c,state){
  const count=state.entries.size;state.row.hidden=!count;c.classList.toggle('has-cooldowns',count>0);
  const name=c.querySelector('.name-row');state.row.style.top=(name.offsetTop+name.offsetHeight)+'px';
  let used=0,overflow=false;const width=state.row.clientWidth;
  for(const entry of state.entries.values()){entry.node.hidden=false;const size=entry.node.offsetWidth,gap=used?4:0;if(overflow||used+gap+size>width){entry.node.hidden=true;overflow=true;}else used+=gap+size;}
 }
 function paint(){timer=null;const now=performance.now();for(const [c,state] of active){
  for(const [id,entry] of state.entries){const left=Math.max(0,(entry.until-now)/1000);if(!left){entry.node.remove();state.entries.delete(id);continue;}entry.text.textContent=left<10?(Math.ceil(left*10)/10).toFixed(1):String(Math.ceil(left));}
  layout(c,state);if(!state.entries.size)active.delete(c);
 }if(active.size)timer=setTimeout(paint,100);}
 window.updateCard=function(p){render(p);const c=cards.get(p.id);if(!c)return;
  let row=c.querySelector('.ability-cooldowns');if(!row){row=document.createElement('div');row.className='ability-cooldowns';row.hidden=true;row.setAttribute('aria-label','技能冷却');c.append(row);}
  const identity=[p.actorId,p.lifeId,p.role].join('|');let state=active.get(c);if(!state||state.identity!==identity){row.replaceChildren();state={identity,row,entries:new Map()};}
  const present=new Set(),now=performance.now();
  if(!p.dead&&p.alive!==false)for(const item of p.cooldowns||[]){const meta=MZ_ABILITIES[item.id],remaining=Number(item.remaining);if(!meta||meta.role!==p.role||!Number.isFinite(remaining)||remaining<=0)continue;
   present.add(item.id);let entry=state.entries.get(item.id);if(!entry){const node=document.createElement('span'),im=document.createElement('img'),text=document.createElement('b');node.className='ability-cooldown';node.dataset.ability=item.id;node.title=meta.label;im.src=meta.icon;im.alt=meta.label;node.append(im,text);row.append(node);entry={node,text};state.entries.set(item.id,entry);}entry.until=now+remaining*1000;
  }
  for(const [id,entry] of state.entries)if(!present.has(id)){entry.node.remove();state.entries.delete(id);}
  layout(c,state);if(state.entries.size)active.set(c,state);else active.delete(c);
  if(timer){clearTimeout(timer);timer=null;}paint();
 };
})();
