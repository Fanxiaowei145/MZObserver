const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {OrderSamples}=require('../desktop/order-samples.cjs');
const folder=fs.readFileSync(path.join(__dirname,'../output/tests/latest-order-sample.txt'),'utf8').trim();
const identities=fs.readFileSync(path.join(folder,'identity-events.jsonl'),'utf8').trim().split('\n').map(s=>JSON.parse(s));
const recorder=new OrderSamples(path.join(folder,'telemetry'),{kind:'synthetic-telemetry-fixture'});
const first=identities[0],last=identities.at(-1);
assert.equal(new Set(first.players.map(p=>p.category)).size,4);
assert.ok(first.players.every(p=>p.name===p.baseName&&p.selectedFaction===null));
assert.ok(last.players.every((p,i)=>p.name===(i<6?'[NTF]':'[SCP]')+p.baseName));
let s={type:'state',epoch:'synthetic-half',sequence:1,wave:0,phase:'preparing',observerRole:'Overwatch',observedActorId:null,order:[],players:[],token:'must-not-be-archived'};
function players(row){return row.players.map((p,i)=>({id:i<6?'H0'+(i+1):'S0'+(i-5),actorId:'dummy:'+i,networkId:100+i,lifeId:1,name:p.name,role:'spectator',alive:false,dead:true,spawnOrder:i+1}));}
s.players=players(first);recorder.state(s);
const read=()=>fs.readFileSync(recorder.file,'utf8').trim().split('\n').map(JSON.parse);
const count=read().length;s.sequence++;recorder.state(s);assert.equal(read().length,count,'unchanged telemetry must not flood archive');
// Selection phase is separate from join and role changes.
for(const row of identities.slice(1)){s.sequence++;s.players=players(row);recorder.state(s);}
s.sequence++;s.wave=1;s.phase='live';s.order=s.players.map(p=>p.id);s.players.forEach((p,i)=>Object.assign(p,{role:i<6?'ntf':i===6?'049':i===7?'173':'939',alive:true,dead:false}));recorder.state(s);
s.sequence++;s.observedActorId='dummy:0';recorder.state(s);
recorder.event('select-request',{number:2});recorder.event('switch-input',{requestId:1,direction:1,from:'dummy:0',target:'dummy:1',sequence:s.sequence});recorder.event('input-release',{requestId:1,ok:true});
s.sequence++;s.observedActorId='dummy:1';recorder.state(s);recorder.event('switch-result',{ok:true,actor:'dummy:1',steps:1});
s.sequence++;s.players[6].role='106';s.players[6].lifeId++;recorder.state(s);
s.sequence++;s.players[2].alive=false;s.players[2].dead=true;recorder.state(s);
s.sequence++;s.players[2].alive=true;s.players[2].dead=false;s.players[2].lifeId++;s.wave++;s.order=[...s.order.slice(1),s.order[0]];recorder.state(s);
s.sequence++;s.observerRole='Spectator';recorder.state(s);recorder.reset('synthetic reconnect');s.sequence++;recorder.state(s);
const rows=read(),text=fs.readFileSync(recorder.file,'utf8');assert.ok(!text.includes('must-not-be-archived'));assert.ok(rows.every(r=>r.captureKind==='synthetic-telemetry-fixture'));
assert.ok(rows.some(r=>r.type==='observed-transition'&&r.from==='dummy:0'&&r.to==='dummy:1'));
assert.ok(rows.some(r=>r.changes?.includes('wave')));assert.ok(rows.some(r=>r.changes?.includes('observerRole')));assert.ok(rows.some(r=>r.changes?.includes('server-card-order')));
assert.ok(rows.some(r=>r.frame?.players?.some(p=>p.name===last.players.find(p=>p.category==='special').name)));
fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify({schema:1,captureKind:'synthetic-only',purpose:'Validate archive and naming lifecycle; NOT evidence of native spectator ordering',seed:first.seed,events:rows.length,scenarios:['join-unselected','select-faction-then-prefix','role-change','death','respawn-wave-reorder','observer-role-change','switch-input-and-target-feedback','reconnect'],nativeClientTested:false},null,2));
const blocked=path.join(folder,'blocked-root');fs.writeFileSync(blocked,'fixture');let error;new OrderSamples(blocked,{onError:e=>error=e}).event('test');assert.match(error,/写入失败/);fs.unlinkSync(blocked);
console.log(`PASS archive boundaries, UTF-8 names, selection timing, changes, no credentials, write failure; ${rows.length} synthetic events archived at ${folder}`);
