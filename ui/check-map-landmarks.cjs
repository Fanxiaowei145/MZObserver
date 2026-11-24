const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const c={window:{}};vm.createContext(c);
for(const f of ['map-data.js','light-map-data.js','alternate-map-data.js','map-landmarks.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),c);
const {MZ_LANDMARKS:api,MZ_MAP,MZ_LIGHT_MAP,MZ_ALTERNATE_MAP}=c.window;
for(const [name,rooms,expected] of [['original HCZ',MZ_MAP.rooms,2],['original LCZ',MZ_LIGHT_MAP.rooms,2],['alternate HCZ',MZ_ALTERNATE_MAP.HCZ_EZ,2],['alternate LCZ',MZ_ALTERNATE_MAP.LCZ,2]]){
 const anchors=api.anchors(rooms);assert.equal(anchors.length,expected,name);
 const rotated=rooms.map(r=>({...r,x:r.x+31,z:r.z-47,yaw_degrees:r.yaw_degrees+90})),next=api.anchors(rotated);
 anchors.forEach((a,i)=>{const room=rooms.find(r=>r.room_id===a.roomId),local={x:a.x-room.x*2,y:a.y+room.z*2};assert(Math.abs(next[i].x-(rotated.find(r=>r.room_id===a.roomId).x*2-local.y))<1e-6);assert(Math.abs(next[i].y-(-rotated.find(r=>r.room_id===a.roomId).z*2+local.x))<1e-6);});
}
const room={room_id:'custom',name:'HczCheckpointA',prefab:'',x:10,z:20,yaw_degrees:90,mapAnchors:{'elevator-a':{localX:8,localY:-3,normalAngle:90}}};const a=api.anchors([room])[0];assert(Math.abs(a.x-23)<1e-9);assert(Math.abs(a.y+32)<1e-9);
console.log('PASS: all landmarks in two seeds; translation, quarter-turn rotations, explicit local endpoint and HCZ inversion supported.');

assert.equal(new Set(api.palette.map(s=>s.color)).size,8);assert.equal(api.classify({name:'LczGlassroom',prefab:'LCZ_372'}).kind,'gr18');assert.equal(api.classify({name:'HczTesla',prefab:'HCZ_Tesla_Rework'}).kind,'tesla');assert.equal(api.classify({name:'HczCheckpointToEntranceZone',prefab:'HCZ_EZ_Checkpoint Part'}),undefined);
