import fs from 'node:fs';import path from 'node:path';
import {generateMap} from 'file:///C:/Users/86188/Documents/%E7%94%B5%E8%84%91%E8%B0%83%E8%AF%95/SLUI-Minimap/packages/map-seed/src/index.js';
const old='C:/Users/86188/Documents/电脑调试/SLUI-Minimap';
const manifest=JSON.parse(fs.readFileSync(path.join(old,'src/features/minimap/room-artwork.json'),'utf8'));
const seed=221713,generated=generateMap(seed,{holiday:'None'}),roomsets={HCZ_EZ:[],LCZ:[]};
for(const r of generated.rooms){const zone=r.zone.name;if(!['LightContainment','HeavyContainment','Entrance'].includes(zone))continue;
 const art=manifest.byPrefabName[r.prefabName]||manifest.byZoneShape[zone]?.[r.shape.name];if(!art)throw Error('Missing artwork '+r.prefabName);
 if(!fs.existsSync(path.join('assets/rooms',art)))fs.copyFileSync(path.join(old,'public/assets/minimap/rooms',art),path.join('assets/rooms',art));
 roomsets[zone==='LightContainment'?'LCZ':'HCZ_EZ'].push({room_id:r.id,prefab:r.prefabName,zone,name:r.name.name,shape:r.shape.name,x:r.position.x,y:r.position.y,z:r.position.z,yaw_degrees:r.rotationY,art});
}
fs.writeFileSync('ui/alternate-map-data.js','window.MZ_ALTERNATE_MAP='+JSON.stringify({seed,...roomsets})+';');console.log(JSON.stringify({seed,counts:Object.fromEntries(Object.entries(roomsets).map(([k,v])=>[k,v.length]))}));
