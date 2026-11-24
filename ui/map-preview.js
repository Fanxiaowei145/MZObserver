let previewPlane='HCZ_EZ',activeRooms=rooms,floorAnimationToken=0,floorDemoTimers=[];
const elevatorLayer=document.createElement('div');elevatorLayer.id='elevators';document.getElementById('radar').append(elevatorLayer);
function redrawRooms(list){
 MZ_LANDMARKS.installColorFilters();
 world.replaceChildren();
 list.forEach(r=>{const im=new Image();im.className='room';im.dataset.zone=r.zone;im.dataset.room=r.room_id;const style=MZ_LANDMARKS.classify(r);if(style?.color){im.dataset.kind=style.kind;im.dataset.color=style.color;im.style.filter=`url(#room-color-${style.kind})`;}else im.dataset.kind='ordinary';im.src='../assets/rooms/'+r.art;im.style.left=`${r.x*2-15}px`;im.style.top=`${-r.z*2-15}px`;im.style.transform=`rotate(${r.yaw_degrees}deg)`;MZ_ROOM_SHAPES.apply(im,r);world.append(im);});
 const icons={monitor:'<rect x="2" y="2" width="16" height="12" rx="1"/><path d="M10 14v4M5 18h10"/>',bolt:'<path d="M12 1 4 11h6l-2 8 9-12h-6Z"/>',gate:'<path d="M3 19V2h14v17M7 19V6h6v13M1 19h18"/>',ammo:'<path d="M3 17V6l2-4 2 4v11ZM11 17V6l2-4 2 4v11ZM3 13h4M11 13h4"/>',gear:'<path d="m7 2 1-1h4l1 3 3 1 3 3-2 3 1 3-3 3-3-1-3 2-3-3 1-3-3-3 2-3Z"/><circle cx="10" cy="10" r="3"/>'};
 elevatorLayer.replaceChildren();
 for(const a of MZ_LANDMARKS.anchors(list)){
  const e=document.createElement('div');e.className=a.elevator?'elevator-label':'room-landmark';e.dataset.kind=a.kind;e.dataset.room=a.roomId;e.mapAnchor=a;e.setAttribute('aria-label',a.elevator?a.label+' 电梯':a.label);
  if(a.elevator)e.textContent=a.label;else e.innerHTML=`<svg viewBox="0 0 20 20" aria-hidden="true">${icons[a.icon]}</svg><span>${a.label}</span>`;
  elevatorLayer.append(e);
 }
}
const baseFitMap=window.fitMapPlayers;
window.fitMapPlayers=function(players,plane){
 baseFitMap(players,plane);
 if(!window.mapCamera)return;
 const c=mapCamera,{width,height}=MZ_MAP_VIEW,occupied=[];
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 const roomBoxes=activeRooms.map(r=>({x:MZ_LANDMARKS.project({x:r.x*2,y:-r.z*2,dx:0,dy:0},c).x-15*c.scale,y:MZ_LANDMARKS.project({x:r.x*2,y:-r.z*2,dx:0,dy:0},c).y-15*c.scale,w:30*c.scale,h:30*c.scale}));
 elevatorLayer.querySelectorAll('[data-kind]').forEach(e=>{
  const p=MZ_LANDMARKS.project(e.mapAnchor,c),w=e.classList.contains('elevator-label')?9:Math.max(34,e.mapAnchor.label.length*10+14),h=16;
  if(p.x<0||p.x>width||p.y<0||p.y>height){e.hidden=true;return;}e.hidden=false;
  const directions=[[p.dx,p.dy],[-p.dy,p.dx],[p.dy,-p.dx],[-p.dx,-p.dy]];
  let best=null;
  for(const radius of [12,22,32])for(let i=0;i<directions.length;i++){
   const [dx,dy]=directions[i];const box={x:p.x+dx*(radius+w/2)-w/2,y:p.y+dy*(radius+h/2)-h/2,w,h};
   const off=Math.max(0,-box.x)+Math.max(0,-box.y)+Math.max(0,box.x+w-width)+Math.max(0,box.y+h-height);
   const score=off*1000+occupied.reduce((sum,b)=>sum+overlap(box,b)*8,0)+roomBoxes.reduce((sum,b)=>sum+overlap(box,b),0)+radius*.15+i*.2;
   if(!best||score<best.score)best={...box,score};
  }
  const x=Math.max(0,Math.min(width-w,best.x)),y=Math.max(0,Math.min(height-h,best.y));
  occupied.push({x,y,w,h});e.style.transform=`translate(${x}px,${y}px)`;
 });
};
function showLightMap(){
 const selected=[0,4,9,14,20,26];
 const ids=['H01','H02','H03','H04','S01','S02'];
 const positions=currentSnapshot.map(p=>{
   const i=ids.indexOf(p.id),r=activeRooms[selected[Math.max(0,i)]%activeRooms.length];
   return {...p,x:r.x*2,y:-r.z*2,plane:i<0?'HCZ_EZ':'LCZ'};
 });
 fitMapPlayers(positions,'LCZ');
}
function loadPlane(plane){
 previewPlane=plane;activeRooms=mapRoomSets[plane];
 redrawRooms(activeRooms);
 if(plane==='LCZ')showLightMap();else updateMap(state,currentSnapshot);
 document.getElementById('radar').dataset.plane=plane;
}
window.previewMapPlane=async function(plane,{animate=true}={}){
 if(!['LCZ','HCZ_EZ'].includes(plane))throw Error('Unknown preview plane');
 const token=++floorAnimationToken,radar=document.getElementById('radar');
 radar.getAnimations().forEach(a=>a.cancel());
 if(animate&&plane!==previewPlane){
   const fade=radar.animate([{opacity:1},{opacity:0}],{duration:130,fill:'forwards'});
   await fade.finished.catch(()=>{});if(token!==floorAnimationToken)return;
   radar.classList.add('floor-reset');loadPlane(plane);await uiReady();
   if(token!==floorAnimationToken)return;
   void radar.offsetWidth;fade.cancel();
   await radar.animate([{opacity:0},{opacity:1}],{duration:210,fill:'forwards'}).finished.catch(()=>{});
   if(token===floorAnimationToken){radar.getAnimations().forEach(a=>a.cancel());radar.classList.remove('floor-reset');}
 }else{radar.classList.add('floor-reset');loadPlane(plane);void radar.offsetWidth;radar.classList.remove('floor-reset');}
};
const lightButton=document.createElement('button');lightButton.id='light-map';lightButton.textContent='5 轻收容';
const floorButton=document.createElement('button');floorButton.id='floor-demo';floorButton.textContent='楼层切换演示';
document.getElementById('motion').before(lightButton,floorButton);
function stopFloorDemo(){floorDemoTimers.forEach(clearTimeout);floorDemoTimers=[];floorButton.textContent='楼层切换演示';}
lightButton.onclick=()=>{stopFloorDemo();previewMapPlane('LCZ');};
floorButton.onclick=()=>{
 stopFloorDemo();stopDamageDemo();if(playTimer){clearInterval(playTimer);playTimer=null;document.getElementById('motion').textContent='播放状态变化';}
 setScene(1);floorButton.textContent='正在演示楼层切换';
 floorDemoTimers.push(setTimeout(()=>previewMapPlane('LCZ'),1200));
 floorDemoTimers.push(setTimeout(()=>previewMapPlane('HCZ_EZ'),3800));
 floorDemoTimers.push(setTimeout(stopFloorDemo,4300));
};
const sceneBeforeFloors=window.setScene;
window.setScene=function(n){stopFloorDemo();++floorAnimationToken;document.getElementById('radar').getAnimations().forEach(a=>a.cancel());const result=sceneBeforeFloors(n);loadPlane('HCZ_EZ');return result;};
addEventListener('keydown',e=>{if(e.key==='5')lightButton.click();});
loadPlane('HCZ_EZ');

MZUI.applyMapRooms=function({plane,rooms:next}){
 if(!['HCZ_EZ','LCZ'].includes(plane)||!Array.isArray(next)||!next.length||next.some(r=>![r.x,r.z,r.yaw_degrees].every(Number.isFinite)||!r.art||!r.room_id))throw Error('Invalid room layout');
 mapRoomSets[plane]=next;cameraController.reset();if(previewPlane===plane)loadPlane(plane);
};
