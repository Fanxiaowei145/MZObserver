// Local-only compatibility heuristic for server 0.1.4 (which does not send world height).
// Evidence: current official HCZ_049 prefab, output/floor-diagnostic/049-hierarchy.json.
// Upper elevator door (-4.569, 18.066), main-floor door (-4.870, 2.284), in room-local X/Z.
// Not a height detector: first connection inside overlapping floor footprints is ambiguous.
window.create049FloorTracker=function(){
 const history=new Map();
 function localPoint(p,r){
  const a=(r.yaw_degrees||0)*Math.PI/180,dx=p.x/2-r.x,dz=-p.y/2-r.z;
  return {x:Math.cos(a)*dx-Math.sin(a)*dz,z:Math.sin(a)*dx+Math.cos(a)*dz};
 }
 function apply(p,rooms,now=performance.now()){
  const key=p.actorId||p.id;
  const room=rooms.find(r=>r.room_id===p.roomId);
  if(p.dead||p.role==='079'||p.plane!=='HCZ_EZ'||room?.name!=='Hcz049'||!Number.isFinite(p.x)||!Number.isFinite(p.y)){
   history.delete(key);return p;
  }
  if(p.mapMarkerHidden){history.delete(key);return p;}
  const v=localPoint(p,room);let old=history.get(key);
  if(old&&(old.lifeId!==p.lifeId||old.roomId!==p.roomId))old=null;
  // Padded main-floor mesh footprint, including the corridor entrances and lower lift cabin.
  const outsideMain=v.x < -8.5||v.x > 8.5||v.z < -4||v.z > 7;
  const lowerLanding=v.x>=-7.5&&v.x<=-2&&v.z>=1&&v.z<=7;
  const upperLanding=v.x>=-8&&v.x<=-1&&v.z>=15&&v.z<=22;
  const recent=old&&now-old.time<=1500;
  const arrivedDown=recent&&old.upper&&lowerLanding&&Math.hypot(v.x-old.x,v.z-old.z)>=8;
  const upper=arrivedDown?false:!!old?.upper||upperLanding||outsideMain;
  history.set(key,{...v,time:now,upper,lifeId:p.lifeId,roomId:p.roomId});
  return upper?{...p,x:room.x*2,y:-room.z*2,mapMarkerHidden:true,mapLocalFloor:'049-upper-inferred'}:p;
 }
 return {apply,reset(){history.clear();}};
};
