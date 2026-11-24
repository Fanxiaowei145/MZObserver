from pathlib import Path
p=Path('ui/map-preview.js');s=p.read_text(encoding='utf-8');a=s.index(' elevatorLayer.innerHTML=list.filter');b=s.index('function showLightMap()',a)
s=s[:a]+''' const icons={monitor:'<rect x="2" y="2" width="16" height="12" rx="1"/><path d="M10 14v4M5 18h10"/>',bolt:'<path d="M12 1 4 11h6l-2 8 9-12h-6Z"/>',gate:'<path d="M3 19V2h14v17M7 19V6h6v13M1 19h18"/>',ammo:'<path d="M3 17V6l2-4 2 4v11ZM11 17V6l2-4 2 4v11ZM3 13h4M11 13h4"/>',gear:'<path d="m7 2 1-1h4l1 3 3 1 3 3-2 3 1 3-3 3-3-1-3 2-3-3 1-3-3-3 2-3Z"/><circle cx="10" cy="10" r="3"/>'};
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
 const roomBoxes=activeRooms.map(r=>({x:r.x*2*c.mapSign*c.scale+c.tx-15*c.scale,y:-r.z*2*c.mapSign*c.scale+c.ty-15*c.scale,w:30*c.scale,h:30*c.scale}));
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
'''+s[b:]
s=s.replace("activeRooms=plane==='LCZ'?MZ_LIGHT_MAP.rooms:rooms;", "activeRooms=mapRoomSets[plane];")
s+='''
MZUI.applyMapRooms=function({plane,rooms:next}){
 if(!['HCZ_EZ','LCZ'].includes(plane)||!Array.isArray(next)||!next.length||next.some(r=>![r.x,r.z,r.yaw_degrees].every(Number.isFinite)||!r.art||!r.room_id))throw Error('Invalid room layout');
 mapRoomSets[plane]=next;cameraController.reset();if(previewPlane===plane)loadPlane(plane);
};
''';p.write_text(s,encoding='utf-8')
