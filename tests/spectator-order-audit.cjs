// Read-only spectator-order audit. Pair code is read from stdin, never saved.
const fs=require('node:fs'),path=require('node:path'),readline=require('node:readline');
class Audit {
 constructor(){this.fingerprint=null;this.sequence=-1;this.epoch=null;this.walk=[];this.players=new Map();this.last=undefined;}
 accept(s){
  if(s.type!=='state')return [];
  if(s.epoch===this.epoch&&s.sequence<=this.sequence)return [];
  this.sequence=s.sequence;this.epoch=s.epoch;
  const players=s.players.filter(p=>!p.dead&&p.alive!==false).map(p=>({id:p.actorId,net:p.networkId,life:p.lifeId,role:p.role,priority:p.rolePriority,spawn:p.spawnOrder,name:p.name}));
  const fingerprint=JSON.stringify([s.epoch,players.map(p=>[p.id,p.net,p.life,p.priority,p.spawn]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))]);
  const events=[];
  if(fingerprint!==this.fingerprint){this.fingerprint=fingerprint;this.walk=[];this.last=undefined;this.players=new Map(players.map(p=>[p.id,p]));events.push({type:'roster',players:players.map(({id,...p})=>p)});}
  const id=s.observedActorId;if(id===this.last)return events;this.last=id;
  const p=this.players.get(id);if(!p){this.walk=[];events.push({type:'untracked-target',note:'No roster target; cycle reset'});return events;}
  events.push({type:'target',net:p.net,name:p.name,role:p.role});
  if(this.walk.includes(id)){
   const cycle=this.walk.slice(this.walk.indexOf(id));
   if(cycle.length===players.length&&cycle.length>1){
    let ring=cycle.map(id=>this.players.get(id));
    const boundary=ring.findIndex((p,i)=>p.priority!==ring[(i+ring.length-1)%ring.length].priority);if(boundary>=0)ring=ring.slice(boundary).concat(ring.slice(0,boundary));
    const equal=(a,b)=>a.every((p,i)=>p.net===b[i].net);
    const groups=[...new Set(ring.map(p=>p.priority))].map(priority=>{
     const group=ring.filter(p=>p.priority===priority),cyclic=boundary<0;
     const match=sorted=>cyclic?sorted.some((_,i)=>equal(group,sorted.slice(i).concat(sorted.slice(0,i)))):equal(group,sorted);
     const result={priority,names:group.map(p=>p.name),networkIds:group.map(p=>p.net),count:group.length};
     if(group.length>1)for(const key of ['net','spawn'])for(const direction of [1,-1]){
      const values=group.map(p=>p[key]);result[key+(direction===1?'Ascending':'Descending')]=values.every(Number.isFinite)&&new Set(values).size===values.length?match([...group].sort((a,b)=>direction*(a[key]-b[key]))):null;
     }
     return result;
    });
    events.push({type:'cycle',order:ring.map(({id,...p})=>p),groups,note:'Observed cycle only. Requires intentional single-direction clicks, no skipped telemetry targets; not proof of a universal order.'});
   }else events.push({type:'incomplete-cycle',uniqueTargets:cycle.length,expected:players.length});
   this.walk=[id];
  }else this.walk.push(id);
  return events;
 }
}
module.exports={Audit};
if(require.main===module){
 if(process.argv.includes('--test')){
  const assert=require('node:assert/strict'),a=new Audit();let seq=0;const players=[1,2,3].map(n=>({actorId:'p'+n,networkId:n,name:'P'+n,lifeId:1,role:'ntf',rolePriority:13,spawnOrder:n,alive:true}));
  let events=[];for(const id of ['p1','p2','p3','p1'])events.push(...a.accept({type:'state',epoch:'a',sequence:++seq,players,observedActorId:id}));
  assert.equal(events.filter(e=>e.type==='cycle').length,1);assert.equal(events.find(e=>e.type==='cycle').groups[0].netAscending,true);
  players[1].dead=true;assert(a.accept({type:'state',epoch:'a',sequence:++seq,players,observedActorId:'p3'}).some(e=>e.type==='roster'));
  assert.equal(a.walk.length,1);console.log('PASS: complete cycle, candidate comparison, roster-change reset');process.exit(0);
 }
 const arg=name=>process.argv[process.argv.indexOf(name)+1];
 if(!process.argv.includes('--url'))throw Error('Specify --url');
 const url=arg('--url'),dest=process.argv.includes('--out')?arg('--out'):path.resolve('output/tests/spectator-order-live.jsonl');fs.mkdirSync(path.dirname(dest),{recursive:true});
 const WebSocket=require(path.resolve(__dirname,'../dist/releases/0.1.9/MZOverlay/resources/app/node_modules/ws'));
 const audit=new Audit(),input=readline.createInterface({input:process.stdin,output:process.stdout});
 console.log('Waiting for pairing code on stdin');input.once('line',code=>{
  if(!/^\d{4}$/.test(code.trim()))throw Error('Expected four digits');
  const ws=new WebSocket(url);ws.on('open',()=>ws.send(JSON.stringify({code:code.trim()})));
  ws.on('message',raw=>{const s=JSON.parse(raw);if(s.type==='authenticated'){console.log('CONNECTED: ready to record spectator target changes');return;}if(s.type==='error'){console.log('SERVER:',s.message);ws.close();return;}
   for(const event of audit.accept(s)){const record={at:new Date().toISOString(),...event};fs.appendFileSync(dest,JSON.stringify(record)+'\n');console.log(JSON.stringify(record));}
  });ws.on('error',e=>console.error(e.message));ws.on('close',()=>{console.log('Recorder disconnected');input.close();});input.on('line',line=>{if(line.trim()==='stop')ws.close();});
 });
}
