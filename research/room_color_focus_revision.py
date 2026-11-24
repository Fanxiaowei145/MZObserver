from pathlib import Path
p=Path('ui/map-camera.js');s=p.read_text(encoding='utf-8-sig');a=s.index('window.selectMapFocusPlayers=');b=s.index(' const origin=roomOf(anchor)',a)
s=s[:a]+'''window.findMapRoom=function(p,rooms){
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
'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('ui/app.js');s=p.read_text(encoding='utf-8');s=s.replace(' let framing,displayPlayers=relevant;', " let framing,displayPlayers=relevant,focusKind='full';")
s=s.replace("framing=fullFallback?(mapRoomSets[plane]||[]).flatMap(r=>[{x:r.x*2-15,y:-r.z*2-15},{x:r.x*2+15,y:-r.z*2+15}]):near.length?near:[anchor];", "focusKind=fullFallback?'full':near.length===1?'single-room-context':'players';\n  framing=fullFallback?(mapRoomSets[plane]||[]).flatMap(r=>[{x:r.x*2-15,y:-r.z*2-15},{x:r.x*2+15,y:-r.z*2+15}]):near.length===1?singlePlayerMapFrame(near[0],mapRoomSets[plane]||[]):near.length?near:singlePlayerMapFrame(anchor,mapRoomSets[plane]||[]);")
s=s.replace("selectionKey:mapZoomEnabled?framing.map(p=>p.id||'camera').sort().join(','):'full'", "selectionKey:mapZoomEnabled?focusKind+':'+displayPlayers.map(p=>p.id).sort().join(','):'full'")
s=s.replace('window.mapCamera={scale,tx,ty,mapSign,framedIds:framing.map(p=>p.id).filter(Boolean)', 'window.mapCamera={scale,tx,ty,mapSign,focusKind,framedIds:mapZoomEnabled?displayPlayers.map(p=>p.id):[]')
s=s.replace("c.style.setProperty('--color',r.color);", "c.dataset.observed=String(p.id===window.mapObservedId);c.style.setProperty('--color',r.color);")
p.write_text(s,encoding='utf-8')
p=Path('ui/map-interaction.js');s=p.read_text(encoding='utf-8');s=s.replace('function redrawLatestMap(){', "function syncObservedCards(){cards.forEach((c,id)=>c.dataset.observed=String(id===mapObservedId));}\nfunction redrawLatestMap(){")
s=s.replace('observeSelect.value=id;mapFocusMembers.clear();', 'observeSelect.value=id;syncObservedCards();mapFocusMembers.clear();')
s=s.replace('MZUI.setMapZoom(false);','MZUI.setMapZoom(false);syncObservedCards();');p.write_text(s,encoding='utf-8')
p=Path('ui/scp-showcase.js');s=p.read_text(encoding='utf-8').replace("copy.removeAttribute('data-id');", "copy.removeAttribute('data-id');copy.removeAttribute('data-observed');");p.write_text(s,encoding='utf-8')
p=Path('ui/final-layout.css');s=p.read_text(encoding='utf-8')+'''\n.card .name-row{transition:background-color .15s ease-out,color .15s ease-out}
.card[data-observed="true"] .name-row{background:#a3bea9;color:#14271c}
.card[data-observed="true"] .name{text-shadow:none}
''';p.write_text(s,encoding='utf-8')
