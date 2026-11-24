const $=s=>document.querySelector(s);
const art=n=>`../assets/official/${n}.png`;
const roles={scientist:{name:'科学家',color:'#edc13d',art:'Scientist_ProfileImage'},ntf:{name:'九尾狐',color:'#2589ee',art:'MTF_ProfileImage'},guard:{name:'保安',color:'#929aa5',art:'Guard_ProfileImage'},'049':{name:'SCP-049',color:'#d72948',art:'049_ProfileImage'},'096':{name:'SCP-096',color:'#d72948',art:'096_ProfileImage'},'106':{name:'SCP-106',color:'#d72948',art:'106_ProfileImage'}};
const shieldIcon='';
const eye='<svg viewBox="0 0 32 24"><path d="M2 12Q16-5 30 12Q16 29 2 12Z" fill="none" stroke="#ff3550" stroke-width="3"/><circle cx="16" cy="12" r="5" fill="#ff3550"/><circle cx="16" cy="12" r="2" fill="#171824"/></svg>';
const dizzy='<svg viewBox="0 0 32 26"><path d="M24 16c-3 8-19 6-19-2 0-7 17-10 19-3 2 5-9 8-11 3-1-2 4-4 6-2" fill="none" stroke="#f5cf48" stroke-width="2.4"/><path d="m5 1 1 3 4 1-3 2 0 4-3-3-3 1 1-4-2-2 4 0Zm22 1 1 3 4 1-3 2 0 4-3-3-3 1 1-4-2-2 4 0Z" fill="#f5cf48"/></svg>';
const people=[
 {id:'H01',name:'Alpha',role:'scientist',hp:100,maxHp:100,armor:null,held:null,ammo:null,magazineCapacity:null,special:[['SCP500','×2']],inventory:[{type:'SCP500',count:2},{type:'SCP2176',count:2}]},
 {id:'H02',name:'Bravo',role:'ntf',hp:100,maxHp:100,armor:'ArmorCombat',held:'E11SR',ammo:30,magazineCapacity:30,special:[]},
 {id:'H03',name:'Charlie',role:'ntf',hp:100,maxHp:100,armor:'ArmorHeavy',held:'ParticleDisruptor',ammo:5,magazineCapacity:5,special:[['ParticleDisruptor','3-X'],['SCP268','268']]},
 {id:'H04',name:'Delta',role:'scientist',hp:100,maxHp:100,armor:'ArmorLight',held:'GrenadeFlash',ammo:null,magazineCapacity:null,special:[['SCP1344','1344']]},
 {id:'H05',name:'Echo',role:'ntf',hp:100,maxHp:100,armor:'ArmorCombat',held:'MicroHID',ammo:'62%',magazineCapacity:null,special:[['MicroHID','电磁炮']]},
 {id:'H06',name:'Foxtrot',role:'guard',hp:100,maxHp:100,armor:'ArmorLight',held:'GrenadeHE',ammo:null,magazineCapacity:null,special:[['Jailbird','囚鸟']]},
 {id:'S01',name:'Phantom',role:'049',hp:2000,maxHp:2000,hs:600,maxHs:600},
 {id:'S02',name:'Wraith',role:'096',hp:2500,maxHp:2500,hs:800,maxHs:800},
 {id:'S03',name:'Shade',role:'106',hp:1800,maxHp:1800,hs:700,maxHs:700,vigor:78}
];
const cards=new Map();
people.forEach((p,i)=>{const c=document.createElement('article');c.className='card';c.dataset.id=p.id;c.innerHTML=`<div class="specials"></div><div class="effects"></div><div class="visual"><div class="frame"></div><div class="fill"></div><div class="shield"></div><div class="edge-effect"></div><div class="portrait"><img alt=""></div><div class="numbers"><div class="hs">${shieldIcon}<span></span></div><div class="hp"></div></div><img class="armor" alt="护甲"></div><div class="name-row"><span class="name"></span><span class="role"></span></div><div class="equipment"></div>`;$(i<6?'#humans':'#scps').append(c);cards.set(p.id,c)});
let state=1,playTimer=null;
const snapshots={
 4:{H05:{hp:100,dead:false,held:'E11SR',ammo:30,magazineCapacity:30,special:[]},S03:{vigor:66}},
 1:{},
 2:{H02:{hp:68,ammo:18},H05:{hp:42},S01:{hp:1600,hs:300},S03:{hp:1200,hs:200,vigor:54}},
 3:{H01:{hp:57,effects:['cardiac']},H02:{hp:36,effects:['corroding'],ammo:12},H03:{hp:81,dizzy:true,eye:true,ammo:3},H04:{effects:['invisible'],special:[['SCP268','268'],['SCP1344','1344']]},H05:{hp:0,dead:true,special:[]},H06:{special:[['ParticleDisruptor','3-X'],['SCP500','×3'],['SCP1344','1344']]},S01:{hp:1400,hs:200,effects:['burn']},S02:{hp:2000,hs:500,effects:['flashed']},S03:{hp:900,hs:100,vigor:23}}
};
function updateCard(p){const c=cards.get(p.id),r=roles[p.role],scp=p.id[0]==='S';const respawning=c.classList.contains('dead')&&!p.dead&&p.hp>0;c.className=['card',scp?'scp':'',p.dead?'dead':'',...(p.effects||[])].join(' ');if(respawning){c.respawnUntil=performance.now()+450;clearTimeout(c.respawnTimer);c.respawnTimer=setTimeout(()=>c.classList.remove('spawning'),450);}if((c.respawnUntil||0)>performance.now())c.classList.add('spawning');c.dataset.observed=String(p.id===window.mapObservedId);c.style.setProperty('--color',r.color);const max=scp?p.maxHp+p.maxHs:p.maxHp;const hp=90*Math.max(0,Math.min(p.hp,max))/max,hs=scp?90*p.hs/max:0;c.querySelector('.fill').style.height=`${hp}px`;const s=c.querySelector('.shield');s.style.height=`${hs}px`;s.style.bottom=`${hp}px`;const portrait=c.querySelector('.portrait');portrait.dataset.art=r.art;const im=portrait.querySelector('img');im.src=art(r.art);im.alt=r.name;c.querySelector('.hp').textContent=p.hp;c.querySelector('.hs').style.display=scp?'flex':'none';c.querySelector('.hs span').textContent=p.hs??'';c.querySelector('.armor').style.display=scp||!p.armor?'none':'block';if(!scp&&p.armor)c.querySelector('.armor').src=art(p.armor);else c.querySelector('.armor').removeAttribute('src');let badge=c.querySelector('.shortcut-number');if(!badge){badge=document.createElement('span');badge.className='shortcut-number';c.querySelector('.name-row').prepend(badge);}badge.textContent=p.shortcutNumber||((scp?6:0)+Number(p.id.slice(1)));badge.hidden=false;c.querySelector('.name').textContent=p.name;c.querySelector('.name').title=p.name;c.querySelector('.role').textContent='';c.querySelector('.specials').innerHTML=(p.special||[]).map(([n,label])=>`<div class="special"><img src="${art(n)}" alt="${n}"><span>${label}</span></div>`).join('');c.querySelector('.effects').innerHTML=(p.dizzy?dizzy:'')+(p.eye?eye:'');const equipment=c.querySelector('.equipment');
 const held=p.dead?null:p.held;
 const angles={E11SR:45,ParticleDisruptor:40,MicroHID:40};
 const isGun=held in angles;
 equipment.innerHTML=scp?(p.vigor!==undefined&&!p.dead?`<img class="vigor-icon" src="${art('Lightning')}" alt=""><div class="vigor"><i style="width:${p.vigor}%"></i></div><span class="vigor-value">${p.vigor}</span>`:''):
 `<span class="held-slot"><img class="held ${isGun?'gun':''}" ${held?`src="${art(held)}"`:''} style="visibility:${held?'visible':'hidden'};--weapon-angle:${angles[held]||0}deg" alt="${held||''}"></span><span class="ammo">${held?(p.ammo??''):''}${held&&p.magazineCapacity!=null&&p.ammo!=null?`<span class="reserve"> / ${p.magazineCapacity}</span>`:''}</span>`;
 if(p.dead){c.querySelector('.specials').replaceChildren();c.querySelector('.effects').replaceChildren();}
}

