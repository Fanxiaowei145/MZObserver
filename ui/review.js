// Production adapter must send confirmed damage ticks; polling HP alone cannot
// distinguish cardiac damage from bullets. No permanently looping CSS pulse.
MZUI.applyDamageTick=function({id,hp,ahp,hs,kind}){
 if(!['cardiac','corroding'].includes(kind)||!Number.isFinite(hp)||hp<0)throw Error('Invalid damage tick');
 const p=currentSnapshot.find(p=>p.id===id);
 if(!p||p.dead||!p.effects?.includes(kind))return false;
 if([ahp,hs].some(v=>v!==undefined&&(!Number.isFinite(v)||v<0)))throw Error('Invalid extra health');
 if(hp>=p.hp&&(ahp===undefined||ahp>=(p.ahp||0))&&(hs===undefined||hs>=(p.hs||0)))return false;
 const next={...p,hp,ahp:ahp??p.ahp,hs:hs??p.hs,dead:hp<=0};
 window.currentSnapshot=currentSnapshot.map(p=>p.id===id?next:p);
 updateCard(next);
 if(next.dead){const marker=document.querySelector(`.marker[data-id="${id}"]`);if(marker)marker.style.display='none';}
 return true;
};
let damageDemoTimer;
const damageButton=document.createElement('button');damageButton.id='damage-demo';damageButton.textContent='演示持续扣血';
damageButton.title='仅为演示：每 1 秒扣 8 HP；正式版按服务器实际扣血事件播放，不采用此数值。';
document.getElementById('background').before(damageButton);
function stopDamageDemo(){clearInterval(damageDemoTimer);damageDemoTimer=null;damageButton.textContent='演示持续扣血';}
const priorScene=window.setScene;
window.setScene=function(n){stopDamageDemo();window.mapSurfaceOverview=false;return priorScene(n);};
damageButton.onclick=()=>{
 if(damageDemoTimer){stopDamageDemo();return;}
 if(playTimer){clearInterval(playTimer);playTimer=null;document.getElementById('motion').textContent='播放状态变化';}
 setScene(3);damageButton.textContent='暂停扣血（演示 1 秒/次）';
 damageDemoTimer=setInterval(()=>{
   const p=currentSnapshot.find(p=>p.id==='H01');
   if(!p||p.dead){stopDamageDemo();return;}
   MZUI.applyDamageTick({id:p.id,hp:Math.max(0,p.hp-8),kind:'cardiac'});
 },1000);
};
