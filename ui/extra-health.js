// AHP and human HS are independent live stats, never inferred from held items.
cards.forEach(c=>{
 const layer=document.createElement('div');layer.className='ahp-fill';c.querySelector('.shield').before(layer);
 const number=document.createElement('div');number.className='ahp-number';
 const secondary=document.createElement('div');secondary.className='secondary-values';c.querySelector('.hp').before(secondary);
 secondary.append(number,c.querySelector('.hs'));
});
const renderBeforeExtraHealth=window.updateCard;
window.updateCard=function(p){
 renderBeforeExtraHealth(p);
 const c=cards.get(p.id),scp=p.id.startsWith('S');
 if(p.dead){c.querySelector('.fill').style.height='0px';c.querySelector('.shield').style.height='0px';c.querySelector('.shield').style.bottom='0px';}
 const ahp=!p.dead&&!scp?Math.max(0,Number(p.ahp)||0):0;
 const hs=!p.dead&&!scp?Math.max(0,Number(p.hs)||0):0;
 const hpHeight=parseFloat(c.querySelector('.fill').style.height);
 const ahpHeight=90*ahp/p.maxHp,hsHeight=90*hs/p.maxHp;
 const ahpFill=c.querySelector('.ahp-fill');ahpFill.style.height=ahpHeight+'px';ahpFill.style.bottom=hpHeight+'px';
 const ahpNumber=c.querySelector('.ahp-number');ahpNumber.textContent=Math.ceil(ahp);ahpNumber.style.display=ahp>0?'block':'none';
 let totalHeight=hpHeight;
 if(!scp){
   const shield=c.querySelector('.shield');shield.style.height=hsHeight+'px';shield.style.bottom=(hpHeight+ahpHeight)+'px';
   c.querySelector('.hs').style.display=hs>0?'flex':'none';c.querySelector('.hs span').textContent=Math.ceil(hs);
   totalHeight+=ahpHeight+hsHeight;
 }
 const effects=c.querySelector('.effects');
 if(!p.dead){
   for(const [kind,label,viewBox,glyph] of [
     ['amnestic','939 气团：失忆','0 0 32 26','<path d="M7 20a6 6 0 1 1 0-12 7 7 0 0 1 13-3 6 6 0 1 1 5 15Z" fill="#bca3cc"/><path d="M11 10h2m6 0h2M12 15h8" stroke="#202432" stroke-width="2"/>'],
     ['cardiac','心脏骤停','8 -1 48 32','<path d="M32 27 15 13C7-1 28-2 32 9 36-2 57-1 49 13Z" fill="#e98995"/><path d="M12 14h10l4-6 7 15 5-10 4 1h10" fill="none" stroke="#111923" stroke-width="3"/>'],
     ['corroding','凋萎','12 -1 44 34','<path d="M29 1C24 9 15 15 15 21a14 10 0 0 0 28 0C43 15 34 9 29 1Z" fill="#d0d3db"/><circle cx="20" cy="21" r="2" fill="#111923"/><circle cx="32" cy="25" r="3" fill="#111923"/><path d="m45 6 4 4-4 4-4-4m9 8 3 3-3 3-3-3Z" fill="#d0d3db"/>']
   ]){
     if(!p.effects?.includes(kind))continue;
     const badge=document.createElement('span');badge.className='status-badge';badge.dataset.status=kind;
     badge.innerHTML=`<svg viewBox="${viewBox}" role="img" aria-label="${label}">${glyph}</svg>`;
     effects.append(badge);
   }
   if(p.effects?.includes('burn')){
     const badge=document.createElement('span');badge.className='status-badge';badge.dataset.status='burn';
     badge.innerHTML='<svg viewBox="0 0 32 26" role="img" aria-label="灼伤"><path d="M17 1c1 6-6 7-5 12-2-1-3-3-3-5-4 4-5 7-4 10 1 5 5 7 11 7s10-3 10-8c0-5-3-9-6-11 1 4-1 6-2 7 0-4 2-7-1-12Z" fill="#ffad55"/><path d="M16 13c1 3-3 4-3 7 0 2 2 3 4 3s4-2 4-4c0-2-1-3-2-4 0 2-1 3-2 3 0-2 0-4-1-5Z" fill="#fff0c7"/></svg>';
     effects.append(badge);
   }
   if(p.deafened){
     const badge=document.createElement('span');badge.className='status-badge';badge.dataset.status='deafened';
     badge.innerHTML='<svg viewBox="0 0 32 26" role="img" aria-label="耳聋"><path d="M9 10V8a7 7 0 0 1 14 0c0 4-2 5-4 7-1.3 1.3-1.5 2.6-2 4.4A4.5 4.5 0 0 1 8.2 19M13 9a3 3 0 0 1 6 0c0 2-1 3-2.5 4M4 24 28 2" fill="none" stroke="#f2f4f7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
     effects.append(badge);
   }
   const colaStacks=Math.max(0,Math.floor(Number(p.colaStacks??(p.colaSpeed?1:0))||0));
   for(const [active,key,icon,label] of [[p.colaSpeed!==false&&colaStacks>0,'cola-speed','SCP207Icon','可乐加速'],[p.antiCola,'anti-cola','SCP207Icon 1','反向可乐'],[p.scp1853,'scp1853','SCP1853Icon','SCP-1853 效果']]){
     if(!active)continue;
     const image=new Image();image.className='status-item';image.dataset.status=key;image.src=art(icon);image.alt=label;
     const badge=document.createElement('span');badge.className='status-badge';badge.append(image);
     if(key==='cola-speed'&&colaStacks>1){const count=document.createElement('span');count.className='status-count';count.textContent='×'+colaStacks;badge.append(count);}
     effects.append(badge);
   }
 }
 c.style.setProperty('--status-bottom',Math.max(167,totalHeight+55)+'px');
 c.style.setProperty('--special-bottom',Math.max(192,totalHeight+55+(effects.children.length?30:0))+'px');
};
snapshots[6]={
 H01:{hp:100,ahp:45,held:'Adrenaline',ammo:null,magazineCapacity:null},
 H02:{hp:76,hs:40,colaSpeed:true,colaStacks:2,ammo:20},
 H03:{hp:100,hs:50,held:'1509Icon',ammo:null,magazineCapacity:null,special:[],scp1853:true},
 H04:{hp:100,ahp:40,hs:50,held:null,colaSpeed:true,colaStacks:3,scp1853:true},
 H06:{hp:100,ahp:25,held:'SCP207Icon 1',ammo:null,magazineCapacity:null,special:[]}
};
const extraButton=document.createElement('button');extraButton.id='extra-health';extraButton.textContent='6 AHP／护盾';
document.getElementById('motion').before(extraButton);
extraButton.onclick=()=>{
 if(playTimer){clearInterval(playTimer);playTimer=null;document.getElementById('motion').textContent='播放状态变化';}
 setScene(6);MZUI.setMatchClock({halfElapsedMs:258000,waveElapsedMs:78000,paused:true});
};
addEventListener('keydown',e=>{if(e.key==='6')extraButton.click();});
currentSnapshot.forEach(updateCard);