const rooms=window.MZ_MAP.rooms;
window.mapRoomSets={HCZ_EZ:rooms,LCZ:MZ_LIGHT_MAP.rooms};
const world=$('#map-world');
rooms.forEach(r=>{const im=new Image();im.className='room';im.dataset.zone=r.zone;im.src='../assets/rooms/'+r.art;im.style.left=`${r.x*2-15}px`;im.style.top=`${-r.z*2-15}px`;im.style.transform=`rotate(${r.yaw_degrees}deg)`;MZ_ROOM_SHAPES.apply(im,r);world.append(im)});
people.forEach(p=>{const m=document.createElement('div');m.className='marker';m.dataset.id=p.id;m.style.setProperty('--color',roles[p.role].color);m.innerHTML=`<span>${(Number(cards.get(p.id)?.dataset.shortcutNumber)||((p.id[0]==='S'?6:0)+Number(p.id.slice(1))))}</span>`;$('#markers').append(m)});
// Positions below are mock data. Camera bounds are calculated from the live set,
// rather than switching to a fixed zone-sized rectangle.
function updateMap(n,data){
 const layout=mapRoomSets.HCZ_EZ;
 const scope=n===1?layout:layout.filter(r=>r.zone==='HeavyContainment');
 let positionRooms;
 if(n===1)positionRooms=[7,15,25,35,44,51,59,64,68].map(i=>scope[i%scope.length]);
 else {
   const center=scope[Math.floor(scope.length/2)];
   positionRooms=[...scope].sort((a,b)=>Math.hypot(a.x-center.x,a.z-center.z)-Math.hypot(b.x-center.x,b.z-center.z)).slice(0,9);
 }
 const points=data.map((p,i)=>({...p,x:positionRooms[i].x*2,y:-positionRooms[i].z*2,plane:'HCZ_EZ'}));
 fitMapPlayers(points,'HCZ_EZ');
}
const cameraController=createMapCamera();let cameraTimer;
window.mapZoomEnabled=false;window.mapObservedId='H02';window.mapLastPlayers=[];window.mapFocusMembers=new Set();
function fitMapPlayers(players,plane){
 const surfaceOverview=(plane==='Surface'||plane==='Pocket')||window.mapSurfaceOverview===true;
 if(surfaceOverview)plane='HCZ_EZ';
 const zoom=window.mapZoomEnabled&&!surfaceOverview;
 clearTimeout(cameraTimer);
 window.mapLastPlayers=players;window.mapLastPlane=plane;
 const relevant=players.filter(p=>!p.dead&&p.hp>0&&p.plane===plane&&p.role!=='tutorial'&&Number.isFinite(p.x)&&Number.isFinite(p.y));
 $('#radar').hidden=!['HCZ_EZ','LCZ'].includes(plane)||(!relevant.length&&!surfaceOverview);
 if((!relevant.length&&!surfaceOverview)||!['HCZ_EZ','LCZ'].includes(plane)){cameraController.reset();return;}
 // Padding includes room geometry and heading glyphs; zoom is capped to keep context.
 const mapSign=plane==='HCZ_EZ'?-1:1;
 const visible=relevant.filter(p=>!p.mapMarkerHidden);
 let framing,displayPlayers=visible,focusKind='full',focusAnchor=null;
 if(!zoom){
  framing=(mapRoomSets[plane]||[]).flatMap(r=>MZ_ROOM_SHAPES.corners(r));
 }else{
  const observed=window.currentSnapshot?.find(p=>p.id===mapObservedId);
  const cameraAnchor=observed?.role==='079'&&Number.isFinite(observed.camera?.x)&&Number.isFinite(observed.camera?.y)?{id:observed.id,role:'079',...observed.camera}:null;
  const anchor=cameraAnchor||relevant.find(p=>p.id===mapObservedId)||relevant[0];
  focusAnchor=anchor;
  const near=selectMapFocusPlayers(visible,anchor,mapRoomSets[plane]||[]);
  window.mapFocusMembers=new Set(near.map(p=>p.id));
  const fullFallback=observed?.role==='079'&&!cameraAnchor;
  // Nearby players frame the camera; visibility is determined only by viewport clipping.
  focusKind=fullFallback?'full':anchor.mapMarkerHidden?'hidden-room-context':near.length<=1?'single-room-context':'players';
  framing=fullFallback?(mapRoomSets[plane]||[]).flatMap(r=>MZ_ROOM_SHAPES.corners(r)):anchor.mapMarkerHidden?[...singlePlayerMapFrame(anchor,mapRoomSets[plane]||[]),...near]:near.length===1?singlePlayerMapFrame(near[0],mapRoomSets[plane]||[]):near.length?near:singlePlayerMapFrame(anchor,mapRoomSets[plane]||[]);
 }
 if(!framing.length)framing=relevant;
 if(zoom&&focusKind!=='full'&&focusAnchor){
  // The observed player/camera is the center. Nearby positions determine the radius only.
  const rx=Math.max(2,...framing.map(p=>Math.abs(p.x-focusAnchor.x)));
  const ry=Math.max(2,...framing.map(p=>Math.abs(p.y-focusAnchor.y)));
  framing=[{x:focusAnchor.x-rx,y:focusAnchor.y-ry},{x:focusAnchor.x+rx,y:focusAnchor.y+ry}];
 }
 const projected=framing.map(p=>({...p,x:p.x*mapSign,y:p.y*mapSign}));
 $('#radar').style.height=setMapViewport(projected,zoom,plane,(mapRoomSets[plane]||[]).flatMap(r=>MZ_ROOM_SHAPES.corners(r)))+'px';
 $('#radar').style.width=MZ_MAP_VIEW.width+'px';
 let {scale,tx,ty,waitMs}=cameraController.update(projected,plane,performance.now(),{focus:zoom,selectionKey:zoom?focusKind+':'+[...window.mapFocusMembers].sort().join(','):'full'});
 if(waitMs>0)cameraTimer=setTimeout(()=>fitMapPlayers(players,plane),waitMs+10);
 world.style.transform=`translate(${tx}px,${ty}px) scale(${scale*mapSign})`;
 const renderedMap=new DOMMatrixReadOnly(getComputedStyle(world).transform);
 const renderedAngle=Math.atan2(renderedMap.b*mapSign,renderedMap.a*mapSign)*180/Math.PI;
 world.dataset.scale=scale;
 world.querySelectorAll('.room').forEach(im=>im.style.opacity='.79');
 document.querySelectorAll('.marker').forEach(m=>m.style.display='none');
 displayPlayers.forEach((p,i)=>{
   const m=$(`.marker[data-id="${p.id}"]`);if(!m)return;
   const camera=p.role==='079';
   if(m.classList.contains('camera-marker')!==camera){
     m.classList.toggle('camera-marker',camera);
     m.innerHTML=(camera?'<svg class="camera-glyph" viewBox="-5 -4 36 32" aria-hidden="true"><path d="M1 4H20L23 7V16L20 19H1Z M23 8L30 5V18L23 15Z M6 19V23H0V26H10V19Z"/></svg>':'')+`<span>${(Number(cards.get(p.id)?.dataset.shortcutNumber)||((p.id[0]==='S'?6:0)+Number(p.id.slice(1))))}</span>`;
   }
   const position=Number(cards.get(p.id)?.dataset.shortcutNumber)||((p.id[0]==='S'?6:0)+Number(p.id.slice(1)));
   m.querySelector('span').textContent=position;
   m.dataset.role=p.role;m.setAttribute('aria-label',camera?`SCP-079 摄像头 ${position}`:`玩家 ${position}`);
   m.style.display='block';m.style.setProperty('--color',roles[p.role]?.color||'#fff');
   // Camera switches are discrete, but viewport panning/zooming is continuous.
   // Project onto the map's currently rendered transform, not its CSS endpoint.

   const markerX=renderedMap.a*p.x+renderedMap.c*p.y+renderedMap.e;
   const markerY=renderedMap.b*p.x+renderedMap.d*p.y+renderedMap.f;
   m.style.transform=`translate(${markerX-MZ_MAP_VIEW.markerSize/2}px,${markerY-MZ_MAP_VIEW.markerSize/2}px) scale(${MZ_MAP_VIEW.markerScale??1})`;
   m.style.setProperty('--angle',`${(p.heading??[35,150,270,45,180,80,225,310,90][i])+(mapSign<0?180:0)+renderedAngle}deg`);
 });
 window.mapCamera={scale,tx,ty,mapSign,matrix:renderedMap,focusKind,framedIds:zoom?[...window.mapFocusMembers]:[],visibleIds:displayPlayers.map(p=>p.id)};
}

