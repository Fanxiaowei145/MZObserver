window.MZ_MAP_VIEW={width:472.5,height:437.5,defaultWidth:472.5,defaultHeight:437.5,fullMapWidths:{HCZ_EZ:616,LCZ:384.4},markerSize:22,markerScale:0.6,roomGridSize:30,overviewPadding:6,minFocusRooms:3};
window.setMapViewport=function(points,zoom,plane,fullPoints=points){
 // Overview sizes use the 1920x1080 design canvas; the stage handles resolution scaling.
 // LCZ drawable width is exactly 80% of the previous 440.5px; keep marker sizes unchanged.
 const v=MZ_MAP_VIEW,padding=v.overviewPadding;
 // Remove 10px of empty space on each side without changing the map geometry scale.
 v.width=(v.fullMapWidths[plane]??v.defaultWidth)-20;
 points=fullPoints;
 const spanX=points.length?Math.max(1,Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))):1;
 const spanY=points.length?Math.max(1,Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))):1;
 v.height=spanY*(v.width-2*padding)/spanX+2*padding;
 return v.height;
};
// Room IDs from live telemetry are authoritative. Nearest-room lookup only supports mock coordinates.
window.findMapRoom=function(p,rooms){
 const id=p.roomId??p.room_id;
 if(id!=null)return rooms.find(r=>r.room_id===id)||null;
 return rooms.reduce((best,r)=>{const distance=Math.hypot(p.x-r.x*2,p.y+r.z*2);return !best||distance<best.distance?{room:r,distance}:best},null)?.room||null;
};
window.singlePlayerMapFrame=function(player,rooms){
 const room=findMapRoom(player,rooms),x=room?room.x*2:player.x,y=room?-room.z*2:player.y;
 const half=1.5*MZ_MAP_VIEW.roomGridSize;
 return [{x:x-half,y:y-half},{x:x+half,y:y+half}];
};
window.selectMapFocusPlayers=function(players,anchor,rooms){
 const roomOf=p=>findMapRoom(p,rooms);
 const origin=roomOf(anchor),step=MZ_MAP_VIEW.roomGridSize;
 return players.filter(p=>{
  const room=roomOf(p);
  const distance=origin&&room?Math.hypot((room.x-origin.x)*2,(room.z-origin.z)*2):Math.hypot(p.x-anchor.x,p.y-anchor.y);
  return distance<=2*step+1e-7;
 });
};
// The camera fits actual player bounds, with a screen-space margin instead of a fixed world radius.
window.createMapCamera=()=>{
 let current=null,mode=null;
 return {
  reset(){current=null;mode=null;},
  update(points,nextPlane,now=performance.now(),options={}){
   const {width:w,height:h}=window.MZ_MAP_VIEW,focus=!!options.focus,edge=focus?24:MZ_MAP_VIEW.overviewPadding;
   if(!points.length){current=null;return {scale:1,tx:w/2,ty:h/2,waitMs:0};}
   const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
   const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
   const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
   // 6% breathing room on each side. A tiny 4-unit floor handles a singleton or coincident markers.
   const spanX=focus?Math.max(4,(maxX-minX)*1.12):Math.max(1,maxX-minX);
   const spanY=focus?Math.max(4,(maxY-minY)*1.12):Math.max(1,maxY-minY);
   // Retain surrounding corridors even when all players occupy one room.
   const fitW=focus?MZ_MAP_VIEW.defaultWidth:w,fitH=focus?MZ_MAP_VIEW.defaultHeight:h;
   const desiredScale=Math.min((fitW-2*edge)/spanX,(fitH-2*edge)/spanY,focus?(Math.min(fitW,fitH)-2*edge)/(MZ_MAP_VIEW.roomGridSize*MZ_MAP_VIEW.minFocusRooms):Infinity);
   const desired={scale:desiredScale,tx:w/2-cx*desiredScale,ty:h/2-cy*desiredScale};
   const nextMode=nextPlane+':'+focus+':'+(options.selectionKey||'');
   if(!current||mode!==nextMode){current=desired;mode=nextMode;return {...current,waitMs:0};}
   const outside=points.some(p=>{const x=p.x*current.scale+current.tx,y=p.y*current.scale+current.ty;return x<edge||x>w-edge||y<edge||y>h-edge;});
   if(outside||desiredScale<current.scale*.97||desiredScale>current.scale*1.03){current=desired;}
   else if(Math.hypot(cx*current.scale+current.tx-w/2,cy*current.scale+current.ty-h/2)>3){current={scale:current.scale,tx:w/2-cx*current.scale,ty:h/2-cy*current.scale};}
   return {...current,waitMs:0};
  }
 };
};
