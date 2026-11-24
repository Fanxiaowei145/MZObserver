const assert=require('node:assert/strict'),{Switcher}=require('../desktop/spectator-switch.cjs');
let cases=0;
for(const role of ['Spectator','Overwatch'])for(const order of [[1,2,3,4,5,6,7,8,9],[1,5,3,9,2,7,4,8,6]]){
 let time=0,current=1,inputs=[],results=[];
 const state={epoch:'e',phase:'live',observerRole:role,players:Array.from({length:9},(_,i)=>({id:i<6?'H0'+(i+1):'S0'+(i-5),actorId:'A'+(i+1),lifeId:1,alive:true})),observedActorId:'A1'};
 const sw=new Switcher({now:()=>time,step:(id,direction)=>inputs.push({id,direction}),report:r=>results.push(r)});
 // Learn real transitions through ordinary selections; do not seed by card number.
 function select(number){const path=[current],begin=inputs.length;sw.start(number,state);for(let n=0;sw.job&&n<32;n++){const input=inputs.at(-1);sw.acknowledge(input.id,true);time+=100;current=order[(order.indexOf(current)+input.direction+9)%9];state.observedActorId='A'+current;path.push(current);sw.update(state);}assert.equal(results.at(-1).ok,true);assert.equal(current,number);return {path,count:inputs.length-begin};}
 for(let i=1;i<order.length;i++)select(order[i]);select(order[0]);
 if(order[1]===2){const result=select(8);assert.deepEqual(result.path,[1,9,8]);assert.equal(result.count,2);cases++;}
 for(let target=1;target<=9;target++){const distance=Math.abs(order.indexOf(current)-order.indexOf(target)),expected=Math.min(distance,9-distance);assert.equal(select(target).count,expected);cases++;}
 // A changed identity removes only affected edges, retaining unrelated observations.
 state.players[1].lifeId++;sw.update(state);assert.ok(sw.routes.size>0);assert.ok(!sw.routes.has('A2'));assert.ok([...sw.routes.values()].every(edges=>![...edges.values()].includes('A2')));cases++;
 // A prediction mismatch must recover from the actual target, dropping the obsolete path.
 sw.syncRoute(state);sw.learn(state.observedActorId,'A2',-1);sw.start(2,state);const inp=inputs.at(-1);sw.acknowledge(inp.id,true);time+=100;state.observedActorId='unlisted';sw.update(state);assert.ok(sw.job);assert.equal(sw.job.searchDirection,-1);assert.equal(inputs.at(-1).direction,-1);assert.equal(sw.route(state.players[0].actorId,'A2'),null);sw.acknowledge(inputs.at(-1).id,true);time+=100;state.observedActorId='A2';sw.update(state);assert.equal(sw.job,null);assert.equal(results.at(-1).ok,true);assert.equal(results.at(-1).recoveries,1);cases++;
}
console.log(`PASS ${cases} bidirectional cases: both roles, 1→9→8, permuted native order, shortest learned path, roster invalidation, prediction mismatch`);
