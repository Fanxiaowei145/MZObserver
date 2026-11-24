const assert=require('node:assert/strict'),{Switcher,numberOf,allowed}=require('../desktop/spectator-switch.cjs');
let checks=0;function ok(x){assert.ok(x);checks++;}
function fixture(role='Spectator'){return {epoch:'half',phase:'live',observerRole:role,observedActorId:'A1',players:Array.from({length:9},(_,i)=>({id:i<6?'H0'+(i+1):'S0'+(i-5),actorId:'A'+(i+1),lifeId:1,alive:true,dead:false}))};}
function harness(){let time=0,steps=[],results=[];const sw=new Switcher({step:id=>steps.push(id),report:r=>results.push(r),now:()=>time});return {sw,steps,results,advance:n=>time+=n};}
for(const role of ['Spectator','Overwatch']){
 for(const target of [1,2,9]){const h=harness(),s=fixture(role);h.sw.start(target,s);for(let i=2;i<=target;i++){ok(h.steps.length===i-1);h.sw.acknowledge(h.steps.at(-1),true);h.advance(200);s.observedActorId='A'+i;h.sw.update(s);}ok(h.results.at(-1).ok);ok(h.results.at(-1).steps===target-1);}
 for(const mutation of [s=>s.players[8].dead=true,s=>s.players[8].lifeId++,s=>s.players[8].actorId='replacement',s=>s.observerRole='ClassD',s=>s.observerRole=role==='Spectator'?'Overwatch':'Spectator',s=>s.epoch='new']){const h=harness(),s=fixture(role);h.sw.start(9,s);mutation(s);h.sw.update(s);ok(!h.sw.job);ok(!h.results.at(-1).ok);}
 const loop=harness(),s=fixture(role);loop.sw.start(9,s);for(const actor of ['A2','A1']){loop.sw.acknowledge(loop.steps.at(-1),true);loop.advance(200);s.observedActorId=actor;loop.sw.update(s);}ok(/循环/.test(loop.results.at(-1).reason));
 const timeout=harness();timeout.sw.start(9,fixture(role));timeout.advance(1201);timeout.sw.tick();ok(!timeout.sw.job);
 const wait=harness(),st=fixture(role);wait.sw.start(9,st);for(let i=0;i<10;i++){wait.advance(50);wait.sw.update(st);}ok(wait.steps.length===1);wait.sw.acknowledge(999,true);ok(!wait.sw.job.ack);wait.sw.acknowledge(wait.steps[0],false);ok(!wait.sw.job);
 const change=harness();change.sw.start(9,fixture(role));change.sw.start(2,fixture(role));const id=change.steps.at(-1);ok(change.steps.length===1);change.sw.acknowledge(id-1,true);ok(!change.sw.job.ack);change.sw.cancel('manual');ok(!change.sw.job);
 const deadline=harness(),ds=fixture(role);deadline.sw.start(9,ds);deadline.advance(8000);deadline.sw.update(ds);ok(!deadline.sw.job);
}
ok(!allowed(fixture('ClassD')));ok(!allowed({...fixture(),observerRole:undefined}));
const s=fixture();ok(s.players.map(numberOf).join(',')==='1,2,3,4,5,6,7,8,9');s.players.reverse();ok(s.players.map(numberOf).join(',')==='9,8,7,6,5,4,3,2,1');s.players[0].dead=true;ok(numberOf(s.players[1])===8);
console.log(`PASS ${checks} switch checks: both roles, acknowledged stepping, direct/no-op, timeout, loop, death, replacement, respawn, epoch, role change, cancellation, fixed slots`);
