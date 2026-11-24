const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Switcher}=require('../desktop/spectator-switch.cjs');
const Old=require('./fixtures/switch-preview1.cjs').Switcher;
function run(Type,role,feedbackDelay){
 let now=0,pending=null,observed=1,result=null,steps=0;
 const state=()=>({epoch:'e',phase:'live',observerRole:role,observedActorId:'A'+observed,players:Array.from({length:9},(_,i)=>({id:i<6?'H0'+(i+1):'S0'+(i-5),actorId:'A'+(i+1),lifeId:1,alive:true}))});
 const sw=new Type({now:()=>now,report:r=>result=r,step:id=>{assert.equal(pending,null,'only one outstanding input');pending={id,ackAt:now+35,feedbackAt:now+feedbackDelay};steps++;}});
 let received=state();sw.start(9,received);
 for(now=1;now<=8000&&!result;now++){
  if(pending&&now===pending.ackAt)sw.acknowledge(pending.id,true);
  if(pending&&now===pending.feedbackAt){observed=observed%9+1;pending=null;}
  if(now%50===0){received=state();sw.update(received);}else if(Type===Switcher&&now%10===0&&sw.job)sw.update(received);
 }
 assert.equal(result?.ok,true);assert.equal(observed,9);assert.equal(steps,8);assert.equal(pending,null,'no input remains after success');return result.elapsedMs;
}
const rows=[];for(const role of ['Spectator','Overwatch'])for(const delay of [50,100,200])rows.push({role,feedbackDelayMs:delay,beforeMs:run(Old,role,delay),afterMs:run(Switcher,role,delay)});
// Feedback must not cause success until the OS has acknowledged key release.
let t=0,ids=[],results=[];const s={epoch:'e',phase:'live',observerRole:'Spectator',observedActorId:'A',players:[{id:'H01',actorId:'A',lifeId:1},{id:'H02',actorId:'B',lifeId:1}]};
const sw=new Switcher({now:()=>t,step:id=>ids.push(id),report:r=>results.push(r)});sw.start(2,s);s.observedActorId='B';sw.update(s);assert.equal(results.length,0);sw.acknowledge(ids[0],true);sw.update(s);assert.equal(results.at(-1).ok,true);
// Rapid reselect to the pre-click player must not report success with an input pending.
results=[];ids=[];s.observedActorId='A';sw.start(2,s);sw.start(1,s);assert.equal(ids.length,1);sw.acknowledge(ids[0],true);sw.update(s);assert.equal(results.length,0);s.observedActorId='B';t+=50;sw.update(s);assert.equal(ids.length,2);sw.acknowledge(ids[1],true);s.observedActorId='A';t+=50;sw.update(s);assert.equal(results.at(-1).ok,true);
// No change means no second input, regardless of elapsed pacing interval.
results=[];ids=[];s.observedActorId='A';sw.start(2,s);sw.acknowledge(ids[0],true);t+=500;sw.update(s);assert.equal(ids.length,1);sw.cancel('done');
fs.writeFileSync(path.join(__dirname,'../output/tests/switch-speed.json'),JSON.stringify({simulationOnly:true,telemetryIntervalMs:50,keyHoldMs:35,rows,safety:'one in-flight input; wait for release and changed target; rapid reselect does not queue a second input'},null,2));
console.log(JSON.stringify(rows));console.log('PASS release confirmation, retarget race, one in-flight input, no false success, no trailing input');
