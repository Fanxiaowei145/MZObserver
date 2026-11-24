from pathlib import Path
p=Path('ui/app.js');s=p.read_text(encoding='utf-8').replace('const cameraController=createMapCamera();let cameraTimer;',"const cameraController=createMapCamera();let cameraTimer;\nwindow.mapZoomEnabled=false;window.mapObservedId='H02';window.mapLastPlayers=[];window.mapFocusMembers=new Set();")
s=s.replace(' clearTimeout(cameraTimer);\n const relevant=', ' clearTimeout(cameraTimer);\n window.mapLastPlayers=players;window.mapLastPlane=plane;\n const relevant=')
s=s.replace(' const projected=relevant.map(p=>({...p,x:p.x*mapSign,y:p.y*mapSign}));', ''' let framing;
 if(!window.mapZoomEnabled){
  framing=(mapRoomSets[plane]||[]).flatMap(r=>[{x:r.x*2-15,y:-r.z*2-15},{x:r.x*2+15,y:-r.z*2+15}]);
 }else{
  const observed=window.currentSnapshot?.find(p=>p.id===mapObservedId);
  const cameraAnchor=observed?.role==='079'&&Number.isFinite(observed.camera?.x)&&Number.isFinite(observed.camera?.y)?{id:observed.id,role:'079',x:observed.camera.x,y:observed.camera.y}:null;
  const anchor=cameraAnchor||relevant.find(p=>p.id===mapObservedId)||relevant[0];
  const near=relevant.filter(p=>Math.hypot(p.x-anchor.x,p.y-anchor.y)<=(mapFocusMembers.has(p.id)?90:75));
  window.mapFocusMembers=new Set(near.map(p=>p.id));
  const enemyNearby=near.some(p=>p.id.startsWith('S')!==anchor.id.startsWith('S'));
  framing=enemyNearby?[anchor,...near]:[{x:anchor.x-45,y:anchor.y-45},{x:anchor.x+45,y:anchor.y+45},anchor];
 }
 if(!framing.length)framing=relevant;
 const projected=framing.map(p=>({...p,x:p.x*mapSign,y:p.y*mapSign}));''')
p.write_text(s,encoding='utf-8')
p=Path('ui/index.html');s=p.read_text(encoding='utf-8').replace('<script src="map-camera.js">','<script src="alternate-map-data.js"></script><script src="map-camera.js">').replace('</body>', '<script src="map-interaction.js"></script></body>');p.write_text(s,encoding='utf-8')
p=Path('ui/final-layout.css');s=p.read_text(encoding='utf-8')+'\n#elevators [hidden]{display:none!important}\n';p.write_text(s,encoding='utf-8')
