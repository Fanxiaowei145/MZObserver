import fs from 'node:fs';
import path from 'node:path';
import {generateMap} from 'file:///C:/Users/86188/Documents/%E7%94%B5%E8%84%91%E8%B0%83%E8%AF%95/SLUI-Minimap/packages/map-seed/src/index.js';
const old='C:/Users/86188/Documents/电脑调试/SLUI-Minimap';
const manifest=JSON.parse(fs.readFileSync(path.join(old,'src/features/minimap/room-artwork.json'),'utf8'));
const map=generateMap(1062329959,{holiday:'None'});
const rooms=map.rooms.filter(r=>r.zone.name==='LightContainment').map(r=>{
 const art=manifest.byPrefabName[r.prefabName]||manifest.byZoneShape.LightContainment[r.shape.name];
 fs.copyFileSync(path.join(old,'public/assets/minimap/rooms',art),path.join('assets/rooms',art));
 return {room_id:r.id,prefab:r.prefabName,zone:r.zone.name,name:r.name.name,shape:r.shape.name,x:r.position.x,y:r.position.y,z:r.position.z,yaw_degrees:r.rotationY,art};
});
fs.writeFileSync('ui/light-map-data.js','window.MZ_LIGHT_MAP='+JSON.stringify({source:map.source,seed:map.seed,rooms})+';');
console.log(JSON.stringify({rooms:rooms.length,elevators:rooms.filter(r=>/Chkp[AB]/.test(r.prefab)).map(r=>({prefab:r.prefab,x:r.x,z:r.z}))}));
