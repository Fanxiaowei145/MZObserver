// Reviewed art uses room-local metres. World positions/heading are never altered.
(()=>{
 const data=window.MZ_ROOM_SHAPE_DATA||{};
 const get=r=>data[r.prefab]; // Match identity, never ambiguous generic room names.
 function apply(im,r){
  const s=get(r);if(!s)return false;
  const [x,y,w,h]=s.bounds;
  im.src=window.MZ_ASSETS?.['rooms/'+s.art]||'../assets/rooms/'+s.art;
  im.dataset.reviewed=s.code;
  Object.assign(im.style,{left:`${r.x*2+x*2}px`,top:`${-r.z*2+y*2}px`,width:`${w*2}px`,height:`${h*2}px`,transformOrigin:`${-x*2}px ${-y*2}px`,transform:`rotate(${r.yaw_degrees||0}deg)`,filter:'none'});
  return true;
 }
 function corners(r){
  const s=get(r),[x,y,w,h]=s?s.bounds:[-7.5,-7.5,15,15];
  const angle=(r.yaw_degrees||0)*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle);
  return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([u,v])=>({x:r.x*2+2*(c*u-sn*v),y:-r.z*2+2*(sn*u+c*v)}));
 }
 window.MZ_ROOM_SHAPES={apply,corners,get};
})();