function setScene(n){state=Number(n);const data=people.map(p=>({...p,...snapshots[state][p.id]}));data.forEach(updateCard);updateMap(state,data);document.querySelectorAll('[data-scene]').forEach(b=>b.classList.toggle('active',Number(b.dataset.scene)===state));window.currentSnapshot=data;return data;}
window.setScene=setScene;
function fit(){const scale=Math.min(innerWidth/1920,innerHeight/1080);const stage=$('#stage');stage.style.width=`${innerWidth/scale}px`;stage.style.height=`${innerHeight/scale}px`;stage.style.transform=`scale(${scale})`;stage.style.left='0px';stage.style.top='0px';stage.style.setProperty('--map-number-font',Math.max(12,7/scale)+'px');}
addEventListener('resize',fit);fit();
document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{if(playTimer){clearInterval(playTimer);playTimer=null;$('#motion').textContent='播放状态变化'}setScene(b.dataset.scene)});
$('#motion').onclick=()=>{if(playTimer){clearInterval(playTimer);playTimer=null;$('#motion').textContent='播放状态变化'}else{setScene(1);playTimer=setInterval(()=>setScene(state===4?1:state+1),3500);$('#motion').textContent='暂停'}};
$('#background').onclick=()=>document.body.classList.toggle('transparent');
addEventListener('keydown',e=>{if(['1','2','3','4'].includes(e.key))setScene(e.key);if(e.key.toLowerCase()==='h')document.body.classList.toggle('export');if(e.key==='Escape')document.body.classList.remove('export')});
const params=new URLSearchParams(location.search);if(params.has('export'))document.body.classList.add('export');setScene(Number(params.get('scene')||1));
window.uiReady=async()=>{await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));return {cards:cards.size,humans:$('#humans').children.length,scps:$('#scps').children.length,missing:[...document.images].filter(im=>im.getAttribute('src') && !im.naturalWidth).map(im=>im.src),state};};

