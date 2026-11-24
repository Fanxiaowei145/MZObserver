(()=>{
 const previous=new Map(),render=window.updateCard;
 window.updateCard=function(p){render(p);const c=cards.get(p.id);if(!c||p.id[0]!=='H')return;
 let badge=c.querySelector('.shot-indicator');if(!badge){badge=document.createElement('span');badge.className='shot-indicator';badge.title='开火';badge.innerHTML='<svg viewBox="0 0 12 10" aria-label="枪口火光"><path d="M0 5 5 2 4 4 11 2 8 5 12 7 5 6 6 9Z"/></svg>' ;c.append(badge);}
 const key=MZ_ITEM_ALIASES[p.held]||p.held,im=c.querySelector('.held'),point=im?MZMuzzlePoint(key,im.clientWidth,im.clientHeight):null;
 if(point){const cr=c.getBoundingClientRect(),ir=im.getBoundingClientRect(),scale=cr.width/c.offsetWidth;badge.style.left=((ir.left-cr.left)/scale+point.x)+'px';badge.style.top=((ir.top-cr.top)/scale+point.y)+'px';badge.style.setProperty('--muzzle-angle',point.angle+'deg');}
 const old=previous.get(p.id),identity=p.actorId+':'+p.lifeId;previous.set(p.id,{identity,sequence:p.shotSequence,held:key});
 if(!point||p.dead||p.alive===false){badge.pulse?.cancel();badge.beamActive=false;return;}
 const changed=old?.identity!==identity||old?.held!==key;if(changed){badge.pulse?.cancel();badge.beamActive=false;}
 if(p.weaponFiring===true){if(!badge.beamActive){badge.pulse?.cancel();badge.pulse=badge.animate([{opacity:.35},{opacity:.7},{opacity:.35}],{duration:240,iterations:Infinity});badge.beamActive=true;}return;}
 if(badge.beamActive){badge.pulse?.cancel();badge.beamActive=false;}if(changed)return;
 if(p.shotSequence&&old.sequence!==p.shotSequence&&p.shotAgeMs>=0&&p.shotAgeMs<350){badge.pulse?.cancel();badge.pulse=badge.animate([{opacity:.8},{opacity:.45,offset:.4},{opacity:0}],{duration:220,easing:'ease-out'});}
 };
})();
