// The live renderer uses only server telemetry. Preview scenes never run this adapter.
(()=>{
 if(new URLSearchParams(location.search).get('live')!=='1')return;
 document.documentElement.classList.add('live');document.body.classList.add('export','transparent');
 MZUI.setAuthorized(false);stopDamageDemo();stopFloorDemo();if(playTimer)clearInterval(playTimer);
 addEventListener('keydown',e=>e.stopImmediatePropagation(),true);
 let epoch=null,sequence=-1,wave=-1,waveOffset=0,connected=false,layoutEpoch=null,layoutKey='',target=null,latest=[],prior=[],received=0;
 const signatures=new Map();
 function clear(){connected=false;MZUI.setAuthorized(false);document.documentElement.classList.remove('ready');latest=[];window.MZKillfeed?.clear();}
 function tile(r){
  const exact=MZ_ROOM_ART.prefabs[r.prefab]||MZ_ROOM_ART.names[r.name];if(exact)return exact;
  const z=r.zone==='LightContainment'?'LCZ':r.zone==='Entrance'?'EZ':'HCZ';
  const shape={Straight:'Straight',Curve:'Curve',TShape:'ThreeWay',XShape:'Crossing',Endroom:z==='HCZ'?'EndSmall':'NonGateEnd'}[r.shape]||'Straight';
  return MZ_ROOM_ART.available.includes(`native079-${z}_${shape}.png`)?`native079-${z}_${shape}.png`:`native079-${z}_Straight.png`;
 }
 function layout(s){if(!Array.isArray(s.rooms))return;const key=JSON.stringify(s.rooms);if(key===layoutKey&&layoutEpoch===s.epoch)return;layoutKey=key;layoutEpoch=s.epoch;
  for(const plane of ['HCZ_EZ','LCZ']){const rows=s.rooms.filter(r=>r.plane===plane).map(r=>({...r,art:tile(r)}));if(rows.length)MZUI.applyMapRooms({plane,rooms:rows});else mapRoomSets[plane]=[];}
 }
 function accept(s){
  if(s.type==='local-controls'){window.mapZoomEnabled=!!s.zoom;MZUI.setAuthorized(connected&&s.uiVisible!==false);return;}
  if(s.type==='layout'){layout(s);return;}
  if(s.type!=='state'){clear();return;}
  if(epoch===s.epoch&&s.sequence<=sequence)return;
  const newEpoch=epoch!==s.epoch,newConnection=!connected;
  if(newEpoch){epoch=s.epoch;sequence=-1;wave=-1;signatures.clear();MZUI.resetRosterTracking();}
  sequence=s.sequence;layout(s);
  if(s.phase==='preparing'){clear();return;}
  if(!Array.isArray(s.players)||s.players.length!==9||s.players.some(p=>!cards.has(p.id)||!roles[p.role])){clear();return;}
  const first=newConnection||newEpoch;
  if(first||wave!==s.wave){waveOffset=first?Math.max(0,s.waveElapsedMs):0;}
  MZUI.setMatchClock({halfElapsedMs:s.halfElapsedMs,waveElapsedMs:Math.max(0,s.waveElapsedMs-waveOffset),paused:s.paused||s.phase==='ended'});
  MZUI.setScore(s.humanScore,s.scpScore);
  // Derive a stable visual flag before excluding ticking effectDetails from the
  // render signature, so effect-only changes still refresh the player card.
  const list=s.players.map(p=>({...p,special:p.special||[],effects:p.effects||[],deafened:!p.dead&&p.alive!==false&&Array.isArray(p.effectDetails)&&p.effectDetails.some(e=>e?.name==='Deafened'&&Number(e.intensity)>0)}));
  // Only the server controls wave boundaries in production; no local vacancy inference.
  window.currentSnapshot=list;
  for(const p of list){
   const {x,y,heading,roomId,plane,mapMarkerHidden,effectDetails,camera,shotAgeMs,...visual}=p;
   const sig=JSON.stringify(visual);
   if(signatures.get(p.id)!==sig){updateCard(p);signatures.set(p.id,sig);}
  }
  if(first||wave!==s.wave){if(first)MZUI.resetRosterTracking();MZUI.applyWaveOrder({waveSequence:s.wave,orderedPlayerIds:s.order,authoritative:true,survivorIds:first?[]:(s.survivorIds||[])});wave=s.wave;}
  target=list.find(p=>p.actorId===s.observedActorId&&!p.dead)||null;
  window.mapObservedId=target?.id||null;syncObservedCards();
  const plane=target?.role==='079'?target.camera?.plane:target?.plane;
  window.mapSurfaceOverview=plane==='Surface'||plane==='Pocket';window.mapZoomEnabled=!!s.zoom;
  const displayPlane=window.mapSurfaceOverview?'HCZ_EZ':plane;
  if(displayPlane&&displayPlane!==previewPlane&&mapRoomSets[displayPlane]?.length){previewPlane=displayPlane;activeRooms=mapRoomSets[displayPlane];redrawRooms(activeRooms);document.getElementById('radar').dataset.plane=displayPlane;cameraController.reset();const radar=document.getElementById('radar');radar.animate([{opacity:0},{opacity:1}],{duration:250});}
  prior=latest;latest=list.map(p=>p.role==='079'&&p.camera?{...p,...p.camera,hp:1}:p);received=performance.now();
  connected=true;MZUI.setAuthorized(s.uiVisible!==false);document.documentElement.classList.add('ready');
  window.MZKillfeed?.accept(s);
 }
 function frame(){
  if(connected&&latest.length){const plane=target?.role==='079'?target.camera?.plane:target?.plane;
   if(!plane||(!['HCZ_EZ','LCZ','Surface','Pocket'].includes(plane))||layoutEpoch!==epoch)document.getElementById('radar').hidden=true;
   else {const t=Math.min(1,(performance.now()-received)/55);const points=latest.map(p=>{const old=prior.find(q=>q.id===p.id&&q.actorId===p.actorId&&q.lifeId===p.lifeId&&q.plane===p.plane&&!!q.mapMarkerHidden===!!p.mapMarkerHidden);return old&&p.role!=='079'?{...p,x:old.x+(p.x-old.x)*t,y:old.y+(p.y-old.y)*t}:p;});fitMapPlayers(points,plane);}
  }requestAnimationFrame(frame);
 }
 window.MZLive={accept,clear};window.mzHost?.onState(accept);requestAnimationFrame(frame);
})();