window.MZUI={
  applyPlayers(players){
    if(!Array.isArray(players)||players.length!==9)throw Error('Expected fixed 6+3 roster');
    const ids=players.map(p=>p.id);
    if(new Set(ids).size!==9||ids.some(id=>!cards.has(id)))throw Error('Invalid roster slots');
    for(const p of players){
      if(p.role==='079'){
        if(!Number.isInteger(p.level)||p.level<1||!Number.isFinite(p.energy)||p.energy<0||!(p.maxEnergy>0)||p.energy>p.maxEnergy)throw Error('Invalid SCP-079 state');
        continue;
      }
      if(!roles[p.role]||!Number.isFinite(p.hp)||!(p.maxHp>0))throw Error('Invalid player state');
      if(p.id.startsWith('S')&&(!(p.maxHs>=0)||!(p.hs>=0)))throw Error('Invalid shield state');
    }
    players.forEach(updateCard);window.currentSnapshot=players;
  },
  setScore(human,scp){
    if(!Number.isInteger(human)||!Number.isInteger(scp)||human<0||scp<0)throw Error('Invalid score');
    const scores=document.querySelectorAll('#score strong');scores[0].textContent=human;scores[1].textContent=scp;
  },
  setAuthorized(authorized){document.getElementById('stage').hidden=!authorized;},
  note:'Renderer only. Authorization and sensitive-data filtering must be enforced on the server.'
};
