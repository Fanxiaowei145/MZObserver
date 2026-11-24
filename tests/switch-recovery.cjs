const assert=require('node:assert/strict'),{Switcher}=require('../desktop/spectator-switch.cjs');
function rig(role='Overwatch'){
 let time=0,pending=null;const inputs=[],results=[],recoveries=[];
 const s={epoch:'e',phase:'live',observerRole:role,observedActorId:'A',order:['H01','H02','H03','H04'],players:['A','B','C','D'].map((actorId,i)=>({id:'H0'+(i+1),actorId,lifeId:1,alive:true}))};
 const sw=new Switcher({now:()=>time,step:(id,direction)=>{assert.equal(pending,null,'one outstanding input');pending={id,direction};inputs.push(pending);},report:r=>results.push(r),recover:r=>recoveries.push(r)});
 function advance(actor,ms=80){assert.ok(pending);const old=pending;pending=null;time+=ms;sw.acknowledge(old.id,true);time+=20;s.observedActorId=actor;sw.update(s);}
 return {s,sw,inputs,results,recoveries,advance,get pending(){return pending},jump:ms=>time+=ms};
}
for(const role of ['Spectator','Overwatch'])for(const direction of [1,-1]){
 const r=rig(role);r.sw.syncRoute(r.s);r.sw.learn('A','B',direction);r.sw.learn('B','D',direction);
 r.sw.start(4,r.s);assert.equal(r.inputs.at(-1).direction,direction);
 r.advance('C');assert.equal(r.recoveries.length,1);assert.equal(r.results.length,0);assert.equal(r.inputs.at(-1).direction,direction);
 r.advance('A');assert.ok(r.sw.job,'can revisit the old origin while searching the new order');r.advance('D');
 assert.equal(r.results.at(-1).ok,true);assert.equal(r.results.at(-1).actor,'D');assert.equal(r.results.at(-1).recoveries,1);assert.equal(r.pending,null);
 // Recovery keeps the original overall budget.
 const b=rig(role);b.sw.syncRoute(b.s);b.sw.learn('A','D',direction);b.sw.start(4,b.s);b.advance('C');b.jump(8000);b.sw.update(b.s);assert.equal(b.results.at(-1).ok,false);
 // Death/replacement of the chosen player still cancels rather than chasing another life.
 for(const change of [p=>p.alive=false,p=>p.lifeId++]){const d=rig(role);d.sw.syncRoute(d.s);d.sw.learn('A','D',direction);d.sw.start(4,d.s);d.advance('C');change(d.s.players[3]);d.sw.update(d.s);assert.equal(d.results.at(-1).ok,false);}
 // Rapid retarget preserves the pending input, then finishes at the latest selection.
 const q=rig(role);q.sw.syncRoute(q.s);q.sw.learn('A','D',direction);q.sw.start(4,q.s);q.advance('C');const count=q.inputs.length;q.sw.start(2,q.s);assert.equal(q.inputs.length,count);q.advance('B');assert.equal(q.results.at(-1).actor,'B');assert.equal(q.pending,null);
 // If the unexpected step already reached the target, finish without another click.
 const t=rig(role);t.sw.syncRoute(t.s);t.sw.learn('A','B',direction);t.sw.learn('B','D',direction);t.sw.start(4,t.s);t.advance('D');assert.equal(t.results.at(-1).ok,true);assert.equal(t.inputs.length,1);
 // Roster changes while input is in flight discard stale route assumptions.
 const c=rig(role);c.sw.syncRoute(c.s);c.sw.learn('A','B',direction);c.sw.learn('B','D',direction);c.sw.start(4,c.s);c.s.players[1].lifeId++;c.advance('C');assert.equal(c.recoveries[0].reason,'roster-changed');c.advance('D');assert.equal(c.results.at(-1).ok,true);
 // A full new search cycle with no target must terminate; recovery is not an endless loop.
 const l=rig(role);l.sw.syncRoute(l.s);l.sw.learn('A','D',direction);l.sw.start(4,l.s);l.advance('C');l.advance('A');l.advance('C');assert.equal(l.results.at(-1).ok,false);
}
// Replay the real 11:34:21 mismatch: predicted 649, actual 648, requested 638.
const r=rig();r.s.players=[638,643,648,649].map((n,i)=>({id:'H0'+(i+1),actorId:'net:'+n,lifeId:1,alive:true}));r.s.observedActorId='net:643';r.sw.syncRoute(r.s);r.sw.learn('net:643','net:649',1);r.sw.learn('net:649','net:638',1);r.sw.start(1,r.s);r.advance('net:648');r.advance('net:649');r.advance('net:638');assert.equal(r.results.at(-1).actor,'net:638');assert.equal(r.results.at(-1).ok,true);
console.log('PASS recovery: live mismatch replay, both roles/directions, fresh scan, death/life replacement, retarget, roster mutation, immediate arrival, bounded cycle/time, one input in flight');
