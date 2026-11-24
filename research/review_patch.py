from pathlib import Path
p=Path('ui/app.js')
s=p.read_text(encoding='utf-8')
s=s.replace("art:'MTF_Icon'", "art:'MTF_ProfileImage'")
s=s.replace('<div class="portrait"><img', '<div class="edge-effect"></div><div class="portrait"><img')
s=s.replace("p.id[0]==='S'?p.id.slice(1).replace('0','S'):p.id.slice(2)", "Number(p.id.slice(1))")
start=s.index('const equipment=c.querySelector')
end=s.index('\nconst rooms=', start)
s=s[:start]+'''const equipment=c.querySelector('.equipment');
 const held=p.dead?null:p.held;
 const angles={E11SR:45,ParticleDisruptor:40,MicroHID:40};
 const isGun=held in angles;
 equipment.innerHTML=scp?(p.vigor!==undefined&&!p.dead?`<img class="vigor-icon" src="${art('Lightning')}" alt=""><div class="vigor"><i style="width:${p.vigor}%"></i></div><span class="vigor-value">${p.vigor}</span>`:''):
 `<span class="held-slot"><img class="held ${isGun?'gun':''}" ${held?`src="${art(held)}"`:''} style="visibility:${held?'visible':'hidden'};--weapon-angle:${angles[held]||0}deg" alt="${held||''}"></span><span class="ammo">${held?(p.ammo??''):''}${held&&p.magazineCapacity!=null&&p.ammo!=null?`<span class="reserve"> / ${p.magazineCapacity}</span>`:''}</span>`;
 if(p.dead){c.querySelector('.specials').replaceChildren();c.querySelector('.effects').replaceChildren();}
}
''' + s[end:]
start=s.index('function updateMap(')
end=s.index('\nfunction setScene',start)
s=s[:start]+'''// Positions below are mock data. Camera bounds are calculated from the live set,
// rather than switching to a fixed zone-sized rectangle.
function updateMap(n,data){
 const scope=n===1?rooms:rooms.filter(r=>r.zone==='HeavyContainment');
 let positionRooms;
 if(n===1)positionRooms=[7,15,25,35,44,51,59,64,68].map(i=>scope[i%scope.length]);
 else {
   const center=scope[Math.floor(scope.length/2)];
   positionRooms=[...scope].sort((a,b)=>Math.hypot(a.x-center.x,a.z-center.z)-Math.hypot(b.x-center.x,b.z-center.z)).slice(0,9);
 }
 const points=data.map((p,i)=>({...p,x:positionRooms[i].x*2,y:-positionRooms[i].z*2,plane:'HCZ_EZ'}));
 fitMapPlayers(points,'HCZ_EZ');
}
function fitMapPlayers(players,plane){
 const relevant=players.filter(p=>!p.dead&&p.hp>0&&p.plane===plane&&p.role!=='tutorial'&&Number.isFinite(p.x)&&Number.isFinite(p.y));
 $('#radar').hidden=plane==='Surface'||!relevant.length;
 if(!relevant.length||plane==='Surface')return;
 // Padding includes room geometry and heading glyphs; zoom is capped to keep context.
 const minX=Math.min(...relevant.map(p=>p.x))-34,maxX=Math.max(...relevant.map(p=>p.x))+34;
 const minY=Math.min(...relevant.map(p=>p.y))-34,maxY=Math.max(...relevant.map(p=>p.y))+34;
 const scale=Math.min(2.1,362/(maxX-minX),334/(maxY-minY));
 const tx=189-(minX+maxX)/2*scale,ty=175-(minY+maxY)/2*scale;
 world.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;
 world.dataset.scale=scale;
 world.querySelectorAll('.room').forEach(im=>im.style.opacity='.79');
 document.querySelectorAll('.marker').forEach(m=>m.style.display='none');
 relevant.forEach((p,i)=>{
   const m=$(`.marker[data-id="${p.id}"]`);if(!m)return;
   m.style.display='block';m.style.setProperty('--color',roles[p.role]?.color||'#fff');
   m.style.transform=`translate(${p.x*scale+tx-11}px,${p.y*scale+ty-11}px)`;
   m.style.setProperty('--angle',`${p.heading??[35,150,270,45,180,80,225,310,90][i]}deg`);
 });
 window.mapCamera={scale,tx,ty,visibleIds:relevant.map(p=>p.id)};
}
''' + s[end:]
p.write_text(s,encoding='utf-8')
p=Path('ui/index.html');s=p.read_text(encoding='utf-8').replace('</head>','<link rel="stylesheet" href="review.css"></head>').replace('</body>','<script src="review.js"></script></body>');p.write_text(s,encoding='utf-8')
