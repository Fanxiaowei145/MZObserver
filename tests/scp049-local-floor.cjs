const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={performance};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../ui/scp049-local-floor.js'),'utf8'),ctx);
let checks=0;
for(const yaw of [0,90,180,270]){
 const tracker=ctx.create049FloorTracker(),r={room_id:'049',name:'Hcz049',x:120,z:-75,yaw_degrees:yaw};
 const p=(x,z,extra={})=>{const a=yaw*Math.PI/180;return {id:'H01',actorId:'test',lifeId:1,role:'scientist',plane:'HCZ_EZ',roomId:'049',x:2*(r.x+Math.cos(a)*x+Math.sin(a)*z),y:-2*(r.z-Math.sin(a)*x+Math.cos(a)*z),mapMarkerHidden:false,...extra};};
 const rooms=[r];let now=0;
 assert.equal(tracker.apply(p(-4.87,3),rooms,now).mapMarkerHidden,false);checks++;
 let upper=tracker.apply(p(-4.569,19),rooms,now+=50);
 assert.equal(upper.mapMarkerHidden,true);assert.equal(upper.x,r.x*2);assert.equal(upper.y,-r.z*2);checks++;
 // Walk upstairs through a footprint that overlaps the main-floor corridor: stay hidden.
 for(let z=18;z>=0;z--)assert.equal(tracker.apply(p(-4.5,z),rooms,now+=100).mapMarkerHidden,true);
 checks++;
 for(let z=1;z<=19;z++)tracker.apply(p(-4.5,z),rooms,now+=100);
 assert.equal(tracker.apply(p(-4.87,3),rooms,now+=50).mapMarkerHidden,false);checks++;
 tracker.apply(p(-4.569,19),rooms,now+=50);
 assert.equal(tracker.apply(p(0,0,{lifeId:2}),rooms,now+=50).mapMarkerHidden,false);checks++;
 tracker.reset();assert.equal(tracker.apply(p(-4.569,19),rooms,0).mapMarkerHidden,true);checks++;
 tracker.reset();assert.equal(tracker.apply(p(0,0),rooms,0).mapMarkerHidden,false);checks++; // Known ambiguous late join.
 const nuke=p(300,300,{roomId:'nuke',mapMarkerHidden:true});assert.equal(tracker.apply(nuke,[{room_id:'nuke',name:'HczWarhead'}],50),nuke);checks++;
}
console.log(`PASS ${checks} local-only 049 inference checks, including all room rotations; ambiguous late join remains visible.`);
