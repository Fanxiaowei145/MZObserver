// Presentation only: the server supplies role priority + server spawn sequence order.
// Commit once after a wave has finished spawning. Never reorder on death or target changes.
(()=>{
 let committedSequence=-1, demoVariant=false, waveSequence=0, sawVacancy=false;
 let survivors=new Set(people.map(p=>p.id)), pendingSurvivors=null;
 function applyWaveOrder({waveSequence,orderedPlayerIds,survivorIds=[],authoritative=false}){
  if(!Number.isSafeInteger(waveSequence)||waveSequence<0)throw Error('Invalid wave sequence');
  if(waveSequence<=committedSequence)return false;
  if(!Array.isArray(orderedPlayerIds)||orderedPlayerIds.length!==cards.size||
     new Set(orderedPlayerIds).size!==cards.size||orderedPlayerIds.some(id=>!cards.has(id)))
   throw Error('Wave order must contain the complete known roster exactly once');
  // Preserve identity, card state, timers, portrait and observed highlight by moving nodes.
  const kept=new Set(survivorIds);
  if(survivorIds.some(id=>!cards.has(id)))throw Error('Unknown survivor');
  const orderedGroup=(selector,prefix)=>{
   if(authoritative)return orderedPlayerIds.filter(id=>id.startsWith(prefix));
   const prior=[...document.querySelector(selector).children].map(c=>c.dataset.id);
   return [...prior.filter(id=>kept.has(id)),...orderedPlayerIds.filter(id=>id.startsWith(prefix)&&!kept.has(id))];
  };
  const humanIds=orderedGroup('#humans','H'),scpIds=orderedGroup('#scps','S');
  if(humanIds.length!==6||scpIds.length!==3)throw Error('Expected 6 humans and 3 SCPs');
  const before=new Map([...cards].map(([id,c])=>[id,c.getBoundingClientRect()]));
  cards.forEach(c=>c.rosterMotion?.cancel());
  document.getElementById('humans').append(...humanIds.map(id=>cards.get(id)));
  document.getElementById('scps').append(...scpIds.map(id=>cards.get(id)));
  cards.forEach((c,id)=>{
   if(!kept.has(id))return;
   const a=before.get(id),b=c.getBoundingClientRect(),scale=b.width/c.offsetWidth;
   const dx=(a.left-b.left)/scale,dy=(a.top-b.top)/scale;
   if(Math.abs(dx)+Math.abs(dy)<.1)return;
   c.rosterMotion=c.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],
    {duration:300,easing:'cubic-bezier(.4,0,.2,1)'});
  });
  committedSequence=waveSequence;
  return true;
 }
 MZUI.applyWaveOrder=applyWaveOrder;
 MZUI.setServerOrder=ids=>{
  if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!cards.has(id)))throw Error('Invalid server order');
  if(ids.length===cards.size&&!sawVacancy&&committedSequence<waveSequence)
   applyWaveOrder({waveSequence,orderedPlayerIds:ids,survivorIds:pendingSurvivors??[]});
 };
 MZUI.resetRosterTracking=()=>{sawVacancy=false;committedSequence=-1;waveSequence=0;survivors=new Set(people.map(p=>p.id));pendingSurvivors=null;};
 function observeRoster(players){
  const alive=new Set(players.filter(p=>!p.dead&&(p.role==='079'||p.hp>0)).map(p=>p.id));
  survivors=new Set([...survivors].filter(id=>alive.has(id)));
  const full=players.length===9&&alive.size===9;
  if(!full){sawVacancy=true;return;}
  if(!sawVacancy)return;
  sawVacancy=false;waveSequence++;
  pendingSurvivors=[...survivors];survivors=alive;
  MZUI.resetWaveElapsed();
  // Wait for the next complete server order after this refill before sorting.
 }
 const applyPlayers=MZUI.applyPlayers;
 MZUI.applyPlayers=function(players){applyPlayers(players);observeRoster(players);};
 MZUI.getWaveOrder=()=>({waveSequence:committedSequence,
  humans:[...document.getElementById('humans').children].map(c=>c.dataset.id),
  scps:[...document.getElementById('scps').children].map(c=>c.dataset.id)});
 const button=document.createElement('button');button.id='wave-order-demo';
 button.textContent='模拟下一波排序';
 button.title='模拟刷新完成后提交服务器排序；覆盖软件使用服务器实际数据';
 button.onclick=()=>{
  if(playTimer){clearInterval(playTimer);playTimer=null;document.getElementById('motion').textContent='播放状态变化';}
  const fallen=demoVariant?['H02','H03','S03']:['H01','H03','S01'];
  MZUI.applyPlayers(currentSnapshot.map(p=>fallen.includes(p.id)?{...p,hp:0,dead:true}:p));
  MZUI.applyPlayers(people.map(p=>({...p,dead:false})));
  demoVariant=!demoVariant;
  const ids=demoVariant?['S03','H02','H01','S01','H05','H03','H06','S02','H04']:people.map(p=>p.id);
  MZUI.setServerOrder(ids);
 };
 document.getElementById('controls').append(button);
 const pauseButton=document.createElement('button');pauseButton.id='match-pause-demo';pauseButton.textContent='暂停／继续计时';
 pauseButton.onclick=()=>MZUI.setMatchPaused(!MZUI.getMatchClock().paused);
 document.getElementById('controls').append(pauseButton);
})();
