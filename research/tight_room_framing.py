from pathlib import Path
p=Path('ui/app.js');s=p.read_text(encoding='utf-8');a=s.index('  const near=relevant.filter(');b=s.index('\n }\n if(!framing.length)',a)
s=s[:a]+'''  const near=selectMapFocusPlayers(relevant,anchor,mapRoomSets[plane]||[]);
  window.mapFocusMembers=new Set(near.map(p=>p.id));
  const fullFallback=observed?.role==='079'&&!cameraAnchor;
  framing=fullFallback?(mapRoomSets[plane]||[]).flatMap(r=>[{x:r.x*2-15,y:-r.z*2-15},{x:r.x*2+15,y:-r.z*2+15}]):near.length?near:[anchor];'''+s[b:]
s=s.replace("const {scale,tx,ty,waitMs}=cameraController.update(projected,plane);", "const {scale,tx,ty,waitMs}=cameraController.update(projected,plane,performance.now(),{focus:mapZoomEnabled,selectionKey:mapZoomEnabled?framing.map(p=>p.id||'camera').sort().join(','):'full'});")
s=s.replace('window.mapCamera={scale,tx,ty,mapSign,visibleIds:', 'window.mapCamera={scale,tx,ty,mapSign,framedIds:framing.map(p=>p.id).filter(Boolean),visibleIds:')
s=s.replace("role:'079',x:observed.camera.x,y:observed.camera.y", "role:'079',x:observed.camera.x,y:observed.camera.y,roomId:observed.camera.roomId")
p.write_text(s,encoding='utf-8')
