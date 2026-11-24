// Browser-only interaction preview. Server-specific keybind registration belongs in LabAPI.
const zoomButton=document.createElement('button');zoomButton.id='map-zoom';
function syncObservedCards(){cards.forEach((c,id)=>c.dataset.observed=String(id===mapObservedId));}
function redrawLatestMap(){if(mapLastPlayers.length)fitMapPlayers(mapLastPlayers,mapLastPlane);}
MZUI.setMapZoom=function(enabled){window.mapZoomEnabled=!!enabled;mapFocusMembers.clear();cameraController.reset();zoomButton.textContent='B 地图：'+(mapZoomEnabled?'动态放大':'全图');zoomButton.classList.toggle('active',mapZoomEnabled);redrawLatestMap();};
zoomButton.onclick=()=>MZUI.setMapZoom(!mapZoomEnabled);
addEventListener('keydown',e=>{if(e.code!=='KeyB'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target?.closest?.('input,textarea,select,[contenteditable=true]'))return;e.preventDefault();MZUI.setMapZoom(!mapZoomEnabled);});
const observeSelect=document.createElement('select');observeSelect.id='observe-player';observeSelect.title='模拟当前观战对象';
people.forEach(p=>observeSelect.add(new Option('观战 '+p.name,p.id)));observeSelect.value=mapObservedId;
MZUI.setMapObservedPlayer=function(id){if(!cards.has(id))throw Error('Unknown observer target');window.mapObservedId=id;observeSelect.value=id;const p=mapLastPlayers.find(p=>p.id===id);window.mapSurfaceOverview=(p?.role==='079'?p.camera?.plane:p?.plane)==='Surface';syncObservedCards();mapFocusMembers.clear();cameraController.reset();redrawLatestMap();};
observeSelect.onchange=()=>MZUI.setMapObservedPlayer(observeSelect.value);
const surfaceButton=document.createElement('button');surfaceButton.id='surface-demo';surfaceButton.textContent='地表观战';
surfaceButton.onclick=async()=>{stopMapMovementDemo();stopDamageDemo();stopFloorDemo();if(playTimer){clearInterval(playTimer);playTimer=null;}window.mapSurfaceOverview=true;await previewMapPlane('HCZ_EZ');const points=mapLastPlayers.map(p=>p.id===mapObservedId?{...p,plane:'Surface'}:p);fitMapPlayers(points,'Surface');};
document.getElementById('controls').append(surfaceButton);
const oldPreviewObserved=MZUI.previewObservedPlayer;
MZUI.previewObservedPlayer=function(id){window.mapObservedId=id;observeSelect.value=id;syncObservedCards();mapFocusMembers.clear();return oldPreviewObserved(id);};
const mapTemplateButton=document.createElement('button');mapTemplateButton.id='map-template';mapTemplateButton.textContent='切换地图模板';let alternateTemplate=false;
mapTemplateButton.onclick=()=>{
 stopMapMovementDemo();alternateTemplate=!alternateTemplate;
 MZUI.applyMapRooms({plane:'HCZ_EZ',rooms:alternateTemplate?MZ_ALTERNATE_MAP.HCZ_EZ:MZ_MAP.rooms});
 MZUI.applyMapRooms({plane:'LCZ',rooms:alternateTemplate?MZ_ALTERNATE_MAP.LCZ:MZ_LIGHT_MAP.rooms});
 mapTemplateButton.textContent=alternateTemplate?'返回原地图模板':'切换地图模板';
};
const moveButton=document.createElement('button');moveButton.id='map-movement';moveButton.textContent='连续走位演示';let mapMoveFrame=0;
function stopMapMovementDemo(){cancelAnimationFrame(mapMoveFrame);mapMoveFrame=0;moveButton.textContent='连续走位演示';}
// Walk along adjacent room centers; demo positions are never server telemetry.
function movementPaths(){
 const all=mapRoomSets.HCZ_EZ.filter(r=>r.zone==='HeavyContainment');
 const neighbors=r=>all.filter(n=>Math.abs(Math.abs(n.x-r.x)+Math.abs(n.z-r.z)-15)<.01);
 const center=all.find(r=>neighbors(r).length>=3)||all[0],neighbor=neighbors(center)[0]||center;
 const queue=[center],parents=new Map([[center.room_id,null]]),ordered=[];
 while(queue.length){const r=queue.shift();ordered.push(r);for(const n of neighbors(r))if(!parents.has(n.room_id)){parents.set(n.room_id,r);queue.push(n);}}
 return people.map((p,i)=>{
  const r=ordered[Math.min(ordered.length-1,4+i%9)]||center,path=[];let step=r;
  while(step){path.push({x:step.x*2,y:-step.z*2});step=parents.get(step.room_id);}
  if(i>=5)path.push({x:neighbor.x*2,y:-neighbor.z*2});
  // Separate actual mock positions inside rooms rather than displacing the icons.
  const offset={x:(i%3-1)*4,y:(Math.floor(i/3)-1)*4};
  return {player:p,path:path.map(v=>({x:v.x+offset.x,y:v.y+offset.y})),gather:{x:center.x*2+offset.x,y:-center.z*2+offset.y}};
 });
}
function sampleMapMovement(paths,seconds){
 const phase=seconds%26;
 const t=phase<8?phase/8:phase<17?1:phase<25?1-(phase-17)/8:0;
 const gatherRatio=phase<8?0:phase<11?(phase-8)/3:phase<14?1:phase<17?1-(phase-14)/3:0;
 return paths.map(({player,path,gather})=>{
  const u=t*(path.length-1),i=Math.max(0,Math.min(path.length-2,Math.floor(u))),f=t===1?1:u-Math.floor(u),a=path[i],b=path[Math.min(i+1,path.length-1)];
  const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;
  const dx=phase>=8&&phase<17?gather.x-path.at(-1).x:b.x-a.x,dy=phase>=8&&phase<17?gather.y-path.at(-1).y:b.y-a.y;
  return {...player,x:x+(gather.x-x)*gatherRatio,y:y+(gather.y-y)*gatherRatio,heading:Math.atan2(dy,dx)*180/Math.PI+(phase>=14&&phase<25?180:0),plane:'HCZ_EZ'};
 });
}
moveButton.onclick=()=>{
 if(mapMoveFrame){stopMapMovementDemo();return;}
 stopDamageDemo();stopFloorDemo();if(playTimer){clearInterval(playTimer);playTimer=null;$('#motion').textContent='播放状态变化';}
 setScene(1);previewMapPlane('HCZ_EZ',{animate:false});const paths=movementPaths(),start=performance.now();moveButton.textContent='暂停走位演示';
 function frame(now){const players=sampleMapMovement(paths,(now-start)/1000);
  fitMapPlayers(players,'HCZ_EZ');mapMoveFrame=requestAnimationFrame(frame);
 }
 mapMoveFrame=requestAnimationFrame(frame);
};
const oldSceneForMovement=window.setScene;window.setScene=function(n){stopMapMovementDemo();return oldSceneForMovement(n);};
const oldPlaneForMovement=window.previewMapPlane;window.previewMapPlane=function(...args){stopMapMovementDemo();return oldPlaneForMovement(...args);};
document.getElementById('motion').before(zoomButton,observeSelect,mapTemplateButton,moveButton);
MZUI.setMapZoom(false);syncObservedCards();
const singleRoomButton=document.createElement('button');singleRoomButton.id='single-room-demo';singleRoomButton.textContent='单人取景演示';
singleRoomButton.onclick=()=>{
 stopMapMovementDemo();stopFloorDemo();stopDamageDemo();if(playTimer){clearInterval(playTimer);playTimer=null;$('#motion').textContent='播放状态变化';}setScene(1);previewMapPlane('HCZ_EZ',{animate:false});MZUI.setMapObservedPlayer('H02');
 const list=mapRoomSets.HCZ_EZ,home=list.find(r=>r.name==='HczMicroHID')||list[0];
 const far=[...list].filter(r=>Math.hypot(r.x-home.x,r.z-home.z)>45).sort((a,b)=>Math.hypot(b.x-home.x,b.z-home.z)-Math.hypot(a.x-home.x,a.z-home.z));
 const points=currentSnapshot.map((p,i)=>{const room=p.id==='H02'?home:far[i%far.length];return {...p,x:room.x*2,y:-room.z*2,roomId:room.room_id,plane:'HCZ_EZ'};});
 fitMapPlayers(points,'HCZ_EZ');MZUI.setMapZoom(true);
};
document.getElementById('motion').before(singleRoomButton);
